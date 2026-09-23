import asyncio
import argparse
import sys
import time
from pathlib import Path
from typing import Callable, Dict, Optional, Tuple
from loguru import logger
from app.p2p.protocol import (
    MessageType,
    create_packet,
    parse_packet,
    pack_encrypted_data,
    unpack_encrypted_payload,
)


class P2PNodeProtocol(asyncio.DatagramProtocol):
    def __init__(self, node: "P2PNode"):
        self.node = node

    def connection_made(self, transport: asyncio.DatagramTransport):
        self.node.transport = transport

    def datagram_received(self, data: bytes, addr: Tuple[str, int]):
        packet, err = parse_packet(data)
        if err or not packet:
            return

        msg_type = packet.get("type")
        sender = packet.get("sender")
        payload = packet.get("payload", {})

        if msg_type == MessageType.REGISTER_ACK.value:
            pub_ip = payload.get("public_ip")
            pub_port = payload.get("public_port")
            logger.info(f"[P2P] Registered with relay. Observed STUN Public Endpoint: {pub_ip}:{pub_port}")
            self.node.registered_event.set()

        elif msg_type == MessageType.PEER_INFO.value:
            target_id = payload.get("target_id")
            ip = payload.get("ip")
            port = payload.get("port")
            logger.info(f"[P2P] Discovered peer '{target_id}' at endpoint {ip}:{port}")
            self.node.peer_endpoints[target_id] = (ip, port)
            self.node.peer_discovered_event.set()

        elif msg_type == MessageType.PUNCH.value:
            logger.info(f"[P2P] Received UDP Hole Punch from '{sender}' at {addr[0]}:{addr[1]}")
            # Reply with PUNCH_ACK
            ack = create_packet(
                msg_type=MessageType.PUNCH_ACK,
                sender=self.node.node_id,
                target=sender,
                secret_token=self.node.secret_token,
            )
            self.node.transport.sendto(ack, addr)
            self.node.peer_endpoints[sender] = addr
            self.node.direct_p2p_active[sender] = True

        elif msg_type == MessageType.PUNCH_ACK.value:
            logger.info(f"[P2P] Direct UDP P2P Connection established with '{sender}' at {addr[0]}:{addr[1]}!")
            self.node.peer_endpoints[sender] = addr
            self.node.direct_p2p_active[sender] = True
            self.node.punch_ack_event.set()

        elif msg_type in (MessageType.DATA.value, MessageType.RELAY_DATA.value):
            is_relay = msg_type == MessageType.RELAY_DATA.value
            mode_str = "RELAY" if is_relay else "DIRECT_P2P"
            decrypted_payload = unpack_encrypted_payload(payload)
            if decrypted_payload:
                logger.info(f"[P2P Message via {mode_str}] From '{sender}': {decrypted_payload}")
                if self.node.on_message_callback:
                    self.node.on_message_callback(sender, decrypted_payload, mode_str)
            else:
                logger.warning(f"[P2P] Received packet from '{sender}' but decryption failed.")


