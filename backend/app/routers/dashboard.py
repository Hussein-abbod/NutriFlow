"""
Dashboard router for NutriFlow.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List, Dict, Any
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.goal import Goal
from app.models.food_log import FoodLog
from app.utils.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# ---------- Schemas ----------

class MacroSummary(BaseModel):
    consumed: float
    target: float

class MealSummary(BaseModel):
    calories: float
    target: float

class TodaySummaryOut(BaseModel):
    calories_consumed: float
    calories_target: float
    protein: MacroSummary
    carbs: MacroSummary
    fat: MacroSummary
    meals: Dict[str, MealSummary]

class DailyCalories(BaseModel):
    date: date
    calories: float

class GoalProgressOut(BaseModel):
    has_active_goal: bool
    goal_type: str = ""
    start_weight: float = 0
    current_weight: float = 0
    target_weight: float = 0
    days_remaining: int = 0
    start_date: date | None = None
    target_date: date | None = None

class ExtendGoalRequest(BaseModel):
    extra_weeks: int

# ---------- Endpoints ----------

@router.get("/today", response_model=TodaySummaryOut)
def get_today_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Full today nutrition summary including macros and meals."""
    today = date.today()
    logs = db.query(FoodLog).filter(
        FoodLog.user_id == current_user.id,
        FoodLog.log_date == today
    ).all()

    total_cal = sum(log.total_calories or 0 for log in logs)
    total_pro = sum(log.total_protein or 0 for log in logs)
    total_carbs = sum(log.total_carbs or 0 for log in logs)
    total_fat = sum(log.total_fat or 0 for log in logs)

    daily_cal = current_user.daily_calories_target or 2000
    
    meals = {"breakfast": 0.0, "lunch": 0.0, "snack": 0.0, "dinner": 0.0}
    for log in logs:
        meal = log.meal_type.value if hasattr(log.meal_type, "value") else log.meal_type
        if meal in meals:
            meals[meal] += log.total_calories or 0

    return TodaySummaryOut(
        calories_consumed=total_cal,
        calories_target=daily_cal,
        protein=MacroSummary(consumed=total_pro, target=current_user.daily_protein_target or 50),
        carbs=MacroSummary(consumed=total_carbs, target=current_user.daily_carbs_target or 250),
        fat=MacroSummary(consumed=total_fat, target=current_user.daily_fat_target or 65),
        meals={
            "breakfast": MealSummary(calories=meals["breakfast"], target=daily_cal * 0.25),
            "lunch": MealSummary(calories=meals["lunch"], target=daily_cal * 0.35),
            "snack": MealSummary(calories=meals["snack"], target=daily_cal * 0.10),
            "dinner": MealSummary(calories=meals["dinner"], target=daily_cal * 0.30),
        }
    )

@router.get("/weekly", response_model=List[DailyCalories])
def get_weekly_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Last 7 days calorie data."""
    today = date.today()
    start_date = today - timedelta(days=6)
    
    logs = db.query(FoodLog).filter(
        FoodLog.user_id == current_user.id,
        FoodLog.log_date >= start_date,
        FoodLog.log_date <= today
    ).all()
    
    daily_totals = {start_date + timedelta(days=i): 0.0 for i in range(7)}
    for log in logs:
        daily_totals[log.log_date] += log.total_calories or 0
        
    return [
        DailyCalories(date=d, calories=c) 
        for d, c in sorted(daily_totals.items())
    ]

@router.get("/goal-progress", response_model=GoalProgressOut)
def get_goal_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Current goal status and progress."""
    active_goal = db.query(Goal).filter(
        Goal.user_id == current_user.id, Goal.is_active == True
    ).first()
    
    if not active_goal:
        return GoalProgressOut(has_active_goal=False)
        
    days_rem = (active_goal.target_date - date.today()).days
    
    return GoalProgressOut(
        has_active_goal=True,
        goal_type=active_goal.goal_type.value,
        start_weight=active_goal.start_weight,
        current_weight=current_user.weight_kg or active_goal.start_weight,
        target_weight=active_goal.target_weight,
        days_remaining=max(0, days_rem),
        start_date=active_goal.start_date,
        target_date=active_goal.target_date
    )

@router.put("/reset-goal")
def reset_goal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deactivate current goal, requiring user to set a new one."""
    active_goal = db.query(Goal).filter(
        Goal.user_id == current_user.id, Goal.is_active == True
    ).first()
    
    if active_goal:
        active_goal.is_active = False
        db.commit()
        
    # Also unset user targets and profile complete flag so they get routed to onboarding
    current_user.is_profile_complete = False
    db.commit()
    return {"message": "Goal reset successfully"}

@router.put("/extend-goal")
def extend_goal(
    data: ExtendGoalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Extend goal period by X weeks."""
    active_goal = db.query(Goal).filter(
        Goal.user_id == current_user.id, Goal.is_active == True
    ).first()
    
    if not active_goal:
        raise HTTPException(status_code=404, detail="No active goal found")
        
    active_goal.target_date = active_goal.target_date + timedelta(weeks=data.extra_weeks)
    active_goal.is_extended = True
    current_user.goal_period_weeks = (current_user.goal_period_weeks or 0) + data.extra_weeks
    
    # Recalculate daily targets based on new timeline
    from app.utils.calorie_calculator import calculate_daily_targets
    try:
        targets = calculate_daily_targets(
            weight_kg=current_user.weight_kg,
            height_cm=current_user.height_cm,
            age=current_user.age,
            gender=current_user.gender,
            activity_level=current_user.activity_level.value,
            goal_type=active_goal.goal_type.value,
            target_weight_kg=active_goal.target_weight,
            goal_period_weeks=current_user.goal_period_weeks
        )
        
        current_user.daily_calories_target = targets["calories"]
        current_user.daily_protein_target = targets["protein"]
        current_user.daily_carbs_target = targets["carbs"]
        current_user.daily_fat_target = targets["fat"]
        
        active_goal.daily_calories = targets["calories"]
        active_goal.daily_protein = targets["protein"]
        active_goal.daily_carbs = targets["carbs"]
        active_goal.daily_fat = targets["fat"]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    db.commit()
    return {"message": "Goal extended successfully"}
