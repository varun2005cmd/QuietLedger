from datetime import datetime, timezone
from dataclasses import dataclass

from fastapi import HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from motor.motor_asyncio import AsyncIOMotorDatabase

from db.collections import USERS_COLLECTION


@dataclass
class GoogleClaims:
    sub: str
    email: str
    name: str
    picture: str


def verify_google_token(credential: str, client_id: str) -> GoogleClaims:
    """Verify a Google ID token and extract claims.
    
    Uses google-auth library which checks signature, expiry, and audience.
    Raises 401 if the token is invalid for any reason.
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            client_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google ID token: {exc}",
        ) from exc

    return GoogleClaims(
        sub=idinfo["sub"],
        email=idinfo["email"],
        name=idinfo.get("name", ""),
        picture=idinfo.get("picture", ""),
    )


async def upsert_user(db: AsyncIOMotorDatabase, claims: GoogleClaims) -> dict:
    """Create a new user or update last_login for a returning user.
    
    Returns the full user document from MongoDB.
    """
    now = datetime.now(tz=timezone.utc)
    result = await db[USERS_COLLECTION].find_one_and_update(
        {"google_sub": claims.sub},
        {
            "$set": {
                "email": claims.email,
                "display_name": claims.name,
                "picture_url": claims.picture,
                "last_login": now,
            },
            "$setOnInsert": {
                "google_sub": claims.sub,
                "created_at": now,
            },
        },
        upsert=True,
        return_document=True,
    )
    return result
