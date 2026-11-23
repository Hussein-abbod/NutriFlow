"""
Food-log router (HTTP only; logic lives in services/food_lookup_service.py and
services/food_log_service.py).

  POST   /food-log/barcode         USDA lookup by UPC / EAN barcode
  POST   /food-log/image           AI photo recognition + USDA lookup
  POST   /food-log/text            USDA search, or AI meal parsing + USDA lookup
  POST   /food-log/submit          Save a meal and return it with AI advice
  GET    /food-log/today           Today's logs grouped by meal
  GET    /food-log/history         One day's logs grouped by meal
  DELETE /food-log/item/{item_id}  Delete one of the user's items
"""

from datetime import date

from fastapi import APIRouter, Depends, Path, Query, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.limiter import AI_RATE_LIMIT, limiter
from app.models.user import User
from app.schemas.food_log import (
    BarcodeRequest,
    FoodItemResult,
    FoodLogOut,
    FoodSubmitRequest,
    ImageRequest,
    TextRequest,
    TodayLogsOut,
)
from app.services import food_log_service, food_lookup_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/food-log", tags=["Food Log"])


@router.post("/barcode", response_model=FoodItemResult, summary="Look up food by barcode")
@limiter.limit(AI_RATE_LIMIT)
async def lookup_barcode(
    request: Request,
    data: BarcodeRequest,
    current_user: User = Depends(get_current_user),
):
    return await food_lookup_service.lookup_barcode(data.barcode)


@router.post("/image", response_model=list[FoodItemResult], summary="Identify food from a photo")
@limiter.limit(AI_RATE_LIMIT)
async def identify_image(
    request: Request,
    data: ImageRequest,
    current_user: User = Depends(get_current_user),
):
    return await food_lookup_service.identify_image(data.image_base64)


@router.post("/text", response_model=list[FoodItemResult], summary="Search or parse food by text")
@limiter.limit(AI_RATE_LIMIT)
async def search_text(
    request: Request,
    data: TextRequest,
    current_user: User = Depends(get_current_user),
):
    return await food_lookup_service.search_text(data.query, data.use_ai_parse)


@router.post("/submit", response_model=FoodLogOut, summary="Log a meal and get AI advice")
@limiter.limit(AI_RATE_LIMIT)
def submit_food_log(
    request: Request,
    data: FoodSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return food_log_service.submit_log(db, current_user, data)


@router.get("/today", response_model=TodayLogsOut, summary="Today's food logs")
def get_today_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return food_log_service.logs_for_day(db, current_user, date.today())


@router.get("/history", response_model=TodayLogsOut, summary="Food logs for one day")
def get_history(
    log_date: date = Query(..., description="Day in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return food_log_service.logs_for_day(db, current_user, log_date)


@router.delete("/item/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a food item")
def delete_food_item(
    item_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    food_log_service.delete_item(db, current_user, item_id)
