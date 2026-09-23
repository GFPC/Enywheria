import uuid
from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.script import Script
from app.repositories.base import BaseRepository


class ScriptRepository(BaseRepository[Script]):
    def __init__(self, session: AsyncSession):
        super().__init__(Script, session)

    async def list_by_device(self, device_id: uuid.UUID) -> Sequence[Script]:
        query = select(Script).where(Script.device_id == device_id).order_by(Script.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()
