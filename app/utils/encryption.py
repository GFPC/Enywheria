import base64
import hashlib
import os
from pathlib import Path
from typing import Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.exceptions import InvalidSignature


def _get_raw_key_string() -> str:
    """Retrieve raw key string from settings or environment variable."""
    try:
        from app.config import settings
        return settings.ENCRYPTION_KEY
    except Exception:
        return os.environ.get("ENCRYPTION_KEY", "dGhpcy1pcy1hLTMyLWJ5dGUtZW5jcnlwdGlvbi1rZXktMTIzNDU=")


def _get_keys_dir() -> Path:
    """Retrieve keys directory from settings or environment variable."""
    try:
        from app.config import settings
        return settings.keys_path
    except Exception:
        return Path("data/keys")


def _get_aes_key() -> bytes:
    """Derive 256-bit key from ENCRYPTION_KEY."""
    raw_key = _get_raw_key_string().encode("utf-8")
    try:
        decoded = base64.b64decode(raw_key)
        if len(decoded) == 32:
            return decoded
    except Exception:
        pass
    # SHA-256 fallback digest if raw key isn't 32 bytes base64
    return hashlib.sha256(raw_key).digest()


def encrypt_data(data: bytes) -> bytes:
    """Encrypt byte data using AES-GCM (nonce + ciphertext + tag)."""
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return nonce + ciphertext


def decrypt_data(encrypted_data: bytes) -> bytes:
    """Decrypt AES-GCM encrypted byte data."""
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    nonce = encrypted_data[:12]
    ciphertext = encrypted_data[12:]
    return aesgcm.decrypt(nonce, ciphertext, None)


def generate_ecdsa_keypair(keys_dir: Optional[Path] = None) -> Tuple[Path, Path]:
    """Generate and save ECDSA private and public keys if they don't exist."""
    target_dir = keys_dir or _get_keys_dir()
    target_dir.mkdir(parents=True, exist_ok=True)
    priv_path = target_dir / "ecdsa_private.pem"
    pub_path = target_dir / "ecdsa_public.pem"

    if not priv_path.exists():
        private_key = ec.generate_private_key(ec.SECP256R1())
        priv_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        pub_pem = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        priv_path.write_bytes(priv_pem)
        pub_path.write_bytes(pub_pem)

    return priv_path, pub_path


def sign_data(data: bytes, keys_dir: Optional[Path] = None) -> str:
    """Sign data using ECDSA private key and return hex signature."""
    priv_path, _ = generate_ecdsa_keypair(keys_dir)
    priv_pem = priv_path.read_bytes()
    private_key = serialization.load_pem_private_key(priv_pem, password=None)
    signature = private_key.sign(data, ec.ECDSA(hashes.SHA256()))
    return signature.hex()


def verify_signature(data: bytes, signature_hex: str, keys_dir: Optional[Path] = None) -> bool:
    """Verify ECDSA signature against public key."""
    _, pub_path = generate_ecdsa_keypair(keys_dir)
    pub_pem = pub_path.read_bytes()
    public_key = serialization.load_pem_public_key(pub_pem)
    try:
        signature = bytes.fromhex(signature_hex)
        public_key.verify(signature, data, ec.ECDSA(hashes.SHA256()))
        return True
    except (InvalidSignature, ValueError):
        return False
