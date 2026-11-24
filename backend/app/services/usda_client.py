"""
USDA FoodData Central API client for NutriFlow.

Base URL: https://api.nal.usda.gov/fdc/v1/
Free API key: https://api.data.gov/signup
Rate limit: 1,000 requests/hour per IP
"""

import httpx
from typing import Optional
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings

settings = get_settings()

USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# Maximum plausible calories per 100g (pure fat ≈ 900 kcal).
# Anything above this is almost certainly a data-entry error.
MAX_CALORIES_PER_100G = 900

# Nutrient IDs we care about in USDA responses
NUTRIENT_IDS = {
    "calories": [1008, 2047, 2048],   # Energy (kcal)
    "protein": [1003],    # Protein (g)
    "fat": [1004],        # Total lipid/fat (g)
    "carbs": [1005],      # Carbohydrate (g)
    "fiber": [1079],      # Fiber (g)
    "sugar": [2000],      # Total sugars (g)
    "sodium": [1093],     # Sodium (mg)
}

# USDA uses non-standard unit codes; map them to user-friendly units.
_UNIT_MAP = {
    "GRM": "g", "grm": "g",
    "MLT": "ml", "mlt": "ml",
    "UNZ": "oz", "unz": "oz",
}


def _normalise_unit(raw: str | None) -> str:
    """Convert USDA unit codes like 'GRM' to lowercase readable units."""
    if not raw:
        return "g"
    return _UNIT_MAP.get(raw, raw.lower())


def parse_nutrients(food_data: dict, quantity_g: float = 100.0) -> dict:
    """
    Extract and scale key nutrients from a USDA food item.
    USDA reports nutrients per 100g by default for most items.
    """
    nutrients = {}
    scale = quantity_g / 100.0

    for nutrient in food_data.get("foodNutrients", []):
        # Handle both search result format and detail format
        nutrient_id = (
            nutrient.get("nutrientId")
            or nutrient.get("nutrient", {}).get("id")
        )
        amount = nutrient.get("value") or nutrient.get("amount", 0)

        for key, uids in NUTRIENT_IDS.items():
            if nutrient_id in uids:
                if key not in nutrients or nutrients[key] == 0:
                    nutrients[key] = round((amount or 0) * scale, 2)

    # Ensure all keys exist even if USDA doesn't have them
    return {
        "calories": nutrients.get("calories", 0),
        "protein": nutrients.get("protein", 0),
        "fat": nutrients.get("fat", 0),
        "carbs": nutrients.get("carbs", 0),
        "fiber": nutrients.get("fiber", 0),
        "sugar": nutrients.get("sugar", 0),
        "sodium": nutrients.get("sodium", 0),
    }

# Common food name aliases -> precise USDA search terms that return the correct food
_QUERY_NORMALISE = {
    "milk": "Milk, whole, 3.25% milkfat",
    "egg": "Egg, whole, raw",
    "eggs": "Egg, whole, raw",
    "toast": "Bread, white, commercially prepared, toasted",
    "bread": "Bread, white, commercially prepared",
    "butter": "Butter, without salt",
    "chicken": "Chicken, broilers or fryers, breast, meat only, cooked",
    "beef": "Beef, ground, 80% lean meat",
    "rice": "Rice, white, long-grain, cooked",
    "white rice": "Rice, white, long-grain, cooked",
    "brown rice": "Rice, brown, long-grain, cooked",
    "pasta": "Pasta, cooked, unenriched",
    "sugar": "Sugars, granulated",
    "oil": "Oil, vegetable, canola",
    "banana": "Bananas, raw",
    "apple": "Apples, raw, with skin",
    "orange": "Oranges, raw",
    "potato": "Potatoes, boiled, cooked without skin",
    "cheese": "Cheese, cheddar",
    "yogurt": "Yogurt, plain, whole milk",
}


