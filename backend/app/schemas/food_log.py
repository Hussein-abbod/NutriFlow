"""
Pydantic schemas for the food-log endpoints.

The limits are mirrored by the React food-log forms
(frontend/src/features/food-log/schemas/limits.ts); keep both in sync.
"""

from datetime import date, timedelta
from typing import Annotated, Literal, Optional

from pydantic import BaseModel, Field, StringConstraints, field_validator

MealTypeName = Literal["breakfast", "lunch", "snack", "dinner"]
LogMethodName = Literal["text", "barcode", "image"]

TEXT_QUERY_MAX_LENGTH = 500
# EAN-8 / UPC-E (8), UPC-A (12), EAN-13 (13) and GTIN-14 (14), digits only.
BARCODE_PATTERN = r"^\d{8,14}$"
MAX_ITEMS_PER_LOG = 50
QUANTITY_MAX = 10_000
CALORIES_MAX = 100_000  # one item: 10 kg of pure fat is 90,000 kcal
GRAMS_MAX = 10_000  # protein, carbs, fat, fiber, sugar per item
SODIUM_MAX_MG = 5_000_000  # 10 kg of table salt is about 3.9 million mg
LOG_DATE_MAX_PAST_DAYS = 366
LOG_DATE_MAX_FUTURE_DAYS = 7

FoodName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
BrandName = Annotated[str, StringConstraints(strip_whitespace=True, max_length=255)]
UnitName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
Quantity = Annotated[float, Field(gt=0, le=QUANTITY_MAX, allow_inf_nan=False)]
Calories = Annotated[float, Field(ge=0, le=CALORIES_MAX, allow_inf_nan=False)]
Grams = Annotated[float, Field(ge=0, le=GRAMS_MAX, allow_inf_nan=False)]
SodiumMg = Annotated[float, Field(ge=0, le=SODIUM_MAX_MG, allow_inf_nan=False)]


# ---------- Requests ----------

class BarcodeRequest(BaseModel):
    barcode: Annotated[
        str, StringConstraints(strip_whitespace=True, pattern=BARCODE_PATTERN)
    ] = Field(..., description="UPC / EAN / GTIN barcode, 8–14 digits")


class ImageRequest(BaseModel):
    image_base64: str = Field(
        ..., min_length=1, description="Base64-encoded JPEG, PNG or WebP image (max 5 MB)"
    )
    meal_type: MealTypeName


class TextRequest(BaseModel):
    query: Annotated[
        str,
        StringConstraints(strip_whitespace=True, min_length=1, max_length=TEXT_QUERY_MAX_LENGTH),
    ]
    meal_type: MealTypeName
    use_ai_parse: bool = Field(False, description="Parse a meal description with AI first")


class FoodItemSubmit(BaseModel):
    food_name: FoodName
    brand_name: Optional[BrandName] = None
    quantity: Quantity = 100.0
    unit: UnitName = "g"
    calories: Calories = 0
    protein: Grams = 0
    carbs: Grams = 0
    fat: Grams = 0
    fiber: Grams = 0
    sodium: SodiumMg = 0
    sugar: Grams = 0
    nutritionix_food_id: Optional[str] = Field(None, max_length=255)  # USDA fdc_id as text
    thumbnail_url: Optional[
        Annotated[str, StringConstraints(max_length=512, pattern=r"^https://\S+$")]
    ] = None


class FoodSubmitRequest(BaseModel):
    meal_type: MealTypeName
    log_method: LogMethodName = "text"
    log_date: Optional[date] = Field(None, description="Day to log the meal on (default: today)")
    items: list[FoodItemSubmit] = Field(..., min_length=1, max_length=MAX_ITEMS_PER_LOG)

    @field_validator("log_date")
    @classmethod
    def log_date_in_range(cls, value: Optional[date]) -> Optional[date]:
        if value is None:
            return value
        today = date.today()
        if value > today + timedelta(days=LOG_DATE_MAX_FUTURE_DAYS):
            raise ValueError(f"Meals can be logged at most {LOG_DATE_MAX_FUTURE_DAYS} days ahead.")
        if value < today - timedelta(days=LOG_DATE_MAX_PAST_DAYS):
            raise ValueError("Meals can be logged at most one year back.")
        return value


# ---------- Responses ----------

class FoodItemResult(BaseModel):
    """A food found by USDA search / barcode / image. Nutrients are per 100 g."""
    fdc_id: Optional[int] = None
    food_name: str
    brand_name: Optional[str] = None
    serving_size: Optional[float] = None
    serving_unit: Optional[str] = "g"
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: float = 0
    sugar: float = 0
    sodium: float = 0


class FoodLogItemOut(BaseModel):
    id: int
    food_name: str
    brand_name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None

    model_config = {"from_attributes": True}


class FoodLogOut(BaseModel):
    id: int
    meal_type: str
    log_date: date
    log_method: str
    total_calories: Optional[float] = None
    total_protein: Optional[float] = None
    total_carbs: Optional[float] = None
    total_fat: Optional[float] = None
    ai_advice: Optional[str] = None
    items: list[FoodLogItemOut] = []

    model_config = {"from_attributes": True}


class TodayLogsOut(BaseModel):
    """One day's logs grouped by meal (used by /today and /history)."""
    date: date
    breakfast: list[FoodLogOut] = []
    lunch: list[FoodLogOut] = []
    snack: list[FoodLogOut] = []
    dinner: list[FoodLogOut] = []
    total_calories: float = 0
    total_protein: float = 0
    total_carbs: float = 0
    total_fat: float = 0
