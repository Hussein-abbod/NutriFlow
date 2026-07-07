"""
Users router for NutriFlow.
Placeholder for future user-profile management endpoints.
"""

from fastapi import APIRouter, Depends
from app.models.user import User
from app.schemas.user import UserOut
from app.utils.security import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/profile",
    response_model=UserOut,
    summary="Get current user profile",
)
def get_profile(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's full profile."""
    return current_user

from typing import List
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.security import verify_password, hash_password

class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class AllergiesRequest(BaseModel):
    allergies: List[str]

@router.put("/profile", response_model=UserOut)
def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update basic profile info and recalculate daily targets if needed."""
    recalc_needed = False
    
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.age is not None and data.age != current_user.age:
        current_user.age = data.age
        recalc_needed = True
    if data.height_cm is not None and data.height_cm != current_user.height_cm:
        current_user.height_cm = data.height_cm
        recalc_needed = True
    if data.weight_kg is not None and data.weight_kg != current_user.weight_kg:
        current_user.weight_kg = data.weight_kg
        recalc_needed = True
        
    if recalc_needed and current_user.goal_type and current_user.is_profile_complete:
        from app.utils.calorie_calculator import calculate_daily_targets
        from app.models.goal import Goal
        try:
            targets = calculate_daily_targets(
                weight_kg=current_user.weight_kg,
                height_cm=current_user.height_cm,
                age=current_user.age,
                gender=current_user.gender,
                activity_level=current_user.activity_level.value,
                goal_type=current_user.goal_type.value,
                target_weight_kg=current_user.goal_weight_kg,
                goal_period_weeks=current_user.goal_period_weeks
            )
            current_user.daily_calories_target = targets["calories"]
            current_user.daily_protein_target = targets["protein"]
            current_user.daily_carbs_target = targets["carbs"]
            current_user.daily_fat_target = targets["fat"]
            
            active_goal = db.query(Goal).filter(
                Goal.user_id == current_user.id, Goal.is_active == True
            ).first()
            if active_goal:
                active_goal.daily_calories = targets["calories"]
                active_goal.daily_protein = targets["protein"]
                active_goal.daily_carbs = targets["carbs"]
                active_goal.daily_fat = targets["fat"]
        except ValueError:
            pass # Ignore calculation errors on simple profile update
            
    db.commit()
    db.refresh(current_user)
    return current_user

from fastapi import HTTPException, status

@router.put("/password")
def change_password(
    data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change user password."""
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
        
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.put("/allergies")
def update_allergies(
    data: AllergiesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update food allergies."""
    current_user.food_allergies = data.allergies
    db.commit()
    return {"message": "Allergies updated successfully", "allergies": current_user.food_allergies}
