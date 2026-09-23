import uuid
from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.collection import Collection
from app.repositories.base import BaseRepository


class CollectionRepository(BaseRepository[Collection]):
    def __init__(self, session: AsyncSession):
        super().__init__(Collection, session)

    async def get_children(self, parent_id: uuid.UUID) -> Sequence[Collection]:
        query = select(Collection).where(Collection.parent_id == parent_id)
        result = await self.session.execute(query)
        return result.scalars().all()
