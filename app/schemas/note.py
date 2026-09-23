import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.tag import TagRead


class NoteBase(BaseModel):
    title: str = Field(..., max_length=300)
    body: str


class NoteCreate(NoteBase):
    tag_ids: List[uuid.UUID] = []


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=300)
    body: Optional[str] = None
    tag_ids: Optional[List[uuid.UUID]] = None


class NoteRead(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    tags: List[TagRead] = []
