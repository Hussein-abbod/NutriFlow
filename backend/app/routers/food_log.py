"""
Food Log router — Task 3 endpoints.

Endpoints:
  POST /food-log/barcode  — USDA barcode lookup
  POST /food-log/image    — Gemini vision + USDA search
  POST /food-log/text     — USDA search / Groq AI parse + USDA search
  POST /food-log/submit   — Save meal log + trigger AI advice
  GET  /food-log/today    — Today's logs grouped by meal type
  GET  /food-log/history  — Logs for a specific date
  DELETE /food-log/item/{id} — Delete a food log item
"""

import asyncio
import base64
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.food_log import FoodLog, FoodLogItem, MealType, LogMethod
from app.models.user import User
from app.schemas.food_log import (
    BarcodeRequest, ImageRequest, TextRequest,
    FoodSubmitRequest, FoodItemResult,
    FoodLogOut, FoodLogItemOut, TodayLogsOut,
)
from app.utils.security import get_current_user
from app.services import usda_client
from app.services.advice_agent import (
    generate_meal_advice,
    identify_foods_from_image,
    parse_food_text,
)

router = APIRouter(prefix="/food-log", tags=["Food Log"])

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────

def _scale_nutrients(food: dict, quantity: float) -> dict:
    """Scale per-100g nutrients to the given quantity."""
    scale = quantity / 100.0
    return {
        "calories": round((food.get("calories") or 0) * scale, 2),
        "protein":  round((food.get("protein")  or 0) * scale, 2),
        "carbs":    round((food.get("carbs")    or 0) * scale, 2),
        "fat":      round((food.get("fat")      or 0) * scale, 2),
        "fiber":    round((food.get("fiber")    or 0) * scale, 2),
        "sodium":   round((food.get("sodium")   or 0) * scale, 2),
        "sugar":    round((food.get("sugar")    or 0) * scale, 2),
    }


def _get_today_totals(user_id: int, db: Session) -> dict:
    """Sum today's calories & macros already logged."""
    today = date.today()
    logs = db.query(FoodLog).filter(
        FoodLog.user_id == user_id,
        FoodLog.log_date == today,
    ).all()
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
    for log in logs:
        totals["calories"] += log.total_calories or 0
        totals["protein"]  += log.total_protein  or 0
        totals["carbs"]    += log.total_carbs    or 0
        totals["fat"]      += log.total_fat      or 0
    return totals


# ─────────────────────────────────────────
# POST /food-log/barcode
# ─────────────────────────────────────────

@router.post("/barcode", response_model=FoodItemResult, summary="Look up food by barcode")
async def lookup_barcode(
    data: BarcodeRequest,
    current_user: User = Depends(get_current_user),
):
    """Search USDA by UPC/GTIN barcode. Returns first matching branded food."""
    result = await usda_client.search_by_barcode(data.barcode)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No food found for barcode: {data.barcode}",
        )
    # Return per-100g values — Flutter's scaleFactor handles the portion scaling
    return FoodItemResult(
        fdc_id=result.get("fdc_id"),
        food_name=result.get("food_name", "Unknown"),
        brand_name=result.get("brand_name"),
        serving_size=result.get("serving_size") or 100.0,
        serving_unit=result.get("serving_unit", "g"),
        calories=result.get("calories", 0),
        protein=result.get("protein", 0),
        carbs=result.get("carbs", 0),
        fat=result.get("fat", 0),
        fiber=result.get("fiber", 0),
        sodium=result.get("sodium", 0),
        sugar=result.get("sugar", 0),
    )


# ─────────────────────────────────────────
# POST /food-log/image
# ─────────────────────────────────────────

