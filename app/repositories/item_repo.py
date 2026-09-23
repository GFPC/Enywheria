import uuid
from datetime import datetime, timezone
from typing import List, Optional, Sequence, Tuple
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.item import Item, ItemType
from app.models.m2m import item_tags, item_collections, item_projects, item_boxes
from app.models.tag import Tag
from app.models.collection import Collection
from app.models.project import Project
from app.models.box import Box
from app.repositories.base import BaseRepository


class ItemRepository(BaseRepository[Item]):
    def __init__(self, session: AsyncSession):
        super().__init__(Item, session)

    async def get_by_id_active(self, item_id: uuid.UUID) -> Optional[Item]:
        """Fetch item by ID excluding soft-deleted ones."""
        query = select(Item).where(Item.id == item_id, Item.deleted_at.is_(None))
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_hash(self, file_hash: str) -> Optional[Item]:
        """Fetch active item by file_hash for deduplication lookup."""
        query = select(Item).where(
            Item.file_hash == file_hash, Item.deleted_at.is_(None)
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def filter_items(
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
        """Filter items with optional pagination and return (items, total_count)."""
        query = select(Item)

        if not include_deleted:
            query = query.where(Item.deleted_at.is_(None))

        if item_type is not None:
            query = query.where(Item.type == item_type)

        if tag_id is not None:
            query = query.join(item_tags, Item.id == item_tags.c.item_id).where(
                item_tags.c.tag_id == tag_id
            )

        if collection_id is not None:
            query = query.join(
                item_collections, Item.id == item_collections.c.item_id
            ).where(item_collections.c.collection_id == collection_id)

        if project_id is not None:
            query = query.join(
                item_projects, Item.id == item_projects.c.item_id
            ).where(item_projects.c.project_id == project_id)

        if box_id is not None:
            query = query.join(item_boxes, Item.id == item_boxes.c.item_id).where(
                item_boxes.c.box_id == box_id
            )

        if search_query:
            query = query.where(
                Item.title.ilike(f"%{search_query}%")
                | Item.content.ilike(f"%{search_query}%")
            )

        # Distinct for M2M joins
        query = query.distinct()

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        # Execute page
        query = query.order_by(Item.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        items = result.scalars().all()

        return items, total

    async def soft_delete(self, item_id: uuid.UUID) -> bool:
        """Mark an item as soft-deleted with deleted_at timestamp."""
        item = await self.get_by_id(item_id)
        if not item or item.deleted_at is not None:
            return False
        item.deleted_at = datetime.now(timezone.utc)
        await self.session.flush()
        return True

    async def restore(self, item_id: uuid.UUID) -> bool:
        """Restore a soft-deleted item."""
        item = await self.get_by_id(item_id)
        if not item or item.deleted_at is None:
            return False
        item.deleted_at = None
        await self.session.flush()
        return True

    async def set_tags(self, item: Item, tag_ids: List[uuid.UUID]):
        """Associate tags with item."""
        if not tag_ids:
            item.tags = []
            return
        result = await self.session.execute(select(Tag).where(Tag.id.in_(tag_ids)))
        tags = result.scalars().all()
        item.tags = list(tags)

    async def set_collections(self, item: Item, collection_ids: List[uuid.UUID]):
        """Associate collections with item."""
        if not collection_ids:
            item.collections = []
            return
        result = await self.session.execute(
            select(Collection).where(Collection.id.in_(collection_ids))
        )
        collections = result.scalars().all()
        item.collections = list(collections)

    async def set_projects(self, item: Item, project_ids: List[uuid.UUID]):
        """Associate projects with item."""
        if not project_ids:
            item.projects = []
            return
        result = await self.session.execute(
            select(Project).where(Project.id.in_(project_ids))
        )
        projects = result.scalars().all()
        item.projects = list(projects)

    async def set_boxes(self, item: Item, box_ids: List[uuid.UUID]):
        """Associate boxes with item."""
        if not box_ids:
            item.boxes = []
            return
        result = await self.session.execute(select(Box).where(Box.id.in_(box_ids)))
        boxes = result.scalars().all()
        item.boxes = list(boxes)
