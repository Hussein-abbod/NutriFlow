"""Pydantic schemas for User, auth and token payloads."""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, EmailStr, model_validator

from app.schemas.common import (
    Age,
    AllergyList,
    ExistingPassword,
    FullName,
    HeightCm,
    NewPassword,
    WeightKg,
)


class ActivityLevel(str, Enum):
    SEDENTARY = "sedentary"
    LIGHTLY_ACTIVE = "lightly_active"
    MODERATELY_ACTIVE = "moderately_active"
    VERY_ACTIVE = "very_active"
    EXTRA_ACTIVE = "extra_active"


class GoalType(str, Enum):
    GAIN_WEIGHT = "gain_weight"
    LOSE_WEIGHT = "lose_weight"
    MAINTAIN_WEIGHT = "maintain_weight"


# ---------- Request schemas ----------


class UserCreate(BaseModel):
    """Registration — email + password, optional full name (asked on the sign-up form)."""
    email: EmailStr
    password: NewPassword
    full_name: Optional[FullName] = None


class UserLogin(BaseModel):
    """Login credentials."""
    email: EmailStr
    password: ExistingPassword


class ProfileUpdateRequest(BaseModel):
    """Partial profile update from the Profile tab."""
    full_name: Optional[FullName] = None
    age: Optional[Age] = None
    height_cm: Optional[HeightCm] = None
    weight_kg: Optional[WeightKg] = None


class PasswordChangeRequest(BaseModel):
    current_password: ExistingPassword
    new_password: NewPassword

    @model_validator(mode="after")
    def _new_password_differs(self) -> "PasswordChangeRequest":
        if self.new_password == self.current_password:
            raise ValueError("New password must be different from the current one.")
        return self


class AllergiesRequest(BaseModel):
    allergies: AllergyList


class RefreshTokenRequest(BaseModel):
    """Body for native clients. Web clients send the refresh token as a cookie instead."""
    refresh_token: Optional[str] = None


# ---------- Response schemas ----------


class UserOut(BaseModel):
    """User response — never includes hashed_password."""
    id: int
    email: str
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[ActivityLevel] = None
    goal_type: Optional[GoalType] = None
    goal_weight_kg: Optional[float] = None
    goal_period_weeks: Optional[int] = None
    daily_calories_target: Optional[float] = None
    daily_protein_target: Optional[float] = None
    daily_carbs_target: Optional[float] = None
    daily_fat_target: Optional[float] = None
    food_allergies: Optional[List[str]] = None
    is_profile_complete: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """
    Access token for the client to keep in memory.
    `refresh_token` is only present for native clients; web clients get it as a cookie.
    """
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None


class RegisterResponse(TokenResponse):
    """Registration response: the new user's basics + tokens."""
    id: int
    email: str
    full_name: Optional[str] = None
    is_profile_complete: bool = False


class AllergiesOut(BaseModel):
    message: str
    allergies: List[str]


class MessageOut(BaseModel):
    message: str


class PasswordChangeOut(TokenResponse):
    """
    A password change ends every other session; this device gets a fresh token pair
    (web: refresh cookie, native: body) so it stays signed in.
    """
    message: str
