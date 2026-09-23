import os
from pathlib import Path

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    HAS_PYDANTIC_SETTINGS = True
except ImportError:
    HAS_PYDANTIC_SETTINGS = False


if HAS_PYDANTIC_SETTINGS:
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

else:
    class Settings:
        """Lightweight fallback settings for P2P client without pydantic-settings."""

        def __init__(self):
            self.APP_NAME = os.environ.get("APP_NAME", "PersonalVault")
            self.DB_PATH = os.environ.get("DB_PATH", "data/app.db")
            self.FILES_DIR = os.environ.get("FILES_DIR", "data/files")
            self.KEYS_DIR = os.environ.get("KEYS_DIR", "data/keys")
            self.LOGS_DIR = os.environ.get("LOGS_DIR", "data/logs")
            self.SECRET_KEY = os.environ.get("SECRET_KEY", "super_secret_personal_vault_key_32_bytes_long!")
            self.ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY", "dGhpcy1pcy1hLTMyLWJ5dGUtZW5jcnlwdGlvbi1rZXktMTIzNDU=")
            self.LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

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
