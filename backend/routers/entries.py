from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from auth.dependencies import get_current_user
from db.mongo import get_db
from models.entry import EntryCreateRequest, EntryResponse, DotDatesResponse
from services import entry_service

router = APIRouter(prefix="/entries", tags=["entries"])


@router.get("/dates", response_model=DotDatesResponse)
async def get_dot_dates(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$", description="YYYY-MM"),
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Return only the date strings (YYYY-MM-DD) that have an entry in the given month.
    
    Used by the calendar to render dot indicators.
    No encrypted content is transferred — only the dates list.
    """
    dates = await entry_service.get_dot_dates(db, user_id, month)
    return DotDatesResponse(dates=dates)


@router.get("", response_model=EntryResponse)
async def get_entry(
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="YYYY-MM-DD"),
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Fetch a single entry for the authenticated user on a given date.
    
    Returns { iv, ciphertext } — the client decrypts these locally.
    Returns 404 if no entry exists for that date.
    """
    entry = await entry_service.get_entry_by_date(db, user_id, date)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No entry for this date")
    return entry


@router.post("", response_model=EntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    body: EntryCreateRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create or update a journal entry.
    
    The body contains only { date, iv, ciphertext } — no plaintext content.
    An existing entry for the same day is overwritten (upsert).
    """
    entry = await entry_service.upsert_entry(
        db=db,
        user_id=user_id,
        date=body.date,
        iv=body.iv,
        ciphertext=body.ciphertext,
    )
    return entry


@router.delete("/{date}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    date: str,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Delete the entry for the given date. Idempotent — no error if entry doesn't exist."""
    await entry_service.delete_entry(db, user_id, date)
