import asyncio
import pytest
from app.p2p.relay_server import RelayServer
from app.p2p.node import P2PNode


@pytest.mark.asyncio
async def test_p2p_relay_and_node_messaging():
    # 1. Start Relay Server on random available port
    relay = RelayServer(host="127.0.0.1", port=9999, secret_token="test_token")
    relay_task = asyncio.create_task(relay.start())

    await asyncio.sleep(0.2)

    received_messages = []

    def on_node_b_msg(sender: str, payload: dict, mode: str):
        received_messages.append((sender, payload, mode))

    # 2. Initialize Node A (PC) and Node B (Termux)
    node_a = P2PNode(
        node_id="pc",
        relay_host="127.0.0.1",
        relay_port=9999,
        secret_token="test_token",
    )
    node_b = P2PNode(
        node_id="phone",
        relay_host="127.0.0.1",
        relay_port=9999,
        secret_token="test_token",
        on_message_callback=on_node_b_msg,
    )

    await node_a.start()
    await node_b.start()

    # 3. Connect Node A to Node B
    connected = await node_a.connect_peer("phone")
    assert connected is True

    # 4. Send encrypted payload from Node A to Node B
    test_payload = {"msg": "Hello Termux from PC!", "vault_item_id": "12345"}
    await node_a.send_message("phone", test_payload)

    await asyncio.sleep(0.5)

    assert len(received_messages) == 1
    sender, payload, mode = received_messages[0]
    assert sender == "pc"
    assert payload["msg"] == "Hello Termux from PC!"
    assert mode in ("DIRECT_P2P", "RELAY")

    # Cleanup
    node_a.close()
    node_b.close()
    relay_task.cancel()
