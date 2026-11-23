"""
User profile service: profile edits, password change, allergies.
Every function acts on the authenticated user passed in — never on another user's row.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.goal import Goal
from app.models.user import User
from app.schemas.user import PasswordChangeRequest, ProfileUpdateRequest
from app.utils.calorie_calculator import calculate_nutrition_plan
from app.utils.security import hash_password, verify_password

_BODY_FIELDS = ("age", "height_cm", "weight_kg")


def _recalculate_targets(db: Session, user: User) -> None:
    """Recompute daily targets after a body-metric change (only for finished profiles)."""
    if not (user.is_profile_complete and user.goal_type and user.activity_level and user.gender):
        return
    plan = calculate_nutrition_plan(
        weight_kg=user.weight_kg,
        height_cm=user.height_cm,
        age=user.age,
        gender=user.gender,
        activity_level=user.activity_level.value,
        goal_type=user.goal_type.value,
        target_weight_kg=user.goal_weight_kg,
        period_weeks=user.goal_period_weeks,
    )
    user.daily_calories_target = plan.daily_calories
    user.daily_protein_target = plan.daily_protein
    user.daily_carbs_target = plan.daily_carbs
    user.daily_fat_target = plan.daily_fat

    active_goal = (
        db.query(Goal)
        .filter(Goal.user_id == user.id, Goal.is_active.is_(True))
        .first()
    )
    if active_goal:
        active_goal.daily_calories = plan.daily_calories
        active_goal.daily_protein = plan.daily_protein
        active_goal.daily_carbs = plan.daily_carbs
        active_goal.daily_fat = plan.daily_fat


def update_profile(db: Session, user: User, data: ProfileUpdateRequest) -> User:
    """Apply a partial profile update and recalculate targets if body metrics changed."""
    if data.full_name is not None:
        user.full_name = data.full_name

    body_changed = False
    for field in _BODY_FIELDS:
        new_value = getattr(data, field)
        if new_value is not None and new_value != getattr(user, field):
            setattr(user, field, new_value)
            body_changed = True

    if body_changed:
        _recalculate_targets(db, user)

    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, data: PasswordChangeRequest) -> None:
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )
    user.hashed_password = hash_password(data.new_password)
    db.commit()


def update_allergies(db: Session, user: User, allergies: list[str]) -> list[str]:
    user.food_allergies = allergies
    db.commit()
    db.refresh(user)
    return list(user.food_allergies or [])
