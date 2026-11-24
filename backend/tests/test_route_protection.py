"""
Every route except the public ones requires a valid access token. New routes are picked up
automatically, so a forgotten `Depends(get_current_user)` fails this test.
"""

import re

import pytest
from fastapi.routing import APIRoute

from app.main import app
from app.utils.security import create_refresh_token

PUBLIC_ROUTES = {
    ("GET", "/"),
    ("GET", "/health"),
    ("POST", "/auth/register"),
    ("POST", "/auth/login"),
    ("POST", "/auth/refresh"),  # authenticated by the refresh token instead
    ("POST", "/auth/logout"),  # idempotent; only revokes what it is given
}


def _api_routes() -> list[tuple[str, str]]:
    routes = []
    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue
        # Path parameters get a harmless value; auth runs before the handler.
        path = re.sub(r"\{[^}]+\}", "1", route.path)
        routes.extend((method, path) for method in sorted(route.methods - {"HEAD", "OPTIONS"}))
    return routes


PROTECTED_ROUTES = [route for route in _api_routes() if route not in PUBLIC_ROUTES]


def test_route_list_is_complete():
    assert len(PROTECTED_ROUTES) >= 24
    assert PUBLIC_ROUTES <= set(_api_routes())


@pytest.mark.parametrize("method,path", PROTECTED_ROUTES)
def test_protected_routes_reject_missing_tokens(client, method, path):
    assert client.request(method, path).status_code == 401


@pytest.mark.parametrize("method,path", PROTECTED_ROUTES)
def test_protected_routes_reject_refresh_tokens_and_garbage(client, user_tokens, method, path):
    refresh_token = create_refresh_token({"sub": "1", "ver": 0})
    for token in (refresh_token, "not-a-jwt"):
        response = client.request(method, path, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401
