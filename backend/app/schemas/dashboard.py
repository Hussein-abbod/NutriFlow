"""Pydantic schemas for the Dashboard endpoints."""

from datetime import date
from typing import Dict

from pydantic import BaseModel, Field

MAX_EXTRA_WEEKS = 52


class MacroSummary(BaseModel):
    consumed: float
    target: float


class MealSummary(BaseModel):
    calories: float
    target: float


class TodaySummaryOut(BaseModel):
    calories_consumed: float
    calories_target: float
    protein: MacroSummary
    carbs: MacroSummary
    fat: MacroSummary
    meals: Dict[str, MealSummary]


class DailyCalories(BaseModel):
    date: date
    calories: float


class GoalProgressOut(BaseModel):
    has_active_goal: bool
    goal_type: str = ""
    start_weight: float = 0
    current_weight: float = 0
    target_weight: float = 0
    days_remaining: int = 0
    start_date: date | None = None
    target_date: date | None = None


class ExtendGoalRequest(BaseModel):
    extra_weeks: int = Field(..., ge=1, le=MAX_EXTRA_WEEKS)


class MessageOut(BaseModel):
    message: str
