"""
Pydantic schemas for Food Log endpoints (Task 3).
"""

from datetime import date
from typing import Optional, List
from pydantic import BaseModel, Field


# ---------- Requests ----------

class BarcodeRequest(BaseModel):
    barcode: str = Field(..., description="UPC / GTIN barcode string")


class ImageRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded JPEG/PNG image (max 5 MB)")
    meal_type: str = Field(..., description="breakfast | lunch | snack | dinner")


class TextRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    meal_type: str = Field(..., description="breakfast | lunch | snack | dinner")
    use_ai_parse: bool = Field(False, description="Force AI parsing instead of USDA search")


class FoodItemSubmit(BaseModel):
    food_name: str
    brand_name: Optional[str] = None
    quantity: float = 100.0
    unit: str = "g"
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: float = 0
    sodium: float = 0
    sugar: float = 0
    nutritionix_food_id: Optional[str] = None   # stores fdc_id as string
    thumbnail_url: Optional[str] = None


class FoodSubmitRequest(BaseModel):
    meal_type: str = Field(..., description="breakfast | lunch | snack | dinner")
    log_method: str = Field("text", description="text | barcode | image")
    log_date: Optional[date] = Field(None, description="Date to log this meal on. Defaults to today.")
    items: List[FoodItemSubmit]


# ---------- Responses ----------

class FoodItemResult(BaseModel):
    """A food item returned by USDA search / barcode / image."""
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
    items: List[FoodLogItemOut] = []

    model_config = {"from_attributes": True}


class TodayLogsOut(BaseModel):
    date: date
    breakfast: List[FoodLogOut] = []
    lunch: List[FoodLogOut] = []
    snack: List[FoodLogOut] = []
    dinner: List[FoodLogOut] = []
    total_calories: float = 0
    total_protein: float = 0
    total_carbs: float = 0
    total_fat: float = 0
