"""Pydantic schemas for Onboarding endpoints."""

from pydantic import BaseModel, Field
from typing import Optional, List
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


class ProfileData(BaseModel):
    """Step 2+3: Basic info + activity level."""
    full_name: str = Field(..., min_length=1, max_length=255)
    age: int = Field(..., ge=10, le=100)
    gender: str = Field(..., pattern="^(male|female)$")
    height_cm: float = Field(..., gt=0, le=300)
    weight_kg: float = Field(..., gt=0, le=500)
    activity_level: ActivityLevel


class GoalData(BaseModel):
    """Step 4: Goal selection."""
    goal_type: GoalType
    target_weight_kg: Optional[float] = Field(None, gt=0, le=500)
    goal_period_weeks: Optional[int] = Field(None, ge=1, le=104)


class AllergiesData(BaseModel):
    """Step 5: Food allergies."""
    food_allergies: List[str] = Field(default_factory=list)


# ---------- Response schemas ----------


class NutritionTargets(BaseModel):
    """Calculated daily nutrition targets."""
    daily_calories: float
    daily_protein: float
    daily_carbs: float
    daily_fat: float


class GoalResponse(BaseModel):
    """Response from goal endpoint with validation + targets."""
    is_feasible: bool
    message: str
    suggested_weeks: Optional[int] = None
    targets: Optional[NutritionTargets] = None


class RegisterWithTokens(BaseModel):
    """Combined registration response: user data + tokens."""
    id: int
    email: str
    full_name: Optional[str] = None
    is_profile_complete: bool = False
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
