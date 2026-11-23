"""Pydantic schemas for Onboarding endpoints."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import Age, AllergyList, FullName, HeightCm, WeightKg


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
    full_name: FullName
    age: Age
    gender: str = Field(..., pattern="^(male|female)$")
    height_cm: HeightCm
    weight_kg: WeightKg
    activity_level: ActivityLevel


class GoalData(BaseModel):
    """Step 4: Goal selection."""
    goal_type: GoalType
    target_weight_kg: Optional[WeightKg] = None
    goal_period_weeks: Optional[int] = Field(None, ge=1, le=104)


class AllergiesData(BaseModel):
    """Step 5: Food allergies."""
    food_allergies: AllergyList = Field(default_factory=list)


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

