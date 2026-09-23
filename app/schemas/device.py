import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.device import DeviceStatus, DeviceType
from app.schemas.tag import TagRead


class DeviceBase(BaseModel):
    name: str = Field(..., max_length=200)
    type: DeviceType = DeviceType.OTHER
    ip_address: Optional[str] = Field(None, max_length=45)
    mac_address: Optional[str] = Field(None, max_length=17)


class DeviceCreate(DeviceBase):
    ssh_key: Optional[str] = None
    tag_ids: List[uuid.UUID] = []


class DeviceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    type: Optional[DeviceType] = None
    ip_address: Optional[str] = Field(None, max_length=45)
    mac_address: Optional[str] = Field(None, max_length=17)
    status: Optional[DeviceStatus] = None
    ssh_key: Optional[str] = None
    tag_ids: Optional[List[uuid.UUID]] = None


class DeviceRead(DeviceBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: DeviceStatus
    last_seen: Optional[datetime] = None
    created_at: datetime
    tags: List[TagRead] = []


class DevicePingResult(BaseModel):
    id: uuid.UUID
    name: str
    status: DeviceStatus
    latency_ms: Optional[float] = None
    message: str
