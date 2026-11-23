"""Users endpoints: profile, password, allergies — validation, auth and isolation."""

import pytest

from app.models.goal import Goal
from tests.helpers import DEFAULT_PASSWORD


def test_get_profile_returns_own_user(client, auth_headers):
    response = client.get("/users/profile", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"
    assert "hashed_password" not in response.json()


@pytest.mark.parametrize(
    "method,path",
    [
        ("get", "/users/profile"),
        ("put", "/users/profile"),
        ("put", "/users/password"),
        ("put", "/users/allergies"),
    ],
)
def test_users_endpoints_require_auth(client, method, path):
    assert getattr(client, method)(path).status_code == 401


def test_update_profile_partial(client, auth_headers):
    response = client.put("/users/profile", json={"full_name": " Alice B "}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["full_name"] == "Alice B"


def test_update_weight_recalculates_targets_for_onboarded_user(client, onboarded_headers, db_session):
    before = client.get("/users/profile", headers=onboarded_headers).json()
    response = client.put("/users/profile", json={"weight_kg": 80}, headers=onboarded_headers)
    assert response.status_code == 200
    after = response.json()
    assert after["weight_kg"] == 80
    assert after["daily_calories_target"] != before["daily_calories_target"]
    assert after["daily_protein_target"] == 160  # 2 g / kg

    goal = db_session.query(Goal).filter(Goal.is_active.is_(True)).one()
    assert goal.daily_calories == after["daily_calories_target"]


@pytest.mark.parametrize(
    "payload",
    [
        {"age": 9},
        {"age": 101},
        {"height_cm": 0},
        {"height_cm": 301},
        {"weight_kg": -1},
        {"weight_kg": 501},
        {"full_name": ""},
        {"full_name": "x" * 256},
        {"age": "abc"},
    ],
)
def test_update_profile_validation(client, auth_headers, payload):
    assert client.put("/users/profile", json=payload, headers=auth_headers).status_code == 422


def test_change_password_happy_path(client, auth_headers):
    response = client.put(
        "/users/password",
        json={"current_password": DEFAULT_PASSWORD, "new_password": "BrandNew123"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json() == {"message": "Password changed successfully"}
    login = client.post("/auth/login", json={"email": "alice@example.com", "password": "BrandNew123"})
    assert login.status_code == 200


def test_change_password_wrong_current(client, auth_headers):
    response = client.put(
        "/users/password",
        json={"current_password": "WrongPass1", "new_password": "BrandNew123"},
        headers=auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.parametrize(
    "payload",
    [
        {"current_password": DEFAULT_PASSWORD, "new_password": "short"},
        {"current_password": DEFAULT_PASSWORD, "new_password": "x" * 73},
        {"current_password": "", "new_password": "BrandNew123"},
        {"new_password": "BrandNew123"},
    ],
)
def test_change_password_validation(client, auth_headers, payload):
    assert client.put("/users/password", json=payload, headers=auth_headers).status_code == 422


def test_update_allergies(client, auth_headers):
    response = client.put("/users/allergies", json={"allergies": [" Peanuts ", "Milk"]}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["allergies"] == ["Peanuts", "Milk"]


@pytest.mark.parametrize(
    "payload",
    [
        {"allergies": [""]},
        {"allergies": ["x" * 101]},
        {"allergies": [f"a{index}" for index in range(31)]},
        {"allergies": "Peanuts"},
        {},
    ],
)
def test_update_allergies_validation(client, auth_headers, payload):
    assert client.put("/users/allergies", json=payload, headers=auth_headers).status_code == 422


def test_user_cannot_read_or_change_another_users_data(client, auth_headers, other_auth_headers):
    client.put("/users/profile", json={"full_name": "Bob Changed"}, headers=other_auth_headers)
    client.put("/users/allergies", json={"allergies": ["Fish"]}, headers=other_auth_headers)

    alice = client.get("/users/profile", headers=auth_headers).json()
    bob = client.get("/users/profile", headers=other_auth_headers).json()
    assert alice["email"] == "alice@example.com"
    assert alice["full_name"] == "Alice"
    assert alice["food_allergies"] in (None, [])
    assert bob["email"] == "bob@example.com"
    assert bob["full_name"] == "Bob Changed"
