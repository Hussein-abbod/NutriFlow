"""Users endpoints: profile, password, allergies — validation, auth and isolation."""

import pytest

from app.models.goal import Goal
from tests.helpers import ALLOWED_ORIGIN, DEFAULT_PASSWORD, NATIVE_HEADERS, bearer


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


def _change_password(client, headers, new_password="BrandNew123", current=DEFAULT_PASSWORD):
    return client.put(
        "/users/password",
        json={"current_password": current, "new_password": new_password},
        headers=headers,
    )


def test_change_password_happy_path(client, auth_headers):
    response = _change_password(client, auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "Password changed successfully"
    assert body["access_token"] and body["refresh_token"] is None  # web: refresh is a cookie
    assert "nf_refresh" in response.cookies

    login = client.post("/auth/login", json={"email": "alice@example.com", "password": "BrandNew123"})
    assert login.status_code == 200
    old = client.post("/auth/login", json={"email": "alice@example.com", "password": DEFAULT_PASSWORD})
    assert old.status_code == 401


def test_change_password_ends_other_sessions_but_keeps_this_one(client, user_tokens, auth_headers):
    other_device = client.post(
        "/auth/login", json={"email": "alice@example.com", "password": DEFAULT_PASSWORD}, headers=NATIVE_HEADERS
    ).json()

    response = _change_password(client, auth_headers)
    assert response.status_code == 200

    # Every token issued before the change is dead: access tokens and refresh tokens alike.
    assert client.get("/users/profile", headers=auth_headers).status_code == 401
    assert client.get("/users/profile", headers=bearer(other_device["access_token"])).status_code == 401
    stale_refresh = client.post(
        "/auth/refresh", json={"refresh_token": other_device["refresh_token"]}, headers=NATIVE_HEADERS
    )
    assert stale_refresh.status_code == 401

    # The device that changed the password continues with the new pair (cookie refresh too).
    assert client.get("/users/profile", headers=bearer(response.json()["access_token"])).status_code == 200
    assert client.post("/auth/refresh", headers={"Origin": ALLOWED_ORIGIN}).status_code == 200


def test_native_password_change_returns_the_refresh_token_in_the_body(client, auth_headers):
    response = client.put(
        "/users/password",
        json={"current_password": DEFAULT_PASSWORD, "new_password": "BrandNew123"},
        headers={**auth_headers, **NATIVE_HEADERS},
    )
    assert response.status_code == 200
    assert response.json()["refresh_token"]


def test_change_password_wrong_current(client, auth_headers):
    response = _change_password(client, auth_headers, current="WrongPass1")
    assert response.status_code == 400
    assert response.json() == {"detail": "Incorrect current password"}
    # Nothing changed: the session is still valid.
    assert client.get("/users/profile", headers=auth_headers).status_code == 200


@pytest.mark.parametrize(
    "payload, message",
    [
        ({"current_password": DEFAULT_PASSWORD, "new_password": "short1"}, None),
        ({"current_password": DEFAULT_PASSWORD, "new_password": "x1" * 37}, None),
        ({"current_password": DEFAULT_PASSWORD, "new_password": "onlyletters"}, "at least one letter and one number"),
        ({"current_password": DEFAULT_PASSWORD, "new_password": "1234567890"}, "at least one letter and one number"),
        ({"current_password": DEFAULT_PASSWORD, "new_password": " BrandNew123"}, "start or end with a space"),
        ({"current_password": DEFAULT_PASSWORD, "new_password": "é1" * 25}, "72 bytes"),
        ({"current_password": DEFAULT_PASSWORD, "new_password": DEFAULT_PASSWORD}, "different from the current"),
        ({"current_password": "", "new_password": "BrandNew123"}, None),
        ({"new_password": "BrandNew123"}, None),
    ],
)
def test_change_password_validation(client, auth_headers, payload, message):
    response = client.put("/users/password", json=payload, headers=auth_headers)
    assert response.status_code == 422
    if message:
        assert message in response.json()["detail"][0]["msg"]


def test_change_password_is_rate_limited(client, auth_headers, rate_limited):
    statuses = [_change_password(client, auth_headers, current="WrongPass1").status_code for _ in range(6)]
    assert statuses == [400] * 5 + [429]


def test_weak_passwords_are_rejected_at_registration(client):
    response = client.post("/auth/register", json={"email": "weak@example.com", "password": "password"})
    assert response.status_code == 422


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


def _plan(goal_type: str, weight_kg: float, period_weeks):
    from app.utils.calorie_calculator import calculate_nutrition_plan

    return calculate_nutrition_plan(
        weight_kg=weight_kg, height_cm=165, age=30, gender="female", activity_level="moderately_active",
        goal_type=goal_type, target_weight_kg=65, period_weeks=period_weeks,
    )


def test_profile_edit_spreads_the_goal_over_the_weeks_left(client, onboarded_headers, db_session):
    from datetime import date, timedelta

    goal = db_session.query(Goal).filter(Goal.is_active.is_(True)).one()
    goal.target_date = date.today() + timedelta(weeks=4)  # 6 of the 10 weeks have passed
    db_session.commit()

    response = client.put("/users/profile", json={"weight_kg": 68}, headers=onboarded_headers)
    assert response.json()["daily_calories_target"] == _plan("lose_weight", 68, 4).daily_calories


def test_profile_edit_below_the_target_weight_switches_to_maintenance(client, onboarded_headers):
    response = client.put("/users/profile", json={"weight_kg": 64}, headers=onboarded_headers)
    assert response.json()["daily_calories_target"] == _plan("maintain_weight", 64, None).daily_calories
