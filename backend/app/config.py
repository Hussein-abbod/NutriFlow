"""
NutriFlow application configuration.
Loads settings from environment variables / .env file.
"""

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings

MIN_SECRET_KEY_LENGTH = 32


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # Database
    DATABASE_URL: str = ""

    # JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — comma-separated list of allowed browser origins (never "*")
    CORS_ORIGINS: str = "http://localhost:5173"

    # Refresh-token cookie (web clients)
    REFRESH_COOKIE_NAME: str = "nf_refresh"
    REFRESH_COOKIE_SECURE: bool = True
    REFRESH_COOKIE_SAMESITE: Literal["strict", "lax", "none"] = "strict"

    # Rate limiting (slowapi). Disabled only in tests.
    RATE_LIMIT_ENABLED: bool = True

    # External API keys
    USDA_API_KEY: str = "DEMO_KEY"  # Free at: https://api.data.gov/signup
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, value: str) -> str:
        if len(value) < MIN_SECRET_KEY_LENGTH:
            raise ValueError(
                f"SECRET_KEY must be set and at least {MIN_SECRET_KEY_LENGTH} characters long."
            )
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        """Parsed CORS allow-list. A wildcard is never allowed (credentials are used)."""
        origins = [origin.strip().rstrip("/") for origin in self.CORS_ORIGINS.split(",")]
        origins = [origin for origin in origins if origin]
        if "*" in origins:
            raise ValueError("CORS_ORIGINS must list explicit origins; '*' is not allowed.")
        return origins


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
