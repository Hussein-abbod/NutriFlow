"""FoodLog and FoodLogItem models for NutriFlow."""

from sqlalchemy import (
    Column, Integer, Float, String, Text, Date, Time, DateTime,
    ForeignKey, Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class MealType(str, enum.Enum):
    """Type of meal."""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    SNACK = "snack"
    DINNER = "dinner"


class LogMethod(str, enum.Enum):
    """How the food was logged."""
    TEXT = "text"
    BARCODE = "barcode"
    IMAGE = "image"


class FoodLog(Base):
    """A single meal-log entry for a user."""

    __tablename__ = "food_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    meal_type = Column(Enum(MealType), nullable=False)
    log_date = Column(Date, nullable=False)
    log_time = Column(Time, nullable=True)
    log_method = Column(Enum(LogMethod), nullable=False, default=LogMethod.TEXT)

    # Totals for the entire log entry
    total_calories = Column(Float, nullable=True, default=0)
    total_protein = Column(Float, nullable=True, default=0)
    total_carbs = Column(Float, nullable=True, default=0)
    total_fat = Column(Float, nullable=True, default=0)

    # Post-meal AI advice
    ai_advice = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="food_logs")
    items = relationship(
        "FoodLogItem", back_populates="food_log", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<FoodLog id={self.id} meal={self.meal_type} date={self.log_date}>"


class FoodLogItem(Base):
    """Individual food item inside a FoodLog."""

    __tablename__ = "food_log_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    food_log_id = Column(
        Integer,
        ForeignKey("food_logs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    food_name = Column(String(255), nullable=False)
    brand_name = Column(String(255), nullable=True)

    quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)

    # Nutritional data
    calories = Column(Float, nullable=True, default=0)
    protein = Column(Float, nullable=True, default=0)
    carbs = Column(Float, nullable=True, default=0)
    fat = Column(Float, nullable=True, default=0)
    fiber = Column(Float, nullable=True, default=0)
    sodium = Column(Float, nullable=True, default=0)
    sugar = Column(Float, nullable=True, default=0)

    # Nutritionix integration
    nutritionix_food_id = Column(String(255), nullable=True)
    thumbnail_url = Column(String(512), nullable=True)

    # Relationships
    food_log = relationship("FoodLog", back_populates="items")

    def __repr__(self) -> str:
        return f"<FoodLogItem id={self.id} food={self.food_name}>"
