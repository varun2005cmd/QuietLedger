from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class EntryDocument(BaseModel):
    """Represents an entry document as stored in MongoDB.
    
    The backend ONLY ever sees iv and ciphertext — never plaintext content.
    """
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    date: str          # "YYYY-MM-DD" — stored as string to avoid all timezone issues
    iv: str            # base64-encoded 12-byte AES-GCM IV
    ciphertext: str    # base64-encoded encrypted journal content
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}


class EntryCreateRequest(BaseModel):
    """Request body for creating or updating an entry.
    
    There is intentionally no 'content' field — only encrypted blobs.
    """
    date: str           # "YYYY-MM-DD"
    iv: str             # base64
    ciphertext: str     # base64


class EntryResponse(BaseModel):
    """Entry data returned to the client for decryption."""
    id: str
    date: str
    iv: str
    ciphertext: str
    created_at: datetime
    updated_at: datetime


class DotDatesResponse(BaseModel):
    """List of YYYY-MM-DD strings where the user has at least one entry."""
    dates: list[str]
