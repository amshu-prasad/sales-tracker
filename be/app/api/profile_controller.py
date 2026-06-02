from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.profile_schema import ProfileSchema
from app.services.profile_service import create_offboarding_profile_service, create_profile_service, get_client_onboarding_profiles_service, get_final_selected_profiles_service, get_profile_by_id_service, get_profiles_service, update_profile_service
from app.api.authenticator import get_current_user

profile_router = APIRouter()


@profile_router.post("/create-profile")
async def create_profile(payload: ProfileSchema, user = Depends(get_current_user)):

    response = create_profile_service(payload.dict(), user)

    return {
        "success": True,
        "data": response
    }

@profile_router.put("/profiles/{profile_id}")
async def update_profile(
    profile_id: str,
    payload: dict, user = Depends(get_current_user)
):

    response = update_profile_service(
        profile_id,
        payload,
        user
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
    skip: int = 0,
    user = Depends(get_current_user)
):

    return {
        "success": True,
        "data": get_profiles_service(
            search,
            profile_status,
            open_status,
            limit,
            skip, user
        )
    }

@profile_router.get("/profiles/{profile_id}")
async def get_profile_by_id(profile_id: str, user = Depends(get_current_user)):

    response = get_profile_by_id_service(profile_id, user)

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
    skip: int = 0, user = Depends(get_current_user)
):
    data =get_final_selected_profiles_service(
            limit,
            skip, user
        )

    return {
        "success": True,
        "data": data
    }

@profile_router.get("/profiles-client-onboarding")
async def get_client_onboarding_profiles(
    limit: int = 100,
    skip: int = 0, user = Depends(get_current_user)
):

    data = get_client_onboarding_profiles_service(
        limit,
        skip, user
    )

    return {
        "success": True,
        "data": data
    }

@profile_router.post("/create-offboarding-profile")
async def create_offboarding_profile(payload: ProfileSchema, user = Depends(get_current_user)):

    response = create_offboarding_profile_service(payload.dict(), user)

    return {
        "success": True,
        "data": response
    }


