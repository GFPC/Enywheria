import uuid
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tag import Tag
from app.repositories.base import BaseRepository


class TagRepository(BaseRepository[Tag]):
    def __init__(self, session: AsyncSession):
        super().__init__(Tag, session)

    async def get_by_name(self, name: str) -> Optional[Tag]:
        query = select(Tag).where(Tag.name == name)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
