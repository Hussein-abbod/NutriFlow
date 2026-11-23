"""Onboarding flow: profile → goal → allergies → complete."""

import pytest

from app.models.goal import Goal
from tests.helpers import LOSE_GOAL, VALID_PROFILE


@pytest.mark.parametrize("path", ["/onboarding/profile", "/onboarding/goal", "/onboarding/allergies", "/onboarding/complete"])
def test_onboarding_requires_auth(client, path):
    assert client.post(path, json={}).status_code == 401


def test_full_onboarding_flow(client, auth_headers, db_session):
    profile = client.post("/onboarding/profile", json=VALID_PROFILE, headers=auth_headers)
    assert profile.status_code == 200
    assert profile.json()["activity_level"] == "moderately_active"

    goal = client.post("/onboarding/goal", json=LOSE_GOAL, headers=auth_headers)
    assert goal.status_code == 200
    goal_body = goal.json()
    assert goal_body["is_feasible"] is True
    assert goal_body["targets"]["daily_calories"] > 1200

    allergies = client.post("/onboarding/allergies", json={"food_allergies": ["Peanuts"]}, headers=auth_headers)
    assert allergies.status_code == 200
    assert allergies.json()["food_allergies"] == ["Peanuts"]

    done = client.post("/onboarding/complete", headers=auth_headers)
    assert done.status_code == 200
    assert done.json()["is_profile_complete"] is True

    goals = db_session.query(Goal).all()
    assert len(goals) == 1
    assert goals[0].is_active and goals[0].target_weight == 65


def test_maintain_goal_needs_no_target(client, auth_headers):
    client.post("/onboarding/profile", json=VALID_PROFILE, headers=auth_headers)
    response = client.post("/onboarding/goal", json={"goal_type": "maintain_weight"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["targets"] is not None


def test_goal_before_profile_is_rejected(client, auth_headers):
    response = client.post("/onboarding/goal", json=LOSE_GOAL, headers=auth_headers)
    assert response.status_code == 400


def test_gain_goal_without_target_is_rejected(client, auth_headers):
    client.post("/onboarding/profile", json=VALID_PROFILE, headers=auth_headers)
    response = client.post("/onboarding/goal", json={"goal_type": "gain_weight"}, headers=auth_headers)
    assert response.status_code == 400


def test_unsafe_goal_is_reported_not_saved(client, auth_headers):
    client.post("/onboarding/profile", json=VALID_PROFILE, headers=auth_headers)
    response = client.post(
        "/onboarding/goal",
        json={"goal_type": "lose_weight", "target_weight_kg": 50, "goal_period_weeks": 4},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["is_feasible"] is False
    assert body["suggested_weeks"] == 21
    assert client.get("/auth/me", headers=auth_headers).json()["goal_type"] is None


@pytest.mark.parametrize(
    "payload",
    [
        {"goal_type": "lose_weight", "target_weight_kg": 75, "goal_period_weeks": 10},
        {"goal_type": "lose_weight", "target_weight_kg": 70, "goal_period_weeks": 10},
        {"goal_type": "gain_weight", "target_weight_kg": 65, "goal_period_weeks": 10},
        {"goal_type": "gain_weight", "target_weight_kg": 70, "goal_period_weeks": 10},
    ],
)
def test_goal_in_the_wrong_direction_is_rejected(client, auth_headers, payload):
    client.post("/onboarding/profile", json=VALID_PROFILE, headers=auth_headers)
    response = client.post("/onboarding/goal", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "current weight (70 kg)" in response.json()["detail"]


def test_gain_goal_targets_add_a_surplus(client, auth_headers):
    client.post("/onboarding/profile", json=VALID_PROFILE, headers=auth_headers)
    maintain = client.post("/onboarding/goal", json={"goal_type": "maintain_weight"}, headers=auth_headers)
    gain = client.post(
        "/onboarding/goal",
        json={"goal_type": "gain_weight", "target_weight_kg": 74, "goal_period_weeks": 8},
        headers=auth_headers,
    )
    assert gain.json()["is_feasible"] is True
    # 4 kg over 8 weeks = 0.5 kg/week = +550 kcal/day
    surplus = gain.json()["targets"]["daily_calories"] - maintain.json()["targets"]["daily_calories"]
    assert surplus == pytest.approx(550, abs=0.01)


def test_goal_response_matches_the_calculator(client, auth_headers):
    client.post("/onboarding/profile", json=VALID_PROFILE, headers=auth_headers)
    targets = client.post("/onboarding/goal", json=LOSE_GOAL, headers=auth_headers).json()["targets"]
    assert targets == {
        "daily_calories": 1651.39,
        "daily_protein": 140,
        "daily_carbs": 169.64,
        "daily_fat": 45.87,
    }
    me = client.get("/auth/me", headers=auth_headers).json()
    assert me["daily_calories_target"] == 1651.39
    assert me["goal_weight_kg"] == 65
    assert me["goal_period_weeks"] == 10


def test_complete_before_steps_is_rejected(client, auth_headers):
    assert client.post("/onboarding/complete", headers=auth_headers).status_code == 400


def test_completing_twice_keeps_a_single_active_goal(client, onboarded_headers, db_session):
    assert client.post("/onboarding/complete", headers=onboarded_headers).status_code == 200
    active = db_session.query(Goal).filter(Goal.is_active.is_(True)).count()
    assert active == 1


@pytest.mark.parametrize(
    "override",
    [
        {"age": 9},
        {"age": 101},
        {"gender": "other"},
        {"height_cm": 0},
        {"height_cm": 49.9},
        {"height_cm": 300.1},
        {"weight_kg": 19.9},
        {"weight_kg": 600},
        {"age": 30.5},
        {"full_name": " "},
        {"activity_level": "couch"},
    ],
)
def test_profile_validation(client, auth_headers, override):
    payload = {**VALID_PROFILE, **override}
    assert client.post("/onboarding/profile", json=payload, headers=auth_headers).status_code == 422


@pytest.mark.parametrize(
    "payload",
    [
        {"goal_type": "get_huge"},
        {"goal_type": "lose_weight", "target_weight_kg": 0, "goal_period_weeks": 10},
        {"goal_type": "lose_weight", "target_weight_kg": 19, "goal_period_weeks": 10},
        {"goal_type": "lose_weight", "target_weight_kg": 60, "goal_period_weeks": 0},
        {"goal_type": "lose_weight", "target_weight_kg": 60, "goal_period_weeks": 105},
    ],
)
def test_goal_validation(client, auth_headers, payload):
    assert client.post("/onboarding/goal", json=payload, headers=auth_headers).status_code == 422


def test_allergies_validation(client, auth_headers):
    payload = {"food_allergies": [f"a{index}" for index in range(31)]}
    assert client.post("/onboarding/allergies", json=payload, headers=auth_headers).status_code == 422


def test_onboarding_only_changes_the_caller(client, auth_headers, other_auth_headers):
    client.post("/onboarding/profile", json=VALID_PROFILE, headers=other_auth_headers)
    alice = client.get("/auth/me", headers=auth_headers).json()
    assert alice["age"] is None
    assert alice["full_name"] == "Alice"
