"""
NutriFlow — FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import auth, users, onboarding, food_log, dashboard, coach

# ---------- Rate limiter ----------
limiter = Limiter(key_func=get_remote_address)

# ---------- App ----------
app = FastAPI(
    title="NutriFlow API",
    description="Mobile-first nutrition tracking application",
    version="0.1.0",
)

# Attach limiter to app state (required by slowapi)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------- CORS (HTTPS-ready) ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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
