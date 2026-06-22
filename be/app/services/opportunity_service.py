import uuid
from datetime import date, datetime
from fastapi import HTTPException

from app.helper.aws_helper import aws_s3_access_class
from app.config.EnvConfig import bucket_name
from app.db.models import count_documents, create_one, find_many, find_many_profile, find_one, update_one
from collections import defaultdict


aws_helper = aws_s3_access_class()

ALLOWED_TYPES = [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]

def convert_ui_date(date_str):
    return datetime.strptime(
        date_str,
        "%d-%m-%Y"
    ).strftime("%Y-%m-%d")

def convert_db_date(date_str):

    if not date_str:
        return None

    return datetime.strptime(
        date_str,
        "%Y-%m-%d"
    ).strftime("%Y-%m-%d")

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
        "client_bu": data.get("client_bu"),
        "client_details": data.get("client_details"),
        "vertical": data.get("vertical"),
        "created_at": datetime.utcnow(),
        "AM" : user,
        "open_status": data.get("open_status"), 
        "hiring_manager_name": data.get("hiring_manager_name"),
        "hiring_manager_email": data.get("hiring_manager_email"),
        "hiring_location": data.get("hiring_location"),
        "hiring_manager_phno": data.get("hiring_manager_phno"),
        "comments": data.get("comments"),
        "job_desc": data.get("job_desc")
    }

    inserted_id = create_one("opportunities", document)

    document["_id"] = inserted_id

    return document


def update_opportunity_service(opportunity_id: str, data: dict, user):

    update_data = data.copy()

    # handle date fields (if present)
    if "reqdate" in update_data and update_data["reqdate"]:
        if isinstance(update_data["reqdate"], (datetime, date)):
            update_data["reqdate"] = update_data["reqdate"].isoformat()


    update_data["updated_at"] = datetime.utcnow()

    query = {"opportunity_id": opportunity_id, "AM": user}

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

    data = find_many(
        "opportunities",
        query=query,
        limit=limit,
        skip=skip,
        sort=[("_id", -1)]
    )

    for opp in data:

        profile_ids = opp.get("profile_ids", [])

        offboarding_profile_ids =opp.get("offboarding_profile_ids",[])

        # total shared profiles
        opp["no_of_profiles_shared"] = len(profile_ids)

        if offboarding_profile_ids:
            opp["no_of_profiles_shared"] += len(offboarding_profile_ids)

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
        if offboarding_profile_ids:
            opp["closed_by_ss_count"] += len(offboarding_profile_ids)

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

# New opportunities code - Shivanand Magadum
############################################


