"""Smoke tests proving external services are mocked and food-log ownership is enforced."""

from datetime import date

from app.models.food_log import FoodLog, FoodLogItem, LogMethod, MealType


def test_text_search_uses_mocked_usda(client, auth_headers):
    response = client.post(
        "/food-log/text",
        json={"query": "rice", "meal_type": "lunch"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()[0]["food_name"] == "rice (USDA)"


def test_user_cannot_delete_another_users_food_item(client, auth_headers, other_auth_headers, db_session):
    alice_id = client.get("/auth/me", headers=auth_headers).json()["id"]
    log = FoodLog(user_id=alice_id, meal_type=MealType.LUNCH, log_date=date(2026, 11, 23), log_method=LogMethod.TEXT)
    log.items.append(FoodLogItem(food_name="Rice", calories=130))
    db_session.add(log)
    db_session.commit()
    item_id = log.items[0].id

    # 404 (not 403): other users' item ids must not be distinguishable from missing ones.
    assert client.delete(f"/food-log/item/{item_id}", headers=other_auth_headers).status_code == 404
    assert db_session.get(FoodLogItem, item_id) is not None