@router.post("/image", response_model=list[FoodItemResult], summary="Identify food from image")
async def identify_image(
    data: ImageRequest,
    current_user: User = Depends(get_current_user),
):
    """Send base64 image to Gemini, identify foods, look each up in USDA."""
    # Validate image size
    try:
        raw = base64.b64decode(data.image_base64)
        if len(raw) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Image exceeds 5 MB limit.")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image.")

    # Step 1: Gemini identifies food items
    identified = await identify_foods_from_image(data.image_base64)
    if not identified:
        raise HTTPException(status_code=422, detail="Could not identify food items in the image.")

    # Step 2: USDA lookup for each item.
    # IMPORTANT: return per-100g values from USDA directly.
    # Flutter's FoodItemModel._quantityInGrams + scaleFactor handle all unit
    # conversions (oz→g, cup→g, piece→g) without double-scaling.
    results: list[FoodItemResult] = []
    for item in identified:
        query = item['food_name']
        foods = await usda_client.search_foods(query, page_size=3)
        if foods:
            f = foods[0]
            qty = float(item.get("estimated_quantity", 100))
            unit = item.get("unit", "g").lower()

            results.append(FoodItemResult(
                fdc_id=f.get("fdc_id"),
                food_name=f.get("food_name", item["food_name"]),
                brand_name=f.get("brand_name"),
                serving_size=qty,
                serving_unit=unit,
                calories=f.get("calories", 0),
                protein=f.get("protein", 0),
                carbs=f.get("carbs", 0),
                fat=f.get("fat", 0),
                fiber=f.get("fiber", 0),
                sodium=f.get("sodium", 0),
                sugar=f.get("sugar", 0),
            ))
        else:
            results.append(FoodItemResult(
                food_name=item["food_name"],
                serving_size=float(item.get("estimated_quantity", 100)),
                serving_unit=item.get("unit", "g"),
            ))

    return results


# ─────────────────────────────────────────
# POST /food-log/text
# ─────────────────────────────────────────

@router.post("/text", response_model=list[FoodItemResult], summary="Search or parse food by text")
async def search_text(
    data: TextRequest,
    current_user: User = Depends(get_current_user),
):
    """
    If use_ai_parse=False: search USDA directly.
    If use_ai_parse=True: use Groq to parse the text, then USDA lookup each item.
    """
    # Sanitize input
    query = data.query.strip()[:500]

    if not data.use_ai_parse:
        # Direct USDA search — return per-100g values; Flutter scales by quantity.
        foods = await usda_client.search_foods(query, page_size=10)
        return [FoodItemResult(
            fdc_id=f.get("fdc_id"),
            food_name=f.get("food_name", "Unknown"),
            brand_name=f.get("brand_name"),
            serving_size=100.0,
            serving_unit="g",
            calories=f.get("calories", 0),
            protein=f.get("protein", 0),
            carbs=f.get("carbs", 0),
            fat=f.get("fat", 0),
            fiber=f.get("fiber", 0),
            sodium=f.get("sodium", 0),
            sugar=f.get("sugar", 0),
        ) for f in foods]

    # AI Parse → USDA lookup — return per-100g values.
    parsed = await parse_food_text(query)
    results: list[FoodItemResult] = []
    for item in parsed:
        search_query = item["food_name"]
        foods = await usda_client.search_foods(search_query, page_size=3)
        if foods:
            f = foods[0]
            qty = float(item.get("quantity", 100))
            unit = item.get("unit", "g").lower()

            results.append(FoodItemResult(
                fdc_id=f.get("fdc_id"),
                food_name=f.get("food_name", item["food_name"]),
                brand_name=f.get("brand_name"),
                serving_size=qty,
                serving_unit=unit,
                calories=f.get("calories", 0),
                protein=f.get("protein", 0),
                carbs=f.get("carbs", 0),
                fat=f.get("fat", 0),
                fiber=f.get("fiber", 0),
                sodium=f.get("sodium", 0),
                sugar=f.get("sugar", 0),
            ))
        else:
            results.append(FoodItemResult(
                food_name=item["food_name"],
                serving_size=float(item.get("quantity", 100)),
                serving_unit=item.get("unit", "g"),
            ))
    return results


# ─────────────────────────────────────────
# POST /food-log/submit
# ─────────────────────────────────────────

