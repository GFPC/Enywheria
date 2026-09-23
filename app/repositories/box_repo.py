import uuid
from typing import List, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.box import Box
from app.models.item import Item
from app.repositories.base import BaseRepository


class BoxRepository(BaseRepository[Box]):
    def __init__(self, session: AsyncSession):
        super().__init__(Box, session)

    async def get_box_items(self, box_id: uuid.UUID) -> Sequence[Item]:
        box = await self.get_by_id(box_id)
        if not box:
            return []
        return box.items

    async def set_items(self, box: Box, item_ids: List[uuid.UUID]):
        if not item_ids:
            box.items = []
            return
        result = await self.session.execute(select(Item).where(Item.id.in_(item_ids)))
        items = result.scalars().all()
        box.items = list(items)
