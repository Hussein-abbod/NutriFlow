"""CORS allow-list, settings validation and rate limiting."""

import pytest
from pydantic import ValidationError

from app.config import Settings
from tests.helpers import ALLOWED_ORIGIN, DEFAULT_PASSWORD, register

STRONG_SECRET = "s" * 40


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_cors_allows_listed_origin_with_credentials(client):
    response = client.options(
        "/auth/login",
        headers={
            "Origin": ALLOWED_ORIGIN,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    assert response.headers["access-control-allow-credentials"] == "true"


def test_cors_rejects_unlisted_origin(client):
    response = client.options(
        "/auth/login",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers

    simple = client.get("/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in simple.headers


def test_settings_reject_wildcard_cors():
    settings = Settings(SECRET_KEY=STRONG_SECRET, CORS_ORIGINS="http://a.test, *")
    with pytest.raises(ValueError):
        _ = settings.cors_origin_list


def test_settings_parse_cors_list():
    settings = Settings(SECRET_KEY=STRONG_SECRET, CORS_ORIGINS=" http://a.test/ ,https://b.test,, ")
    assert settings.cors_origin_list == ["http://a.test", "https://b.test"]


@pytest.mark.parametrize("secret", ["", "too-short"])
def test_settings_reject_weak_secret_key(secret):
    with pytest.raises(ValidationError):
        Settings(SECRET_KEY=secret)


def test_login_is_rate_limited(client, rate_limited):
    payload = {"email": "rl@example.com", "password": DEFAULT_PASSWORD}
    statuses = [client.post("/auth/login", json=payload).status_code for _ in range(11)]
    assert statuses[:10] == [401] * 10
    assert statuses[10] == 429


def test_register_is_rate_limited_with_api_error_shape(client, rate_limited):
    for index in range(5):
        register(client, f"user{index}@example.com")
    response = client.post("/auth/register", json={"email": "user6@example.com", "password": DEFAULT_PASSWORD})
    assert response.status_code == 429
    assert response.json() == {"detail": "Too many requests. Please try again later."}


def test_password_change_is_rate_limited(client, auth_headers, rate_limited):
    payload = {"current_password": "WrongPass1", "new_password": "NewPassw0rd"}
    statuses = [client.put("/users/password", json=payload, headers=auth_headers).status_code for _ in range(6)]
    assert statuses[:5] == [400] * 5
    assert statuses[5] == 429


def test_ai_endpoints_are_rate_limited(client, auth_headers, rate_limited):
    payload = {"query": "rice", "meal_type": "lunch"}
    statuses = [
        client.post("/food-log/text", json=payload, headers=auth_headers).status_code for _ in range(21)
    ]
    assert statuses[:20] == [200] * 20
    assert statuses[20] == 429


def test_coach_message_length_is_limited(client, auth_headers):
    response = client.post("/coach/message", json={"message": "x" * 2001}, headers=auth_headers)
    assert response.status_code == 422


def test_validation_messages_have_no_pydantic_prefix(client, auth_headers):
    payload = {"meal_type": "lunch", "log_date": "2999-01-01", "items": [{"food_name": "Rice"}]}
    response = client.post("/food-log/submit", json=payload, headers=auth_headers)
    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "Meals can be logged at most 7 days ahead."


def test_oversized_bodies_are_rejected_before_parsing(client, auth_headers):
    from app.utils.request_size import MAX_REQUEST_BODY_BYTES

    body = b"x" * (MAX_REQUEST_BODY_BYTES + 1)
    response = client.post(
        "/food-log/image",
        content=body,
        headers={**auth_headers, "Content-Type": "application/json", "Origin": ALLOWED_ORIGIN},
    )
    assert response.status_code == 413
    assert response.json() == {"detail": "Request body is too large."}
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN


def test_bodies_without_a_length_are_refused(client, auth_headers):
    def chunks():
        yield b'{"query": "rice", "meal_type": "lunch"}'

    response = client.post(
        "/food-log/text", content=chunks(), headers={**auth_headers, "Content-Type": "application/json"}
    )
    assert response.status_code == 411
