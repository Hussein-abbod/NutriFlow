"""
NutriFlow — FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.limiter import limiter, rate_limit_exceeded_handler
from app.routers import auth, users, onboarding, food_log, dashboard, coach
from app.utils.token_transport import CLIENT_PLATFORM_HEADER

settings = get_settings()

# ---------- App ----------
app = FastAPI(
    title="NutriFlow API",
    description="Mobile-first nutrition tracking application",
    version="0.1.0",
)

# Attach limiter to app state (required by slowapi)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    422 with only `loc`, `msg` and `type`. FastAPI's default also echoes the rejected `input`,
    which leaks values such as passwords and crashes (500) on non-JSON values like NaN.
    """
    errors = [
        {"loc": list(error.get("loc", ())), "msg": str(error.get("msg", "")), "type": str(error.get("type", ""))}
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": errors})

# ---------- CORS (explicit allow-list, credentials for the refresh cookie) ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", CLIENT_PLATFORM_HEADER],
)

# ---------- Routers ----------
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(onboarding.router)
app.include_router(food_log.router)
app.include_router(dashboard.router)
app.include_router(coach.router)


# ---------- Health check ----------
@app.get("/", tags=["Health"])
def root():
    """Health check endpoint."""
    return {"status": "healthy", "app": "NutriFlow API", "version": "0.1.0"}


@app.get("/health", tags=["Health"])
def health():
    """Detailed health check."""
    return {"status": "ok"}
