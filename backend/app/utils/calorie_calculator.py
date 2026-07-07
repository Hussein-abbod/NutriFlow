"""
Calorie & macro calculator for NutriFlow.

Uses the Mifflin-St Jeor equation and validates goal feasibility.
"""

from dataclasses import dataclass
from typing import Optional

# Activity multipliers
ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "lightly_active": 1.375,
    "moderately_active": 1.55,
    "very_active": 1.725,
    "extra_active": 1.9,
}

# Safety limits
MAX_SAFE_WEIGHT_LOSS_KG_PER_WEEK = 1.0
MAX_SAFE_WEIGHT_GAIN_KG_PER_WEEK = 1.0


@dataclass
class NutritionPlan:
    """Calculated nutrition plan."""
    bmr: float
    tdee: float
    daily_calories: float
    daily_protein: float  # grams
    daily_carbs: float    # grams
    daily_fat: float      # grams


@dataclass
class GoalValidation:
    """Result of goal feasibility check."""
    is_feasible: bool
    message: str
    suggested_weeks: Optional[int] = None


def calculate_bmr(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
) -> float:
    """
    Calculate Basal Metabolic Rate using Mifflin-St Jeor equation.

    Men:   BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
    Women: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
    """
    bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
    if gender.lower() == "male":
        bmr += 5
    else:
        bmr -= 161
    return round(bmr, 2)


def calculate_tdee(bmr: float, activity_level: str) -> float:
    """Multiply BMR by activity factor to get Total Daily Energy Expenditure."""
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level.lower(), 1.2)
    return round(bmr * multiplier, 2)


def adjust_calories_for_goal(
    tdee: float, 
    goal_type: str,
    current_weight_kg: float = None,
    target_weight_kg: float = None,
    period_weeks: int = None
) -> float:
    """
    Adjust TDEE based on weight goal and timeline.
    1 kg weight change requires approx 7700 kcal deficit/surplus.
    Daily adjustment = (rate_per_week * 7700) / 7 = rate_per_week * 1100
    """
    if goal_type == "maintain_weight" or not current_weight_kg or not target_weight_kg or not period_weeks:
        return round(tdee, 2)
        
    abs_diff = abs(target_weight_kg - current_weight_kg)
    rate_per_week = abs_diff / period_weeks if period_weeks > 0 else 0
    daily_adjustment = rate_per_week * 1100
    
    if goal_type == "lose_weight":
        # Hard limit: don't suggest below 1200 calories
        return max(round(tdee - daily_adjustment, 2), 1200.0)
    elif goal_type == "gain_weight":
        return round(tdee + daily_adjustment, 2)
        
    return round(tdee, 2)


def calculate_macros(
    daily_calories: float, weight_kg: float
) -> dict[str, float]:
    """
    Calculate macro split:
    - Protein: 2 g per kg body weight
    - Fat:     25% of total calories ÷ 9
    - Carbs:   remaining calories ÷ 4
    """
    protein_g = round(2.0 * weight_kg, 2)
    fat_g = round((daily_calories * 0.25) / 9, 2)
    remaining_cals = daily_calories - (protein_g * 4) - (fat_g * 9)
    carbs_g = round(max(remaining_cals, 0) / 4, 2)
    return {"protein": protein_g, "fat": fat_g, "carbs": carbs_g}


def validate_goal_feasibility(
    current_weight_kg: float,
    target_weight_kg: float,
    period_weeks: int,
) -> GoalValidation:
    """
    Check whether the user's goal is safe and realistic.

    Safety limits:
    - Maximum safe weight loss: 1 kg per week
    - Maximum safe weight gain: 0.5 kg per week
    """
    weight_diff = target_weight_kg - current_weight_kg
    abs_diff = abs(weight_diff)

    if period_weeks <= 0:
        return GoalValidation(
            is_feasible=False,
            message="Goal period must be at least 1 week.",
            suggested_weeks=max(1, int(abs_diff / MAX_SAFE_WEIGHT_LOSS_KG_PER_WEEK)),
        )

    rate_per_week = abs_diff / period_weeks

    # Losing weight
    if weight_diff < 0:
        if rate_per_week > MAX_SAFE_WEIGHT_LOSS_KG_PER_WEEK:
            suggested = int(abs_diff / MAX_SAFE_WEIGHT_LOSS_KG_PER_WEEK) + 1
            return GoalValidation(
                is_feasible=False,
                message=(
                    f"Losing {abs_diff:.1f} kg in {period_weeks} weeks "
                    f"requires losing {rate_per_week:.2f} kg/week, which exceeds "
                    f"the safe maximum of {MAX_SAFE_WEIGHT_LOSS_KG_PER_WEEK} kg/week. "
                    f"A realistic timeline would be at least {suggested} weeks "
                    f"({suggested // 4} months)."
                ),
                suggested_weeks=suggested,
            )

    # Gaining weight
    elif weight_diff > 0:
        if rate_per_week > MAX_SAFE_WEIGHT_GAIN_KG_PER_WEEK:
            suggested = int(abs_diff / MAX_SAFE_WEIGHT_GAIN_KG_PER_WEEK) + 1
            return GoalValidation(
                is_feasible=False,
                message=(
                    f"Gaining {abs_diff:.1f} kg in {period_weeks} weeks "
                    f"requires gaining {rate_per_week:.2f} kg/week, which exceeds "
                    f"the safe maximum of {MAX_SAFE_WEIGHT_GAIN_KG_PER_WEEK} kg/week. "
                    f"A realistic timeline would be at least {suggested} weeks "
                    f"({suggested // 4} months)."
                ),
                suggested_weeks=suggested,
            )

    return GoalValidation(
        is_feasible=True,
        message="Your goal is realistic and safe. Let's do this!",
    )


def calculate_nutrition_plan(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
    activity_level: str,
    goal_type: str,
    target_weight_kg: float = None,
    period_weeks: int = None,
) -> NutritionPlan:
    """
    Full pipeline: BMR → TDEE → goal adjustment → macro split.

    Returns a NutritionPlan dataclass.
    """
    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    tdee = calculate_tdee(bmr, activity_level)
    daily_calories = adjust_calories_for_goal(
        tdee, goal_type, weight_kg, target_weight_kg, period_weeks
    )
    macros = calculate_macros(daily_calories, weight_kg)

    return NutritionPlan(
        bmr=bmr,
        tdee=tdee,
        daily_calories=daily_calories,
        daily_protein=macros["protein"],
        daily_carbs=macros["carbs"],
        daily_fat=macros["fat"],
    )
