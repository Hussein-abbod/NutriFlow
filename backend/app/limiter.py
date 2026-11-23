"""
Shared slowapi rate limiter.

Every router must import this single instance so limits share one storage and can be
switched off in tests via RATE_LIMIT_ENABLED.
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings

# Endpoints that call Groq / Gemini / USDA (paid or quota-limited services).
AI_RATE_LIMIT = "20/minute"

limiter = Limiter(
    key_func=get_remote_address,
    enabled=get_settings().RATE_LIMIT_ENABLED,
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Return 429 in the same `{"detail": ...}` shape as every other API error."""
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )
