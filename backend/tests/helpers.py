"""Helpers shared by test modules (plain functions/constants, not fixtures)."""

from fastapi.testclient import TestClient

ALLOWED_ORIGIN = "http://localhost:5173"
NATIVE_HEADERS = {"X-Client-Platform": "native"}
DEFAULT_PASSWORD = "Str0ngPass!"

VALID_PROFILE = {
    "full_name": "Alice Example",
    "age": 30,
    "gender": "female",
    "height_cm": 165,
    "weight_kg": 70,
    "activity_level": "moderately_active",
}

LOSE_GOAL = {"goal_type": "lose_weight", "target_weight_kg": 65, "goal_period_weeks": 10}


def register(client: TestClient, email: str, password: str = DEFAULT_PASSWORD, **extra) -> dict:
    response = client.post("/auth/register", json={"email": email, "password": password, **extra})
    assert response.status_code == 201, response.text
    return response.json()


def bearer(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


RICE = {
    "food_name": "Rice, white, cooked",
    "quantity": 200,
    "unit": "g",
    "calories": 260,
    "protein": 5.4,
    "carbs": 56,
    "fat": 0.6,
}


def submit(client: TestClient, headers: dict, items=None, **extra):
    """POST /food-log/submit with one rice item unless told otherwise."""
    payload = {"meal_type": "breakfast", "log_method": "text", "items": items or [RICE], **extra}
    return client.post("/food-log/submit", json=payload, headers=headers)
