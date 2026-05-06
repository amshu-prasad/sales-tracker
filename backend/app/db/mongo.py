from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import DB_NAME, MONGO_URL

_client: AsyncIOMotorClient = None
_db: AsyncIOMotorDatabase = None


async def connect_db() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(MONGO_URL)
    _db = _client[DB_NAME]

    # Ensure indexes exist
    await _db.entries.create_index("am")
    await _db.entries.create_index("type")
    await _db.entries.create_index("date")
    await _db.entries.create_index([("month", 1), ("week", 1)])


async def close_db() -> None:
    if _client:
        _client.close()


def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency – returns the active database handle."""
    return _db
