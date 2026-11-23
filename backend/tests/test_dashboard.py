"""Dashboard endpoints: today, weekly, goal progress, reset and extend goal."""

from datetime import date, timedelta

import pytest

from app.models.food_log import FoodLog, MealType
from app.models.goal import Goal
from app.utils.calorie_calculator import calculate_bmr, calculate_tdee
from tests.helpers import VALID_PROFILE

DASHBOARD_GETS = ["/dashboard/today", "/dashboard/weekly", "/dashboard/goal-progress"]
DASHBOARD_PUTS = ["/dashboard/reset-goal", "/dashboard/extend-goal"]


def _user_id(client, headers) -> int:
    return client.get("/auth/me", headers=headers).json()["id"]


def _add_log(db_session, user_id, meal, calories, day=None, protein=0, carbs=0, fat=0):
    db_session.add(
        FoodLog(
            user_id=user_id,
            meal_type=MealType(meal),
            log_date=day or date.today(),
            total_calories=calories,
            total_protein=protein,
            total_carbs=carbs,
            total_fat=fat,
        )
    )
    db_session.commit()


# ---------- Auth ----------


@pytest.mark.parametrize("path", DASHBOARD_GETS)
def test_get_endpoints_require_auth(client, path):
    assert client.get(path).status_code == 401


@pytest.mark.parametrize("path", DASHBOARD_PUTS)
def test_put_endpoints_require_auth(client, path):
    assert client.put(path, json={"extra_weeks": 2}).status_code == 401


# ---------- /today ----------


def test_today_without_logs_uses_the_user_targets(client, onboarded_headers):
    me = client.get("/auth/me", headers=onboarded_headers).json()
    body = client.get("/dashboard/today", headers=onboarded_headers).json()

    assert body["calories_consumed"] == 0
    assert body["calories_target"] == me["daily_calories_target"]
    assert body["protein"] == {"consumed": 0, "target": me["daily_protein_target"]}
    assert body["carbs"]["target"] == me["daily_carbs_target"]
    assert body["fat"]["target"] == me["daily_fat_target"]
    target = me["daily_calories_target"]
    assert body["meals"]["breakfast"]["target"] == pytest.approx(target * 0.25)
    assert body["meals"]["lunch"]["target"] == pytest.approx(target * 0.35)
    assert body["meals"]["snack"]["target"] == pytest.approx(target * 0.10)
    assert body["meals"]["dinner"]["target"] == pytest.approx(target * 0.30)


def test_today_sums_todays_logs_per_meal(client, onboarded_headers, db_session):
    user_id = _user_id(client, onboarded_headers)
    _add_log(db_session, user_id, "breakfast", 300, protein=20, carbs=30, fat=10)
    _add_log(db_session, user_id, "breakfast", 100, protein=5, carbs=10, fat=2)
    _add_log(db_session, user_id, "dinner", 600, protein=40, carbs=50, fat=20)
    _add_log(db_session, user_id, "lunch", 999, day=date.today() - timedelta(days=1))

    body = client.get("/dashboard/today", headers=onboarded_headers).json()
    assert body["calories_consumed"] == 1000
    assert body["protein"]["consumed"] == 65
    assert body["carbs"]["consumed"] == 90
    assert body["fat"]["consumed"] == 32
    assert body["meals"]["breakfast"]["calories"] == 400
    assert body["meals"]["dinner"]["calories"] == 600
    assert body["meals"]["lunch"]["calories"] == 0


def test_today_defaults_before_onboarding(client, auth_headers):
    body = client.get("/dashboard/today", headers=auth_headers).json()
    assert body["calories_target"] == 2000
    assert body["protein"]["target"] == 50
    assert body["carbs"]["target"] == 250
    assert body["fat"]["target"] == 65


def test_today_only_counts_the_callers_logs(client, onboarded_headers, other_auth_headers, db_session):
    other_id = _user_id(client, other_auth_headers)
    _add_log(db_session, other_id, "lunch", 800)
    assert client.get("/dashboard/today", headers=onboarded_headers).json()["calories_consumed"] == 0


# ---------- /weekly ----------


def test_weekly_returns_seven_days_oldest_first(client, onboarded_headers, db_session):
    user_id = _user_id(client, onboarded_headers)
    today = date.today()
    _add_log(db_session, user_id, "lunch", 500)
    _add_log(db_session, user_id, "dinner", 250)
    _add_log(db_session, user_id, "lunch", 400, day=today - timedelta(days=6))
    _add_log(db_session, user_id, "lunch", 900, day=today - timedelta(days=7))  # outside window

    days = client.get("/dashboard/weekly", headers=onboarded_headers).json()
    assert [day["date"] for day in days] == [
        (today - timedelta(days=offset)).isoformat() for offset in range(6, -1, -1)
    ]
    assert days[0]["calories"] == 400
    assert days[-1]["calories"] == 750
    assert sum(day["calories"] for day in days) == 1150


def test_weekly_hides_other_users_logs(client, onboarded_headers, other_auth_headers, db_session):
    _add_log(db_session, _user_id(client, other_auth_headers), "lunch", 800)
    days = client.get("/dashboard/weekly", headers=onboarded_headers).json()
    assert all(day["calories"] == 0 for day in days)


# ---------- /goal-progress ----------


def test_goal_progress_without_goal(client, auth_headers):
    assert client.get("/dashboard/goal-progress", headers=auth_headers).json() == {
        "has_active_goal": False,
        "goal_type": "",
        "start_weight": 0,
        "current_weight": 0,
        "target_weight": 0,
        "days_remaining": 0,
        "start_date": None,
        "target_date": None,
    }


