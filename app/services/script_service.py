import uuid
from datetime import datetime, timezone
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from app.models.script import Script
from app.models.event import Event, EventType
from app.schemas.script import ScriptCreate, ScriptUpdate, ScriptRunResult
from app.repositories.script_repo import ScriptRepository
from app.repositories.event_repo import EventRepository


class ScriptService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.script_repo = ScriptRepository(session)
        self.event_repo = EventRepository(session)

    async def create_script(self, data: ScriptCreate) -> Script:
        script = Script(
            name=data.name,
            language=data.language,
            body=data.body,
            description=data.description,
            device_id=data.device_id,
        )
        script = await self.script_repo.create(script)
        await self.session.commit()
        return script

    async def get_script(self, script_id: uuid.UUID) -> Optional[Script]:
        return await self.script_repo.get_by_id(script_id)

    async def list_scripts(self, skip: int = 0, limit: int = 100) -> Sequence[Script]:
        return await self.script_repo.list_all(skip=skip, limit=limit)

    async def update_script(self, script_id: uuid.UUID, data: ScriptUpdate) -> Optional[Script]:
        script = await self.script_repo.get_by_id(script_id)
        if not script:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(script, key, value)
        script = await self.script_repo.update(script)
        await self.session.commit()
        return script

    async def delete_script(self, script_id: uuid.UUID) -> bool:
        success = await self.script_repo.delete(script_id)
        if success:
            await self.session.commit()
        return success

    async def run_script(self, script_id: uuid.UUID) -> ScriptRunResult:
        """Run script execution stub and record audit Event."""
        script = await self.script_repo.get_by_id(script_id)
        if not script:
            raise ValueError(f"Script {script_id} not found")

        output = f"Execution stub for [{script.language}] script '{script.name}': Completed with status 0."
        now = datetime.now(timezone.utc)

        # Record Event log
        event = Event(
            type=EventType.SCRIPT_RUN,
            description=f"Executed script '{script.name}' ({script.language}) on target device",
            device_id=script.device_id,
        )
        await self.event_repo.create(event)
        await self.session.commit()

        return ScriptRunResult(
            script_id=script.id,
            device_id=script.device_id,
            success=True,
            output=output,
            executed_at=now,
        )
