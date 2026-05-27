import uuid
from datetime import date, datetime
from fastapi import HTTPException

from app.helper.aws_helper import aws_s3_access_class
from app.config.EnvConfig import bucket_name
from app.db.models import count_documents, create_one, find_many, find_many_profile, find_one, update_one

aws_helper = aws_s3_access_class()

ALLOWED_TYPES = [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]


async def upload_document(file, user):

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type"
        )

    file_content = await file.read()
    file_id = uuid.uuid4()

    unique_name = f"{file_id}_{file.filename}"

    s3_key = f"sb_tracker/jd_file/{unique_name}"

    # Upload to S3
    aws_helper.upload_file(
        bucket_name=bucket_name,
        file_key=s3_key,
        file_content=file_content,
        content_type=file.content_type
    )

    s3_url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"

    document = {
        "AM": user,
        "file_id": str(file_id),
        "file_name": file.filename,
        "file_type": file.content_type,
        "s3_key": s3_key,
        "s3_url": s3_url,
        "uploaded_at": datetime.utcnow()
    }

    inserted_id = create_one("file_details", document)
    document["_id"] = inserted_id

    return document

def create_opportunity_service(data, user):

    document = {
        "opportunity_id": str(uuid.uuid4()),
        "client": data.get("client"),
        "BU": data.get("BU"),
        "mode": data.get("mode"),
        "team": data.get("team"),
        "skill": data.get("skill"),
        "month": data.get("month"),
        "reqdate": data.get("reqdate").isoformat() if data.get("reqdate") else None,
        "expected_start_date": data.get("expected_start_date"),
        "expected_closure_date": data.get("expected_closure_date"),
        "location": data.get("location"),
        "no_of_positions": data.get("no_of_positions"),
        "experience": data.get("experience"),
        "technical_poc": data.get("technical_poc"),
        "priority": data.get("priority"),
        "doable_headcount": data.get("doable_headcount"),
        "file_id": data.get("file_id"),
        "vertical": data.get("vertical"),
        "created_at": datetime.utcnow(),
        "AM" : user,
        "hiring_manager_name": data.get("hiring_manager_name"),
        "hiring_manager_email": data.get("hiring_manager_email"),
        "hiring_location": data.get("hiring_location"),
        "hiring_manager_phno": data.get("hiring_manager_phno")
    }

    inserted_id = create_one("opportunities", document)

    document["_id"] = inserted_id

    return document


def update_opportunity_service(opportunity_id: str, data: dict):

    update_data = data.copy()

    # handle date fields (if present)
    if "reqdate" in update_data and update_data["reqdate"]:
        if isinstance(update_data["reqdate"], (datetime, date)):
            update_data["reqdate"] = update_data["reqdate"].isoformat()


    update_data["updated_at"] = datetime.utcnow()

    query = {"opportunity_id": opportunity_id}

    result = update_one("opportunities", query, update_data)

    if result.matched_count == 0:
        return None

    return {
        "updated": result.modified_count,
        "opportunity_id": opportunity_id
    }

def get_opportunities_service(
    search,
    reqdate,
    start_date,
    limit,
    skip, user
):

    query = {}

    query["AM"] = user

    # -------------------------
    # FILTERS
    # -------------------------
    if reqdate:
        query["reqdate"] = reqdate

    if start_date:
        query["start_date"] = start_date

    # -------------------------
    # SEARCH
    # -------------------------
    if search:

        regex = {
            "$regex": search,
            "$options": "i"
        }

        query["$or"] = [
            {"client": regex},
            {"BU": regex},
            {"mode": regex},
            {"team": regex},
            {"skill": regex},
            {"month": regex},
            {"location": regex},
            {"experience": regex},
            {"technical_poc": regex},
            {"priority": regex},
            {"file_id": regex},
        ]

    # -------------------------
    # GET OPPORTUNITIES
    # -------------------------
    data = find_many(
        "opportunities",
        query=query,
        limit=limit,
        skip=skip,
        sort=[("_id", -1)]
    )

    # -------------------------
    # PROFILE COUNTS
    # -------------------------
    for opp in data:

        profile_ids = opp.get("profile_ids", [])

        # total shared profiles
        opp["no_of_profiles_shared"] = len(profile_ids)

        # -------------------------
        # FINAL SELECTION COUNT
        # -------------------------
        closed_by_ss_count = 0

        for profile_id in profile_ids:

            profile = find_one(
                "profiles",
                query={
                    "profile_id": profile_id
                }
            )

            if (
                profile
                and profile.get("profile_status") == "Final Selection"
            ):
                closed_by_ss_count += 1

        opp["closed_by_ss_count"] = closed_by_ss_count

    # -------------------------
    # TOTAL COUNT
    # -------------------------
    total = count_documents(
        "opportunities",
        query
    )

    return {
        "items": data,
        "total": total,
        "limit": limit,
        "skip": skip
    }

def get_opportunity_by_id_service(opportunity_id: str, user):

    opportunity = find_one(
        "opportunities",
        query={
            "opportunity_id": opportunity_id,
            "AM" : user
        },
        projection={
            "_id": 0
        }
    )

    if not opportunity:
        return None

    profile_ids = opportunity.get("profile_ids", [])

    profiles = []

    if profile_ids:

        profiles = find_many_profile(
            "profiles",
            query={
                "profile_id": {
                    "$in": profile_ids
                }
            },
            projection={
                "_id": 0
            },
            limit=1000
        )

        closed_by_ss_count = 0

        for profile_id in profile_ids:

                profile = find_one(
                    "profiles",
                    query={
                        "profile_id": profile_id
                    }
                )

                if (
                    profile
                    and profile.get("profile_status") == "Final Selection"
                ):
                    closed_by_ss_count += 1

        opportunity["closed_by_ss_count"] = closed_by_ss_count

    opportunity["profiles"] = profiles
    opportunity["no_of_profiles_shared"] = len(profile_ids)

    # optional remove profile_ids
    opportunity.pop("_id", None)

    return opportunity