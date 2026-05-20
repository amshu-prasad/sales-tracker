from fastapi import APIRouter
from app.db.profile_schema import ProfileSchema
from app.services.profile_service import create_profile_service

profile_router = APIRouter()


@profile_router.post("/create-profile")
async def create_profile(payload: ProfileSchema):

    response = create_profile_service(payload.dict())

    return {
        "success": True,
        "data": response
    }