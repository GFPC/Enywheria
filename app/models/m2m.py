from sqlalchemy import Column, ForeignKey, Table, UUID
from app.models.base import Base

item_tags = Table(
    "item_tags",
    Base.metadata,
    Column("item_id", UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

item_collections = Table(
    "item_collections",
    Base.metadata,
    Column("item_id", UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
    Column("collection_id", UUID(as_uuid=True), ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True),
)

item_projects = Table(
    "item_projects",
    Base.metadata,
    Column("item_id", UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
    Column("project_id", UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
)

item_boxes = Table(
    "item_boxes",
    Base.metadata,
    Column("item_id", UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
    Column("box_id", UUID(as_uuid=True), ForeignKey("boxes.id", ondelete="CASCADE"), primary_key=True),
)

device_tags = Table(
    "device_tags",
    Base.metadata,
    Column("device_id", UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

note_tags = Table(
    "note_tags",
    Base.metadata,
    Column("note_id", UUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)
