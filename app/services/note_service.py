import uuid
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate
from app.repositories.note_repo import NoteRepository


class NoteService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.note_repo = NoteRepository(session)

    async def create_note(self, data: NoteCreate) -> Note:
        note = Note(
            title=data.title,
            body=data.body,
        )
        note = await self.note_repo.create(note)
        if data.tag_ids:
            await self.note_repo.set_tags(note, data.tag_ids)
        await self.session.commit()
        return note

    async def get_note(self, note_id: uuid.UUID) -> Optional[Note]:
        return await self.note_repo.get_by_id(note_id)

    async def list_notes(self, skip: int = 0, limit: int = 100) -> Sequence[Note]:
        return await self.note_repo.list_all(skip=skip, limit=limit)

    async def update_note(self, note_id: uuid.UUID, data: NoteUpdate) -> Optional[Note]:
        note = await self.note_repo.get_by_id(note_id)
        if not note:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        tag_ids = update_dict.pop("tag_ids", None)

        for key, value in update_dict.items():
            setattr(note, key, value)

        if tag_ids is not None:
            await self.note_repo.set_tags(note, tag_ids)

        note = await self.note_repo.update(note)
        await self.session.commit()
        return note

    async def delete_note(self, note_id: uuid.UUID) -> bool:
        success = await self.note_repo.delete(note_id)
        if success:
            await self.session.commit()
        return success
