"""
Coach AI agent for NutriFlow: LangChain + Groq with the user's data as context.

The conversation memory is the stored chat history (passed in by coach_service), so it
survives restarts, is shared by all workers and is gone when the user clears the chat.
"""

import json
import logging
from collections.abc import Sequence
from datetime import date, timedelta

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from sqlalchemy.orm import Session

from app.models.coach_message import CoachMessage, MessageRole
from app.models.food_log import FoodLog
from app.models.goal import Goal
from app.models.user import User
from app.services.llm_config import get_groq_llm

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are NutriFlow's personal nutrition coach. You have full
access to the user's dietary data, goals, and health profile.
Your role is to provide personalised, evidence-based nutrition
and dietary advice. You are friendly, motivating, and practical.
Always tailor advice to the user's specific goal, remaining daily targets, and
food allergies. Never recommend foods the user is allergic to.
Keep responses clear, concise, and conversational. Do not use markdown formatting like bolding or lists unless necessary.

Current Context:
"""


class CoachUnavailableError(Exception):
    """The language model is not configured, failed, or returned nothing."""


def _sum(logs: Sequence[FoodLog], field: str) -> float:
    return sum(getattr(log, field) or 0 for log in logs)


def _allergy_list(stored: object) -> list[str]:
    """Allergies as a list; early Flutter rows stored the JSON list as a string."""
    if isinstance(stored, str):
        try:
            stored = json.loads(stored)
        except ValueError:
            return [stored] if stored.strip() else []
    if not isinstance(stored, list):
        return []
    return [str(item) for item in stored]


def build_user_context(db: Session, user: User, today: date | None = None) -> str:
    """The user's profile, goal and recent intake as plain text for the system prompt."""
    day = today or date.today()
    goal = db.query(Goal).filter(Goal.user_id == user.id, Goal.is_active.is_(True)).first()
    goal_text = "No active goal."
    if goal:
        goal_text = (
            f"Goal: {goal.goal_type.value}. "
            f"Start weight: {goal.start_weight}kg, Target weight: {goal.target_weight}kg. "
            f"Days remaining: {(goal.target_date - day).days} days."
        )

    today_logs = db.query(FoodLog).filter(FoodLog.user_id == user.id, FoodLog.log_date == day).all()
    today_text = (
        f"Today's intake: {_sum(today_logs, 'total_calories'):.0f} kcal, "
        f"{_sum(today_logs, 'total_protein'):.0f}g protein, "
        f"{_sum(today_logs, 'total_carbs'):.0f}g carbs, {_sum(today_logs, 'total_fat'):.0f}g fat. "
        f"Target: {user.daily_calories_target or 2000:.0f} kcal."
    )

    recent_logs = (
        db.query(FoodLog)
        .filter(FoodLog.user_id == user.id, FoodLog.log_date >= day - timedelta(days=7), FoodLog.log_date < day)
        .all()
    )
    weekly_text = (
        f"Avg calories last 7 days: {_sum(recent_logs, 'total_calories') / 7:.0f} kcal/day."
        if recent_logs
        else "No log data for the past 7 days."
    )

    allergies = ", ".join(_allergy_list(user.food_allergies)) or "None"
    return (
        "USER PROFILE:\n"
        f"Age: {user.age or 'Unknown'}, Gender: {user.gender or 'Unknown'}, "
        f"Height: {user.height_cm or 'Unknown'}cm, Weight: {user.weight_kg or 'Unknown'}kg\n"
        f"Allergies: {allergies}\n\n"
        f"GOAL STATUS:\n{goal_text}\n\n"
        f"DIETARY LOG:\n{today_text}\n{weekly_text}\n"
    )


def _as_llm_message(message: CoachMessage) -> BaseMessage:
    if message.role == MessageRole.USER:
        return HumanMessage(content=message.content)
    return AIMessage(content=message.content)


async def generate_reply(user_context: str, history: Sequence[CoachMessage], message: str) -> str:
    """The coach's answer to `message`, given the earlier chat. Raises CoachUnavailableError."""
    llm = get_groq_llm()
    if llm is None:
        raise CoachUnavailableError("No language model configured.")
    prompt = [
        SystemMessage(content=SYSTEM_PROMPT + user_context),
        *(_as_llm_message(item) for item in history),
        HumanMessage(content=message),
    ]
    try:
        response = await llm.ainvoke(prompt)
    except Exception as exc:  # provider/network errors vary by LangChain integration
        logger.warning("Coach LLM call failed: %s", type(exc).__name__)
        raise CoachUnavailableError("The language model call failed.") from exc
    reply = str(response.content).strip()
    if not reply:
        raise CoachUnavailableError("The language model returned an empty reply.")
    return reply
