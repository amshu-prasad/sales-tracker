from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from app.services.opportunity_service import create_opportunity_service, get_opportunities_service, get_opportunity_by_id_service, update_opportunity_service, upload_document, get_opportunities_by_filter_service
from app.db.opportunity_schema import OpportunitySchema
from app.api.authenticator import get_current_user

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
async def create_opportunity(payload: OpportunitySchema, user = Depends(get_current_user)):

    response = create_opportunity_service(payload.dict(), user)

    return {
        "success": True,
        "data": response
    }


@opportunity_router.put("/update-opportunity/{opportunity_id}")
async def update_opportunity(opportunity_id: str, payload: dict, user = Depends(get_current_user)):

    response = update_opportunity_service(opportunity_id, payload, user)

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
    skip: int = 0,
    user = Depends(get_current_user)
):

    return {
        "success": True,
        "data": get_opportunities_service(search, reqdate, start_date, limit, skip, user)
    }

# New opportunities code - Shivanand Magadum
############################################

@opportunity_router.get("/dashboard")
async def get_opportunities_by_filter(

    client: str = Query(None),
    vertical: str = Query(None),
    am: str = Query(None),
    source: str = Query(None),

    from_date: str = Query(None),
    to_date: str = Query(None),

    user = Depends(get_current_user)
    # user = "shiva"
):

    return get_opportunities_by_filter_service(
        client=client,
        vertical=vertical,
        am=am,
        source=source,
        from_date=from_date,
        to_date=to_date,
        user=user
    )

# End of new opportunities code - Shivanand Magadum
############################################

@opportunity_router.get("/opportunities/{opportunity_id}")
async def get_opportunity_by_id(opportunity_id: str, user = Depends(get_current_user)):

    response = get_opportunity_by_id_service(opportunity_id, user)

    if not response:
        raise HTTPException(
            status_code=404,
            detail="Opportunity not found"
        )

    return {
        "success": True,
        "data": response
    }