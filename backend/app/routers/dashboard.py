"""
Dashboard router for NutriFlow (HTTP only; logic lives in services/dashboard_service.py).
"""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.dashboard import (
    DailyCalories,
    ExtendGoalRequest,
    GoalProgressOut,
    MessageOut,
    TodaySummaryOut,
)
from app.services import dashboard_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/today", response_model=TodaySummaryOut, summary="Today's calories, macros and meals")
def get_today_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dashboard_service.today_summary(db, current_user)


@router.get("/weekly", response_model=List[DailyCalories], summary="Calories for the last 7 days")
def get_weekly_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dashboard_service.weekly_summary(db, current_user)


@router.get("/goal-progress", response_model=GoalProgressOut, summary="Active goal and progress")
def get_goal_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dashboard_service.goal_progress(db, current_user)


@router.put("/reset-goal", response_model=MessageOut, summary="End the goal and restart onboarding")
def reset_goal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboard_service.reset_goal(db, current_user)
    return MessageOut(message="Goal reset successfully")


@router.put("/extend-goal", response_model=MessageOut, summary="Extend the goal by N weeks")
def extend_goal(
    data: ExtendGoalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboard_service.extend_goal(db, current_user, data.extra_weeks)
    return MessageOut(message="Goal extended successfully")
