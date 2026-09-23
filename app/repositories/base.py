import uuid
from typing import Any, Generic, List, Optional, Sequence, Type, TypeVar
from sqlalchemy import select, func, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Base

T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    """Generic async repository providing standard CRUD operations."""

    def __init__(self, model: Type[T], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, entity_id: uuid.UUID) -> Optional[T]:
        return await self.session.get(self.model, entity_id)

    async def list_all(
        self,
        skip: int = 0,
        limit: int = 100,
        order_by: Any = None,
    ) -> Sequence[T]:
        query = select(self.model)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            if hasattr(self.model, "created_at"):
                query = query.order_by(self.model.created_at.desc())
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def count(self) -> int:
        query = select(func.count()).select_from(self.model)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def create(self, entity: T) -> T:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def update(self, entity: T) -> T:
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity_id: uuid.UUID) -> bool:
        entity = await self.get_by_id(entity_id)
        if entity is None:
            return False
        await self.session.delete(entity)
        await self.session.flush()
        return True
