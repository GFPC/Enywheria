import enum
import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, TimestampMixin
from app.models.m2m import item_tags, item_collections, item_projects, item_boxes


class ItemType(str, enum.Enum):
    PHOTO = "photo"
    PDF = "pdf"
    NOTE = "note"
    LINK = "link"
    SCRIPT = "script"
    SCHEMATIC = "schematic"
    LOG = "log"
    FIRMWARE = "firmware"
    OTHER = "other"


class Item(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "items"

    type: Mapped[ItemType] = mapped_column(
        Enum(ItemType), default=ItemType.OTHER, nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_encrypted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)

    device_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("devices.id", ondelete="SET NULL"), nullable=True
    )

    tags: Mapped[List["Tag"]] = relationship("Tag", secondary=item_tags, lazy="selectin")
    collections: Mapped[List["Collection"]] = relationship(
        "Collection", secondary=item_collections, back_populates="items", lazy="selectin"
    )
    projects: Mapped[List["Project"]] = relationship(
        "Project", secondary=item_projects, back_populates="items", lazy="selectin"
    )
    boxes: Mapped[List["Box"]] = relationship(
        "Box", secondary=item_boxes, back_populates="items", lazy="selectin"
    )
    device: Mapped[Optional["Device"]] = relationship("Device", lazy="selectin")
