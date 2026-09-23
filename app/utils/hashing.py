import hashlib
from typing import BinaryIO, Union


def compute_sha256_bytes(data: bytes) -> str:
    """Compute SHA-256 hash of byte data."""
    return hashlib.sha256(data).hexdigest()


def compute_sha256_stream(stream: BinaryIO, chunk_size: int = 65536) -> str:
    """Compute SHA-256 hash of a file-like stream."""
    hasher = hashlib.sha256()
    while chunk := stream.read(chunk_size):
        hasher.update(chunk)
    stream.seek(0)
    return hasher.hexdigest()


def compute_sha256_file(file_path: str, chunk_size: int = 65536) -> str:
    """Compute SHA-256 hash of a file on disk."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(chunk_size):
            hasher.update(chunk)
    return hasher.hexdigest()
