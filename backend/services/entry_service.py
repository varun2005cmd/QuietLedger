from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from db.collections import ENTRIES_COLLECTION


def _ensure_utc(dt: datetime) -> datetime:
    """Motor returns naive datetimes (UTC values without tzinfo). Tag them so
    Pydantic serialises them with the 'Z' suffix and JS parses them as UTC."""
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _serialize_entry(doc: dict) -> dict:
    """Convert MongoDB document to a serializable dict."""
    return {
        "id": str(doc["_id"]),
        "date": doc["date"],
        "iv": doc["iv"],
        "ciphertext": doc["ciphertext"],
        "created_at": _ensure_utc(doc["created_at"]),
        "updated_at": _ensure_utc(doc["updated_at"]),
    }


async def get_entry_by_date(
    db: AsyncIOMotorDatabase,
    user_id: str,
    date: str,
) -> dict | None:
    """Return a single entry for a user on a given YYYY-MM-DD date, or None."""
    doc = await db[ENTRIES_COLLECTION].find_one({"user_id": user_id, "date": date})
    if doc is None:
        return None
    return _serialize_entry(doc)


async def get_dot_dates(
    db: AsyncIOMotorDatabase,
    user_id: str,
    month: str,
) -> list[str]:
    """Return all YYYY-MM-DD date strings where the user has an entry in the given month.
    
    month: "YYYY-MM"
    Projects only the 'date' field — no encrypted blobs are transferred.
    """
    pattern = f"^{month}-"
    cursor = db[ENTRIES_COLLECTION].find(
        {"user_id": user_id, "date": {"$regex": pattern}},
        {"date": 1, "_id": 0},
    )
    return [doc["date"] async for doc in cursor]


async def upsert_entry(
    db: AsyncIOMotorDatabase,
    user_id: str,
    date: str,
    iv: str,
    ciphertext: str,
) -> dict:
    """Create or replace an entry for a given user and date.
    
    Enforces one entry per user per day via the unique (user_id, date) index.
    The server stores only the encrypted blobs — never plaintext.
    """
    now = datetime.now(tz=timezone.utc)
    result = await db[ENTRIES_COLLECTION].find_one_and_update(
        {"user_id": user_id, "date": date},
        {
            "$set": {
                "iv": iv,
                "ciphertext": ciphertext,
                "updated_at": now,
            },
            "$setOnInsert": {
                "user_id": user_id,
                "date": date,
                "created_at": now,
            },
        },
        upsert=True,
        return_document=True,
    )
    return _serialize_entry(result)


async def delete_entry(
    db: AsyncIOMotorDatabase,
    user_id: str,
    date: str,
) -> bool:
    """Delete the entry for the given user and date. Returns True if a document was deleted."""
    result = await db[ENTRIES_COLLECTION].delete_one({"user_id": user_id, "date": date})
    return result.deleted_count > 0
