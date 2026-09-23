from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, utc_now


class Client(Base, UUIDMixin):
    __tablename__ = "clients"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    projects: Mapped[List["Project"]] = relationship("Project", back_populates="client")
