import sqlite3
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import event, engine
from app.config import settings


# Ensure parent directory exists for SQLite database
settings.db_file_path.parent.mkdir(parents=True, exist_ok=True)

engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable WAL mode and Foreign Key enforcement in SQLite."""
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()


async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for providing database sessions in FastAPI routes."""
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
