"""
Authentication service layer for NutriFlow.
Handles user creation, credential verification, and token lifecycle.
"""

from dataclasses import dataclass
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    revoke_token,
    verify_password,
)

settings = get_settings()


@dataclass(frozen=True)
class TokenPair:
    access_token: str
    refresh_token: str
    expires_in: int  # access-token lifetime in seconds


def create_user(db: Session, user_data: UserCreate) -> User:
    """Register a new user. Raises 400 if email already exists."""
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Verify credentials and return the user, or raise 401."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def generate_tokens(user_id: int) -> TokenPair:
    """Generate an access + refresh token pair for a user id."""
    token_data = {"sub": str(user_id)}
    return TokenPair(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def refresh_tokens(db: Session, refresh_token: Optional[str]) -> TokenPair:
    """
    Validate a refresh token and issue a new pair (rotation: the old one is revoked).
    Raises 401 when the token is missing, invalid, revoked, or the user no longer exists.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing.",
        )
    payload = decode_token(refresh_token, expected_type="refresh")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    revoke_token(refresh_token)
    return generate_tokens(user.id)


def logout(access_token: Optional[str], refresh_token: Optional[str]) -> None:
    """Revoke whichever tokens the client presented."""
    for token in (access_token, refresh_token):
        if token:
            revoke_token(token)
