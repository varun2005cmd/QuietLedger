from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from fastapi import HTTPException, status


def encode_jwt(user_id: str, email: str, secret: str, algorithm: str, expire_hours: int) -> str:
    """Issue a new application JWT for a verified user."""
    now = datetime.now(tz=timezone.utc)
    payload: dict[str, Any] = {
        "sub": user_id,          # internal MongoDB ObjectId string
        "email": email,
        "iat": now,
        "exp": now + timedelta(hours=expire_hours),
    }
    return jwt.encode(payload, secret, algorithm=algorithm)


def decode_jwt(token: str, secret: str, algorithm: str) -> dict[str, Any]:
    """Decode and verify an application JWT. Raises 401 on failure."""
    try:
        payload: dict[str, Any] = jwt.decode(token, secret, algorithms=[algorithm])
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
