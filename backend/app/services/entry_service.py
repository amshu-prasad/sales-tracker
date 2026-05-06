import math
from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.entry import EntryCreate, EntryUpdate


# ── Date helpers ────────────────────────────────────────────────

def get_week(date_str: str) -> str:
    try:
        d = datetime.fromisoformat(date_str)
        return "W" + str(min(4, math.floor((d.day - 1) / 7) + 1))
    except Exception:
        return "W1"


def get_month(date_str: str) -> str:
    try:
        return datetime.fromisoformat(date_str).strftime("%b'%y")
    except Exception:
        return ""


def get_quarter(date_str: str) -> str:
    try:
        d = datetime.fromisoformat(date_str)
        return f"Q{(d.month - 1) // 3 + 1}'{str(d.year)[-2:]}"
    except Exception:
        return ""


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# ── Service functions ────────────────────────────────────────────

async def create_entry(db: AsyncIOMotorDatabase, body: EntryCreate, current_user: str) -> dict:
    doc = body.dict()
    doc["am"]         = current_user
    doc["week"]       = get_week(body.date)
    doc["month"]      = get_month(body.date)
    doc["quarter"]    = get_quarter(body.date)
    doc["created_at"] = datetime.utcnow().isoformat()

    result = await db.entries.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


async def list_entries(
    db: AsyncIOMotorDatabase,
    current_user: str,
    month: Optional[str] = None,
    week: Optional[str] = None,
    date: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    type: Optional[str] = None,
) -> list:
    query: dict = {"is_deleted": {"$ne": True}}

    if current_user != "manager":
        query["am"] = current_user

    if from_date and to_date:
        query["date"] = {"$gte": from_date, "$lte": to_date}
    elif date:
        query["date"] = date
    else:
        if month and month != "ALL":
            query["month"] = month
        if week and week != "ALL":
            query["week"] = week

    if type:
        query["type"] = type

    cursor = db.entries.find(query).sort("date", -1)
    docs = await cursor.to_list(length=2000)
    return [_serialize(d) for d in docs]


async def get_entry(db: AsyncIOMotorDatabase, entry_id: str, current_user: str) -> dict:
    doc = await db.entries.find_one({"_id": ObjectId(entry_id), "is_deleted": {"$ne": True}})
    if not doc:
        raise HTTPException(status_code=404, detail="Entry not found")
    if current_user != "manager" and doc["am"] != current_user:
        raise HTTPException(status_code=403, detail="Forbidden")
    return _serialize(doc)


async def update_entry(
    db: AsyncIOMotorDatabase, entry_id: str, body: EntryUpdate, current_user: str
) -> dict:
    doc = await db.entries.find_one({"_id": ObjectId(entry_id), "is_deleted": {"$ne": True}})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    if current_user != "manager" and doc["am"] != current_user:
        raise HTTPException(status_code=403, detail="Forbidden")

    update = {k: v for k, v in body.dict().items() if v is not None}
    if "date" in update:
        update["week"]    = get_week(update["date"])
        update["month"]   = get_month(update["date"])
        update["quarter"] = get_quarter(update["date"])

    update["updated_by"] = current_user
    update["updated_at"] = datetime.utcnow().isoformat()

    await db.entries.update_one({"_id": ObjectId(entry_id)}, {"$set": update})
    updated = await db.entries.find_one({"_id": ObjectId(entry_id), "is_deleted": {"$ne": True}})
    return _serialize(updated)


async def delete_entry(db: AsyncIOMotorDatabase, entry_id: str, current_user: str) -> dict:
    doc = await db.entries.find_one({"_id": ObjectId(entry_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    if current_user != "manager" and doc["am"] != current_user:
        raise HTTPException(status_code=403, detail="Forbidden")

    await db.entries.update_one(
        {"_id": ObjectId(entry_id)},
        {"$set": {
            "is_deleted": True,
            "deleted_at": datetime.utcnow().isoformat(),
            "deleted_by": current_user,
        }},
    )
    return {"deleted": entry_id}
