"""
Shared pytest fixtures.

- Uses a separate test database: in-memory SQLite by default, or TEST_DATABASE_URL.
  The dev DATABASE_URL from .env is never used (env vars override .env).
- Groq, Gemini and USDA are mocked; real outbound HTTP is blocked.
"""

import os

TEST_ENV = {
    "DATABASE_URL": os.environ.get("TEST_DATABASE_URL", "sqlite://"),
    "SECRET_KEY": "test-secret-key-that-is-long-enough-for-hs256-signing",
    "CORS_ORIGINS": "http://localhost:5173,https://app.nutriflow.test",
    "RATE_LIMIT_ENABLED": "false",
    "REFRESH_COOKIE_SECURE": "true",
    "REFRESH_COOKIE_SAMESITE": "strict",
    "GROQ_API_KEY": "",
    "GEMINI_API_KEY": "",
    "OPENAI_API_KEY": "",
    "USDA_API_KEY": "test-usda-key",
}
os.environ.update(TEST_ENV)

import httpx  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.limiter import limiter  # noqa: E402
from app.main import app  # noqa: E402
from app.services import advice_agent, coach_agent, llm_config, usda_client  # noqa: E402
from app.utils import security  # noqa: E402

from app import models as _models  # noqa: E402,F401  (registers every table on Base.metadata)
from tests.helpers import LOSE_GOAL, VALID_PROFILE, bearer, register  # noqa: E402

FAKE_USDA_FOOD = {
    "fdc_id": 1,
    "food_name": "Rice, white, cooked",
    "brand_name": None,
    "calories": 130.0,
    "protein": 2.7,
    "carbs": 28.0,
    "fat": 0.3,
    "fiber": 0.4,
    "sugar": 0.1,
    "sodium": 1.0,
}


# ---------- Isolation ----------


@pytest.fixture(autouse=True)
def database():
    """Fresh schema for every test."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def reset_security_state():
    security._revoked_token_ids.clear()
    limiter.reset()
    yield
    security._revoked_token_ids.clear()
    limiter.enabled = False


@pytest.fixture(autouse=True)
def mock_external_services(monkeypatch):
    """No test may reach Groq, Gemini or USDA."""
    monkeypatch.setattr(llm_config, "get_groq_llm", lambda: None)
    monkeypatch.setattr(llm_config, "get_gemini_llm", lambda: None)
    monkeypatch.setattr(advice_agent, "get_groq_llm", lambda: None)
    monkeypatch.setattr(coach_agent, "get_groq_llm", lambda: None)

    async def fake_search_foods(query, page_size=10):
        return [dict(FAKE_USDA_FOOD, food_name=f"{query} (USDA)")]

    async def fake_get_food_by_id(fdc_id):
        return dict(FAKE_USDA_FOOD, fdc_id=fdc_id)

    async def fake_search_by_barcode(upc):
        return dict(FAKE_USDA_FOOD, food_name=f"Barcode {upc}")

    monkeypatch.setattr(usda_client, "search_foods", fake_search_foods)
    monkeypatch.setattr(usda_client, "get_food_by_id", fake_get_food_by_id)
    monkeypatch.setattr(usda_client, "search_by_barcode", fake_search_by_barcode)

    def blocked(*args, **kwargs):
        raise RuntimeError("Outbound HTTP is blocked in tests")

    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", blocked)
    monkeypatch.setattr(httpx.AsyncHTTPTransport, "handle_async_request", blocked)


# ---------- Clients & users ----------


@pytest.fixture
def client():
    # https so the Secure refresh cookie is stored and sent back by the test client.
    with TestClient(app, base_url="https://testserver") as test_client:
        yield test_client


@pytest.fixture
def db_session():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def user_tokens(client) -> dict:
    return register(client, "alice@example.com", full_name="Alice")


@pytest.fixture
def auth_headers(user_tokens) -> dict:
    return bearer(user_tokens["access_token"])


@pytest.fixture
def other_auth_headers() -> dict:
    """A second, independent user (own client so cookies don't mix)."""
    with TestClient(app, base_url="https://testserver") as other_client:
        tokens = register(other_client, "bob@example.com", full_name="Bob")
    return bearer(tokens["access_token"])


@pytest.fixture
def onboarded_headers(client, auth_headers) -> dict:
    """Alice with a finished onboarding (lose 5 kg in 10 weeks)."""
    assert client.post("/onboarding/profile", json=VALID_PROFILE, headers=auth_headers).status_code == 200
    assert client.post("/onboarding/goal", json=LOSE_GOAL, headers=auth_headers).status_code == 200
    assert client.post("/onboarding/complete", headers=auth_headers).status_code == 200
    return auth_headers
