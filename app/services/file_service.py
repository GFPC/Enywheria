import os
import shutil
from pathlib import Path
from typing import BinaryIO, Optional, Tuple
from fastapi import UploadFile
from loguru import logger
from app.config import settings
from app.utils.hashing import compute_sha256_bytes
from app.utils.encryption import encrypt_data, decrypt_data, sign_data


class FileService:
    """Service handling file storage sharding, deduplication, encryption, and signatures."""

    def __init__(self, base_files_dir: Optional[Path] = None):
        self.files_dir = base_files_dir or settings.files_path
        self.files_dir.mkdir(parents=True, exist_ok=True)

    def get_sharded_path(self, file_hash: str) -> Path:
        """Generate sharded path: data/files/{hash[:2]}/{hash}."""
        prefix = file_hash[:2]
        shard_dir = self.files_dir / prefix
        shard_dir.mkdir(parents=True, exist_ok=True)
        return shard_dir / file_hash

    async def save_file(
        self,
        file_content: bytes,
        is_encrypted: bool = False,
    ) -> Tuple[Path, str, int, Optional[str]]:
        """
        Save file content with deduplication and optional encryption.
        Returns (relative_file_path, file_hash, size_bytes, signature).
        """
        file_hash = compute_sha256_bytes(file_content)
        size_bytes = len(file_content)
        target_path = self.get_sharded_path(file_hash)

        # Check deduplication
        if target_path.exists():
            logger.info(f"File with hash {file_hash} already exists. Skipping physical write (deduplicated).")
        else:
            data_to_write = encrypt_data(file_content) if is_encrypted else file_content
            target_path.write_bytes(data_to_write)
            logger.info(f"Saved file to sharded storage: {target_path}")

        # Compute ECDSA signature
        signature = sign_data(file_content, settings.keys_path)

        # Return relative path for database portability
        rel_path = str(target_path.relative_to(settings.base_dir)).replace("\\", "/")
        return target_path, file_hash, size_bytes, signature

    def read_file(self, full_path: Path, is_encrypted: bool = False) -> bytes:
        """Read and optionally decrypt file from disk."""
        if not full_path.exists():
            raise FileNotFoundError(f"File not found on disk: {full_path}")
        raw_data = full_path.read_bytes()
        if is_encrypted:
            return decrypt_data(raw_data)
        return raw_data
