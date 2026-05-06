from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.db.mongo import get_db
from app.services import meta_service

router = APIRouter(prefix="/meta", tags=["Meta"])


@router.get("")
async def get_meta(db=Depends(get_db)):
    return await meta_service.get_meta(db)


@router.put("")
async def update_meta(
    body: dict,
    current_user: str = Depends(get_current_user),
    db=Depends(get_db),
):
    allowed = {"CLIENTS", "VERTICALS", "AMS"}
    update_fields = {k.upper(): v for k, v in body.items() if k.upper() in allowed}
    return await meta_service.update_meta(db, update_fields, current_user)
