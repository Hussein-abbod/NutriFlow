"""
How tokens travel between the API and its clients.

Web (default):
  - access token in the JSON body (the client keeps it in memory only)
  - refresh token in an httpOnly, Secure, SameSite cookie scoped to /auth
Native (Capacitor / mobile, header `X-Client-Platform: native`):
  - both tokens in the JSON body; refresh is sent back in the request body
"""

from typing import Optional

from fastapi import HTTPException, Request, Response, status

from app.config import get_settings

settings = get_settings()

CLIENT_PLATFORM_HEADER = "X-Client-Platform"
NATIVE_PLATFORM = "native"
REFRESH_COOKIE_PATH = "/auth"


def is_native_client(request: Request) -> bool:
    """True when the client explicitly asked for body-based refresh tokens."""
    return request.headers.get(CLIENT_PLATFORM_HEADER, "").lower() == NATIVE_PLATFORM


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
    )


def deliver_tokens(request: Request, response: Response, tokens) -> dict:
    """
    Token-response body for a new token pair (`auth_service.TokenPair`), delivered the way
    the calling client expects: web gets the refresh token as a cookie, native in the body.
    """
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


def get_refresh_cookie(request: Request) -> Optional[str]:
    return request.cookies.get(settings.REFRESH_COOKIE_NAME)


def ensure_trusted_origin(request: Request) -> None:
    """
    CSRF guard for cookie-authenticated requests: if the browser sent an Origin header,
    it must be in the CORS allow-list. (SameSite already blocks most cross-site sends.)
    """
    origin = request.headers.get("origin")
    if origin is not None and origin.rstrip("/") not in settings.cors_origin_list:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Origin not allowed.",
        )
