import uuid
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, utc_now


class Tag(Base, UUIDMixin):
    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("tags.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    # Self relationship
    parent: Mapped[Optional["Tag"]] = relationship(
        "Tag", remote_side="Tag.id", backref="children", lazy="selectin"
    )
