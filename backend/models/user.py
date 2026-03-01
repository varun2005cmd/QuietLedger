from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class UserDocument(BaseModel):
    """Represents a user document as stored in and returned from MongoDB."""
    id: Optional[str] = Field(default=None, alias="_id")
    google_sub: str
    email: str
    display_name: str
    picture_url: str
    created_at: datetime
    last_login: datetime

    model_config = {"populate_by_name": True}


class UserPublic(BaseModel):
    """The subset of user data sent to the frontend."""
    id: str
    email: str
    display_name: str
    picture_url: str


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    picture_url: Optional[str] = None
