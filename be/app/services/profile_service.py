import uuid
from datetime import datetime

from app.db.models import (
    count_documents,
    create_one,
    append_to_list,
    find_many,
    find_many_profile,
    find_one,
    update_one
)

def create_profile_service(data):
    profile_id = str(uuid.uuid4())
    document = {
        "profile_id": profile_id,
        "opportunity_id": data.get("opportunity_id"),
        "source": data.get("source"),
        "engg_name": data.get("engg_name"),
        "ss_id": data.get("ss_id"),
        "projected_experience": data.get("projected_experience"),
        "profile_status": data.get("profile_status"),
        "selection_date": (
            data.get("selection_date").isoformat()
            if data.get("selection_date")
            else None
        ),
        "created_at": datetime.utcnow()
    }

    # create profile
    create_one(
        "profiles",
        document
    )

    # append profile_id into opportunity
    append_to_list(
        collection_name="opportunities",
        query={
            "opportunity_id": data.get("opportunity_id")
        },
        field_name="profile_ids",
        value=profile_id
    )
    document.pop("_id", None)

    return document

def update_profile_service(
    profile_id: str,
    data: dict
):

    update_data = data.copy()

    # handle optional date
    if (
        "selection_date" in update_data
        and update_data["selection_date"]
    ):

        if hasattr(update_data["selection_date"], "isoformat"):
            update_data["selection_date"] = (
                update_data["selection_date"].isoformat()
            )

    update_data["updated_at"] = datetime.utcnow()

    result = update_one(
        collection_name="profiles",
        query={
            "profile_id": profile_id
        },
        update_data=update_data
    )

    if result.matched_count == 0:
        return None

    return {
        "profile_id": profile_id,
        "updated": result.modified_count
    }

def get_profiles_service(
    search,
    profile_status,
    open_status,
    limit,
    skip
):

    query = {}

    if profile_status:
        query["profile_status"] = profile_status

    if open_status:
        query["open_status"] = open_status

    if search:

        regex = {
            "$regex": search,
            "$options": "i"
        }

        query["$or"] = [
            {"source": regex},
            {"engg_name": regex},
            {"ss_id": regex},
            {"projected_experience": regex},
            {"profile_status": regex},
            {"open_status": regex},
            {"BU_name": regex},
            {"hiring_manager_name": regex},
            {"hiring_manager_email": regex},
            {"hiring_location": regex},
            {"profile_id": regex},
            {"opportunity_id": regex}
        ]

    data = find_many_profile(
        collection_name="profiles",
        query=query,
        projection={
            "_id": 0
        },
        limit=limit,
        skip=skip,
        sort=[("created_at", -1)]
    )

    total = count_documents(
        "profiles",
        query
    )

    return {
        "items": data,
        "total": total,
        "limit": limit,
        "skip": skip
    }

def get_profile_by_id_service(profile_id: str):

    data = find_one(
        collection_name="profiles",
        query={
            "profile_id": profile_id
        },
        projection={
            "_id": 0
        }
    )

    return data

def get_final_selected_profiles_service(
    limit,
    skip
):
    query = {
        "profile_status": "Final Selection"
    }

    profiles = find_many_profile(
        collection_name="profiles",
        query=query,
        projection={
            "_id": 0
        },
        limit=limit,
        skip=skip,
        sort=[("created_at", -1)]
    )

    for profile in profiles:

        opportunity = find_one(
            collection_name="opportunities",
            query={
                "opportunity_id": profile.get("opportunity_id")
            },
            projection={
                "_id": 0,
                "profile_ids": 0
            }
        )

        profile["opportunity_details"] = (
            opportunity if opportunity else {}
        )

    total = count_documents(
        "profiles",
        query
    )

    return {
        "items": profiles,
        "total": total,
        "limit": limit,
        "skip": skip
    }


def get_client_onboarding_profiles_service(
    limit,
    skip
):

    # -----------------------------
    # FILTER PROFILES
    # -----------------------------
    query = {
        "client_onboarding_date": {
            "$exists": True,
            "$ne": None,
            "$ne": ""
        }
    }

    profiles = find_many_profile(
        collection_name="profiles",
        query=query,
        projection={
            "_id": 0
        },
        limit=limit,
        skip=skip,
        sort=[("created_at", -1)]
    )

    # -----------------------------
    # GET OPPORTUNITY DETAILS
    # -----------------------------
    for profile in profiles:

        opportunity = find_one(
            collection_name="opportunities",
            query={
                "opportunity_id": profile.get("opportunity_id")
            },
            projection={
                "_id": 0,
                "profile_ids": 0
            }
        )

        profile["opportunity_details"] = (
            opportunity if opportunity else {}
        )

    total = count_documents(
        "profiles",
        query
    )

    return {
        "items": profiles,
        "total": total,
        "limit": limit,
        "skip": skip
    }