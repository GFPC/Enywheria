import asyncio
import os
import sqlite3
import pytest
import pytest_asyncio
from pathlib import Path
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.main import app
from app.models import Base
from app.config import settings

# Test in-memory database URL
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    engine = create_async_engine(
        TEST_DB_URL,
        echo=False,
        future=True,
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        if isinstance(dbapi_connection, sqlite3.Connection):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Create FTS5 table and triggers for testing
        await conn.exec_driver_sql(
            "CREATE VIRTUAL TABLE IF NOT EXISTS item_fts USING fts5(title, content, tokenize='unicode61');"
        )
        await conn.exec_driver_sql(
            """
            CREATE TRIGGER IF NOT EXISTS item_fts_ai AFTER INSERT ON items BEGIN
                INSERT INTO item_fts(rowid, title, content) VALUES (new.rowid, new.title, COALESCE(new.content, ''));
            END;
            """
        )
        await conn.exec_driver_sql(
            """
            CREATE TRIGGER IF NOT EXISTS item_fts_au AFTER UPDATE ON items BEGIN
                UPDATE item_fts SET title = new.title, content = COALESCE(new.content, '') WHERE rowid = new.rowid;
            END;
            """
        )
        await conn.exec_driver_sql(
            """
            CREATE TRIGGER IF NOT EXISTS item_fts_ad AFTER DELETE ON items BEGIN
                DELETE FROM item_fts WHERE rowid = old.rowid;
            END;
            """
        )

    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    async_session = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def _get_test_db():
        yield db_session

    app.dependency_overrides[get_db] = _get_test_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
