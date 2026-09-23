import json
import base64
import enum
from typing import Any, Dict, Optional, Tuple
from app.utils.encryption import encrypt_data, decrypt_data


class MessageType(str, enum.Enum):
    REGISTER = "REGISTER"
    REGISTER_ACK = "REGISTER_ACK"
    LOOKUP = "LOOKUP"
    PEER_INFO = "PEER_INFO"
    PUNCH = "PUNCH"
    PUNCH_ACK = "PUNCH_ACK"
    DATA = "DATA"
    RELAY_DATA = "RELAY_DATA"
    PING = "PING"
    PONG = "PONG"


def create_packet(
    msg_type: MessageType,
    sender: str,
    target: Optional[str] = None,
    secret_token: str = "default_p2p_token",
    payload: Optional[Dict[str, Any]] = None,
) -> bytes:
    """Construct JSON packet string encoded as UTF-8 bytes."""
    data = {
        "type": msg_type.value,
        "sender": sender,
        "target": target,
        "token": secret_token,
        "payload": payload or {},
    }
    return json.dumps(data).encode("utf-8")


def parse_packet(raw_bytes: bytes) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Parse JSON packet from raw bytes. Returns (data_dict, error_msg)."""
    try:
        data = json.loads(raw_bytes.decode("utf-8"))
        return data, None
    except Exception as e:
        return None, str(e)


def pack_encrypted_data(
    sender: str,
    target: str,
    payload_dict: Dict[str, Any],
    secret_token: str = "default_p2p_token",
    is_relay: bool = False,
) -> bytes:
    """Encrypt payload dictionary using AES-GCM and package into packet."""
    raw_payload = json.dumps(payload_dict).encode("utf-8")
    encrypted_bytes = encrypt_data(raw_payload)
    encoded_b64 = base64.b64encode(encrypted_bytes).decode("utf-8")

    msg_type = MessageType.RELAY_DATA if is_relay else MessageType.DATA
    return create_packet(
        msg_type=msg_type,
        sender=sender,
        target=target,
        secret_token=secret_token,
        payload={"encrypted": encoded_b64},
    )


def unpack_encrypted_payload(payload_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Decrypt payload dictionary from base64 encrypted packet."""
    try:
        encoded_b64 = payload_dict.get("encrypted")
        if not encoded_b64:
            return None
        encrypted_bytes = base64.b64decode(encoded_b64)
        decrypted_bytes = decrypt_data(encrypted_bytes)
        return json.loads(decrypted_bytes.decode("utf-8"))
    except Exception:
        return None