@router.post("/submit", response_model=FoodLogOut, summary="Submit a food log entry")
def submit_food_log(
    data: FoodSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save meal + items to DB, generate AI advice synchronously."""
    if not data.items:
        raise HTTPException(status_code=400, detail="No food items provided.")

    try:
        meal_type_enum = MealType(data.meal_type.lower())
        log_method_enum = LogMethod(data.log_method.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid meal_type or log_method.")

    # Create FoodLog
    food_log = FoodLog(
        user_id=current_user.id,
        meal_type=meal_type_enum,
        log_date=data.log_date if data.log_date else date.today(),
        log_time=datetime.now().time(),
        log_method=log_method_enum,
    )
    db.add(food_log)
    db.flush()  # get food_log.id

    total_cal = total_pro = total_carb = total_fat = 0.0
    items_summary_parts = []

    for item in data.items:
        log_item = FoodLogItem(
            food_log_id=food_log.id,
            food_name=item.food_name,
            brand_name=item.brand_name,
            quantity=item.quantity,
            unit=item.unit,
            calories=item.calories,
            protein=item.protein,
            carbs=item.carbs,
            fat=item.fat,
            fiber=item.fiber,
            sodium=item.sodium,
            sugar=item.sugar,
            nutritionix_food_id=item.nutritionix_food_id,
            thumbnail_url=item.thumbnail_url,
        )
        db.add(log_item)
        total_cal  += item.calories or 0
        total_pro  += item.protein  or 0
        total_carb += item.carbs    or 0
        total_fat  += item.fat      or 0
        items_summary_parts.append(f"{item.food_name} ({item.quantity}{item.unit})")

    food_log.total_calories = round(total_cal, 2)
    food_log.total_protein  = round(total_pro, 2)
    food_log.total_carbs    = round(total_carb, 2)
    food_log.total_fat      = round(total_fat, 2)
    db.commit()
    db.refresh(food_log)

    # Generate AI advice
    today_totals = _get_today_totals(current_user.id, db)
    remaining_cal = max(0, (current_user.daily_calories_target or 2000) - today_totals["calories"])
    remaining_pro = max(0, (current_user.daily_protein_target or 50) - today_totals["protein"])
    allergies = current_user.food_allergies or []
    if isinstance(allergies, str):
        import json
        try:
            allergies = json.loads(allergies)
        except Exception:
            allergies = []

    advice = generate_meal_advice(
        meal_type=data.meal_type,
        food_items_summary=", ".join(items_summary_parts),
        calories=total_cal,
        protein=total_pro,
        carbs=total_carb,
        fat=total_fat,
        remaining_calories=remaining_cal,
        remaining_protein=remaining_pro,
        goal_type=str(current_user.goal_type or "maintain_weight"),
        allergies=allergies,
    )
    food_log.ai_advice = advice
    db.commit()
    db.refresh(food_log)

    return food_log


# ─────────────────────────────────────────
# GET /food-log/today
# ─────────────────────────────────────────

@router.get("/today", response_model=TodayLogsOut, summary="Get today's food logs")
def get_today_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    logs = (
        db.query(FoodLog)
        .filter(FoodLog.user_id == current_user.id, FoodLog.log_date == today)
        .all()
    )

    result = TodayLogsOut(date=today)
    for log in logs:
        meal = log.meal_type.value if hasattr(log.meal_type, "value") else log.meal_type
        log_out = FoodLogOut.model_validate(log)
        getattr(result, meal).append(log_out)
        result.total_calories += log.total_calories or 0
        result.total_protein  += log.total_protein  or 0
        result.total_carbs    += log.total_carbs    or 0
        result.total_fat      += log.total_fat      or 0

    result.total_calories = round(result.total_calories, 2)
    result.total_protein  = round(result.total_protein,  2)
    result.total_carbs    = round(result.total_carbs,    2)
    result.total_fat      = round(result.total_fat,      2)
    return result


# ─────────────────────────────────────────
# GET /food-log/history
# ─────────────────────────────────────────

@router.get("/history", response_model=TodayLogsOut, summary="Get food logs for a specific date")
def get_history(
    log_date: date = Query(..., description="Date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(FoodLog)
        .filter(FoodLog.user_id == current_user.id, FoodLog.log_date == log_date)
        .all()
    )

    result = TodayLogsOut(date=log_date)
    for log in logs:
        meal = log.meal_type.value if hasattr(log.meal_type, "value") else log.meal_type
        log_out = FoodLogOut.model_validate(log)
        getattr(result, meal).append(log_out)
        result.total_calories += log.total_calories or 0
        result.total_protein  += log.total_protein  or 0
        result.total_carbs    += log.total_carbs    or 0
        result.total_fat      += log.total_fat      or 0

    return result


# ─────────────────────────────────────────
# DELETE /food-log/item/{id}
# ─────────────────────────────────────────

@router.delete("/item/{item_id}", status_code=204, summary="Delete a food log item")
def delete_food_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(FoodLogItem).filter(FoodLogItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    food_log = item.food_log
    # Verify ownership via parent log
    if food_log.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised.")

    # Update parent log totals
    food_log.total_calories = max(0, round((food_log.total_calories or 0) - (item.calories or 0), 2))
    food_log.total_protein = max(0, round((food_log.total_protein or 0) - (item.protein or 0), 2))
    food_log.total_carbs = max(0, round((food_log.total_carbs or 0) - (item.carbs or 0), 2))
    food_log.total_fat = max(0, round((food_log.total_fat or 0) - (item.fat or 0), 2))

    db.delete(item)
    db.commit()
