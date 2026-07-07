"""Models package — import all models so Alembic can discover them."""

from app.models.user import User  # noqa: F401
from app.models.goal import Goal  # noqa: F401
from app.models.food_log import FoodLog, FoodLogItem  # noqa: F401
from app.models.meal import Meal  # noqa: F401
from app.models.coach_message import CoachMessage  # noqa: F401
