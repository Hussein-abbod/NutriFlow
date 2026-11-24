"""Food-log lookups: POST /food-log/text, /barcode and /image (USDA, Groq, Gemini mocked)."""

import asyncio
import base64

import httpx
import pytest
from tenacity import stop_after_attempt

from app.services import advice_agent, usda_client
from app.utils.image_validation import MAX_BASE64_CHARS, MAX_IMAGE_BYTES

# conftest replaces usda_client.search_by_barcode for every test; keep the real one here.
REAL_SEARCH_BY_BARCODE = usda_client.search_by_barcode

JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
WEBP = b"RIFF\x00\x00\x00\x00WEBPVP8 " + b"\x00" * 64
GIF = b"GIF89a" + b"\x00" * 64


def b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


@pytest.fixture
def identified(monkeypatch):
    """Fake Gemini: records the MIME type it was given and returns two foods."""
    calls = []

    async def fake_identify(image_base64, mime_type="image/jpeg"):
        calls.append(mime_type)
        return [
            {"food_name": "chicken breast, cooked, roasted", "estimated_quantity": 150, "unit": "g"},
            {"food_name": "broccoli, cooked", "estimated_quantity": 80, "unit": "G"},
        ]

    monkeypatch.setattr(advice_agent, "identify_foods_from_image", fake_identify)
    return calls


# ---------- Auth ----------


@pytest.mark.parametrize(
    "method, path, body",
    [
        ("post", "/food-log/text", {"query": "rice", "meal_type": "lunch"}),
        ("post", "/food-log/barcode", {"barcode": "012345678905"}),
        ("post", "/food-log/image", {"image_base64": b64(JPEG), "meal_type": "lunch"}),
    ],
)
def test_lookups_require_auth(client, method, path, body):
    kwargs = {"json": body} if body is not None else {}
    assert getattr(client, method)(path, **kwargs).status_code == 401


# ---------- POST /text ----------


def test_text_search_returns_usda_values_per_100g(client, auth_headers):
    response = client.post("/food-log/text", json={"query": "  rice ", "meal_type": "lunch"}, headers=auth_headers)

    assert response.status_code == 200
    [food] = response.json()
    assert food["food_name"] == "rice (USDA)"
    assert food["serving_size"] == 100
    assert food["serving_unit"] == "g"
    assert food["calories"] == 130


def test_ai_parse_keeps_valid_items_with_their_portions(client, auth_headers, monkeypatch):
    async def fake_parse(text):
        return [
            {"food_name": "egg, whole, raw", "quantity": 2, "unit": "Egg"},
            {"food_name": "", "quantity": 1, "unit": "cup"},
            "not a food",
            {"food_name": "milk, whole", "quantity": -3, "unit": "cup"},
            {"food_name": "toast", "quantity": "lots"},
        ]

    monkeypatch.setattr(advice_agent, "parse_food_text", fake_parse)
    response = client.post(
        "/food-log/text",
        json={"query": "2 eggs, milk and toast", "meal_type": "breakfast", "use_ai_parse": True},
        headers=auth_headers,
    )

    assert response.status_code == 200
    foods = response.json()
    assert [(f["food_name"], f["serving_size"], f["serving_unit"]) for f in foods] == [
        ("egg, whole, raw (USDA)", 2, "egg"),
        ("milk, whole (USDA)", 100, "cup"),
        ("toast (USDA)", 100, "g"),
    ]


def test_ai_parse_falls_back_to_the_query_and_keeps_unknown_foods(client, auth_headers, monkeypatch):
    async def fake_parse(text):
        return []

    async def no_match(query, page_size=10):
        return []

    monkeypatch.setattr(advice_agent, "parse_food_text", fake_parse)
    monkeypatch.setattr(usda_client, "search_foods", no_match)
    response = client.post(
        "/food-log/text",
        json={"query": "grandma's stew", "meal_type": "dinner", "use_ai_parse": True},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            "fdc_id": None, "food_name": "grandma's stew", "brand_name": None, "serving_size": 100.0,
            "serving_unit": "g", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0,
            "sugar": 0, "sodium": 0,
        }
    ]


