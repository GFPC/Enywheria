import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.script import ScriptCreate, ScriptRead, ScriptRunResult, ScriptUpdate
from app.services.script_service import ScriptService

router = APIRouter(prefix="/scripts", tags=["Scripts"])


@router.get("", response_model=List[ScriptRead])
async def list_scripts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    service = ScriptService(db)
    scripts = await service.list_scripts(skip=skip, limit=limit)
    return [ScriptRead.model_validate(s) for s in scripts]


@router.get("/{script_id}", response_model=ScriptRead)
async def get_script(
    script_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = ScriptService(db)
    script = await service.get_script(script_id)
    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")
    return ScriptRead.model_validate(script)


@router.post("", response_model=ScriptRead, status_code=status.HTTP_201_CREATED)
async def create_script(
    data: ScriptCreate,
    db: AsyncSession = Depends(get_db),
):
    service = ScriptService(db)
    script = await service.create_script(data)
    return ScriptRead.model_validate(script)


@router.patch("/{script_id}", response_model=ScriptRead)
async def update_script(
    script_id: uuid.UUID,
    data: ScriptUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = ScriptService(db)
    script = await service.update_script(script_id, data)
    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")
    return ScriptRead.model_validate(script)


@router.delete("/{script_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_script(
    script_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = ScriptService(db)
    success = await service.delete_script(script_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")


@router.post("/{script_id}/run", response_model=ScriptRunResult)
async def run_script(
    script_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Execute script and log event."""
    service = ScriptService(db)
    try:
        return await service.run_script(script_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
