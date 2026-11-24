"""
Daily nutrition targets for a user's active goal.

Shared by profile edits (users) and goal extension (dashboard), so both spread the weight
still to change over the weeks that are actually left.
"""

import math
from datetime import date

from app.models.goal import Goal
from app.models.user import User
from app.utils.calorie_calculator import calculate_nutrition_plan


def _target_reached(goal_type: str, current_kg: float, target_kg: float) -> bool:
    if goal_type == "lose_weight":
        return current_kg <= target_kg
    if goal_type == "gain_weight":
        return current_kg >= target_kg
    return False


def apply_daily_targets(user: User, goal: Goal | None, today: date | None = None) -> None:
    """
    Recompute the daily calorie / macro targets of `user` (and its active `goal`) from the
    current body metrics. Once the target weight is reached there is no deficit or surplus.
    Does not commit.
    """
    day = today or date.today()
    goal_type = user.goal_type.value
    target_weight = user.goal_weight_kg
    period_weeks = user.goal_period_weeks
    if goal is not None:
        goal_type = goal.goal_type.value
        target_weight = goal.target_weight
        # After the period ended (until it is extended or reset) there are no weeks left;
        # use the whole period instead of cramming the rest into one week.
        if goal.target_date > day:
            period_weeks = max(1, math.ceil((goal.target_date - day).days / 7))
    if _target_reached(goal_type, user.weight_kg, target_weight):
        goal_type = "maintain_weight"

    plan = calculate_nutrition_plan(
        weight_kg=user.weight_kg,
        height_cm=user.height_cm,
        age=user.age,
        gender=user.gender,
        activity_level=user.activity_level.value,
        goal_type=goal_type,
        target_weight_kg=target_weight,
        period_weeks=period_weeks,
    )
    user.daily_calories_target = plan.daily_calories
    user.daily_protein_target = plan.daily_protein
    user.daily_carbs_target = plan.daily_carbs
    user.daily_fat_target = plan.daily_fat
    if goal is not None:
        goal.daily_calories = plan.daily_calories
        goal.daily_protein = plan.daily_protein
        goal.daily_carbs = plan.daily_carbs
        goal.daily_fat = plan.daily_fat
