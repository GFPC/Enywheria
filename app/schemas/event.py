import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.event import EventType


class EventBase(BaseModel):
    type: EventType = EventType.OTHER
    description: str
    item_id: Optional[uuid.UUID] = None
    device_id: Optional[uuid.UUID] = None


class EventCreate(EventBase):
    pass


class EventRead(EventBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
