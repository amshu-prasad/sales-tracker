import uuid
from datetime import datetime

from app.db.models import (
    create_one,
    append_to_list
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
        "open_status": data.get("open_status"),
        "BU_name": data.get("BU_name"),
        "hiring_manager_name": data.get("hiring_manager_name"),
        "hiring_manager_email": data.get("hiring_manager_email"),
        "hiring_location": data.get("hiring_location"),
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