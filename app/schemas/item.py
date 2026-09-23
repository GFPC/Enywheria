import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.item import ItemType
from app.schemas.tag import TagRead
from app.schemas.collection import CollectionRead
from app.schemas.project import ProjectRead


class ItemBase(BaseModel):
    type: ItemType = ItemType.OTHER
    title: str = Field(..., max_length=300)
    content: Optional[str] = None
    is_encrypted: bool = False
    device_id: Optional[uuid.UUID] = None


class ItemCreate(ItemBase):
    file_path: Optional[str] = None
    file_hash: Optional[str] = None
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None
    signature: Optional[str] = None
    tag_ids: List[uuid.UUID] = []
    collection_ids: List[uuid.UUID] = []
    project_ids: List[uuid.UUID] = []
    box_ids: List[uuid.UUID] = []


class ItemUpdate(BaseModel):
    type: Optional[ItemType] = None
    title: Optional[str] = Field(None, max_length=300)
    content: Optional[str] = None
    is_encrypted: Optional[bool] = None
    signature: Optional[str] = None
    device_id: Optional[uuid.UUID] = None
    tag_ids: Optional[List[uuid.UUID]] = None
    collection_ids: Optional[List[uuid.UUID]] = None
    project_ids: Optional[List[uuid.UUID]] = None
    box_ids: Optional[List[uuid.UUID]] = None


class ItemRead(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_path: Optional[str] = None
    file_hash: Optional[str] = None
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None
    signature: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    tags: List[TagRead] = []
    collections: List[CollectionRead] = []
    projects: List[ProjectRead] = []
