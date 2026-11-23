"""Unit tests for utils/calorie_calculator.py (Mifflin-St Jeor + goal feasibility)."""

import pytest

from app.utils.calorie_calculator import (
    adjust_calories_for_goal,
    calculate_bmr,
    calculate_macros,
    calculate_nutrition_plan,
    calculate_tdee,
    validate_goal_feasibility,
)


class TestBmr:
    def test_male(self):
        # 10*80 + 6.25*180 - 5*25 + 5
        assert calculate_bmr(80, 180, 25, "male") == 1805

    def test_female(self):
        # 10*70 + 6.25*165 - 5*30 - 161
        assert calculate_bmr(70, 165, 30, "female") == 1420.25

    def test_gender_is_case_insensitive(self):
        assert calculate_bmr(80, 180, 25, "MALE") == calculate_bmr(80, 180, 25, "male")


class TestTdee:
    @pytest.mark.parametrize(
        ("level", "multiplier"),
        [
            ("sedentary", 1.2),
            ("lightly_active", 1.375),
            ("moderately_active", 1.55),
            ("very_active", 1.725),
            ("extra_active", 1.9),
        ],
    )
    def test_activity_multipliers(self, level, multiplier):
        assert calculate_tdee(1000, level) == round(1000 * multiplier, 2)

    def test_unknown_level_falls_back_to_sedentary(self):
        assert calculate_tdee(1000, "couch_potato") == 1200


class TestGoalAdjustment:
    def test_maintain_keeps_tdee(self):
        assert adjust_calories_for_goal(2200, "maintain_weight", 70, 60, 10) == 2200

    def test_lose_subtracts_daily_deficit(self):
        # 5 kg over 10 weeks = 0.5 kg/week = 550 kcal/day
        assert adjust_calories_for_goal(2200, "lose_weight", 70, 65, 10) == 1650

    def test_gain_adds_daily_surplus(self):
        assert adjust_calories_for_goal(2200, "gain_weight", 60, 65, 10) == 2750

    def test_lose_never_goes_below_1200(self):
        assert adjust_calories_for_goal(1500, "lose_weight", 70, 60, 10) == 1200

    @pytest.mark.parametrize("missing", [{"target": None}, {"weeks": None}, {"weeks": 0}])
    def test_missing_timeline_keeps_tdee(self, missing):
        target = missing.get("target", 65)
        weeks = missing.get("weeks", 10)
        assert adjust_calories_for_goal(2200, "lose_weight", 70, target, weeks) == 2200


class TestMacros:
    def test_split(self):
        macros = calculate_macros(2000, 70)
        assert macros["protein"] == 140  # 2 g/kg
        assert macros["fat"] == round(2000 * 0.25 / 9, 2)
        remaining = 2000 - 140 * 4 - macros["fat"] * 9
        assert macros["carbs"] == round(remaining / 4, 2)

    def test_carbs_never_negative(self):
        assert calculate_macros(500, 100)["carbs"] == 0


class TestFeasibility:
    def test_safe_loss(self):
        assert validate_goal_feasibility(70, 65, 10).is_feasible

    def test_exactly_the_limit_is_allowed(self):
        assert validate_goal_feasibility(80, 70, 10).is_feasible

    def test_too_fast_loss_suggests_weeks(self):
        result = validate_goal_feasibility(80, 70, 5)
        assert not result.is_feasible
        assert result.suggested_weeks == 11
        assert "safe maximum" in result.message

    def test_too_fast_gain_suggests_weeks(self):
        result = validate_goal_feasibility(60, 70, 5)
        assert not result.is_feasible
        assert result.suggested_weeks == 11

    def test_no_change_is_feasible(self):
        assert validate_goal_feasibility(70, 70, 4).is_feasible

    def test_zero_weeks_is_rejected(self):
        result = validate_goal_feasibility(80, 70, 0)
        assert not result.is_feasible
        assert result.suggested_weeks == 10


class TestNutritionPlan:
    def test_full_pipeline_matches_the_steps(self):
        plan = calculate_nutrition_plan(70, 165, 30, "female", "moderately_active", "lose_weight", 65, 10)
        assert plan.bmr == 1420.25
        assert plan.tdee == 2201.39
        assert plan.daily_calories == 1651.39
        assert plan.daily_protein == 140
        assert plan.daily_fat == 45.87
        assert plan.daily_carbs == 169.64

    def test_maintain_uses_tdee(self):
        plan = calculate_nutrition_plan(80, 180, 25, "male", "sedentary", "maintain_weight")
        assert plan.daily_calories == plan.tdee == 2166
