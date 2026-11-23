"""
Onboarding router for NutriFlow.
Endpoints: profile, goal, allergies, complete. All require authentication.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.onboarding import AllergiesData, GoalData, GoalResponse, ProfileData
from app.schemas.user import UserOut
from app.services import onboarding_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.post("/profile", response_model=UserOut, summary="Save basic profile info and activity level")
def save_profile(
    data: ProfileData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return onboarding_service.save_profile(db, current_user, data)


@router.post("/goal", response_model=GoalResponse, summary="Save goal and get calculated nutrition targets")
def save_goal(
    data: GoalData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return onboarding_service.save_goal(db, current_user, data)


@router.post("/allergies", response_model=UserOut, summary="Save food allergies")
def save_allergies(
    data: AllergiesData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return onboarding_service.save_allergies(db, current_user, data.food_allergies)


@router.post("/complete", response_model=UserOut, summary="Mark onboarding as complete and create first Goal")
def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return onboarding_service.complete_onboarding(db, current_user)
