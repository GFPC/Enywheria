import asyncio
import argparse
import time
from typing import Dict, Tuple
from loguru import logger
from app.p2p.protocol import MessageType, create_packet, parse_packet


class RelayServerProtocol(asyncio.DatagramProtocol):
    """Async UDP Protocol handling STUN reflecting, Peer discovery, and Relay fallback."""

    def __init__(self, secret_token: str = "default_p2p_token"):
        self.transport: Optional[asyncio.DatagramTransport] = None
        self.nodes: Dict[str, Tuple[str, int, float]] = {}  # node_id -> (ip, port, timestamp)
        self.secret_token = secret_token

    def connection_made(self, transport: asyncio.DatagramTransport):
        self.transport = transport
        logger.info("P2P Relay & STUN Server started listening.")

    def datagram_received(self, data: bytes, addr: Tuple[str, int]):
        packet, err = parse_packet(data)
        if err or not packet:
            return

        token = packet.get("token")
        if token != self.secret_token:
            logger.warning(f"Unauthorized packet from {addr}: invalid token '{token}'")
            return

        msg_type = packet.get("type")
        sender = packet.get("sender")
        target = packet.get("target")
        now = time.time()

        if not sender:
            return

        # Update node registry with observed public socket (STUN reflection)
        self.nodes[sender] = (addr[0], addr[1], now)

        if msg_type == MessageType.REGISTER.value:
            logger.info(f"Registered node '{sender}' from public endpoint {addr[0]}:{addr[1]}")
            ack = create_packet(
                msg_type=MessageType.REGISTER_ACK,
                sender="SERVER",
                target=sender,
                secret_token=self.secret_token,
                payload={"public_ip": addr[0], "public_port": addr[1]},
            )
            self.transport.sendto(ack, addr)

        elif msg_type == MessageType.LOOKUP.value:
            logger.info(f"Node '{sender}' requested peer lookup for target '{target}'")
            if target in self.nodes:
                target_ip, target_port, _ = self.nodes[target]
                # Send PEER_INFO to requester
                peer_info_req = create_packet(
                    msg_type=MessageType.PEER_INFO,
                    sender="SERVER",
                    target=sender,
                    secret_token=self.secret_token,
                    payload={"target_id": target, "ip": target_ip, "port": target_port},
                )
                self.transport.sendto(peer_info_req, addr)

                # Send PEER_INFO to target node as well so it starts UDP hole punching back
                peer_info_target = create_packet(
                    msg_type=MessageType.PEER_INFO,
                    sender="SERVER",
                    target=target,
                    secret_token=self.secret_token,
                    payload={"target_id": sender, "ip": addr[0], "port": addr[1]},
                )
                self.transport.sendto(peer_info_target, (target_ip, target_port))
            else:
                logger.warning(f"Lookup failed: target node '{target}' not online")

        elif msg_type == MessageType.RELAY_DATA.value:
            # Relay fallback: forward packet to target node
            if target in self.nodes:
                target_ip, target_port, _ = self.nodes[target]
                self.transport.sendto(data, (target_ip, target_port))
                logger.debug(f"Relayed {len(data)} bytes from '{sender}' to '{target}' ({target_ip}:{target_port})")
            else:
                logger.warning(f"Relay failed: target node '{target}' not registered")

        elif msg_type == MessageType.PING.value:
            pong = create_packet(
                msg_type=MessageType.PONG,
                sender="SERVER",
                target=sender,
                secret_token=self.secret_token,
            )
            self.transport.sendto(pong, addr)


class RelayServer:
    def __init__(self, host: str = "0.0.0.0", port: int = 9000, secret_token: str = "default_p2p_token"):
        self.host = host
        self.port = port
        self.secret_token = secret_token

    async def start(self):
        loop = asyncio.get_running_loop()
        logger.info(f"Launching P2P STUN/Relay Server on {self.host}:{self.port}...")
        transport, protocol = await loop.create_datagram_endpoint(
            lambda: RelayServerProtocol(secret_token=self.secret_token),
            local_addr=(self.host, self.port),
        )
        try:
            while True:
                await asyncio.sleep(3600)
        finally:
            transport.close()


def main():
    parser = argparse.ArgumentParser(description="P2P STUN & Relay Server for PersonalVault")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host IP to bind (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=9000, help="UDP Port to listen (default: 9000)")
    parser.add_argument("--token", type=str, default="default_p2p_token", help="Secret cluster authentication token")
    args = parser.parse_args()

    server = RelayServer(host=args.host, port=args.port, secret_token=args.token)
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        logger.info("Relay server stopped.")


if __name__ == "__main__":
    main()
