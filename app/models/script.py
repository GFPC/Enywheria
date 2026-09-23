import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, TimestampMixin


class Script(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "scripts"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    language: Mapped[str] = mapped_column(String(50), default="bash", nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    device_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("devices.id", ondelete="SET NULL"), nullable=True
    )

    device: Mapped[Optional["Device"]] = relationship("Device", back_populates="scripts", lazy="selectin")
