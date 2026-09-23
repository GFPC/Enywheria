import enum
import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import LargeBinary, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, utc_now
from app.models.m2m import device_tags


class DeviceType(str, enum.Enum):
    PC = "pc"
    PHONE = "phone"
    MCU = "mcu"
    ROUTER = "router"
    SBC = "sbc"
    OTHER = "other"


class DeviceStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    UNKNOWN = "unknown"


class Device(Base, UUIDMixin):
    __tablename__ = "devices"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[DeviceType] = mapped_column(
        Enum(DeviceType), default=DeviceType.OTHER, nullable=False
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    mac_address: Mapped[Optional[str]] = mapped_column(String(17), nullable=True)
    ssh_key_encrypted: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    status: Mapped[DeviceStatus] = mapped_column(
        Enum(DeviceStatus), default=DeviceStatus.UNKNOWN, nullable=False
    )
    last_seen: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    tags: Mapped[List["Tag"]] = relationship(
        "Tag", secondary=device_tags, lazy="selectin"
    )
    scripts: Mapped[List["Script"]] = relationship("Script", back_populates="device", lazy="selectin")
    events: Mapped[List["Event"]] = relationship("Event", back_populates="device")
