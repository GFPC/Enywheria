import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ScriptBase(BaseModel):
    name: str = Field(..., max_length=200)
    language: str = Field("bash", max_length=50)
    body: str
    description: Optional[str] = None
    device_id: Optional[uuid.UUID] = None


class ScriptCreate(ScriptBase):
    pass


class ScriptUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    language: Optional[str] = Field(None, max_length=50)
    body: Optional[str] = None
    description: Optional[str] = None
    device_id: Optional[uuid.UUID] = None


class ScriptRead(ScriptBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ScriptRunResult(BaseModel):
    script_id: uuid.UUID
    device_id: Optional[uuid.UUID]
    success: bool
    output: str
    executed_at: datetime
