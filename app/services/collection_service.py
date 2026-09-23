import uuid
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.collection import Collection
from app.schemas.collection import CollectionCreate, CollectionUpdate
from app.repositories.collection_repo import CollectionRepository


class CollectionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.collection_repo = CollectionRepository(session)

    async def create_collection(self, data: CollectionCreate) -> Collection:
        collection = Collection(
            name=data.name,
            description=data.description,
            parent_id=data.parent_id,
            cover_item_id=data.cover_item_id,
        )
        collection = await self.collection_repo.create(collection)
        await self.session.commit()
        return collection

    async def get_collection(self, collection_id: uuid.UUID) -> Optional[Collection]:
        return await self.collection_repo.get_by_id(collection_id)

    async def list_collections(self, skip: int = 0, limit: int = 100) -> Sequence[Collection]:
        return await self.collection_repo.list_all(skip=skip, limit=limit)

    async def update_collection(
        self, collection_id: uuid.UUID, data: CollectionUpdate
    ) -> Optional[Collection]:
        collection = await self.collection_repo.get_by_id(collection_id)
        if not collection:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(collection, key, value)
        collection = await self.collection_repo.update(collection)
        await self.session.commit()
        return collection

    async def delete_collection(self, collection_id: uuid.UUID) -> bool:
        success = await self.collection_repo.delete(collection_id)
        if success:
            await self.session.commit()
        return success
