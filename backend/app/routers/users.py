"""
Users router for NutriFlow: profile, password and allergies of the current user.
"""

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.limiter import limiter
from app.models.user import User
from app.schemas.user import (
    AllergiesOut,
    AllergiesRequest,
    PasswordChangeOut,
    PasswordChangeRequest,
    ProfileUpdateRequest,
    UserOut,
)
from app.services import user_service
from app.utils.security import get_current_user
from app.utils.token_transport import deliver_tokens

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserOut, summary="Get current user profile")
def get_profile(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's full profile."""
    return current_user


@router.put("/profile", response_model=UserOut, summary="Update basic profile info")
def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update name / body metrics and recalculate daily targets when needed."""
    return user_service.update_profile(db, current_user, data)


@router.put("/password", response_model=PasswordChangeOut, summary="Change password")
@limiter.limit("5/minute")
def change_password(
    request: Request,
    response: Response,
    data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the password; other sessions end and this device gets new tokens."""
    tokens = user_service.change_password(db, current_user, data)
    return {"message": "Password changed successfully", **deliver_tokens(request, response, tokens)}


@router.put("/allergies", response_model=AllergiesOut, summary="Update food allergies")
def update_allergies(
    data: AllergiesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allergies = user_service.update_allergies(db, current_user, data.allergies)
    return AllergiesOut(message="Allergies updated successfully", allergies=allergies)
