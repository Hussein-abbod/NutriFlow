"""
Authentication router for NutriFlow.
Endpoints: register, login, refresh, logout, me.
Rate-limited with slowapi.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.schemas.user import (
    UserCreate, UserLogin, UserOut, Token, RefreshTokenRequest,
)
from app.schemas.onboarding import RegisterWithTokens
from app.services.auth_service import (
    create_user,
    authenticate_user,
    generate_tokens,
    refresh_access_token,
    logout_user,
)
from app.utils.security import get_current_user, oauth2_scheme
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Rate limiter (uses the app-level limiter registered in main.py)
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/register",
    response_model=RegisterWithTokens,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user and return tokens",
)
@limiter.limit("5/minute")
def register(
    request: Request,
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    """Register with email + password and automatically login. Profile is completed later."""
    user = create_user(db, user_data)
    tokens = generate_tokens(user)
    return RegisterWithTokens(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_profile_complete=user.is_profile_complete,
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
    )


@router.post(
    "/login",
    response_model=Token,
    summary="Login and receive tokens",
)
@limiter.limit("10/minute")
def login(
    request: Request,
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """Authenticate and return access + refresh JWT tokens."""
    user = authenticate_user(db, credentials.email, credentials.password)
    return generate_tokens(user)


@router.post(
    "/refresh",
    response_model=Token,
    summary="Refresh access token",
)
@limiter.limit("10/minute")
def refresh(
    request: Request,
    body: RefreshTokenRequest,
):
    """Exchange a valid refresh token for a new token pair."""
    return refresh_access_token(body.refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout (invalidate token)",
)
def logout(token: str = Depends(oauth2_scheme)):
    """Blacklist the current access token."""
    logout_user(token)
    return None


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get current user profile",
)
def me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user
