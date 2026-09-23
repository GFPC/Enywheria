import enum
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, utc_now
from app.models.m2m import item_projects


class ProjectStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    DONE = "done"
    ARCHIVED = "archived"


class Project(Base, UUIDMixin):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), default=ProjectStatus.ACTIVE, nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    deadline: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("clients.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    client: Mapped[Optional["Client"]] = relationship("Client", back_populates="projects", lazy="selectin")
    items: Mapped[List["Item"]] = relationship(
        "Item", secondary=item_projects, back_populates="projects", lazy="selectin"
    )
