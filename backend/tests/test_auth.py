"""Auth endpoints: register, login, refresh (cookie + native body), logout, me."""

import pytest

from app.config import get_settings
from tests.helpers import ALLOWED_ORIGIN, DEFAULT_PASSWORD, NATIVE_HEADERS, bearer, register

COOKIE = get_settings().REFRESH_COOKIE_NAME


def _set_cookie_header(response) -> str:
    return response.headers.get("set-cookie", "")


# ---------- register ----------


def test_register_returns_access_token_and_sets_secure_refresh_cookie(client):
    response = client.post(
        "/auth/register",
        json={"email": "new@example.com", "password": DEFAULT_PASSWORD, "full_name": "  New User "},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "new@example.com"
    assert body["full_name"] == "New User"
    assert body["is_profile_complete"] is False
    assert body["access_token"]
    assert body["refresh_token"] is None  # web: never exposed to JavaScript
    assert body["expires_in"] == get_settings().ACCESS_TOKEN_EXPIRE_MINUTES * 60

    cookie = _set_cookie_header(response).lower()
    assert f"{COOKIE}=" in cookie
    assert "httponly" in cookie
    assert "secure" in cookie
    assert "samesite=strict" in cookie
    assert "path=/auth" in cookie
    assert "hashed_password" not in response.text


def test_register_native_client_gets_refresh_token_in_body_and_no_cookie(client):
    response = client.post(
        "/auth/register",
        json={"email": "native@example.com", "password": DEFAULT_PASSWORD},
        headers=NATIVE_HEADERS,
    )
    assert response.status_code == 201
    assert response.json()["refresh_token"]
    assert COOKIE not in _set_cookie_header(response)


def test_register_duplicate_email_is_rejected(client):
    register(client, "dup@example.com")
    response = client.post("/auth/register", json={"email": "dup@example.com", "password": DEFAULT_PASSWORD})
    assert response.status_code == 400
    assert response.json()["detail"] == "A user with this email already exists."


@pytest.mark.parametrize(
    "payload",
    [
        {"email": "not-an-email", "password": DEFAULT_PASSWORD},
        {"email": "a@example.com", "password": "short"},
        {"email": "a@example.com", "password": "x" * 73},
        {"email": "a@example.com", "password": "é" * 40},  # 80 bytes > bcrypt limit
        {"email": "a@example.com", "password": DEFAULT_PASSWORD, "full_name": "   "},
        {"email": "a@example.com", "password": DEFAULT_PASSWORD, "full_name": "x" * 256},
        {"email": "a@example.com"},
        {},
    ],
)
def test_register_validation_errors(client, payload):
    assert client.post("/auth/register", json=payload).status_code == 422


# ---------- login ----------


def test_login_happy_path(client):
    register(client, "login@example.com")
    response = client.post("/auth/login", json={"email": "login@example.com", "password": DEFAULT_PASSWORD})
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["refresh_token"] is None
    assert f"{COOKIE}=" in _set_cookie_header(response)

    me = client.get("/auth/me", headers=bearer(body["access_token"]))
    assert me.status_code == 200
    assert me.json()["email"] == "login@example.com"


def test_login_native_returns_refresh_token(client):
    register(client, "n@example.com")
    response = client.post(
        "/auth/login",
        json={"email": "n@example.com", "password": DEFAULT_PASSWORD},
        headers=NATIVE_HEADERS,
    )
    assert response.status_code == 200
    assert response.json()["refresh_token"]


@pytest.mark.parametrize(
    "email,password",
    [("login@example.com", "WrongPass123"), ("nobody@example.com", DEFAULT_PASSWORD)],
)
def test_login_bad_credentials_return_generic_401(client, email, password):
    register(client, "login@example.com")
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


@pytest.mark.parametrize(
    "payload",
    [
        {"email": "bad", "password": "x"},
        {"email": "a@example.com", "password": ""},
        {"email": "a@example.com", "password": "x" * 129},
        {"email": "a@example.com"},
    ],
)
def test_login_validation_errors(client, payload):
    assert client.post("/auth/login", json=payload).status_code == 422


# ---------- me / access-token checks ----------


def test_me_requires_token(client):
    assert client.get("/auth/me").status_code == 401


def test_me_rejects_garbage_token(client):
    assert client.get("/auth/me", headers=bearer("not.a.jwt")).status_code == 401


def test_refresh_token_cannot_be_used_as_access_token(client):
    tokens = client.post(
        "/auth/register",
        json={"email": "r@example.com", "password": DEFAULT_PASSWORD},
        headers=NATIVE_HEADERS,
    ).json()
    assert client.get("/auth/me", headers=bearer(tokens["refresh_token"])).status_code == 401


def test_every_issued_token_is_unique(client):
    first = register(client, "u@example.com")
    second = client.post("/auth/login", json={"email": "u@example.com", "password": DEFAULT_PASSWORD}).json()
    assert first["access_token"] != second["access_token"]


# ---------- refresh ----------


def test_refresh_with_cookie_rotates_and_revokes_old_token(client, user_tokens):
    old_cookie = client.cookies.get(COOKIE)
    assert old_cookie

    response = client.post("/auth/refresh", headers={"Origin": ALLOWED_ORIGIN})
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"] and body["refresh_token"] is None
    new_cookie = client.cookies.get(COOKIE)
    assert new_cookie and new_cookie != old_cookie
    assert client.get("/auth/me", headers=bearer(body["access_token"])).status_code == 200

    # Re-using the rotated-out refresh token must fail.
    client.cookies.clear()
    client.cookies.set(COOKIE, old_cookie)
    reuse = client.post("/auth/refresh")
    assert reuse.status_code == 401
    assert reuse.json()["detail"] == "Could not validate credentials"  # revoked, not missing


def test_refresh_native_uses_body(client):
    tokens = client.post(
        "/auth/register",
        json={"email": "nb@example.com", "password": DEFAULT_PASSWORD},
        headers=NATIVE_HEADERS,
    ).json()
    response = client.post(
        "/auth/refresh", json={"refresh_token": tokens["refresh_token"]}, headers=NATIVE_HEADERS
    )
    assert response.status_code == 200
    assert response.json()["refresh_token"] not in (None, tokens["refresh_token"])


def test_native_refresh_ignores_cookie(client, user_tokens):
    """A browser can't turn its httpOnly cookie into a readable token via the native header."""
    assert client.cookies.get(COOKIE)
    assert client.post("/auth/refresh", headers=NATIVE_HEADERS).status_code == 401


def test_refresh_without_token_is_401(client):
    assert client.post("/auth/refresh").status_code == 401


def test_refresh_rejects_access_token(client):
    tokens = register(client, "x@example.com")
    client.cookies.clear()
    response = client.post(
        "/auth/refresh", json={"refresh_token": tokens["access_token"]}, headers=NATIVE_HEADERS
    )
    assert response.status_code == 401


def test_refresh_cookie_from_untrusted_origin_is_forbidden(client, user_tokens):
    response = client.post("/auth/refresh", headers={"Origin": "https://evil.example"})
    assert response.status_code == 403


# ---------- logout ----------


def test_logout_revokes_access_and_refresh_tokens_and_clears_cookie(client, user_tokens, auth_headers):
    refresh_cookie = client.cookies.get(COOKIE)
    response = client.post("/auth/logout", headers=auth_headers)
    assert response.status_code == 204
    assert "max-age=0" in _set_cookie_header(response).lower()

    assert client.get("/auth/me", headers=auth_headers).status_code == 401
    client.cookies.clear()
    client.cookies.set(COOKIE, refresh_cookie)
    reuse = client.post("/auth/refresh")
    assert reuse.status_code == 401
    assert reuse.json()["detail"] == "Could not validate credentials"  # revoked, not missing


def test_logout_native_revokes_body_refresh_token(client):
    tokens = client.post(
        "/auth/register",
        json={"email": "lo@example.com", "password": DEFAULT_PASSWORD},
        headers=NATIVE_HEADERS,
    ).json()
    response = client.post(
        "/auth/logout",
        json={"refresh_token": tokens["refresh_token"]},
        headers={**NATIVE_HEADERS, **bearer(tokens["access_token"])},
    )
    assert response.status_code == 204
    again = client.post(
        "/auth/refresh", json={"refresh_token": tokens["refresh_token"]}, headers=NATIVE_HEADERS
    )
    assert again.status_code == 401


def test_logout_without_tokens_is_idempotent(client):
    assert client.post("/auth/logout").status_code == 204


def test_logout_from_untrusted_origin_still_clears_cookie_without_revoking(client, user_tokens):
    refresh_cookie = client.cookies.get(COOKIE)
    response = client.post("/auth/logout", headers={"Origin": "https://evil.example"})
    assert response.status_code == 204
    assert "max-age=0" in _set_cookie_header(response).lower()
    client.cookies.clear()
    client.cookies.set(COOKIE, refresh_cookie)
    assert client.post("/auth/refresh").status_code == 200  # not revoked by the untrusted caller


def test_expired_revocations_are_pruned():
    from datetime import timedelta

    from app.utils import security

    expired = security.create_access_token({"sub": "1"}, expires_delta=timedelta(seconds=-1))
    live = security.create_access_token({"sub": "1"})
    security._revoked_token_ids["stale"] = 0.0
    security.revoke_token(expired)  # invalid (expired) → ignored
    security.revoke_token(live)
    assert "stale" not in security._revoked_token_ids
    assert len(security._revoked_token_ids) == 1
