import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "PersonalVault"
    DB_PATH: str = "data/app.db"
    FILES_DIR: str = "data/files"
    KEYS_DIR: str = "data/keys"
    LOGS_DIR: str = "data/logs"
    SECRET_KEY: str = "super_secret_personal_vault_key_32_bytes_long!"
    ENCRYPTION_KEY: str = "dGhpcy1pcy1hLTMyLWJ5dGUtZW5jcnlwdGlvbi1rZXktMTIzNDU="
    LOG_LEVEL: str = "INFO"

    @property
    def base_dir(self) -> Path:
        return Path(__file__).resolve().parent.parent

    @property
    def db_file_path(self) -> Path:
        path = Path(self.DB_PATH)
        if not path.is_absolute():
            path = self.base_dir / path
        return path

    @property
    def files_path(self) -> Path:
        path = Path(self.FILES_DIR)
        if not path.is_absolute():
            path = self.base_dir / path
        return path

    @property
    def keys_path(self) -> Path:
        path = Path(self.KEYS_DIR)
        if not path.is_absolute():
            path = self.base_dir / path
        return path

    @property
    def logs_path(self) -> Path:
        path = Path(self.LOGS_DIR)
        if not path.is_absolute():
            path = self.base_dir / path
        return path

    @property
    def database_url(self) -> str:
        return f"sqlite+aiosqlite:///{self.db_file_path.as_posix()}"


settings = Settings()
