from typing import Optional

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.db.mongo import get_db
from app.schemas.entry import EntryCreate, EntryUpdate
from app.services import entry_service

router = APIRouter(prefix="/entries", tags=["Entries"])


@router.post("", status_code=201)
async def create_entry(
    body: EntryCreate,
    current_user: str = Depends(get_current_user),
    db=Depends(get_db),
):
    return await entry_service.create_entry(db, body, current_user)


@router.get("")
async def list_entries(
    month: Optional[str] = None,
    week: Optional[str] = None,
    date: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    type: Optional[str] = None,
    current_user: str = Depends(get_current_user),
    db=Depends(get_db),
):
    return await entry_service.list_entries(
        db, current_user, month, week, date, from_date, to_date, type
    )


@router.get("/{entry_id}")
async def get_entry(
    entry_id: str,
    current_user: str = Depends(get_current_user),
    db=Depends(get_db),
):
    return await entry_service.get_entry(db, entry_id, current_user)


@router.put("/{entry_id}")
async def update_entry(
    entry_id: str,
    body: EntryUpdate,
    current_user: str = Depends(get_current_user),
    db=Depends(get_db),
):
    return await entry_service.update_entry(db, entry_id, body, current_user)


@router.delete("/{entry_id}", status_code=200)
async def delete_entry(
    entry_id: str,
    current_user: str = Depends(get_current_user),
    db=Depends(get_db),
):
    return await entry_service.delete_entry(db, entry_id, current_user)
