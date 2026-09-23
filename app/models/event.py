import enum
import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, utc_now


class EventType(str, enum.Enum):
    UPLOAD = "upload"
    SCRIPT_RUN = "script_run"
    DEVICE_ONLINE = "device_online"
    DEVICE_OFFLINE = "device_offline"
    SYNC = "sync"
    OTHER = "other"


class Event(Base, UUIDMixin):
    __tablename__ = "events"

    type: Mapped[EventType] = mapped_column(
        Enum(EventType), default=EventType.OTHER, nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    item_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("items.id", ondelete="SET NULL"), nullable=True
    )
    device_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("devices.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    item: Mapped[Optional["Item"]] = relationship("Item", lazy="selectin")
    device: Mapped[Optional["Device"]] = relationship("Device", back_populates="events", lazy="selectin")
