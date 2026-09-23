"""initial schema and fts5

Revision ID: 001_initial_schema_and_fts5
Revises: 
Create Date: 2026-09-22 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial_schema_and_fts5"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Tags
    op.create_table(
        "tags",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("color", sa.String(7), nullable=True),
        sa.Column("parent_id", sa.CHAR(36), sa.ForeignKey("tags.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_tags_name", "tags", ["name"], unique=True)

    # 2. Clients
    op.create_table(
        "clients",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("contact", sa.String(200), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 3. Projects
    op.create_table(
        "projects",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.Enum("ACTIVE", "PAUSED", "DONE", "ARCHIVED", name="projectstatus"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("client_id", sa.CHAR(36), sa.ForeignKey("clients.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 4. Devices
    op.create_table(
        "devices",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("type", sa.Enum("PC", "PHONE", "MCU", "ROUTER", "SBC", "OTHER", name="devicetype"), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("mac_address", sa.String(17), nullable=True),
        sa.Column("ssh_key_encrypted", sa.LargeBinary(), nullable=True),
        sa.Column("status", sa.Enum("ONLINE", "OFFLINE", "UNKNOWN", name="devicestatus"), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 5. Items (Central Entity)
    op.create_table(
        "items",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("type", sa.Enum("PHOTO", "PDF", "NOTE", "LINK", "SCRIPT", "SCHEMATIC", "LOG", "FIRMWARE", "OTHER", name="itemtype"), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("file_path", sa.String(500), nullable=True),
        sa.Column("file_hash", sa.String(64), nullable=True),
        sa.Column("mime_type", sa.String(100), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("is_encrypted", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("signature", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("device_id", sa.CHAR(36), sa.ForeignKey("devices.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_items_type", "items", ["type"])
    op.create_index("ix_items_title", "items", ["title"])
    op.create_index("ix_items_file_hash", "items", ["file_hash"])
    op.create_index("ix_items_deleted_at", "items", ["deleted_at"])

    # 6. Collections
    op.create_table(
        "collections",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("parent_id", sa.CHAR(36), sa.ForeignKey("collections.id", ondelete="SET NULL"), nullable=True),
        sa.Column("cover_item_id", sa.CHAR(36), sa.ForeignKey("items.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 7. Scripts
    op.create_table(
        "scripts",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("language", sa.String(50), nullable=False, server_default="bash"),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("device_id", sa.CHAR(36), sa.ForeignKey("devices.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 8. Boxes
    op.create_table(
        "boxes",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("location", sa.String(200), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("photo_id", sa.CHAR(36), sa.ForeignKey("items.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 9. Notes
    op.create_table(
        "notes",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 10. Events
    op.create_table(
        "events",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("type", sa.Enum("UPLOAD", "SCRIPT_RUN", "DEVICE_ONLINE", "DEVICE_OFFLINE", "SYNC", "OTHER", name="eventtype"), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("item_id", sa.CHAR(36), sa.ForeignKey("items.id", ondelete="SET NULL"), nullable=True),
        sa.Column("device_id", sa.CHAR(36), sa.ForeignKey("devices.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # M2M Join Tables
    op.create_table(
        "item_tags",
        sa.Column("item_id", sa.CHAR(36), sa.ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.CHAR(36), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "item_collections",
        sa.Column("item_id", sa.CHAR(36), sa.ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("collection_id", sa.CHAR(36), sa.ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "item_projects",
        sa.Column("item_id", sa.CHAR(36), sa.ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("project_id", sa.CHAR(36), sa.ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "item_boxes",
        sa.Column("item_id", sa.CHAR(36), sa.ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("box_id", sa.CHAR(36), sa.ForeignKey("boxes.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "device_tags",
        sa.Column("device_id", sa.CHAR(36), sa.ForeignKey("devices.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.CHAR(36), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "note_tags",
        sa.Column("note_id", sa.CHAR(36), sa.ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.CHAR(36), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )

    # SQLite FTS5 Virtual Table & Triggers
    op.execute(
        """
        CREATE VIRTUAL TABLE item_fts USING fts5(
            title, content, tokenize='unicode61'
        );
        """
    )

    op.execute(
        """
        CREATE TRIGGER item_fts_ai AFTER INSERT ON items BEGIN
            INSERT INTO item_fts(rowid, title, content) VALUES (new.rowid, new.title, COALESCE(new.content, ''));
        END;
        """
    )

    op.execute(
        """
        CREATE TRIGGER item_fts_au AFTER UPDATE ON items BEGIN
            UPDATE item_fts SET title = new.title, content = COALESCE(new.content, '') WHERE rowid = new.rowid;
        END;
        """
    )

    op.execute(
        """
        CREATE TRIGGER item_fts_ad AFTER DELETE ON items BEGIN
            DELETE FROM item_fts WHERE rowid = old.rowid;
        END;
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS item_fts_ad;")
    op.execute("DROP TRIGGER IF EXISTS item_fts_au;")
    op.execute("DROP TRIGGER IF EXISTS item_fts_ai;")
    op.execute("DROP TABLE IF EXISTS item_fts;")

    op.drop_table("note_tags")
    op.drop_table("device_tags")
    op.drop_table("item_boxes")
    op.drop_table("item_projects")
    op.drop_table("item_collections")
    op.drop_table("item_tags")

    op.drop_table("events")
    op.drop_table("notes")
    op.drop_table("boxes")
    op.drop_table("scripts")
    op.drop_table("collections")
    op.drop_table("items")
    op.drop_table("devices")
    op.drop_table("projects")
    op.drop_table("clients")
    op.drop_table("tags")
