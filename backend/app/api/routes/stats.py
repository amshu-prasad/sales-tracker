from typing import Optional

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.db.mongo import get_db
from app.services import stats_service

router = APIRouter(tags=["Stats"])


@router.get("/stats/summary")
async def stats_summary(
    month: Optional[str] = None,
    week: Optional[str] = None,
    current_user: str = Depends(get_current_user),
    db=Depends(get_db),
):
    return await stats_service.summary(db, current_user, month, week)


@router.get("/stats/by-am")
async def stats_by_am(
    month: Optional[str] = None,
    week: Optional[str] = None,
    current_user: str = Depends(get_current_user),
    db=Depends(get_db),
):
    return await stats_service.by_am(db, current_user, month, week)


@router.get("/stats/by-vertical")
async def stats_by_vertical(
    month: Optional[str] = None,
    week: Optional[str] = None,
    current_user: str = Depends(get_current_user),
    db=Depends(get_db),
):
    return await stats_service.by_vertical(db, current_user, month, week)


@router.get("/stats/by-client")
async def stats_by_client(
    month: Optional[str] = None,
    week: Optional[str] = None,
    current_user: str = Depends(get_current_user),
    db=Depends(get_db),
):
    return await stats_service.by_client(db, current_user, month, week)


@router.get("/stats/rollup")
async def stats_rollup(
    current_user: str = Depends(get_current_user),
    db=Depends(get_db),
):
    return await stats_service.rollup(db, current_user)


@router.get("/months")
async def get_months(
    current_user: str = Depends(get_current_user),
    db=Depends(get_db),
):
    return await stats_service.get_months(db, current_user)
