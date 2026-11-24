"""
User profile service: profile edits, password change, allergies.
Every function acts on the authenticated user passed in — never on another user's row.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.goal import Goal
from app.models.user import User
from app.schemas.user import PasswordChangeRequest, ProfileUpdateRequest
from app.services.auth_service import TokenPair, generate_tokens
from app.services.targets_service import apply_daily_targets
from app.utils.security import hash_password, verify_password

_BODY_FIELDS = ("age", "height_cm", "weight_kg")


def _recalculate_targets(db: Session, user: User) -> None:
    """Recompute daily targets after a body-metric change (only for finished profiles)."""
    if not (user.is_profile_complete and user.goal_type and user.activity_level and user.gender):
        return
    active_goal = (
        db.query(Goal)
        .filter(Goal.user_id == user.id, Goal.is_active.is_(True))
        .first()
    )
    apply_daily_targets(user, active_goal)


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


def change_password(db: Session, user: User, data: PasswordChangeRequest) -> TokenPair:
    """
    Set a new password and end every session (all tokens carry the old token version).
    Returns a new token pair for the device that made the change.
    """
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )
    user.hashed_password = hash_password(data.new_password)
    user.token_version = (user.token_version or 0) + 1
    db.commit()
    db.refresh(user)
    return generate_tokens(user)


def update_allergies(db: Session, user: User, allergies: list[str]) -> list[str]:
    user.food_allergies = allergies
    db.commit()
    db.refresh(user)
    return list(user.food_allergies or [])
