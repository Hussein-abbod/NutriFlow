"""User model for NutriFlow."""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, Enum, DateTime, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class ActivityLevel(str, enum.Enum):
    """Physical activity level."""
    SEDENTARY = "sedentary"
    LIGHTLY_ACTIVE = "lightly_active"
    MODERATELY_ACTIVE = "moderately_active"
    VERY_ACTIVE = "very_active"
    EXTRA_ACTIVE = "extra_active"


class GoalType(str, enum.Enum):
    """Weight goal type."""
    GAIN_WEIGHT = "gain_weight"
    LOSE_WEIGHT = "lose_weight"
    MAINTAIN_WEIGHT = "maintain_weight"


class User(Base):
    """User account and profile."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)

    # Profile fields
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)

    # Activity & goals
    activity_level = Column(
        Enum(ActivityLevel), nullable=True, default=None
    )
    goal_type = Column(
        Enum(GoalType), nullable=True, default=None
    )
    goal_weight_kg = Column(Float, nullable=True)
    goal_period_weeks = Column(Integer, nullable=True)

    # Daily macro targets
    daily_calories_target = Column(Float, nullable=True)
    daily_protein_target = Column(Float, nullable=True)
    daily_carbs_target = Column(Float, nullable=True)
    daily_fat_target = Column(Float, nullable=True)

    # Dietary info
    food_allergies = Column(JSON, nullable=True, default=list)

    # Profile completion flag
    is_profile_complete = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    food_logs = relationship(
        "FoodLog", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
