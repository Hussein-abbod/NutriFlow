"""
Meal model placeholder for NutriFlow.

Meal-level data is currently captured through FoodLog + FoodLogItem.
This module is reserved for future meal-template or saved-meal features.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class Meal(Base):
    """Saved / template meal (future feature)."""

    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)

    total_calories = Column(Float, nullable=True, default=0)
    total_protein = Column(Float, nullable=True, default=0)
    total_carbs = Column(Float, nullable=True, default=0)
    total_fat = Column(Float, nullable=True, default=0)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Meal id={self.id} name={self.name}>"
