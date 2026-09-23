import uuid
from typing import Optional, Sequence, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.event import Event, EventType
from app.schemas.event import EventCreate
from app.repositories.event_repo import EventRepository


class EventService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.event_repo = EventRepository(session)

    async def create_event(self, data: EventCreate) -> Event:
        event = Event(
            type=data.type,
            description=data.description,
            item_id=data.item_id,
            device_id=data.device_id,
        )
        event = await self.event_repo.create(event)
        await self.session.commit()
        return event

    async def list_events(
        self,
        event_type: Optional[EventType] = None,
        item_id: Optional[uuid.UUID] = None,
        device_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[Sequence[Event], int]:
        return await self.event_repo.filter_events(
            event_type=event_type,
            item_id=item_id,
            device_id=device_id,
            skip=skip,
            limit=limit,
        )
