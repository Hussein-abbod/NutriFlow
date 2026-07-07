"""
Post-meal AI advice agent for NutriFlow.
Uses LangChain + Groq (llama-3.3-70b-versatile) to generate
personalised 3-4 sentence feedback about a logged meal.
"""

from app.services.llm_config import get_groq_llm


def generate_meal_advice(
    meal_type: str,
    food_items_summary: str,
    calories: float,
    protein: float,
    carbs: float,
    fat: float,
    remaining_calories: float,
    remaining_protein: float,
    goal_type: str,
    allergies: list[str],
) -> str:
    """
    Generate concise post-meal AI advice.
    Falls back to a static message if LLM is unavailable.
    """
    llm = get_groq_llm()
    if llm is None:
        return (
            f"You logged {meal_type} with {round(calories)} kcal. "
            f"You have {round(remaining_calories)} kcal remaining today. "
            "Keep tracking your meals to stay on target!"
        )

    system_prompt = (
        "You are NutriFlow's nutrition advisor. Your role is to give users "
        "immediate, friendly, and practical feedback about their meals. "
        "Always consider their health goal, remaining daily targets, and food allergies. "
        "Be encouraging but honest. Keep advice concise (3-4 sentences max). "
        "Never recommend foods the user is allergic to."
    )

    allergies_str = ", ".join(allergies) if allergies else "None"
    user_prompt = (
        f"User just logged {meal_type}.\n"
        f"Goal: {goal_type}.\n"
        f"Meal: {food_items_summary}.\n"
        f"Nutritional values: {round(calories)}kcal, {round(protein)}g protein, "
        f"{round(carbs)}g carbs, {round(fat)}g fat.\n"
        f"Remaining today: {round(remaining_calories)}kcal, {round(remaining_protein)}g protein.\n"
        f"Allergies: {allergies_str}.\n"
        "Please give immediate advice about this meal and suggest what to eat for the next meal."
    )

    try:
        from langchain_core.messages import SystemMessage, HumanMessage
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ])
        return response.content.strip()
    except Exception as e:
        return (
            f"You logged {meal_type} with {round(calories)} kcal. "
            f"You have {round(remaining_calories)} kcal remaining today. "
            "Keep up the great work!"
        )


async def identify_foods_from_image(image_base64: str) -> list[dict]:
    """
    Use Gemini 1.5 Flash to identify food items from a base64 image.
    Returns a list of dicts: [{food_name, estimated_quantity, unit}]
    """
    from app.services.llm_config import get_gemini_llm
    from langchain_core.messages import HumanMessage
    import json
    import re

    llm = get_gemini_llm()
    if llm is None:
        return []

    prompt = (
        "You are a food identification expert. Carefully analyze this meal image.\n"
        "Identify every distinct food item visible. For each item:\n"
        "1. Give a specific, USDA-style food name that includes the cooking method "
        "(e.g. 'chicken breast, cooked, roasted' — NOT just 'chicken').\n"
        "2. ALWAYS estimate portion weight in GRAMS (unit must be 'g'). "
        "Never use oz, cups, or pieces — convert everything to grams.\n"
        "3. Use these visual references for gram estimates:\n"
        "   - 1 chicken breast \u2248 150g, 1 egg \u2248 60g, 1 apple \u2248 180g\n"
        "   - 1 banana \u2248 120g, 1 cup of rice (cooked) \u2248 200g\n"
        "   - 1 cup of milk \u2248 240g, 1 slice of bread \u2248 30g\n"
        "   - 1 medium potato \u2248 150g, 1 oz of meat \u2248 28g\n\n"
        "Return ONLY a valid JSON array with no other text:\n"
        '[{"food_name": "chicken breast, cooked, roasted", "estimated_quantity": 150, "unit": "g"}]\n'
        "Do not include any explanation or text outside the JSON array."
    )

    try:
        message = HumanMessage(content=[
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
        ])
        response = llm.invoke([message])
        text = response.content.strip()

        # Extract JSON from response
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        return []
    except Exception:
        return []


async def parse_food_text(text: str) -> list[dict]:
    """
    Use Groq to parse a free-text meal description into structured food items.
    Returns: [{food_name, quantity, unit}]  — unit is ALWAYS 'g'.
    """
    import json
    import re

    llm = get_groq_llm()
    if llm is None:
        return [{"food_name": text, "quantity": 100.0, "unit": "g"}]

    from langchain_core.messages import SystemMessage, HumanMessage

    system = (
        "You are a nutrition expert that converts meal descriptions into structured data "
        "for USDA FoodData Central lookup.\n\n"
        "Rules:\n"
        "1. Keep the NATURAL unit the user described. Use these units only:\n"
        "   'g', 'oz', 'lb', 'ml', 'cup', 'tbsp', 'tsp', 'slice', 'egg', 'piece', 'bowl'\n"
        "2. Use specific, USDA-style food names that include the cooking method:\n"
        "   Good: 'egg, whole, raw' | Bad: 'egg'\n"
        "   Good: 'milk, whole, 3.25% milkfat' | Bad: 'milk'\n"
        "   Good: 'bread, white, commercially prepared, toasted' | Bad: 'toast'\n"
        "   Good: 'chicken breast, cooked, roasted' | Bad: 'chicken'\n"
        "3. Extract the quantity exactly as the user said it:\n"
        "   '5 eggs' → quantity: 5, unit: 'egg'\n"
        "   'a cup of milk' → quantity: 1, unit: 'cup'\n"
        "   '5 toast' → quantity: 5, unit: 'slice'\n"
        "   '200g rice' → quantity: 200, unit: 'g'\n"
        "   '2 tbsp olive oil' → quantity: 2, unit: 'tbsp'\n"
        "4. Return ONLY a valid JSON array — no explanation, no markdown.\n\n"
        "Example input: 'I had 2 eggs and a cup of milk with 2 slices of toast'\n"
        'Example output: [{"food_name": "egg, whole, raw", "quantity": 2, "unit": "egg"}, '
        '{"food_name": "milk, whole, 3.25% milkfat", "quantity": 1, "unit": "cup"}, '
        '{"food_name": "bread, white, commercially prepared, toasted", "quantity": 2, "unit": "slice"}]'
    )

    try:
        response = llm.invoke([
            SystemMessage(content=system),
            HumanMessage(content=f"Parse this meal description into USDA food items: {text}"),
        ])
        raw = response.content.strip()
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            items = json.loads(match.group())
            # Normalise: ensure unit is always 'g' and quantity is a positive float
            cleaned = []
            for item in items:
                food_name = str(item.get("food_name", "")).strip()
                quantity = float(item.get("quantity", 100))
                unit = str(item.get("unit", "g")).lower().strip()
                if not food_name:
                    continue
                # Reject zero/negative quantities
                if quantity <= 0:
                    quantity = 100.0
                cleaned.append({"food_name": food_name, "quantity": quantity, "unit": unit})
            return cleaned if cleaned else [{"food_name": text, "quantity": 100.0, "unit": "g"}]
        return [{"food_name": text, "quantity": 100.0, "unit": "g"}]
    except Exception:
        return [{"food_name": text, "quantity": 100.0, "unit": "g"}]
