import uuid
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, utc_now
from app.models.m2m import item_collections


class Collection(Base, UUIDMixin):
    __tablename__ = "collections"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("collections.id", ondelete="SET NULL"), nullable=True
    )
    cover_item_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("items.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    parent: Mapped[Optional["Collection"]] = relationship(
        "Collection", remote_side="Collection.id", backref="children", lazy="selectin"
    )
    items: Mapped[List["Item"]] = relationship(
        "Item", secondary=item_collections, back_populates="collections", foreign_keys="[item_collections.c.item_id, item_collections.c.collection_id]", lazy="selectin"
    )
