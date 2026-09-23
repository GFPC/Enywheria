import sys
from pathlib import Path
from loguru import logger
from app.config import settings


def setup_logging():
    """Configure loguru logging to console and file."""
    logger.remove()

    # Log to stdout
    logger.add(
        sys.stdout,
        level=settings.LOG_LEVEL,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level:10}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    )

    # Log to app.log
    logs_dir = settings.logs_path
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_file = logs_dir / "app.log"

    logger.add(
        str(log_file),
        level=settings.LOG_LEVEL,
        rotation="10 MB",
        retention="30 days",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level:10} | {name}:{function}:{line} - {message}",
        encoding="utf-8",
    )

    logger.info(f"Logging initialized. Log file: {log_file}")
