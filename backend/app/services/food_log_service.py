"""
Food-log service: saving meals with post-meal AI advice, reading one day's logs and deleting
items. Every query is scoped to the authenticated user.
"""

import json
from datetime import date, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.food_log import FoodLog, FoodLogItem, LogMethod, MealType
from app.models.user import User
from app.schemas.food_log import FoodLogOut, FoodSubmitRequest, TodayLogsOut
from app.services import advice_agent

# Fallbacks for users without calculated targets (same values the Flutter app assumed).
DEFAULT_CALORIES_TARGET = 2000
DEFAULT_PROTEIN_TARGET = 50

MEALS = ("breakfast", "lunch", "snack", "dinner")


def _apply_totals(log: FoodLog) -> None:
    log.total_calories = round(sum(item.calories or 0 for item in log.items), 2)
    log.total_protein = round(sum(item.protein or 0 for item in log.items), 2)
    log.total_carbs = round(sum(item.carbs or 0 for item in log.items), 2)
    log.total_fat = round(sum(item.fat or 0 for item in log.items), 2)


def _day_logs(db: Session, user: User, day: date) -> list[FoodLog]:
    return (
        db.query(FoodLog)
        .filter(FoodLog.user_id == user.id, FoodLog.log_date == day)
        .order_by(FoodLog.id)
        .all()
    )


def _enum_value(value: object) -> str:
    return str(getattr(value, "value", value))


def _allergies(user: User) -> list[str]:
    allergies = user.food_allergies or []
    if isinstance(allergies, str):
        try:
            allergies = json.loads(allergies)
        except ValueError:
            return []
    return [str(allergy) for allergy in allergies] if isinstance(allergies, list) else []


def _meal_advice(db: Session, user: User, log: FoodLog) -> str:
    day_logs = _day_logs(db, user, log.log_date)
    eaten_calories = sum(day_log.total_calories or 0 for day_log in day_logs)
    eaten_protein = sum(day_log.total_protein or 0 for day_log in day_logs)
    return advice_agent.generate_meal_advice(
        meal_type=_enum_value(log.meal_type),
        food_items_summary=", ".join(f"{item.food_name} ({item.quantity}{item.unit})" for item in log.items),
        calories=log.total_calories,
        protein=log.total_protein,
        carbs=log.total_carbs,
        fat=log.total_fat,
        remaining_calories=max(0, (user.daily_calories_target or DEFAULT_CALORIES_TARGET) - eaten_calories),
        remaining_protein=max(0, (user.daily_protein_target or DEFAULT_PROTEIN_TARGET) - eaten_protein),
        goal_type=_enum_value(user.goal_type or "maintain_weight"),
        allergies=_allergies(user),
    )


def submit_log(db: Session, user: User, data: FoodSubmitRequest) -> FoodLog:
    """Save the meal first, then add the AI advice (a slow AI call never loses the meal)."""
    log = FoodLog(
        user_id=user.id,
        meal_type=MealType(data.meal_type),
        log_date=data.log_date or date.today(),
        log_time=datetime.now().time(),
        log_method=LogMethod(data.log_method),
        items=[FoodLogItem(**item.model_dump()) for item in data.items],
    )
    _apply_totals(log)
    db.add(log)
    db.commit()

    log.ai_advice = _meal_advice(db, user, log)
    db.commit()
    db.refresh(log)
    return log


def logs_for_day(db: Session, user: User, day: date) -> TodayLogsOut:
    result = TodayLogsOut(date=day)
    for log in _day_logs(db, user, day):
        meal = _enum_value(log.meal_type)
        if meal in MEALS:
            getattr(result, meal).append(FoodLogOut.model_validate(log))
        result.total_calories += log.total_calories or 0
        result.total_protein += log.total_protein or 0
        result.total_carbs += log.total_carbs or 0
        result.total_fat += log.total_fat or 0

    result.total_calories = round(result.total_calories, 2)
    result.total_protein = round(result.total_protein, 2)
    result.total_carbs = round(result.total_carbs, 2)
    result.total_fat = round(result.total_fat, 2)
    return result


def delete_item(db: Session, user: User, item_id: int) -> None:
    """
    Delete one of the user's items. Someone else's item answers 404, exactly like a missing
    one, so ids of other users cannot be probed. A meal left without items is removed.
    """
    item = (
        db.query(FoodLogItem)
        .join(FoodLog)
        .filter(FoodLogItem.id == item_id, FoodLog.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")

    log = item.food_log
    log.items.remove(item)
    if log.items:
        _apply_totals(log)
    else:
        db.delete(log)
    db.commit()
