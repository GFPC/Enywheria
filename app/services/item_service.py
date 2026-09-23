import uuid
from typing import List, Optional, Tuple, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from app.models.item import Item, ItemType
from app.models.event import Event, EventType
from app.schemas.item import ItemCreate, ItemUpdate
from app.repositories.item_repo import ItemRepository
from app.repositories.event_repo import EventRepository


class ItemService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.item_repo = ItemRepository(session)
        self.event_repo = EventRepository(session)

    async def create_item(self, data: ItemCreate) -> Item:
        item = Item(
            type=data.type,
            title=data.title,
            content=data.content,
            file_path=data.file_path,
            file_hash=data.file_hash,
            mime_type=data.mime_type,
            size_bytes=data.size_bytes,
            is_encrypted=data.is_encrypted,
            signature=data.signature,
            device_id=data.device_id,
        )

        item = await self.item_repo.create(item)

        # Handle M2M relationships
        if data.tag_ids:
            await self.item_repo.set_tags(item, data.tag_ids)
        if data.collection_ids:
            await self.item_repo.set_collections(item, data.collection_ids)
        if data.project_ids:
            await self.item_repo.set_projects(item, data.project_ids)
        if data.box_ids:
            await self.item_repo.set_boxes(item, data.box_ids)

        await self.session.flush()
        await self.session.refresh(item)

        # Log event
        event = Event(
            type=EventType.UPLOAD if data.file_path else EventType.OTHER,
            description=f"Created item '{item.title}' (type: {item.type.value})",
            item_id=item.id,
            device_id=item.device_id,
        )
        await self.event_repo.create(event)
        await self.session.commit()

        logger.info(f"Item created successfully: {item.id} - {item.title}")
        return item

    async def get_item(self, item_id: uuid.UUID) -> Optional[Item]:
        return await self.item_repo.get_by_id_active(item_id)

    async def list_items(
        self,
        item_type: Optional[ItemType] = None,
        tag_id: Optional[uuid.UUID] = None,
        collection_id: Optional[uuid.UUID] = None,
        project_id: Optional[uuid.UUID] = None,
        box_id: Optional[uuid.UUID] = None,
        search_query: Optional[str] = None,
        include_deleted: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[Sequence[Item], int]:
        return await self.item_repo.filter_items(
            item_type=item_type,
            tag_id=tag_id,
            collection_id=collection_id,
            project_id=project_id,
            box_id=box_id,
            search_query=search_query,
            include_deleted=include_deleted,
            skip=skip,
            limit=limit,
        )

    async def update_item(self, item_id: uuid.UUID, data: ItemUpdate) -> Optional[Item]:
        item = await self.item_repo.get_by_id_active(item_id)
        if not item:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        tag_ids = update_dict.pop("tag_ids", None)
        collection_ids = update_dict.pop("collection_ids", None)
        project_ids = update_dict.pop("project_ids", None)
        box_ids = update_dict.pop("box_ids", None)

        for key, value in update_dict.items():
            setattr(item, key, value)

        if tag_ids is not None:
            await self.item_repo.set_tags(item, tag_ids)
        if collection_ids is not None:
            await self.item_repo.set_collections(item, collection_ids)
        if project_ids is not None:
            await self.item_repo.set_projects(item, project_ids)
        if box_ids is not None:
            await self.item_repo.set_boxes(item, box_ids)

        item = await self.item_repo.update(item)
        await self.session.commit()
        logger.info(f"Item updated: {item.id} - {item.title}")
        return item

    async def soft_delete_item(self, item_id: uuid.UUID) -> bool:
        success = await self.item_repo.soft_delete(item_id)
        if success:
            await self.session.commit()
            logger.info(f"Soft-deleted item: {item_id}")
        return success

    async def restore_item(self, item_id: uuid.UUID) -> bool:
        success = await self.item_repo.restore(item_id)
        if success:
            await self.session.commit()
            logger.info(f"Restored item: {item_id}")
        return success