class P2PNode:
    def __init__(
        self,
        node_id: str,
        relay_host: str,
        relay_port: int = 9000,
        secret_token: str = "default_p2p_token",
        local_port: int = 0,
        on_message_callback: Optional[Callable[[str, Dict, str], None]] = None,
    ):
        self.node_id = node_id
        self.relay_host = relay_host
        self.relay_port = relay_port
        self.secret_token = secret_token
        self.local_port = local_port
        self.on_message_callback = on_message_callback

        self.transport: Optional[asyncio.DatagramTransport] = None
        self.registered_event = asyncio.Event()
        self.peer_discovered_event = asyncio.Event()
        self.punch_ack_event = asyncio.Event()

        self.peer_endpoints: Dict[str, Tuple[str, int]] = {}
        self.direct_p2p_active: Dict[str, bool] = {}

    async def start(self):
        loop = asyncio.get_running_loop()
        logger.info(f"Starting P2P Node '{self.node_id}' on local port {self.local_port}...")
        await loop.create_datagram_endpoint(
            lambda: P2PNodeProtocol(self),
            local_addr=("0.0.0.0", self.local_port),
        )

        # Register with relay server
        reg_pkt = create_packet(
            msg_type=MessageType.REGISTER,
            sender=self.node_id,
            secret_token=self.secret_token,
        )
        self.transport.sendto(reg_pkt, (self.relay_host, self.relay_port))

        try:
            await asyncio.wait_for(self.registered_event.wait(), timeout=5.0)
        except asyncio.TimeoutError:
            logger.warning(f"Could not connect to relay server at {self.relay_host}:{self.relay_port}. Proceeding anyway...")

    async def connect_peer(self, target_id: str) -> bool:
        """Lookup peer and attempt UDP Hole Punching. Fallback to Relay mode if hole punch fails."""
        logger.info(f"Initiating connection to peer '{target_id}'...")

        # Step 1: Send Lookup packet to Relay server
        lookup_pkt = create_packet(
            msg_type=MessageType.LOOKUP,
            sender=self.node_id,
            target=target_id,
            secret_token=self.secret_token,
        )
        self.transport.sendto(lookup_pkt, (self.relay_host, self.relay_port))

        try:
            await asyncio.wait_for(self.peer_discovered_event.wait(), timeout=5.0)
        except asyncio.TimeoutError:
            logger.error(f"Peer discovery timeout for '{target_id}'")
            return False

        target_addr = self.peer_endpoints.get(target_id)
        if not target_addr:
            return False

        # Step 2: UDP Hole Punching loop (send 5 PUNCH packets to target endpoint)
        logger.info(f"Punching UDP hole to {target_id} at {target_addr[0]}:{target_addr[1]}...")
        punch_pkt = create_packet(
            msg_type=MessageType.PUNCH,
            sender=self.node_id,
            target=target_id,
            secret_token=self.secret_token,
        )

        for _ in range(5):
            self.transport.sendto(punch_pkt, target_addr)
            await asyncio.sleep(0.2)

        try:
            await asyncio.wait_for(self.punch_ack_event.wait(), timeout=3.0)
            logger.info(f"Direct P2P Link Established with '{target_id}'! Mode: DIRECT_P2P")
            return True
        except asyncio.TimeoutError:
            logger.info(f"Direct UDP hole punching to '{target_id}' timed out (CGNAT). Falling back to RELAY mode via {self.relay_host}:{self.relay_port}.")
            self.direct_p2p_active[target_id] = False
            return True

    async def send_message(self, target_id: str, data_dict: Dict):
        """Send encrypted message using direct UDP P2P or Relay fallback."""
        is_direct = self.direct_p2p_active.get(target_id, False)

        if is_direct and target_id in self.peer_endpoints:
            target_addr = self.peer_endpoints[target_id]
            pkt = pack_encrypted_data(
                sender=self.node_id,
                target=target_id,
                payload_dict=data_dict,
                secret_token=self.secret_token,
                is_relay=False,
            )
            self.transport.sendto(pkt, target_addr)
            logger.debug(f"Sent DIRECT_P2P packet to {target_id} ({target_addr})")
        else:
            # Fallback to Relay Server
            relay_addr = (self.relay_host, self.relay_port)
            pkt = pack_encrypted_data(
                sender=self.node_id,
                target=target_id,
                payload_dict=data_dict,
                secret_token=self.secret_token,
                is_relay=True,
            )
            self.transport.sendto(pkt, relay_addr)
            logger.debug(f"Sent RELAY packet to {target_id} via {relay_addr}")

    def close(self):
        if self.transport:
            self.transport.close()


async def run_cli_node():
    parser = argparse.ArgumentParser(description="P2P Node Client (PC / Termux)")
    parser.add_argument("--relay", type=str, required=True, help="Relay server address e.g. 1.2.3.4:9000")
    parser.add_argument("--node-id", type=str, required=True, help="My Node ID (e.g. pc, phone)")
    parser.add_argument("--target-id", type=str, required=True, help="Target peer Node ID to connect (e.g. phone, pc)")
    parser.add_argument("--token", type=str, default="default_p2p_token", help="Secret cluster token")
    parser.add_argument("--local-port", type=int, default=0, help="Local UDP port (default: auto)")
    args = parser.parse_args()

    relay_parts = args.relay.split(":")
    relay_host = relay_parts[0]
    relay_port = int(relay_parts[1]) if len(relay_parts) > 1 else 9000

    def print_incoming(sender: str, payload: Dict, mode: str):
        msg_text = payload.get("msg", str(payload))
        print(f"\n📩 [{mode}] From {sender}: {msg_text}")
        print(f"{args.node_id}> ", end="", flush=True)

    node = P2PNode(
        node_id=args.node_id,
        relay_host=relay_host,
        relay_port=relay_port,
        secret_token=args.token,
        local_port=args.local_port,
        on_message_callback=print_incoming,
    )

    await node.start()
    await node.connect_peer(args.target_id)

    print(f"\n=======================================================")
    print(f"🚀 P2P Terminal Session Ready! Linked with '{args.target_id}'")
    print(f"Type your message and press ENTER to send.")
    print(f"Type 'exit' to quit.")
    print(f"=======================================================\n")

    loop = asyncio.get_running_loop()
    while True:
        try:
            line = await loop.run_in_executor(None, sys.stdin.readline)
            if not line:
                break
            msg = line.strip()
            if not msg:
                continue
            if msg.lower() == "exit":
                break

            await node.send_message(args.target_id, {"msg": msg, "time": time.time()})
            print(f"{args.node_id}> ", end="", flush=True)
        except (KeyboardInterrupt, EOFError):
            break

    node.close()
    print("P2P Node session ended.")


if __name__ == "__main__":
    asyncio.run(run_cli_node())
