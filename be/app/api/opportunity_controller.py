from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from app.services.opportunity_service import create_opportunity_service, get_opportunities_service, get_opportunity_by_id_service, update_opportunity_service, upload_document
from app.db.opportunity_schema import OpportunitySchema
from be.app.api.authenticator import get_current_user

# aws_s3_object = aws_s3_access_class()

opportunity_router = APIRouter()

@opportunity_router.post("/upload-jd")
async def upload_file(
    file: UploadFile = File(...), user = Depends(get_current_user)
):
    response = await upload_document(file, user)
    return {
        "success": True,
        "data": response
    }

@opportunity_router.post("/create-opportunity")
async def create_opportunity(payload: OpportunitySchema):

    response = create_opportunity_service(payload.dict())

    return {
        "success": True,
        "data": response
    }


@opportunity_router.put("/update-opportunity/{opportunity_id}")
async def update_opportunity(opportunity_id: str, payload: dict):

    response = update_opportunity_service(opportunity_id, payload)

    if not response:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    return {
        "success": True,
        "data": response
    }

@opportunity_router.get("/opportunities")
async def get_opportunities(
    search: Optional[str] = Query(None),
    reqdate: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    limit: int = 100,
    skip: int = 0
):

    return {
        "success": True,
        "data": get_opportunities_service(search, reqdate, start_date, limit, skip)
    }

@opportunity_router.get("/opportunities/{opportunity_id}")
async def get_opportunity_by_id(opportunity_id: str):

    response = get_opportunity_by_id_service(opportunity_id)

    if not response:
        raise HTTPException(
            status_code=404,
            detail="Opportunity not found"
        )

    return {
        "success": True,
        "data": response
    }