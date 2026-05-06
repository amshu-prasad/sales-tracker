from typing import Optional

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase


def _base_query(current_user: str, month: Optional[str], week: Optional[str]) -> dict:
    query: dict = {}
    if current_user != "manager":
        query["am"] = current_user
    if month and month != "ALL":
        query["month"] = month
    if week and week != "ALL":
        query["week"] = week
    return query


async def summary(
    db: AsyncIOMotorDatabase,
    current_user: str,
    month: Optional[str] = None,
    week: Optional[str] = None,
) -> dict:
    query = _base_query(current_user, month, week)

    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": {"type": "$type", "source": "$source"},
            "count": {"$sum": 1},
        }},
    ]
    results = await db.entries.aggregate(pipeline).to_list(length=100)

    out = {
        "selection":   {"bench": 0, "partner": 0},
        "onboarding":  {"bench": 0, "partner": 0},
        "offboarding": {"bench": 0, "partner": 0},
    }
    for r in results:
        t = r["_id"]["type"]
        s = (r["_id"]["source"] or "bench").lower()
        if t in out and s in out[t]:
            out[t][s] = r["count"]
    return out


async def by_am(
    db: AsyncIOMotorDatabase,
    current_user: str,
    month: Optional[str] = None,
    week: Optional[str] = None,
) -> dict:
    if current_user != "manager":
        raise HTTPException(status_code=403, detail="Manager only")

    query: dict = {}
    if month and month != "ALL":
        query["month"] = month
    if week and week != "ALL":
        query["week"] = week

    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": {"am": "$am", "type": "$type", "source": "$source"},
            "count": {"$sum": 1},
        }},
    ]
    results = await db.entries.aggregate(pipeline).to_list(length=500)

    data: dict = {}
    for r in results:
        am  = r["_id"]["am"]
        t   = r["_id"]["type"]
        s   = (r["_id"]["source"] or "bench").lower()
        key = f"{t}_{s}"
        data.setdefault(am, {})[key] = data[am].get(key, 0) + r["count"]
    return data


async def by_vertical(
    db: AsyncIOMotorDatabase,
    current_user: str,
    month: Optional[str] = None,
    week: Optional[str] = None,
) -> dict:
    query = _base_query(current_user, month, week)

    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": {"vertical": "$vertical", "type": "$type", "source": "$source"},
            "count": {"$sum": 1},
        }},
    ]
    results = await db.entries.aggregate(pipeline).to_list(length=500)

    data: dict = {}
    for r in results:
        v   = r["_id"]["vertical"]
        t   = r["_id"]["type"]
        s   = (r["_id"]["source"] or "bench").lower()
        key = f"{t}_{s}"
        data.setdefault(v, {})[key] = data[v].get(key, 0) + r["count"]
    return data


async def by_client(
    db: AsyncIOMotorDatabase,
    current_user: str,
    month: Optional[str] = None,
    week: Optional[str] = None,
) -> dict:
    query = _base_query(current_user, month, week)

    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": {"client": "$client", "type": "$type", "vertical": "$vertical"},
            "count": {"$sum": 1},
        }},
    ]
    results = await db.entries.aggregate(pipeline).to_list(length=1000)

    data: dict = {}
    for r in results:
        c = r["_id"]["client"]
        t = r["_id"]["type"]
        v = r["_id"]["vertical"]
        data.setdefault(c, {})
        data[c][f"type_{t}"] = data[c].get(f"type_{t}", 0) + r["count"]
        data[c][f"vert_{v}"] = data[c].get(f"vert_{v}", 0) + r["count"]
    return data


async def rollup(db: AsyncIOMotorDatabase, current_user: str) -> dict:
    query = {} if current_user == "manager" else {"am": current_user}

    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": {"month": "$month", "week": "$week", "type": "$type", "source": "$source"},
            "count": {"$sum": 1},
        }},
    ]
    results = await db.entries.aggregate(pipeline).to_list(length=2000)

    data: dict = {}
    for r in results:
        m   = r["_id"]["month"]
        w   = r["_id"]["week"]
        t   = r["_id"]["type"]
        s   = (r["_id"]["source"] or "bench").lower()
        key = f"{t}_{s}"
        data.setdefault(m, {}).setdefault(w, {})[key] = (
            data[m][w].get(key, 0) + r["count"]
        )
    return data


async def get_months(db: AsyncIOMotorDatabase, current_user: str) -> list:
    query = {} if current_user == "manager" else {"am": current_user}
    months = await db.entries.distinct("month", query)
    return sorted([m for m in months if m])
