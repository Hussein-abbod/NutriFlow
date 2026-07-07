"""Pydantic schemas for Goal."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from enum import Enum


class GoalType(str, Enum):
    GAIN_WEIGHT = "gain_weight"
    LOSE_WEIGHT = "lose_weight"
    MAINTAIN_WEIGHT = "maintain_weight"


class GoalCreate(BaseModel):
    """Create a new goal."""
    goal_type: GoalType
    start_weight: float = Field(..., gt=0)
    target_weight: float = Field(..., gt=0)
    start_date: date
    target_date: date
    daily_calories: Optional[float] = None
    daily_protein: Optional[float] = None
    daily_carbs: Optional[float] = None
    daily_fat: Optional[float] = None
    notes: Optional[str] = None


class GoalUpdate(BaseModel):
    """Update an existing goal."""
    goal_type: Optional[GoalType] = None
    target_weight: Optional[float] = Field(None, gt=0)
    target_date: Optional[date] = None
    daily_calories: Optional[float] = None
    daily_protein: Optional[float] = None
    daily_carbs: Optional[float] = None
    daily_fat: Optional[float] = None
    is_active: Optional[bool] = None
    is_extended: Optional[bool] = None
    notes: Optional[str] = None


class GoalOut(BaseModel):
    """Goal response."""
    id: int
    user_id: int
    goal_type: GoalType
    start_weight: float
    target_weight: float
    start_date: date
    target_date: date
    daily_calories: Optional[float] = None
    daily_protein: Optional[float] = None
    daily_carbs: Optional[float] = None
    daily_fat: Optional[float] = None
    is_active: bool
    is_extended: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
