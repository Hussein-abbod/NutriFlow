"""
Dashboard service: today's totals, the last 7 days, goal progress and goal actions.
Every query is scoped to the authenticated user passed in.
"""

import math
from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.food_log import FoodLog
from app.models.goal import Goal
from app.models.user import User
from app.schemas.dashboard import (
    DailyCalories,
    GoalProgressOut,
    MacroSummary,
    MealSummary,
    TodaySummaryOut,
)
from app.utils.calorie_calculator import calculate_nutrition_plan

# Fallbacks for users without calculated targets (same values the Flutter app assumed).
DEFAULT_CALORIES = 2000
DEFAULT_PROTEIN = 50
DEFAULT_CARBS = 250
DEFAULT_FAT = 65

# Share of the daily calorie target per meal.
MEAL_SHARES = {"breakfast": 0.25, "lunch": 0.35, "snack": 0.10, "dinner": 0.30}

WEEK_DAYS = 7


def _active_goal(db: Session, user: User) -> Goal | None:
    return (
        db.query(Goal)
        .filter(Goal.user_id == user.id, Goal.is_active.is_(True))
        .first()
    )


def _meal_name(log: FoodLog) -> str:
    return log.meal_type.value if hasattr(log.meal_type, "value") else str(log.meal_type)


def today_summary(db: Session, user: User, today: date | None = None) -> TodaySummaryOut:
    day = today or date.today()
    logs = db.query(FoodLog).filter(FoodLog.user_id == user.id, FoodLog.log_date == day).all()

    meal_calories = {meal: 0.0 for meal in MEAL_SHARES}
    for log in logs:
        meal = _meal_name(log)
        if meal in meal_calories:
            meal_calories[meal] += log.total_calories or 0

    daily_calories = user.daily_calories_target or DEFAULT_CALORIES
    return TodaySummaryOut(
        calories_consumed=sum(log.total_calories or 0 for log in logs),
        calories_target=daily_calories,
        protein=MacroSummary(
            consumed=sum(log.total_protein or 0 for log in logs),
            target=user.daily_protein_target or DEFAULT_PROTEIN,
        ),
        carbs=MacroSummary(
            consumed=sum(log.total_carbs or 0 for log in logs),
            target=user.daily_carbs_target or DEFAULT_CARBS,
        ),
        fat=MacroSummary(
            consumed=sum(log.total_fat or 0 for log in logs),
            target=user.daily_fat_target or DEFAULT_FAT,
        ),
        meals={
            meal: MealSummary(calories=meal_calories[meal], target=daily_calories * share)
            for meal, share in MEAL_SHARES.items()
        },
    )


def weekly_summary(db: Session, user: User, today: date | None = None) -> list[DailyCalories]:
    """Calories per day for the last 7 days (oldest first, today last, empty days = 0)."""
    end = today or date.today()
    start = end - timedelta(days=WEEK_DAYS - 1)
    logs = (
        db.query(FoodLog)
        .filter(FoodLog.user_id == user.id, FoodLog.log_date >= start, FoodLog.log_date <= end)
        .all()
    )
    totals = {start + timedelta(days=offset): 0.0 for offset in range(WEEK_DAYS)}
    for log in logs:
        totals[log.log_date] += log.total_calories or 0
    return [DailyCalories(date=day, calories=calories) for day, calories in sorted(totals.items())]


def goal_progress(db: Session, user: User, today: date | None = None) -> GoalProgressOut:
    goal = _active_goal(db, user)
    if not goal:
        return GoalProgressOut(has_active_goal=False)

    days_left = (goal.target_date - (today or date.today())).days
    return GoalProgressOut(
        has_active_goal=True,
        goal_type=goal.goal_type.value,
        start_weight=goal.start_weight,
        current_weight=user.weight_kg or goal.start_weight,
        target_weight=goal.target_weight,
        days_remaining=max(0, days_left),
        start_date=goal.start_date,
        target_date=goal.target_date,
    )


def reset_goal(db: Session, user: User) -> None:
    """Deactivate the active goal and send the user back through onboarding."""
    goal = _active_goal(db, user)
    if goal:
        goal.is_active = False
    user.is_profile_complete = False
    db.commit()


def _target_reached(goal_type: str, current_kg: float, target_kg: float) -> bool:
    if goal_type == "lose_weight":
        return current_kg <= target_kg
    if goal_type == "gain_weight":
        return current_kg >= target_kg
    return False


def extend_goal(db: Session, user: User, extra_weeks: int, today: date | None = None) -> None:
    """
    Push the target date back (from today if the goal already ended) and spread the weight
    that is still to change over the weeks that are actually left.
    """
    goal = _active_goal(db, user)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active goal found")

    day = today or date.today()
    goal.target_date = max(goal.target_date, day) + timedelta(weeks=extra_weeks)
    goal.is_extended = True

    goal_type = goal.goal_type.value
    if goal_type != "maintain_weight":
        # Maintain goals keep `goal_period_weeks = None` (see onboarding_service).
        user.goal_period_weeks = max(1, round((goal.target_date - goal.start_date).days / 7))
        if _target_reached(goal_type, user.weight_kg, goal.target_weight):
            goal_type = "maintain_weight"

    plan = calculate_nutrition_plan(
        weight_kg=user.weight_kg,
        height_cm=user.height_cm,
        age=user.age,
        gender=user.gender,
        activity_level=user.activity_level.value,
        goal_type=goal_type,
        target_weight_kg=goal.target_weight,
        period_weeks=max(1, math.ceil((goal.target_date - day).days / 7)),
    )
    user.daily_calories_target = goal.daily_calories = plan.daily_calories
    user.daily_protein_target = goal.daily_protein = plan.daily_protein
    user.daily_carbs_target = goal.daily_carbs = plan.daily_carbs
    user.daily_fat_target = goal.daily_fat = plan.daily_fat
    db.commit()