def test_usda_outage_is_a_503_with_a_friendly_message(client, auth_headers, monkeypatch):
    async def down(query, page_size=10):
        raise httpx.ConnectError("boom")

    monkeypatch.setattr(usda_client, "search_foods", down)
    response = client.post("/food-log/text", json={"query": "rice", "meal_type": "lunch"}, headers=auth_headers)

    assert response.status_code == 503
    assert response.json() == {"detail": "The food database is not available right now. Please try again."}


@pytest.mark.parametrize(
    "body",
    [
        {"query": "   ", "meal_type": "lunch"},
        {"query": "x" * 501, "meal_type": "lunch"},
        {"query": "rice", "meal_type": "brunch"},
        {"query": "rice"},
        {"query": "rice", "meal_type": "lunch", "use_ai_parse": "maybe"},
    ],
)
def test_text_search_validation(client, auth_headers, body):
    assert client.post("/food-log/text", json=body, headers=auth_headers).status_code == 422


# ---------- POST /barcode ----------


def test_barcode_lookup(client, auth_headers):
    response = client.post("/food-log/barcode", json={"barcode": " 012345678905 "}, headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["food_name"] == "Barcode 012345678905"
    assert body["calories"] == 130


def test_unknown_barcode_is_404(client, auth_headers, monkeypatch):
    async def not_found(upc):
        return None

    monkeypatch.setattr(usda_client, "search_by_barcode", not_found)
    response = client.post("/food-log/barcode", json={"barcode": "4006381333931"}, headers=auth_headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "No food found for barcode: 4006381333931"}


@pytest.mark.parametrize("barcode", ["", "abc", "1234567", "123456789012345", "0123-4567-8905", "12345678\n"])
def test_barcode_format_is_validated(client, auth_headers, barcode):
    response = client.post("/food-log/barcode", json={"barcode": barcode}, headers=auth_headers)
    # A trailing newline is whitespace and is stripped, so only that one is accepted.
    expected = 200 if barcode == "12345678\n" else 422
    assert response.status_code == expected


def test_barcode_lookup_ignores_invalid_usda_serving_sizes(client, auth_headers, monkeypatch):
    async def odd_serving(upc):
        return {"food_name": "Snack bar", "serving_size": 0, "serving_unit": None, "calories": 400}

    monkeypatch.setattr(usda_client, "search_by_barcode", odd_serving)
    body = client.post("/food-log/barcode", json={"barcode": "12345670"}, headers=auth_headers).json()
    assert (body["serving_size"], body["serving_unit"]) == (100, "g")


# ---------- USDA barcode matching ----------


def test_barcode_match_prefers_the_scanned_gtin():
    foods = [{"description": "Other", "gtinUpc": "111111111111"}, {"description": "Mine", "gtinUpc": "0012345678905"}]
    assert usda_client._barcode_match(foods, "012345678905")["description"] == "Mine"


def test_barcode_match_rejects_results_for_other_products():
    assert usda_client._barcode_match([{"gtinUpc": "111111111111"}], "012345678905") is None


def test_barcode_match_falls_back_to_the_first_result_without_gtins():
    assert usda_client._barcode_match([{"description": "First"}], "012345678905") == {"description": "First"}
    assert usda_client._barcode_match([], "012345678905") is None


# ---------- POST /image ----------


@pytest.mark.parametrize("image, mime", [(JPEG, "image/jpeg"), (PNG, "image/png"), (WEBP, "image/webp")])
def test_image_identification(client, auth_headers, identified, image, mime):
    response = client.post(
        "/food-log/image", json={"image_base64": b64(image), "meal_type": "lunch"}, headers=auth_headers
    )

    assert response.status_code == 200
    assert identified == [mime]
    foods = response.json()
    assert [(f["food_name"], f["serving_size"], f["serving_unit"]) for f in foods] == [
        ("chicken breast, cooked, roasted (USDA)", 150, "g"),
        ("broccoli, cooked (USDA)", 80, "g"),
    ]


def test_image_without_recognisable_food_is_422(client, auth_headers, monkeypatch):
    async def nothing(image_base64, mime_type="image/jpeg"):
        return []

    monkeypatch.setattr(advice_agent, "identify_foods_from_image", nothing)
    response = client.post(
        "/food-log/image", json={"image_base64": b64(JPEG), "meal_type": "lunch"}, headers=auth_headers
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "Could not identify food items in the image."}


INVALID_IMAGES = {
    "not-base64": (lambda: "not base64!!", 400, "Invalid base64 image."),
    "empty": (lambda: "", 422, None),
    "gif": (lambda: b64(GIF), 415, "Only JPEG, PNG or WebP images are supported."),
    "svg": (lambda: b64(b"<svg onload=alert(1)>"), 415, "Only JPEG, PNG or WebP images are supported."),
    "over-5mb": (lambda: b64(JPEG[:3] + b"\x00" * MAX_IMAGE_BYTES), 413, "Image exceeds the 5 MB limit."),
    "base64-too-long": (lambda: "A" * (MAX_BASE64_CHARS + 4), 413, "Image exceeds the 5 MB limit."),
}


@pytest.mark.parametrize("case", INVALID_IMAGES)
def test_invalid_images_are_rejected_before_any_ai_call(client, auth_headers, identified, case):
    build_image, status, detail = INVALID_IMAGES[case]
    response = client.post(
        "/food-log/image", json={"image_base64": build_image(), "meal_type": "lunch"}, headers=auth_headers
    )
    assert response.status_code == status
    if detail:
        assert response.json() == {"detail": detail}
    assert identified == []


def test_image_requires_a_valid_meal_type(client, auth_headers, identified):
    response = client.post(
        "/food-log/image", json={"image_base64": b64(JPEG), "meal_type": "supper"}, headers=auth_headers
    )
    assert response.status_code == 422


# ---------- Rate limits ----------


@pytest.mark.parametrize(
    "path, body",
    [
        ("/food-log/barcode", {"barcode": "012345678905"}),
        ("/food-log/image", {"image_base64": b64(JPEG), "meal_type": "lunch"}),
    ],
)
def test_lookups_are_rate_limited(client, auth_headers, identified, rate_limited, path, body):
    statuses = [client.post(path, json=body, headers=auth_headers).status_code for _ in range(21)]
    assert statuses[:20] == [200] * 20
    assert statuses[20] == 429


# ---------- UPC-E barcodes ----------


@pytest.mark.parametrize(
    "upce, upca",
    [
        ("04252614", "042100005264"),  # last digit 0-2: manufacturer keeps it
        ("01234531", "012300000451"),  # last digit 3
        ("01234532", None),  # wrong check digit -> not a UPC-E (could be EAN-8)
        ("00123457", "001234000057"),  # last digit 5-9
        ("12345670", "123456000070"),  # number system 1
        ("12345671", None),
        ("40063813", None),  # EAN-8 style, system digit 4
        ("012345678905", None),  # already UPC-A
    ],
)
def test_expand_upce(upce, upca):
    assert usda_client.expand_upce(upce) == upca


def test_barcode_match_accepts_the_upca_form_of_a_upce_scan():
    foods = [{"description": "Other", "gtinUpc": "011111111111"}, {"description": "Soup", "gtinUpc": "042100005264"}]
    assert usda_client._barcode_match(foods, "04252614")["description"] == "Soup"


def test_upce_lookup_also_searches_usda_with_the_upca_form(monkeypatch):
    queries = []

    def handler(request: httpx.Request) -> httpx.Response:
        query = request.url.params["query"]
        queries.append(query)
        foods = [{"fdcId": 9, "description": "Soup", "gtinUpc": "042100005264"}] if query == "042100005264" else []
        return httpx.Response(200, json={"foods": foods})

    real_client = httpx.AsyncClient
    monkeypatch.setattr(
        usda_client.httpx, "AsyncClient", lambda **kwargs: real_client(transport=httpx.MockTransport(handler))
    )
    food = asyncio.run(REAL_SEARCH_BY_BARCODE.retry_with(stop=stop_after_attempt(1))("04252614"))

    assert queries == ["04252614", "042100005264"]
    assert food["food_name"] == "Soup"


# ---------- Unexpected errors are not hidden as outages ----------


def test_programming_errors_in_usda_lookups_are_not_reported_as_503(client, auth_headers, monkeypatch):
    async def broken(query, page_size=10):
        raise KeyError("foodNutrients")

    monkeypatch.setattr(usda_client, "search_foods", broken)
    with pytest.raises(KeyError):
        client.post("/food-log/text", json={"query": "rice", "meal_type": "lunch"}, headers=auth_headers)
