"""
Authentication router for NutriFlow.
Endpoints: register, login, refresh, logout, me. Rate-limited with slowapi.

Token transport (see app/utils/token_transport.py):
  web    → access token in body, refresh token in an httpOnly cookie
  native → both tokens in body (header `X-Client-Platform: native`)
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.limiter import limiter
from app.models.user import User
from app.schemas.user import (
    RefreshTokenRequest,
    RegisterResponse,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserOut,
)
from app.services import auth_service
from app.utils.security import get_current_user, optional_oauth2_scheme
from app.utils.token_transport import (
    clear_refresh_cookie,
    ensure_trusted_origin,
    get_refresh_cookie,
    is_native_client,
    set_refresh_cookie,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _issue(request: Request, response: Response, tokens: auth_service.TokenPair) -> dict:
    """Deliver a token pair the way the calling client expects."""
    body = {
        "access_token": tokens.access_token,
        "token_type": "bearer",
        "expires_in": tokens.expires_in,
        "refresh_token": None,
    }
    if is_native_client(request):
        body["refresh_token"] = tokens.refresh_token
    else:
        set_refresh_cookie(response, tokens.refresh_token)
    return body


def _presented_refresh_token(
    request: Request, body: Optional[RefreshTokenRequest]
) -> Optional[str]:
    """Native clients send the token in the body; browsers send the cookie."""
    if is_native_client(request):
        return body.refresh_token if body else None
    cookie_token = get_refresh_cookie(request)
    if cookie_token:
        ensure_trusted_origin(request)
    return cookie_token


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user and return tokens",
)
@limiter.limit("5/minute")
def register(
    request: Request,
    response: Response,
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    """Register with email + password (+ optional full name) and log the user in."""
    user = auth_service.create_user(db, user_data)
    tokens = _issue(request, response, auth_service.generate_tokens(user.id))
    return RegisterResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_profile_complete=user.is_profile_complete,
        **tokens,
    )


@router.post("/login", response_model=TokenResponse, summary="Login and receive tokens")
@limiter.limit("10/minute")
def login(
    request: Request,
    response: Response,
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """Authenticate and return an access token (+ refresh token via cookie or body)."""
    user = auth_service.authenticate_user(db, credentials.email, credentials.password)
    return _issue(request, response, auth_service.generate_tokens(user.id))


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
@limiter.limit("30/minute")
def refresh(
    request: Request,
    response: Response,
    body: Optional[RefreshTokenRequest] = None,
    db: Session = Depends(get_db),
):
    """Exchange a valid refresh token for a new pair. The old refresh token is revoked."""
    refresh_token = _presented_refresh_token(request, body)
    tokens = auth_service.refresh_tokens(db, refresh_token)
    return _issue(request, response, tokens)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout (revoke tokens, clear cookie)",
)
def logout(
    request: Request,
    body: Optional[RefreshTokenRequest] = None,
    access_token: Optional[str] = Depends(optional_oauth2_scheme),
):
    """Revoke the presented access + refresh tokens. Always succeeds (idempotent)."""
    try:
        refresh_token = _presented_refresh_token(request, body)
    except HTTPException:
        # Untrusted origin: don't revoke on its behalf, but still clear the cookie.
        refresh_token = None
    auth_service.logout(access_token, refresh_token)
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_refresh_cookie(response)
    return response


@router.get("/me", response_model=UserOut, summary="Get current user profile")
def me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user
