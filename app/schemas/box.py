import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BoxBase(BaseModel):
    name: str = Field(..., max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    photo_id: Optional[uuid.UUID] = None


class BoxCreate(BoxBase):
    item_ids: List[uuid.UUID] = []


class BoxUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    photo_id: Optional[uuid.UUID] = None
    item_ids: Optional[List[uuid.UUID]] = None


class BoxRead(BoxBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
