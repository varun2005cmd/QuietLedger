from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from auth.jwt_utils import encode_jwt
from db.mongo import get_db
from services.auth_service import verify_google_token, upsert_user
from config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleTokenRequest(BaseModel):
    id_token: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/google", response_model=AuthResponse)
async def login_with_google(
    body: GoogleTokenRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Verify a Google ID token issued by the frontend, upsert the user, and return a JWT.
    
    The frontend uses @react-oauth/google to get the credential string, then POSTs it here.
    This route never handles any journal content — it is auth-only.
    """
    settings = get_settings()
    claims = verify_google_token(body.id_token, settings.google_client_id)
    user_doc = await upsert_user(db, claims)

    user_id = str(user_doc["_id"])
    token = encode_jwt(
        user_id=user_id,
        email=claims.email,
        secret=settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
        expire_hours=settings.jwt_expire_hours,
    )

    return AuthResponse(
        access_token=token,
        user={
            "id": user_id,
            "email": claims.email,
            "display_name": claims.name,
            "picture_url": claims.picture,
        },
    )
