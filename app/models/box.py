import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, utc_now
from app.models.m2m import item_boxes


class Box(Base, UUIDMixin):
    __tablename__ = "boxes"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("items.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    items: Mapped[List["Item"]] = relationship(
        "Item", secondary=item_boxes, back_populates="boxes", foreign_keys="[item_boxes.c.item_id, item_boxes.c.box_id]", lazy="selectin"
    )
