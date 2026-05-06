from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase


def _format(doc: dict) -> dict:
    return {
        "clients":   doc.get("CLIENTS", []),
        "verticals": doc.get("VERTICALS", []),
        "ams":       doc.get("AMS", []),
    }


async def get_meta(db: AsyncIOMotorDatabase) -> dict:
    doc = await db.meta.find_one({})
    if not doc:
        raise HTTPException(status_code=404, detail="Meta config not found")
    return _format(doc)


async def update_meta(db: AsyncIOMotorDatabase, update_fields: dict, current_user: str) -> dict:
    if current_user != "manager":
        raise HTTPException(status_code=403, detail="Only manager can update meta")

    await db.meta.update_one({}, {"$set": update_fields}, upsert=True)
    doc = await db.meta.find_one({})
    return _format(doc)
