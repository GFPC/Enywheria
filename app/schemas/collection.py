import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CollectionBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    cover_item_id: Optional[uuid.UUID] = None


class CollectionCreate(CollectionBase):
    pass


class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    cover_item_id: Optional[uuid.UUID] = None


class CollectionRead(CollectionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
