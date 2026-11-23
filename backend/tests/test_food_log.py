"""Food-log meals: POST /food-log/submit, GET /today and /history, DELETE /item/{id}."""

from datetime import date, timedelta

import pytest

from app.models.food_log import FoodLog, FoodLogItem, LogMethod, MealType
from app.services import advice_agent

RICE = {
    "food_name": "Rice, white, cooked",
    "quantity": 200,
    "unit": "g",
    "calories": 260,
    "protein": 5.4,
    "carbs": 56,
    "fat": 0.6,
}
EGG = {
    "food_name": "Egg, whole, raw",
    "quantity": 2,
    "unit": "large egg",
    "calories": 172,
    "protein": 15,
    "carbs": 1,
    "fat": 11.4,
}


def submit(client, headers, items=None, **extra):
    payload = {"meal_type": "breakfast", "log_method": "text", "items": items or [RICE], **extra}
    return client.post("/food-log/submit", json=payload, headers=headers)


def user_id(client, headers) -> int:
    return client.get("/auth/me", headers=headers).json()["id"]


# ---------- Auth ----------


@pytest.mark.parametrize(
    "method, path, body",
    [
        ("post", "/food-log/submit", {"meal_type": "lunch", "items": [RICE]}),
        ("get", "/food-log/today", None),
        ("get", "/food-log/history?log_date=2026-11-20", None),
        ("delete", "/food-log/item/1", None),
    ],
)
def test_meal_endpoints_require_auth(client, method, path, body):
    kwargs = {"json": body} if body is not None else {}
    assert getattr(client, method)(path, **kwargs).status_code == 401


# ---------- POST /submit ----------


def test_submit_saves_the_meal_with_totals_and_advice(client, onboarded_headers):
    response = submit(client, onboarded_headers, items=[RICE, EGG], log_method="barcode")

    assert response.status_code == 200
    log = response.json()
    assert log["meal_type"] == "breakfast"
    assert log["log_method"] == "barcode"
    assert log["log_date"] == date.today().isoformat()
    assert log["total_calories"] == 432
    assert log["total_protein"] == 20.4
    assert log["total_carbs"] == 57
    assert log["total_fat"] == 12
    assert [item["food_name"] for item in log["items"]] == ["Rice, white, cooked", "Egg, whole, raw"]
    target = round(client.get("/auth/me", headers=onboarded_headers).json()["daily_calories_target"])
    assert log["ai_advice"] == (
        f"You logged breakfast with 432 kcal. You have {target - 432} kcal remaining today. "
        "Keep tracking your meals to stay on target!"
    )


def test_advice_uses_the_logged_day_and_the_users_goal(client, onboarded_headers, monkeypatch):
    advice_args = {}

    def fake_advice(**kwargs):
        advice_args.update(kwargs)
        return "Nice meal!"

    monkeypatch.setattr(advice_agent, "generate_meal_advice", fake_advice)
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    assert submit(client, onboarded_headers, log_date=date.today().isoformat()).status_code == 200
    assert submit(client, onboarded_headers, items=[EGG], log_date=yesterday, meal_type="dinner").status_code == 200

    target = client.get("/auth/me", headers=onboarded_headers).json()["daily_calories_target"]
    assert advice_args["meal_type"] == "dinner"
    assert advice_args["goal_type"] == "lose_weight"
    assert advice_args["food_items_summary"] == "Egg, whole, raw (2.0large egg)"
    # Only yesterday's 172 kcal count, not today's rice.
    assert advice_args["remaining_calories"] == pytest.approx(target - 172)


def test_submitted_meal_updates_the_dashboard(client, onboarded_headers):
    submit(client, onboarded_headers)
    today = client.get("/dashboard/today", headers=onboarded_headers).json()
    assert today["calories_consumed"] == 260
    assert today["meals"]["breakfast"]["calories"] == 260


@pytest.mark.parametrize(
    "override",
    [
        {"items": []},
        {"items": [RICE] * 51},
        {"meal_type": "brunch"},
        {"meal_type": "Breakfast"},
        {"log_method": "fax"},
        {"log_date": (date.today() + timedelta(days=8)).isoformat()},
        {"log_date": (date.today() - timedelta(days=400)).isoformat()},
        {"log_date": "yesterday"},
        {"items": [{**RICE, "quantity": 0}]},
        {"items": [{**RICE, "quantity": 10_001}]},
        {"items": [{**RICE, "calories": -1}]},
        {"items": [{**RICE, "calories": 100_001}]},
        {"items": [{**RICE, "protein": 10_001}]},
        {"items": [{**RICE, "sodium": -5}]},
        {"items": [{**RICE, "food_name": "   "}]},
        {"items": [{**RICE, "food_name": "x" * 256}]},
        {"items": [{**RICE, "unit": ""}]},
        {"items": [{**RICE, "unit": "u" * 51}]},
        {"items": [{**RICE, "thumbnail_url": "javascript:alert(1)"}]},
    ],
)
def test_submit_validation(client, auth_headers, override):
    payload = {"meal_type": "breakfast", "log_method": "text", "items": [RICE], **override}
    assert client.post("/food-log/submit", json=payload, headers=auth_headers).status_code == 422


