from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.db.profile_schema import ProfileSchema
from app.services.profile_service import create_profile_service, get_final_selected_profiles_service, get_profile_by_id_service, get_profiles_service, update_profile_service

profile_router = APIRouter()


@profile_router.post("/create-profile")
async def create_profile(payload: ProfileSchema):

    response = create_profile_service(payload.dict())

    return {
        "success": True,
        "data": response
    }

@profile_router.put("/profiles/{profile_id}")
async def update_profile(
    profile_id: str,
    payload: dict
):

    response = update_profile_service(
        profile_id,
        payload
    )

    if not response:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return {
        "success": True,
        "data": response
    }

@profile_router.get("/profiles")
async def get_profiles(

    search: Optional[str] = Query(None),

    profile_status: Optional[str] = Query(None),

    open_status: Optional[str] = Query(None),

    limit: int = 100,

    skip: int = 0
):

    return {
        "success": True,
        "data": get_profiles_service(
            search,
            profile_status,
            open_status,
            limit,
            skip
        )
    }

@profile_router.get("/profiles/{profile_id}")
async def get_profile_by_id(profile_id: str):

    response = get_profile_by_id_service(profile_id)

    if not response:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return {
        "success": True,
        "data": response
    }

@profile_router.get("/profiles-final-selection")
async def get_final_selected_profiles(
    limit: int = 100,
    skip: int = 0
):
    data =get_final_selected_profiles_service(
            limit,
            skip
        )

    return {
        "success": True,
        "data": data
    }