def get_opportunities_by_filter_service(
    client,
    vertical,
    source,
    from_date,
    to_date,
    user
):

    # ---------------------------------------------------
    # OPPORTUNITY FILTER
    # ---------------------------------------------------
    
    opportunity_query = {}
    opportunity_query["AM"] = user

    if client:
        opportunity_query["client"] = client

    if vertical:
        opportunity_query["vertical"] = vertical

    if from_date or to_date:

        opportunity_query["reqdate"] = {}

        if from_date:
            opportunity_query["reqdate"]["$gte"] = convert_ui_date(from_date)

        if to_date:
            opportunity_query["reqdate"]["$lte"] = convert_ui_date(to_date)

    opportunities = find_many(
        "opportunities",
        query=opportunity_query,
        limit=100000,
        skip=0
    )

    # ---------------------------------------------------
    # DEMANDS
    # ---------------------------------------------------

    demands = len(opportunities)

    # ---------------------------------------------------
    # POSITIONS
    # ---------------------------------------------------

    positions = sum(
        int(opp.get("no_of_positions", 0))
        for opp in opportunities
    )

    # ---------------------------------------------------
    # GET OPPORTUNITY IDS
    # ---------------------------------------------------

    opportunity_ids = [
        opp["opportunity_id"]
        for opp in opportunities
    ]

    # Opportunity lookup for vertical charts
    opportunity_map = {
        opp["opportunity_id"]: opp
        for opp in opportunities
    }

    if not opportunity_ids:

        return {
            "demands": 0,
            "positions": 0,
            "selections": 0,
            "onboardings": 0,
            "offboardings": 0,
            "net_adds": 0,
            "charts": {
                "selections_by_source": [],
                "onboardings_by_source": [],
                "selections_by_vertical": [],
                "onboardings_by_vertical": []
            }
        }

    # ---------------------------------------------------
    # PROFILE FILTER
    # ---------------------------------------------------

    profile_query = {
        "opportunity_id": {
            "$in": opportunity_ids
        },
        "AM": user
    }

    if source:
        profile_query["source"] = source

    profiles = find_many(
        "profiles",
        query=profile_query,
        limit=100000,
        skip=0
    )

    # ---------------------------------------------------
    # SELECTIONS
    # ---------------------------------------------------

    selection_profiles = [
        profile
        for profile in profiles
        if profile.get("profile_status") == "Final Selection"
    ]

    selections = len(selection_profiles)

    # ---------------------------------------------------
    # ONBOARDINGS
    # ---------------------------------------------------

    # onboarding_profiles = [
    #     profile
    #     for profile in profiles
    #     if profile.get("profile_status") == "Onboarded"
    # ]

    onboarding_profiles = [
    profile
    for profile in profiles
    if (
        profile.get("client_onboarding_date")
        and str(profile.get("client_onboarding_date")).strip() != ""
    )
    ]
    
    onboardings = len(onboarding_profiles)

    # print("Profiles:", len(profiles))
    # print("Onboarded Profiles:", len(onboarding_profiles))
    # print("Profiles Found:", len(profiles))

    # for p in profiles:
    #     if p.get("client_onboarding_date"):
    #      print(
    #         p.get("engg_name"),
    #         p.get("client_onboarding_date"),
    #         p.get("source")
    #     )

    # print("Onboarded Profiles:", len(onboarding_profiles))

    


    # ---------------------------------------------------
    # SELECTIONS BY SOURCE
    # ---------------------------------------------------

    selections_by_source = defaultdict(int)

    for profile in selection_profiles:
        source_name = profile.get("source", "Unknown")
        selections_by_source[source_name] += 1

    # ---------------------------------------------------
    # ONBOARDINGS BY SOURCE
    # ---------------------------------------------------

    onboardings_by_source = defaultdict(int)

    for profile in onboarding_profiles:
        source_name = profile.get("source", "Unknown")
        onboardings_by_source[source_name] += 1

    # ---------------------------------------------------
    # SELECTIONS BY VERTICAL
    # ---------------------------------------------------

    selections_by_vertical = defaultdict(int)

    for profile in selection_profiles:

        opp = opportunity_map.get(
            profile.get("opportunity_id")
        )

        vertical_name = (
            opp.get("vertical", "Unknown")
            if opp else "Unknown"
        )

        selections_by_vertical[vertical_name] += 1

    # ---------------------------------------------------
    # ONBOARDINGS BY VERTICAL
    # ---------------------------------------------------

    onboardings_by_vertical = defaultdict(int)

    for profile in onboarding_profiles:

        opp = opportunity_map.get(
            profile.get("opportunity_id")
        )

        vertical_name = (
            opp.get("vertical", "Unknown")
            if opp else "Unknown"
        )

        onboardings_by_vertical[vertical_name] += 1

    # ---------------------------------------------------
    # OFFBOARDINGS
    # ---------------------------------------------------

    offboarding_query = {"AM": user}


    if client:
        offboarding_query["client_name"] = client

    if from_date or to_date:

        offboarding_query["offboarding_date"] = {}

        if from_date:
            offboarding_query["offboarding_date"]["$gte"] = from_date

        if to_date:
            offboarding_query["offboarding_date"]["$lte"] = to_date

    offboardings = count_documents(
        "offboarding_profiles",
        offboarding_query
    )

    # ---------------------------------------------------
    # NET ADDS
    # ---------------------------------------------------

    net_adds = onboardings - offboardings

    return {
        "demands": demands,
        "positions": positions,
        "selections": selections,
        "onboardings": onboardings,
        "offboardings": offboardings,
        "net_adds": net_adds,

        "charts": {

            "selections_by_source": [
                {
                    "name": k,
                    "count": v
                }
                for k, v in selections_by_source.items()
            ],

            "onboardings_by_source": [
                {
                    "name": k,
                    "count": v
                }
                for k, v in onboardings_by_source.items()
            ],

            "selections_by_vertical": [
                {
                    "name": k,
                    "count": v
                }
                for k, v in selections_by_vertical.items()
            ],

            "onboardings_by_vertical": [
                {
                    "name": k,
                    "count": v
                }
                for k, v in onboardings_by_vertical.items()
            ]
        }
    }