def _score_food_match(food_name: str, query: str) -> int:
    """Score how well a USDA food_name matches the user query. Higher = better."""
    fn = food_name.lower()
    q = query.lower().strip()

    if fn == q:
        return 1000
    if fn.startswith(q + ",") or fn.startswith(q + " "):
        score = 800
    else:
        first_segment = fn.split(",")[0].strip()
        if first_segment == q:
            score = 700
        elif first_segment.startswith(q):
            score = 600
        elif q in fn:
            idx = fn.index(q)
            score = max(0, 400 - idx * 5)
        else:
            score = -len(food_name)

    # Penalise heavily processed / non-fresh forms
    for bad in ("dried", "dehydrated", "powder", "freeze-dried", "powdered"):
        if bad in fn:
            score -= 300
            break

    # Prefer fresh / natural forms
    for good in ("raw", "fresh", "fluid", "whole,", "cooked", "toasted"):
        if good in fn:
            score += 50
            break

    return score


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=4))
async def search_foods(query: str, page_size: int = 10) -> list[dict]:
    """
    Search USDA FoodData Central by keyword.
    Prioritises Foundation and SR Legacy (whole foods) over Branded products.
    Re-ranks results so the closest name match always comes first.
    Returns a simplified list of food results.
    """
    # Normalise common food words to better USDA search terms.
    # Also try the first segment of compound Groq-style queries like 'egg, whole, raw' -> 'egg'
    q_lower = query.lower().strip()
    first_segment = q_lower.split(",")[0].strip()
    normalised_query = (
        _QUERY_NORMALISE.get(q_lower)
        or _QUERY_NORMALISE.get(first_segment)
        or query
    )
    fetch_n = max(page_size, 15)  # fetch extra candidates for re-ranking

    async with httpx.AsyncClient(timeout=10.0) as client:

        def _build_params(data_type: str, q: str) -> dict:
            return {
                "query": q,
                "pageSize": fetch_n,
                "dataType": data_type,
                "api_key": settings.USDA_API_KEY,
            }

        # Pass 1: prefer whole-food databases
        resp = await client.get(
            f"{USDA_BASE_URL}/foods/search",
            params=_build_params("Foundation,SR Legacy", normalised_query),
        )
        if resp.status_code == 429:
            resp.raise_for_status()  # let tenacity retry on rate-limit
        if resp.status_code in (400, 403):
            foods_raw = []  # bad key or bad query — skip gracefully
        else:
            resp.raise_for_status()
            foods_raw = resp.json().get("foods", [])

        # Pass 2: fall back to Branded if Pass 1 returned nothing
        if not foods_raw:
            resp2 = await client.get(
                f"{USDA_BASE_URL}/foods/search",
                params=_build_params("Branded", query),
            )
            if resp2.status_code == 429:
                resp2.raise_for_status()
            if resp2.status_code in (400, 403):
                foods_raw = []
            else:
                resp2.raise_for_status()
                foods_raw = resp2.json().get("foods", [])

    results = []
    for food in foods_raw:
        nutrients = parse_nutrients(food, quantity_g=100.0)

        # Skip entries with impossible calorie values (bad data)
        if nutrients["calories"] > MAX_CALORIES_PER_100G:
            continue

        desc = food.get("description", "Unknown")
        results.append({
            "fdc_id": food.get("fdcId"),
            "food_name": desc,
            "brand_name": food.get("brandOwner") or food.get("brandName"),
            "serving_size": food.get("servingSize"),
            "serving_unit": _normalise_unit(food.get("servingSizeUnit")),
            "_score": _score_food_match(desc, query),
            **nutrients,
        })

    # Re-rank by match quality so best result is first
    results.sort(key=lambda r: r["_score"], reverse=True)
    for r in results:
        r.pop("_score", None)
    return results[:page_size]


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=4))
async def get_food_by_id(fdc_id: int) -> Optional[dict]:
    """Get full nutritional details for a specific food by FDC ID."""
    params = {"api_key": settings.USDA_API_KEY}

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{USDA_BASE_URL}/food/{fdc_id}", params=params)
        if resp.status_code == 429:
            resp.raise_for_status()
        if resp.status_code in (400, 403):
            return None
        resp.raise_for_status()
        data = resp.json()

    nutrients = parse_nutrients(data, quantity_g=100.0)
    return {
        "fdc_id": data.get("fdcId"),
        "food_name": data.get("description", "Unknown"),
        "brand_name": data.get("brandOwner") or data.get("brandName"),
        "serving_size": data.get("servingSize", 100),
        "serving_unit": _normalise_unit(data.get("servingSizeUnit")),
        **nutrients,
    }