def test_goal_progress_for_the_onboarding_goal(client, onboarded_headers):
    body = client.get("/dashboard/goal-progress", headers=onboarded_headers).json()
    assert body["has_active_goal"] is True
    assert body["goal_type"] == "lose_weight"
    assert body["start_weight"] == 70
    assert body["current_weight"] == 70
    assert body["target_weight"] == 65
    assert body["days_remaining"] == 70  # 10 weeks
    assert body["start_date"] == date.today().isoformat()


def test_goal_progress_never_negative(client, onboarded_headers, db_session):
    goal = db_session.query(Goal).filter(Goal.is_active.is_(True)).one()
    goal.target_date = date.today() - timedelta(days=3)
    db_session.commit()
    assert client.get("/dashboard/goal-progress", headers=onboarded_headers).json()["days_remaining"] == 0


def test_goal_progress_ignores_other_users_goals(client, onboarded_headers, other_auth_headers):
    body = client.get("/dashboard/goal-progress", headers=other_auth_headers).json()
    assert body["has_active_goal"] is False


# ---------- /reset-goal ----------


def test_reset_goal_restarts_onboarding(client, onboarded_headers, db_session):
    response = client.put("/dashboard/reset-goal", headers=onboarded_headers)
    assert response.status_code == 200
    assert response.json() == {"message": "Goal reset successfully"}
    assert client.get("/auth/me", headers=onboarded_headers).json()["is_profile_complete"] is False
    assert db_session.query(Goal).filter(Goal.is_active.is_(True)).count() == 0
    assert client.get("/dashboard/goal-progress", headers=onboarded_headers).json()["has_active_goal"] is False


def test_reset_goal_leaves_other_users_alone(client, onboarded_headers, other_auth_headers):
    assert client.put("/dashboard/reset-goal", headers=other_auth_headers).status_code == 200
    assert client.get("/auth/me", headers=onboarded_headers).json()["is_profile_complete"] is True


# ---------- /extend-goal ----------


def test_extend_goal_moves_the_date_and_softens_the_deficit(client, onboarded_headers, db_session):
    before = client.get("/auth/me", headers=onboarded_headers).json()

    response = client.put("/dashboard/extend-goal", json={"extra_weeks": 2}, headers=onboarded_headers)
    assert response.status_code == 200, response.text
    assert response.json() == {"message": "Goal extended successfully"}

    after = client.get("/auth/me", headers=onboarded_headers).json()
    assert after["goal_period_weeks"] == 12
    # 5 kg over 12 instead of 10 weeks → smaller daily deficit → more calories.
    assert after["daily_calories_target"] > before["daily_calories_target"]

    progress = client.get("/dashboard/goal-progress", headers=onboarded_headers).json()
    assert progress["days_remaining"] == 84

    goal = db_session.query(Goal).filter(Goal.is_active.is_(True)).one()
    assert goal.is_extended is True
    assert goal.daily_calories == after["daily_calories_target"]


def test_extend_an_ended_goal_counts_from_today(client, onboarded_headers, db_session):
    goal = db_session.query(Goal).filter(Goal.is_active.is_(True)).one()
    goal.start_date = date.today() - timedelta(weeks=16)
    goal.target_date = date.today() - timedelta(weeks=6)
    db_session.commit()

    assert client.put("/dashboard/extend-goal", json={"extra_weeks": 2}, headers=onboarded_headers).status_code == 200
    progress = client.get("/dashboard/goal-progress", headers=onboarded_headers).json()
    assert progress["days_remaining"] == 14
    me = client.get("/auth/me", headers=onboarded_headers).json()
    assert me["goal_period_weeks"] == 18
    # 5 kg left over the 2 remaining weeks would be unsafe, but the 1200 kcal floor applies.
    assert me["daily_calories_target"] == 1200


def test_extend_after_reaching_the_target_stops_the_deficit(client, onboarded_headers):
    assert client.put("/users/profile", json={"weight_kg": 64}, headers=onboarded_headers).status_code == 200
    assert client.put("/dashboard/extend-goal", json={"extra_weeks": 2}, headers=onboarded_headers).status_code == 200
    me = client.get("/auth/me", headers=onboarded_headers).json()
    # Already below the 65 kg target: the new plan is plain maintenance (TDEE), no deficit.
    tdee = calculate_tdee(calculate_bmr(64, 165, 30, "female"), "moderately_active")
    assert me["daily_calories_target"] == tdee


def test_extend_a_maintain_goal_keeps_no_period(client, auth_headers):
    client.post("/onboarding/profile", json=VALID_PROFILE, headers=auth_headers)
    client.post("/onboarding/goal", json={"goal_type": "maintain_weight"}, headers=auth_headers)
    client.post("/onboarding/complete", headers=auth_headers)

    assert client.put("/dashboard/extend-goal", json={"extra_weeks": 2}, headers=auth_headers).status_code == 200
    assert client.get("/auth/me", headers=auth_headers).json()["goal_period_weeks"] is None
    assert client.get("/dashboard/goal-progress", headers=auth_headers).json()["days_remaining"] == 14 * 7


def test_extend_goal_without_goal_is_404(client, auth_headers):
    client.post("/onboarding/profile", json=VALID_PROFILE, headers=auth_headers)
    response = client.put("/dashboard/extend-goal", json={"extra_weeks": 2}, headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.parametrize("payload", [{}, {"extra_weeks": 0}, {"extra_weeks": -1}, {"extra_weeks": 53}, {"extra_weeks": "x"}])
def test_extend_goal_validation(client, onboarded_headers, payload):
    assert client.put("/dashboard/extend-goal", json=payload, headers=onboarded_headers).status_code == 422
