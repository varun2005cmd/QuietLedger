from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from auth.dependencies import get_current_user
from db.mongo import get_db
from models.user import UserProfileUpdate
from services.user_service import update_user_profile

router = APIRouter(prefix="/users", tags=["users"])


@router.put("/profile")
async def update_profile(
    body: UserProfileUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Update the authenticated user's display name or picture URL.
    
    The response reflects the updated values immediately —
    the frontend updates its in-memory state without a page reload.
    """
    if body.display_name is None and body.picture_url is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    updated = await update_user_profile(
        db=db,
        user_id=user_id,
        display_name=body.display_name,
        picture_url=body.picture_url,
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {
        "id": str(updated["_id"]),
        "email": updated["email"],
        "display_name": updated["display_name"],
        "picture_url": updated["picture_url"],
    }
