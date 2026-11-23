"""
Food lookups for the food log: USDA search, USDA barcode lookup, AI meal-text parsing and
AI photo recognition (each AI-named food is then looked up in USDA).

Results carry USDA nutrients per 100 g; the client scales them to the chosen portion.
"""

import asyncio
import logging
from dataclasses import dataclass

from fastapi import HTTPException, status

from app.schemas.food_log import QUANTITY_MAX, FoodItemResult
from app.services import advice_agent, usda_client
from app.utils.image_validation import decode_image

logger = logging.getLogger(__name__)

DEFAULT_SERVING_G = 100.0
TEXT_SEARCH_PAGE_SIZE = 10
AI_MATCH_PAGE_SIZE = 3
MAX_AI_ITEMS = 10  # bounds the USDA lookups one AI request can trigger
FOOD_NAME_MAX = 255
UNIT_MAX = 50

NUTRIENT_KEYS = ("calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium")
USDA_UNAVAILABLE = "The food database is not available right now. Please try again."


@dataclass(frozen=True)
class ParsedFood:
    """One food named by the AI (text parser or photo recognition)."""
    name: str
    quantity: float
    unit: str


def _usda_result(food: dict, serving_size: float, serving_unit: str) -> FoodItemResult:
    return FoodItemResult(
        fdc_id=food.get("fdc_id"),
        food_name=(food.get("food_name") or "Unknown")[:FOOD_NAME_MAX],
        brand_name=food.get("brand_name"),
        serving_size=serving_size,
        serving_unit=serving_unit,
        **{key: food.get(key) or 0 for key in NUTRIENT_KEYS},
    )


def _valid_quantity(value: object) -> float:
    try:
        quantity = float(value)
    except (TypeError, ValueError):
        return DEFAULT_SERVING_G
    return quantity if 0 < quantity <= QUANTITY_MAX else DEFAULT_SERVING_G


async def _from_usda(call):
    """Await a USDA call; outages (network, 5xx, exhausted retries) become a 503."""
    try:
        return await call
    except Exception as exc:
        logger.warning("USDA lookup failed: %s", type(exc).__name__)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=USDA_UNAVAILABLE) from exc


def _parsed_foods(raw_items: object, quantity_key: str) -> list[ParsedFood]:
    """Keep only well-formed AI items (the model's JSON is untrusted)."""
    if not isinstance(raw_items, list):
        return []
    foods: list[ParsedFood] = []
    for raw in raw_items[:MAX_AI_ITEMS]:
        if not isinstance(raw, dict):
            continue
        name = str(raw.get("food_name") or "").strip()[:FOOD_NAME_MAX]
        if not name:
            continue
        unit = str(raw.get("unit") or "g").strip().lower()[:UNIT_MAX] or "g"
        foods.append(ParsedFood(name=name, quantity=_valid_quantity(raw.get(quantity_key)), unit=unit))
    return foods


async def _match_in_usda(foods: list[ParsedFood]) -> list[FoodItemResult]:
    """Look every AI-named food up in USDA (in parallel); unknown foods keep 0 nutrients."""
    matches = await _from_usda(
        asyncio.gather(*(usda_client.search_foods(food.name, page_size=AI_MATCH_PAGE_SIZE) for food in foods))
    )
    return [
        _usda_result(found[0], food.quantity, food.unit)
        if found
        else FoodItemResult(food_name=food.name, serving_size=food.quantity, serving_unit=food.unit)
        for food, found in zip(foods, matches)
    ]


async def lookup_barcode(barcode: str) -> FoodItemResult:
    food = await _from_usda(usda_client.search_by_barcode(barcode))
    if not food:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No food found for barcode: {barcode}")
    serving = _valid_quantity(food.get("serving_size"))
    return _usda_result(food, serving, food.get("serving_unit") or "g")


async def identify_image(image_base64: str) -> list[FoodItemResult]:
    image = decode_image(image_base64)
    identified = await advice_agent.identify_foods_from_image(image_base64, image.mime_type)
    foods = _parsed_foods(identified, quantity_key="estimated_quantity")
    if not foods:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not identify food items in the image.",
        )
    return await _match_in_usda(foods)


async def search_text(query: str, use_ai_parse: bool) -> list[FoodItemResult]:
    if not use_ai_parse:
        foods = await _from_usda(usda_client.search_foods(query, page_size=TEXT_SEARCH_PAGE_SIZE))
        return [_usda_result(food, DEFAULT_SERVING_G, "g") for food in foods]

    parsed = _parsed_foods(await advice_agent.parse_food_text(query), quantity_key="quantity")
    return await _match_in_usda(parsed or [ParsedFood(query[:FOOD_NAME_MAX], DEFAULT_SERVING_G, "g")])
