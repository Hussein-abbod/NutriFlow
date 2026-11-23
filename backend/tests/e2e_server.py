"""
Backend for the Playwright E2E tests: the real app and the real database (DATABASE_URL from
.env), with USDA, Groq and Gemini replaced by fixed fake data so runs are deterministic, free
and work offline.

    venv/Scripts/python -m uvicorn tests.e2e_server:app --port 8001

frontend/playwright.config.ts starts it together with a Vite dev server on port 5174
(`--mode e2e`, see frontend/.env.e2e). Never use this module for anything but E2E tests.
"""

import os

# The E2E web app runs on its own port so it never reuses a developer's dev servers.
os.environ["CORS_ORIGINS"] = "http://localhost:5174"

from app.main import app  # noqa: E402
from app.services import advice_agent, usda_client  # noqa: E402

# Per-100 g values, roughly USDA SR Legacy.
FAKE_FOODS = [
    {"fdc_id": 169757, "food_name": "Rice, white, long-grain, cooked", "calories": 130.0, "protein": 2.7,
     "carbs": 28.2, "fat": 0.3, "fiber": 0.4, "sugar": 0.1, "sodium": 1.0},
    {"fdc_id": 171477, "food_name": "Chicken breast, cooked, roasted", "calories": 165.0, "protein": 31.0,
     "carbs": 0.0, "fat": 3.6, "fiber": 0.0, "sugar": 0.0, "sodium": 74.0},
    {"fdc_id": 173424, "food_name": "Egg, whole, raw", "calories": 143.0, "protein": 12.6,
     "carbs": 0.7, "fat": 9.5, "fiber": 0.0, "sugar": 0.4, "sodium": 142.0},
]
FAKE_BARCODES = {
    "012345678905": {**FAKE_FOODS[1], "food_name": "Grilled Chicken Strips", "brand_name": "E2E Foods",
                     "serving_size": 85.0, "serving_unit": "g"},
}


async def fake_search_foods(query: str, page_size: int = 10) -> list[dict]:
    words = query.lower().replace(",", " ").split()
    return [
        {**food, "brand_name": None, "serving_size": None, "serving_unit": "g"}
        for food in FAKE_FOODS
        if any(word in food["food_name"].lower() for word in words)
    ][:page_size]


async def fake_search_by_barcode(upc: str) -> dict | None:
    return FAKE_BARCODES.get(upc)


async def fake_parse_food_text(text: str) -> list[dict]:
    return [{"food_name": part.strip(), "quantity": 100.0, "unit": "g"} for part in text.split(" and ")]


async def fake_identify_foods_from_image(image_base64: str, mime_type: str = "image/jpeg") -> list[dict]:
    return [{"food_name": "chicken breast", "estimated_quantity": 150, "unit": "g"}]


def fake_meal_advice(**kwargs) -> str:
    return (
        f"Solid {kwargs['meal_type']}: {round(kwargs['calories'])} kcal. "
        f"You have {round(kwargs['remaining_calories'])} kcal left today."
    )


usda_client.search_foods = fake_search_foods
usda_client.search_by_barcode = fake_search_by_barcode
advice_agent.parse_food_text = fake_parse_food_text
advice_agent.identify_foods_from_image = fake_identify_foods_from_image
advice_agent.generate_meal_advice = fake_meal_advice

__all__ = ["app"]