def _same_gtin(left: str, right: str) -> bool:
    """UPC-A, EAN-13 and GTIN-14 of one product differ only by leading zeros."""
    return left.lstrip("0") == right.lstrip("0")


def _upc_check_digit(first_eleven: str) -> int:
    odd = sum(int(digit) for digit in first_eleven[0::2])
    even = sum(int(digit) for digit in first_eleven[1::2])
    return (10 - (odd * 3 + even) % 10) % 10


def expand_upce(code: str) -> Optional[str]:
    """
    The 12-digit UPC-A of an 8-digit UPC-E (zero-suppressed) barcode, or None when `code`
    is not a valid UPC-E (8-digit codes can also be EAN-8, which has no expansion).
    """
    if len(code) != 8 or not code.isdigit() or code[0] not in "01":
        return None
    system, digits, check = code[0], code[1:7], code[7]
    last = int(digits[5])
    if last <= 2:
        body = digits[0:2] + digits[5] + "0000" + digits[2:5]
    elif last == 3:
        body = digits[0:3] + "00000" + digits[3:5]
    elif last == 4:
        body = digits[0:4] + "00000" + digits[4]
    else:
        body = digits[0:5] + "0000" + digits[5]
    upc_a = system + body + check
    return upc_a if _upc_check_digit(upc_a[:11]) == int(check) else None


def _barcode_match(foods: list[dict], upc: str) -> Optional[dict]:
    """
    The search is a keyword search, so a hit is not always the scanned product. Prefer a food
    whose `gtinUpc` is the barcode (or its UPC-A form); when results carry GTINs and none
    matches, there is no match.
    """
    candidates = [code for code in (upc, expand_upce(upc)) if code]
    with_gtin = [food for food in foods if food.get("gtinUpc")]
    for food in with_gtin:
        if any(_same_gtin(str(food["gtinUpc"]), code) for code in candidates):
            return food
    if with_gtin:
        return None
    return foods[0] if foods else None


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=4))
async def search_by_barcode(upc: str) -> Optional[dict]:
    """
    Search for a branded food by its UPC/GTIN barcode.
    USDA indexes GTINs in the branded food database (as UPC-A, so a UPC-E code is also
    searched in its expanded form).
    """
    food = None
    async with httpx.AsyncClient(timeout=10.0) as client:
        for query in dict.fromkeys(code for code in (upc, expand_upce(upc)) if code):
            resp = await client.get(
                f"{USDA_BASE_URL}/foods/search",
                params={"query": query, "dataType": "Branded", "pageSize": 5, "api_key": settings.USDA_API_KEY},
            )
            if resp.status_code == 429:
                resp.raise_for_status()
            if resp.status_code in (400, 403):
                return None
            resp.raise_for_status()
            food = _barcode_match(resp.json().get("foods", []), upc)
            if food is not None:
                break
    if food is None:
        return None

    nutrients = parse_nutrients(food, quantity_g=100.0)
    return {
        "fdc_id": food.get("fdcId"),
        "food_name": food.get("description", "Unknown"),
        "brand_name": food.get("brandOwner") or food.get("brandName"),
        "serving_size": food.get("servingSize", 100),
        "serving_unit": _normalise_unit(food.get("servingSizeUnit")),
        **nutrients,
    }
