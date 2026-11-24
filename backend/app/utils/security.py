"""
Security utilities for NutriFlow.
- Password hashing (bcrypt)
- JWT creation / validation (access + refresh, each with a unique jti)
- get_current_user dependency
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.user import User

settings = get_settings()

TokenType = Literal["access", "refresh"]

# ---------- Password hashing ----------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ---------- JWT tokens ----------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# In-memory revocation list: jti -> expiry (unix seconds). Expired entries are pruned.
# Single-process only and lost on restart; see "Known issues" in PROJECT_STATE.md.
_revoked_token_ids: dict[str, float] = {}


def _prune_revoked(now: float) -> None:
    for token_id in [jti for jti, expires_at in _revoked_token_ids.items() if expires_at <= now]:
        del _revoked_token_ids[token_id]


def _credentials_exception(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _create_token(data: dict, token_type: TokenType, lifetime: timedelta) -> str:
    to_encode = data.copy()
    to_encode.update(
        {
            "exp": datetime.now(timezone.utc) + lifetime,
            "type": token_type,
            "jti": uuid.uuid4().hex,
        }
    )
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    lifetime = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(data, "access", lifetime)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT refresh token."""
    lifetime = expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _create_token(data, "refresh", lifetime)


def decode_token(token: str, expected_type: TokenType) -> dict:
    """
    Decode and validate a JWT of the expected type.
    Raises 401 if the token is invalid, expired, revoked or of the wrong type.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise _credentials_exception()
    if payload.get("type") != expected_type:
        raise _credentials_exception("Invalid token type.")
    token_id = payload.get("jti")
    if not token_id or token_id in _revoked_token_ids:
        raise _credentials_exception()
    if payload.get("sub") is None:
        raise _credentials_exception()
    return payload


def user_for_token(db: Session, payload: dict) -> User:
    """
    The user a decoded token belongs to. 401 when the user is gone or the token predates
    the user's latest password change (its "ver" no longer matches).
    """
    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise _credentials_exception()
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise _credentials_exception("User not found")
    if payload.get("ver", 0) != user.token_version:
        raise _credentials_exception("Session ended. Please log in again.")
    return user


def revoke_token(token: str) -> None:
    """Revoke a token by its jti. Invalid / expired tokens are ignored."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return
    token_id = payload.get("jti")
    if token_id:
        now = datetime.now(timezone.utc).timestamp()
        _prune_revoked(now)
        _revoked_token_ids[token_id] = float(payload.get("exp", now))


# ---------- FastAPI dependency ----------


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency: extract the current user from a valid *access* token."""
    return user_for_token(db, decode_token(token, expected_type="access"))
