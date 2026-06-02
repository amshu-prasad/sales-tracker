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

def create_profile_service(data, user):
    profile_id = str(uuid.uuid4())
    document = {
        "profile_id": profile_id,
        "opportunity_id": data.get("opportunity_id"),
        "source": data.get("source"),
        "engg_name": data.get("engg_name"),
        "ss_id": data.get("ss_id"),
        "projected_experience": data.get("projected_experience"),
        "profile_status": data.get("profile_status"),
        "remarks": data.get("remarks"),
        "selection_date": (
            data.get("selection_date").isoformat()
            if data.get("selection_date")
            else None
        ),
        "created_at": datetime.utcnow(),
        "AM": user
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
    data: dict,
    user
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
            "profile_id": profile_id,
            "AM" : user
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
    skip, user
):

    query = {}
    query["AM"] = user

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

def get_profile_by_id_service(profile_id: str, user):

    data = find_one(
        collection_name="profiles",
        query={
            "profile_id": profile_id,
            "AM": user
        },
        projection={
            "_id": 0
        }
    )

    return data

def get_final_selected_profiles_service(
    limit,
    skip, user
):
    query = {
        "profile_status": "Final Selection",
        "AM": user
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
    skip,
    user
):

    query = {
        "client_onboarding_date": {
            "$exists": True,
            "$ne": None,
            "$ne": ""
        },
        "AM": user
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


def create_offboarding_profile_service(data, user):

    offboarding_profile_id = str(uuid.uuid4())

    document = {
        "offboarding_profile_id": offboarding_profile_id,

        "opportunity_id": data["opportunity_id"],
        "informed_date": (
            data["informed_date"].isoformat()
            if data.get("informed_date")
            else None
        ),
        "type": data["type"],
        "offboarding_month": data["offboarding_month"],
        "offboarding_date": data["offboarding_date"].isoformat(),

        "emp_id": data["emp_id"],
        "engg_name": data["engg_name"],
        "department": data["department"],

        "vertical_head": data["vertical_head"],
        "acc_manager": data["acc_manager"],

        "client_name": data["client_name"],
        "client_offboarding_loc": data["client_offboarding_loc"],

        "reason": data["reason"],
        "revenu_impact_comments": data.get(
            "revenu_impact_comments"
        ),

        "AM": user,
        "created_at": datetime.utcnow()
    }

    create_one(
        "offboarding_profiles",
        document
    )

    return {
        "offboarding_profile_id": offboarding_profile_id
    }