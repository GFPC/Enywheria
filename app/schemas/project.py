import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.project import ProjectStatus
from app.schemas.client import ClientRead


class ProjectBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.ACTIVE
    deadline: Optional[datetime] = None
    client_id: Optional[uuid.UUID] = None


class ProjectCreate(ProjectBase):
    started_at: Optional[datetime] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    deadline: Optional[datetime] = None
    client_id: Optional[uuid.UUID] = None


class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    started_at: datetime
    created_at: datetime
    client: Optional[ClientRead] = None
