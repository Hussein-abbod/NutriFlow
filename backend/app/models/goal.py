"""Goal model for NutriFlow."""

from sqlalchemy import (
    Column, Integer, Float, String, Boolean, Text, Date, DateTime,
    ForeignKey, Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class GoalType(str, enum.Enum):
    """Weight goal type (mirrors user.GoalType for DB column)."""
    GAIN_WEIGHT = "gain_weight"
    LOSE_WEIGHT = "lose_weight"
    MAINTAIN_WEIGHT = "maintain_weight"


class Goal(Base):
    """Nutrition / weight goal for a user."""

    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    goal_type = Column(Enum(GoalType), nullable=False)
    start_weight = Column(Float, nullable=False)
    target_weight = Column(Float, nullable=False)

    start_date = Column(Date, nullable=False)
    target_date = Column(Date, nullable=False)

    # Calculated daily targets
    daily_calories = Column(Float, nullable=True)
    daily_protein = Column(Float, nullable=True)
    daily_carbs = Column(Float, nullable=True)
    daily_fat = Column(Float, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    is_extended = Column(Boolean, default=False, nullable=False)

    notes = Column(Text, nullable=True)

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
    user = relationship("User", back_populates="goals")

    def __repr__(self) -> str:
        return f"<Goal id={self.id} user_id={self.user_id} type={self.goal_type}>"
