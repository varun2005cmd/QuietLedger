from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth.jwt_utils import decode_jwt
from config import get_settings

bearer_scheme = HTTPBearer()


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """FastAPI dependency. Validates the Bearer JWT and returns the user_id (MongoDB ObjectId string).
    
    Inject this into any protected route:
        user_id: str = Depends(get_current_user)
    """
    settings = get_settings()
    payload = decode_jwt(credentials.credentials, settings.jwt_secret_key, settings.jwt_algorithm)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return user_id
