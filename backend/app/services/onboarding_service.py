"""
Onboarding service: saves each onboarding step for the authenticated user and
creates the first active Goal when onboarding is completed.
"""

from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.goal import Goal, GoalType as GoalTypeEnum
from app.models.user import User
from app.schemas.onboarding import (
    GoalData,
    GoalResponse,
    GoalType,
    NutritionTargets,
    ProfileData,
)
from app.utils.calorie_calculator import (
    NutritionPlan,
    calculate_nutrition_plan,
    validate_goal_feasibility,
)

MAINTAIN_DEFAULT_WEEKS = 12


def _bad_request(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def _check_goal_direction(goal_type: GoalType, current_kg: float, target_kg: float) -> None:
    """A lose goal needs a lower target, a gain goal a higher one."""
    if goal_type == GoalType.LOSE_WEIGHT and target_kg >= current_kg:
        raise _bad_request(
            f"To lose weight, your target must be below your current weight ({current_kg:g} kg)."
        )
    if goal_type == GoalType.GAIN_WEIGHT and target_kg <= current_kg:
        raise _bad_request(
            f"To gain weight, your target must be above your current weight ({current_kg:g} kg)."
        )


def _apply_plan(user: User, plan: NutritionPlan) -> NutritionTargets:
    user.daily_calories_target = plan.daily_calories
    user.daily_protein_target = plan.daily_protein
    user.daily_carbs_target = plan.daily_carbs
    user.daily_fat_target = plan.daily_fat
    return NutritionTargets(
        daily_calories=plan.daily_calories,
        daily_protein=plan.daily_protein,
        daily_carbs=plan.daily_carbs,
        daily_fat=plan.daily_fat,
    )


def save_profile(db: Session, user: User, data: ProfileData) -> User:
    """Step 2+3: basic info and activity level."""
    user.full_name = data.full_name
    user.age = data.age
    user.gender = data.gender
    user.height_cm = data.height_cm
    user.weight_kg = data.weight_kg
    user.activity_level = data.activity_level
    db.commit()
    db.refresh(user)
    return user


def save_goal(db: Session, user: User, data: GoalData) -> GoalResponse:
    """Step 4: validate goal feasibility and calculate daily targets."""
    if not all([user.age, user.gender, user.height_cm, user.weight_kg, user.activity_level]):
        raise _bad_request("Please complete your profile information first.")

    common = dict(
        weight_kg=user.weight_kg,
        height_cm=user.height_cm,
        age=user.age,
        gender=user.gender,
        activity_level=user.activity_level.value,
    )

    if data.goal_type == GoalType.MAINTAIN_WEIGHT:
        user.goal_type = data.goal_type
        user.goal_weight_kg = user.weight_kg
        user.goal_period_weeks = None
        targets = _apply_plan(
            user, calculate_nutrition_plan(**common, goal_type=data.goal_type.value)
        )
        db.commit()
        return GoalResponse(
            is_feasible=True,
            message="Maintain your current weight — great choice!",
            targets=targets,
        )

    if not data.target_weight_kg or not data.goal_period_weeks:
        raise _bad_request("Target weight and goal period are required for gain/lose goals.")
    _check_goal_direction(data.goal_type, user.weight_kg, data.target_weight_kg)

    validation = validate_goal_feasibility(
        current_weight_kg=user.weight_kg,
        target_weight_kg=data.target_weight_kg,
        period_weeks=data.goal_period_weeks,
    )
    if not validation.is_feasible:
        return GoalResponse(
            is_feasible=False,
            message=validation.message,
            suggested_weeks=validation.suggested_weeks,
        )

    user.goal_type = data.goal_type
    user.goal_weight_kg = data.target_weight_kg
    user.goal_period_weeks = data.goal_period_weeks
    targets = _apply_plan(
        user,
        calculate_nutrition_plan(
            **common,
            goal_type=data.goal_type.value,
            target_weight_kg=data.target_weight_kg,
            period_weeks=data.goal_period_weeks,
        ),
    )
    db.commit()
    return GoalResponse(is_feasible=True, message=validation.message, targets=targets)


def save_allergies(db: Session, user: User, allergies: list[str]) -> User:
    """Step 5: food allergies."""
    user.food_allergies = allergies
    db.commit()
    db.refresh(user)
    return user


def complete_onboarding(db: Session, user: User) -> User:
    """Step 6: mark the profile complete and create the (single) active Goal."""
    required = [
        user.full_name,
        user.age,
        user.gender,
        user.height_cm,
        user.weight_kg,
        user.activity_level,
        user.goal_type,
        user.daily_calories_target,
    ]
    if not all(required):
        raise _bad_request("Please complete all onboarding steps before finishing.")

    # Re-onboarding after a goal reset must not leave two active goals behind.
    db.query(Goal).filter(Goal.user_id == user.id, Goal.is_active.is_(True)).update(
        {Goal.is_active: False}
    )

    start = date.today()
    weeks = user.goal_period_weeks or MAINTAIN_DEFAULT_WEEKS
    db.add(
        Goal(
            user_id=user.id,
            goal_type=GoalTypeEnum(user.goal_type.value),
            start_weight=user.weight_kg,
            target_weight=user.goal_weight_kg or user.weight_kg,
            start_date=start,
            target_date=start + timedelta(weeks=weeks),
            daily_calories=user.daily_calories_target,
            daily_protein=user.daily_protein_target,
            daily_carbs=user.daily_carbs_target,
            daily_fat=user.daily_fat_target,
            is_active=True,
            notes="Initial goal from onboarding",
        )
    )
    user.is_profile_complete = True
    db.commit()
    db.refresh(user)
    return user
