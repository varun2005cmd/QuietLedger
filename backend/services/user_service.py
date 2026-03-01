from motor.motor_asyncio import AsyncIOMotorDatabase

from db.collections import USERS_COLLECTION


async def update_user_profile(
    db: AsyncIOMotorDatabase,
    user_id: str,
    display_name: str | None,
    picture_url: str | None,
) -> dict | None:
    """Update mutable profile fields. Returns the updated user document or None if not found."""
    update_fields: dict = {}
    if display_name is not None:
        update_fields["display_name"] = display_name
    if picture_url is not None:
        update_fields["picture_url"] = picture_url

    if not update_fields:
        return None

    result = await db[USERS_COLLECTION].find_one_and_update(
        {"_id": user_id},
        {"$set": update_fields},
        return_document=True,
    )
    return result
