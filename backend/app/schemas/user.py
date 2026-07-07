"""Pydantic schemas for User."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


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
    """Registration — email + password only."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    """Login credentials."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Update user profile (all optional)."""
    full_name: Optional[str] = Field(None, max_length=255)
    age: Optional[int] = Field(None, ge=13, le=120)
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    height_cm: Optional[float] = Field(None, gt=0, le=300)
    weight_kg: Optional[float] = Field(None, gt=0, le=500)
    activity_level: Optional[ActivityLevel] = None
    goal_type: Optional[GoalType] = None
    goal_weight_kg: Optional[float] = Field(None, gt=0, le=500)
    goal_period_weeks: Optional[int] = Field(None, ge=1, le=104)
    daily_calories_target: Optional[float] = Field(None, ge=0)
    daily_protein_target: Optional[float] = Field(None, ge=0)
    daily_carbs_target: Optional[float] = Field(None, ge=0)
    daily_fat_target: Optional[float] = Field(None, ge=0)
    food_allergies: Optional[List[str]] = None


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


# ---------- Token schemas ----------


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str
