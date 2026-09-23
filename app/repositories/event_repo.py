import uuid
from typing import Optional, Sequence, Tuple
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.event import Event, EventType
from app.repositories.base import BaseRepository


class EventRepository(BaseRepository[Event]):
    def __init__(self, session: AsyncSession):
        super().__init__(Event, session)

    async def filter_events(
        self,
        event_type: Optional[EventType] = None,
        item_id: Optional[uuid.UUID] = None,
        device_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[Sequence[Event], int]:
        query = select(Event)

        if event_type is not None:
            query = query.where(Event.type == event_type)
        if item_id is not None:
            query = query.where(Event.item_id == item_id)
        if device_id is not None:
            query = query.where(Event.device_id == device_id)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar() or 0

        query = query.order_by(Event.created_at.desc()).offset(skip).limit(limit)
        events = (await self.session.execute(query)).scalars().all()

        return events, total
