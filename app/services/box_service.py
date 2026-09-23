import uuid
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.box import Box
from app.models.item import Item
from app.schemas.box import BoxCreate, BoxUpdate
from app.repositories.box_repo import BoxRepository


class BoxService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.box_repo = BoxRepository(session)

    async def create_box(self, data: BoxCreate) -> Box:
        box = Box(
            name=data.name,
            location=data.location,
            description=data.description,
            photo_id=data.photo_id,
        )
        box = await self.box_repo.create(box)
        if data.item_ids:
            await self.box_repo.set_items(box, data.item_ids)
        await self.session.commit()
        return box

    async def get_box(self, box_id: uuid.UUID) -> Optional[Box]:
        return await self.box_repo.get_by_id(box_id)

    async def list_boxes(self, skip: int = 0, limit: int = 100) -> Sequence[Box]:
        return await self.box_repo.list_all(skip=skip, limit=limit)

    async def update_box(self, box_id: uuid.UUID, data: BoxUpdate) -> Optional[Box]:
        box = await self.box_repo.get_by_id(box_id)
        if not box:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        item_ids = update_dict.pop("item_ids", None)

        for key, value in update_dict.items():
            setattr(box, key, value)

        if item_ids is not None:
            await self.box_repo.set_items(box, item_ids)

        box = await self.box_repo.update(box)
        await self.session.commit()
        return box

    async def delete_box(self, box_id: uuid.UUID) -> bool:
        success = await self.box_repo.delete(box_id)
        if success:
            await self.session.commit()
        return success

    async def get_box_items(self, box_id: uuid.UUID) -> Sequence[Item]:
        return await self.box_repo.get_box_items(box_id)
