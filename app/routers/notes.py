import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate
from app.services.note_service import NoteService

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.get("", response_model=List[NoteRead])
async def list_notes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    service = NoteService(db)
    notes = await service.list_notes(skip=skip, limit=limit)
    return [NoteRead.model_validate(n) for n in notes]


@router.get("/{note_id}", response_model=NoteRead)
async def get_note(
    note_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = NoteService(db)
    note = await service.get_note(note_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return NoteRead.model_validate(note)


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def create_note(
    data: NoteCreate,
    db: AsyncSession = Depends(get_db),
):
    service = NoteService(db)
    note = await service.create_note(data)
    return NoteRead.model_validate(note)


@router.patch("/{note_id}", response_model=NoteRead)
async def update_note(
    note_id: uuid.UUID,
    data: NoteUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = NoteService(db)
    note = await service.update_note(note_id, data)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return NoteRead.model_validate(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = NoteService(db)
    success = await service.delete_note(note_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
