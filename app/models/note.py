from typing import List
from sqlalchemy import Text, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, TimestampMixin
from app.models.m2m import note_tags


class Note(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notes"

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    tags: Mapped[List["Tag"]] = relationship(
        "Tag", secondary=note_tags, lazy="selectin"
    )
