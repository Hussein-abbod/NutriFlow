"""
Onboarding router for NutriFlow.
Endpoints: profile, goal, allergies, complete.
All require authentication.
"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.goal import Goal, GoalType as GoalTypeEnum
from app.schemas.onboarding import (
    ProfileData,
    GoalData,
    AllergiesData,
    GoalResponse,
    NutritionTargets,
)
from app.schemas.user import UserOut
from app.utils.security import get_current_user
from app.utils.calorie_calculator import (
    calculate_nutrition_plan,
    validate_goal_feasibility,
)

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.post(
    "/profile",
    response_model=UserOut,
    summary="Save basic profile info and activity level",
)
def save_profile(
    data: ProfileData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Step 2+3: Save full_name, age, gender, height, weight, activity_level."""
    current_user.full_name = data.full_name
    current_user.age = data.age
    current_user.gender = data.gender
    current_user.height_cm = data.height_cm
    current_user.weight_kg = data.weight_kg
    current_user.activity_level = data.activity_level
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post(
    "/goal",
    response_model=GoalResponse,
    summary="Save goal and get calculated nutrition targets",
)
def save_goal(
    data: GoalData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Step 4: Validate goal feasibility and calculate daily targets."""
    # Ensure profile basics are filled
    if not all([current_user.age, current_user.gender,
                current_user.height_cm, current_user.weight_kg,
                current_user.activity_level]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile information first.",
        )

    current_user.goal_type = data.goal_type

    # For maintain weight, no target/period needed
    if data.goal_type == "maintain_weight":
        plan = calculate_nutrition_plan(
            weight_kg=current_user.weight_kg,
            height_cm=current_user.height_cm,
            age=current_user.age,
            gender=current_user.gender,
            activity_level=current_user.activity_level.value,
            goal_type="maintain_weight",
        )
        current_user.goal_weight_kg = current_user.weight_kg
        current_user.goal_period_weeks = None
        current_user.daily_calories_target = plan.daily_calories
        current_user.daily_protein_target = plan.daily_protein
        current_user.daily_carbs_target = plan.daily_carbs
        current_user.daily_fat_target = plan.daily_fat
        db.commit()
        db.refresh(current_user)

        return GoalResponse(
            is_feasible=True,
            message="Maintain your current weight — great choice!",
            targets=NutritionTargets(
                daily_calories=plan.daily_calories,
                daily_protein=plan.daily_protein,
                daily_carbs=plan.daily_carbs,
                daily_fat=plan.daily_fat,
            ),
        )

    # For gain/lose — validate feasibility
    if not data.target_weight_kg or not data.goal_period_weeks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target weight and goal period are required for gain/lose goals.",
        )

    validation = validate_goal_feasibility(
        current_weight_kg=current_user.weight_kg,
        target_weight_kg=data.target_weight_kg,
        period_weeks=data.goal_period_weeks,
    )

    if not validation.is_feasible:
        return GoalResponse(
            is_feasible=False,
            message=validation.message,
            suggested_weeks=validation.suggested_weeks,
        )

    # Feasible — calculate plan
    plan = calculate_nutrition_plan(
        weight_kg=current_user.weight_kg,
        height_cm=current_user.height_cm,
        age=current_user.age,
        gender=current_user.gender,
        activity_level=current_user.activity_level.value,
        goal_type=data.goal_type,
        target_weight_kg=data.target_weight_kg,
        period_weeks=data.goal_period_weeks,
    )

    current_user.goal_weight_kg = data.target_weight_kg
    current_user.goal_period_weeks = data.goal_period_weeks
    current_user.daily_calories_target = plan.daily_calories
    current_user.daily_protein_target = plan.daily_protein
    current_user.daily_carbs_target = plan.daily_carbs
    current_user.daily_fat_target = plan.daily_fat
    db.commit()
    db.refresh(current_user)

    return GoalResponse(
        is_feasible=True,
        message=validation.message,
        targets=NutritionTargets(
            daily_calories=plan.daily_calories,
            daily_protein=plan.daily_protein,
            daily_carbs=plan.daily_carbs,
            daily_fat=plan.daily_fat,
        ),
    )


@router.post(
    "/allergies",
    response_model=UserOut,
    summary="Save food allergies",
)
def save_allergies(
    data: AllergiesData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Step 5: Save the food allergies list."""
    current_user.food_allergies = data.food_allergies
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post(
    "/complete",
    response_model=UserOut,
    summary="Mark onboarding as complete and create first Goal",
)
def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Step 6: Mark profile complete and create the active Goal record."""
    # Validate all required fields are present
    required = [
        current_user.full_name,
        current_user.age,
        current_user.gender,
        current_user.height_cm,
        current_user.weight_kg,
        current_user.activity_level,
        current_user.goal_type,
        current_user.daily_calories_target,
    ]
    if not all(required):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete all onboarding steps before finishing.",
        )

    # Create the first active Goal record
    goal_type_value = current_user.goal_type
    if isinstance(goal_type_value, str):
        goal_type_enum = GoalTypeEnum(goal_type_value)
    else:
        goal_type_enum = GoalTypeEnum(goal_type_value.value)

    start_date_val = date.today()
    if current_user.goal_period_weeks:
        target_date_val = start_date_val + timedelta(
            weeks=current_user.goal_period_weeks
        )
    else:
        # Maintain weight — set target 12 weeks out as default
        target_date_val = start_date_val + timedelta(weeks=12)

    goal = Goal(
        user_id=current_user.id,
        goal_type=goal_type_enum,
        start_weight=current_user.weight_kg,
        target_weight=current_user.goal_weight_kg or current_user.weight_kg,
        start_date=start_date_val,
        target_date=target_date_val,
        daily_calories=current_user.daily_calories_target,
        daily_protein=current_user.daily_protein_target,
        daily_carbs=current_user.daily_carbs_target,
        daily_fat=current_user.daily_fat_target,
        is_active=True,
        notes="Initial goal from onboarding",
    )
    db.add(goal)

    current_user.is_profile_complete = True
    db.commit()
    db.refresh(current_user)
    return current_user
