import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ClientBase(BaseModel):
    name: str = Field(..., max_length=200)
    contact: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    contact: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None


class ClientRead(ClientBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
