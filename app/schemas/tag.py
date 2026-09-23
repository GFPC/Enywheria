import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class TagBase(BaseModel):
    name: str = Field(..., max_length=100)
    color: Optional[str] = Field(None, max_length=7, pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
    parent_id: Optional[uuid.UUID] = None


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=7, pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
    parent_id: Optional[uuid.UUID] = None


class TagRead(TagBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
