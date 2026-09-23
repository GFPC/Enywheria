import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.database import get_db
from app.models.item import ItemType
from app.schemas.item import ItemCreate, ItemRead
from app.services.file_service import FileService
from app.services.item_service import ItemService

router = APIRouter(prefix="/files", tags=["Files"])


@router.post("/upload", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    type: ItemType = Form(ItemType.OTHER),
    is_encrypted: bool = Form(False),
    device_id: Optional[uuid.UUID] = Form(None),
    tag_ids: List[uuid.UUID] = Form([]),
    collection_ids: List[uuid.UUID] = Form([]),
    project_ids: List[uuid.UUID] = Form([]),
    box_ids: List[uuid.UUID] = Form([]),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload file asset, compute SHA-256 hash, perform sharded storage & deduplication,
    sign file with ECDSA, and register central Item entity.
    """
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty"
        )

    file_service = FileService()
    target_path, file_hash, size_bytes, signature = await file_service.save_file(
        file_content=file_bytes,
        is_encrypted=is_encrypted,
    )

    # Convert path to relative string
    rel_path = str(target_path.relative_to(settings.base_dir)).replace("\\", "/")

    # Determine title
    item_title = title or file.filename or f"File_{file_hash[:8]}"

    item_data = ItemCreate(
        type=type,
        title=item_title,
        file_path=rel_path,
        file_hash=file_hash,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        is_encrypted=is_encrypted,
        signature=signature,
        device_id=device_id,
        tag_ids=tag_ids,
        collection_ids=collection_ids,
        project_ids=project_ids,
        box_ids=box_ids,
    )

    item_service = ItemService(db)
    item = await item_service.create_item(item_data)
    return ItemRead.model_validate(item)


@router.get("/{item_id}")
async def download_file(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Download associated file content for an Item."""
    item_service = ItemService(db)
    item = await item_service.get_item(item_id)
    if not item or not item.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item or file path not found",
        )

    full_path = settings.base_dir / item.file_path
    file_service = FileService()
    try:
        data = file_service.read_file(full_path, is_encrypted=item.is_encrypted)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File asset not found at path {item.file_path}",
        )

    filename = item.title if "." in item.title else f"{item.title}.bin"
    return Response(
        content=data,
        media_type=item.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