def test_submit_rejects_non_finite_numbers(client, auth_headers):
    body = '{"meal_type": "lunch", "items": [{"food_name": "Rice", "calories": NaN}]}'
    response = client.post(
        "/food-log/submit", content=body, headers={**auth_headers, "Content-Type": "application/json"}
    )
    assert response.status_code == 422
    [error] = response.json()["detail"]
    assert error["loc"] == ["body", "items", 0, "calories"]
    assert set(error) == {"loc", "msg", "type"}


# ---------- GET /today and /history ----------


def test_day_logs_are_grouped_by_meal_with_rounded_totals(client, auth_headers):
    submit(client, auth_headers, items=[{**RICE, "calories": 100.333}])
    submit(client, auth_headers, items=[{**EGG, "calories": 50.333}], meal_type="snack")
    submit(client, auth_headers, items=[RICE], meal_type="breakfast")

    for path in ("/food-log/today", f"/food-log/history?log_date={date.today().isoformat()}"):
        body = client.get(path, headers=auth_headers).json()
        assert body["date"] == date.today().isoformat()
        assert [log["total_calories"] for log in body["breakfast"]] == [100.33, 260]
        assert [log["total_calories"] for log in body["snack"]] == [50.33]
        assert body["lunch"] == [] and body["dinner"] == []
        assert body["total_calories"] == 410.66


def test_history_only_returns_the_requested_day(client, auth_headers):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    submit(client, auth_headers, log_date=yesterday)

    assert client.get(f"/food-log/history?log_date={yesterday}", headers=auth_headers).json()["total_calories"] == 260
    assert client.get("/food-log/today", headers=auth_headers).json()["total_calories"] == 0


def test_users_never_see_each_others_logs(client, auth_headers, other_auth_headers):
    submit(client, auth_headers)
    assert client.get("/food-log/today", headers=other_auth_headers).json()["breakfast"] == []


@pytest.mark.parametrize("query", ["", "?log_date=", "?log_date=2026-13-01", "?log_date=today"])
def test_history_requires_a_valid_date(client, auth_headers, query):
    assert client.get(f"/food-log/history{query}", headers=auth_headers).status_code == 422


# ---------- DELETE /item/{id} ----------


def test_delete_item_recalculates_the_meal_totals(client, auth_headers):
    log = submit(client, auth_headers, items=[RICE, EGG]).json()
    rice_id = log["items"][0]["id"]

    assert client.delete(f"/food-log/item/{rice_id}", headers=auth_headers).status_code == 204

    [breakfast] = client.get("/food-log/today", headers=auth_headers).json()["breakfast"]
    assert [item["food_name"] for item in breakfast["items"]] == ["Egg, whole, raw"]
    assert breakfast["total_calories"] == 172
    assert breakfast["total_protein"] == 15


def test_deleting_the_last_item_removes_the_meal(client, auth_headers, db_session):
    log = submit(client, auth_headers).json()

    assert client.delete(f"/food-log/item/{log['items'][0]['id']}", headers=auth_headers).status_code == 204

    assert client.get("/food-log/today", headers=auth_headers).json()["breakfast"] == []
    assert db_session.get(FoodLog, log["id"]) is None


def test_someone_elses_item_is_not_found_and_kept(client, auth_headers, other_auth_headers, db_session):
    log = FoodLog(
        user_id=user_id(client, auth_headers),
        meal_type=MealType.LUNCH,
        log_date=date.today(),
        log_method=LogMethod.TEXT,
        total_calories=130,
    )
    log.items.append(FoodLogItem(food_name="Rice", calories=130))
    db_session.add(log)
    db_session.commit()
    item_id = log.items[0].id

    response = client.delete(f"/food-log/item/{item_id}", headers=other_auth_headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "Item not found."}
    db_session.expire_all()
    assert db_session.get(FoodLogItem, item_id) is not None


def test_deleting_a_missing_item_is_404(client, auth_headers):
    assert client.delete("/food-log/item/999", headers=auth_headers).status_code == 404


@pytest.mark.parametrize("item_id", ["0", "-1", "abc"])
def test_delete_validates_the_item_id(client, auth_headers, item_id):
    assert client.delete(f"/food-log/item/{item_id}", headers=auth_headers).status_code == 422


# ---------- Rate limit ----------


def test_submit_is_rate_limited(client, auth_headers, rate_limited):
    # Every submit asks the AI for advice, so it shares the AI limit.
    statuses = [submit(client, auth_headers).status_code for _ in range(21)]
    assert statuses[:20] == [200] * 20
    assert statuses[20] == 429