# End of new opportunities code - Shivanand Magadum
############################################


##admin_dashboard_start

from collections import defaultdict

def get_admin_dashboard_service(
    client=None,
    vertical=None,
    am=None,
    source=None,
    from_date=None,
    to_date=None
):

    # ---------------------------------------------------
    # OPPORTUNITY FILTER
    # ---------------------------------------------------

    opportunity_query = {}
    if am:
        opportunity_query["AM"] = am

    if client:
        opportunity_query["client"] = client

    if vertical:
        opportunity_query["vertical"] = vertical

    if from_date or to_date:

        opportunity_query["reqdate"] = {}

        if from_date:
            opportunity_query["reqdate"]["$gte"] = from_date

        if to_date:
            opportunity_query["reqdate"]["$lte"] = to_date

        

    opportunities = find_many(
        "opportunities",
        query=opportunity_query,
        limit=100000,
        skip=0
    )

    opportunity_map = {
        opp["opportunity_id"]: opp
        for opp in opportunities
    }

    opportunity_ids = [
        opp["opportunity_id"]
        for opp in opportunities
    ]

    if not opportunity_ids:
        return []

    # ---------------------------------------------------
    # PROFILE FILTER
    # ---------------------------------------------------

    profile_query = {
    "opportunity_id": {
        "$in": opportunity_ids
    }
    }

    if am:
        profile_query["AM"] = am

    if source:
        profile_query["source"] = source

    profiles = find_many(
        "profiles",
        query=profile_query,
        limit=100000,
        skip=0
    )

    # ---------------------------------------------------
    # OFFBOARDINGS
    # ---------------------------------------------------

    offboarding_query = {}

    if am:
        offboarding_query["AM"] = am

    if client:
        offboarding_query["client_name"] = client

    if from_date or to_date:

        offboarding_query["offboarding_date"] = {}

        if from_date:
            offboarding_query["offboarding_date"]["$gte"] = from_date

        if to_date:
            offboarding_query["offboarding_date"]["$lte"] = to_date

    offboarding_profiles = find_many(
        "offboarding_profiles",
        query=offboarding_query,
        limit=100000,
        skip=0
    )

    # ---------------------------------------------------
    # AM WISE DASHBOARD
    # ---------------------------------------------------

    # dashboard = defaultdict(
    #     lambda: {
    #         "AM": "",
    #         "demands": 0,
    #         "positions": 0,
    #         "selections": 0,
    #         "onboardings": 0,
    #         "offboardings": 0,
    #         "net_adds": 0,
    #         "charts": {
    #             "selections_by_source": defaultdict(int),
    #             "onboardings_by_source": defaultdict(int),
    #             "selections_by_vertical": defaultdict(int),
    #             "onboardings_by_vertical": defaultdict(int)
    #         }
    #     }
    # )
    dashboard = defaultdict(
    lambda: {
        "AM": "",
        "demands": 0,
        "positions": 0,
        "selections": 0,
        "onboardings": 0,
        "offboardings": 0,
        "net_adds": 0,

        "selection_details": [],
        "onboarding_details": [],
        "offboarding_details": [],

        "charts": {
            "selections_by_source": defaultdict(int),
            "onboardings_by_source": defaultdict(int),
            "selections_by_vertical": defaultdict(int),
            "onboardings_by_vertical": defaultdict(int)
        }
    }
    )

    # ---------------------------------------------------
    # DEMANDS / POSITIONS
    # ---------------------------------------------------

    for opp in opportunities:

        am = opp.get("AM", "Unknown")

        dashboard[am]["AM"] = am
        dashboard[am]["demands"] += 1
        dashboard[am]["positions"] += int(
            opp.get("no_of_positions", 0)
        )

    # ---------------------------------------------------
    # SELECTIONS / ONBOARDINGS
    # ---------------------------------------------------

    for profile in profiles:

        am = profile.get("AM", "Unknown")

        dashboard[am]["AM"] = am

        source_name = profile.get("source", "Unknown")

        opp = opportunity_map.get(
            profile.get("opportunity_id")
        )

        vertical_name = (
            opp.get("vertical", "Unknown")
            if opp else "Unknown"
        )

        # -------------------------
        # SELECTIONS
        # -------------------------

        if profile.get("profile_status") == "Final Selection":

            dashboard[am]["selections"] += 1
            dashboard[am]["selection_details"].append({
                "date": profile.get("selection_date"),
                "client": profile.get("client_name"),
                "vertical": vertical_name,
                "source": source_name,
                "candidate": profile.get("engg_name"),
                "remarks": profile.get("remarks")
            })

            dashboard[am]["charts"][
                "selections_by_source"
            ][source_name] += 1

            dashboard[am]["charts"][
                "selections_by_vertical"
            ][vertical_name] += 1

        # -------------------------
        # ONBOARDINGS
        # -------------------------

        if (
            profile.get("client_onboarding_date")
            and str(
                profile.get("client_onboarding_date")
            ).strip() != ""
        ):

            dashboard[am]["onboardings"] += 1

            dashboard[am]["onboarding_details"].append({
                "date": profile.get("client_onboarding_date"),
                "client": profile.get("client_name"),
                "vertical": vertical_name,
                "source": source_name,
                "candidate": profile.get("engg_name"),
                "remarks": profile.get("remarks")
            })

            dashboard[am]["charts"][
                "onboardings_by_source"
            ][source_name] += 1

            dashboard[am]["charts"][
                "onboardings_by_vertical"
            ][vertical_name] += 1

    # ---------------------------------------------------
    # OFFBOARDINGS
    # ---------------------------------------------------

    for offboarding in offboarding_profiles:

        am = offboarding.get("AM", "Unknown")

        dashboard[am]["AM"] = am
        dashboard[am]["offboardings"] += 1

        dashboard[am]["offboarding_details"].append({
            "date": offboarding.get("offboarding_date"),
            "client": offboarding.get("client_name"),
            "vertical": offboarding.get("vertical"),
            "source": offboarding.get("source"),
            "candidate": offboarding.get("engg_name"),
            "remarks": offboarding.get("remarks")
        })

    # ---------------------------------------------------
    # NET ADDS
    # ---------------------------------------------------

    for am in dashboard:

        dashboard[am]["net_adds"] = (
            dashboard[am]["onboardings"]
            - dashboard[am]["offboardings"]
        )

    # ---------------------------------------------------#
    # CONVERT CHARTS
    # ---------------------------------------------------

    response = []

    for am, data in dashboard.items():

        data["charts"]["selections_by_source"] = [
            {"name": k, "count": v}
            for k, v in data["charts"][
                "selections_by_source"
            ].items()
        ]

        data["charts"]["onboardings_by_source"] = [
            {"name": k, "count": v}
            for k, v in data["charts"][
                "onboardings_by_source"
            ].items()
        ]

        data["charts"]["selections_by_vertical"] = [
            {"name": k, "count": v}
            for k, v in data["charts"][
                "selections_by_vertical"
            ].items()
        ]

        data["charts"]["onboardings_by_vertical"] = [
            {"name": k, "count": v}
            for k, v in data["charts"][
                "onboardings_by_vertical"
            ].items()
        ]

        response.append(data)

    return response

##admindashboard_end

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
    offboarding_profile_ids =opportunity.get("offboarding_profile_ids",[])

    profiles = []
    offboarding_profiles = []

    if profile_ids:

        profiles = find_many_profile(
            "profiles",
            query={
                "profile_id": {
                    "$in": profile_ids
                },
                "AM": user
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

    if offboarding_profile_ids:

        offboarding_profiles = find_many_profile(
            "offboarding_profiles",
            query={
                "offboarding_profile_id": {
                    "$in": offboarding_profile_ids
                },
                "AM": user
            },
            projection={
                "_id": 0
            },
            limit=1000
        )

    opportunity["profiles"] = profiles
    opportunity["offboarding_profiles"] = offboarding_profiles
    opportunity["no_of_profiles_shared"] = len(profile_ids) + len(offboarding_profile_ids)

    # optional remove profile_ids
    opportunity.pop("_id", None)

    return opportunity