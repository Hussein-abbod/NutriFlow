"""
Pydantic schemas for Meal (placeholder for future saved-meal feature).
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MealCreate(BaseModel):
    """Create a saved meal template."""
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    total_calories: Optional[float] = Field(None, ge=0)
    total_protein: Optional[float] = Field(None, ge=0)
    total_carbs: Optional[float] = Field(None, ge=0)
    total_fat: Optional[float] = Field(None, ge=0)


class MealOut(BaseModel):
    """Meal response."""
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    total_calories: Optional[float] = None
    total_protein: Optional[float] = None
    total_carbs: Optional[float] = None
    total_fat: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}
