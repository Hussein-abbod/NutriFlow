"""
Coach AI chat: send a message, read and clear the history. Every query is scoped to the
authenticated user.
"""

from fastapi import HTTPException, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.models.coach_message import CoachMessage, MessageRole
from app.models.food_log import FoodLog
from app.models.user import User
from app.schemas.coach import CoachMessageRequest
from app.services import coach_agent

# Earlier messages the model sees (10 exchanges), like the old window memory.
MEMORY_WINDOW = 20
COACH_UNAVAILABLE = "Coach AI is unavailable right now. Please try again in a moment."


def recent_messages(db: Session, user: User, limit: int) -> list[CoachMessage]:
    """The user's last `limit` messages, oldest first."""
    newest_first = (
        db.query(CoachMessage)
        .filter(CoachMessage.user_id == user.id)
        .order_by(CoachMessage.created_at.desc(), CoachMessage.id.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(newest_first))


def _advice_to_discuss(db: Session, user: User, food_log_id: int) -> str:
    log = db.query(FoodLog).filter(FoodLog.id == food_log_id, FoodLog.user_id == user.id).first()
    if log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food log not found")
    if not log.ai_advice:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This meal has no advice to discuss.")
    return log.ai_advice


def _prepare(db: Session, user: User, data: CoachMessageRequest):
    """The model's input: (user context, earlier messages, prompt, message to store first)."""
    history = recent_messages(db, user, MEMORY_WINDOW)
    if data.food_log_id is not None:
        advice = _advice_to_discuss(db, user, data.food_log_id)
        prompt = (
            f"The user wants to discuss this meal advice: {advice}. "
            "Acknowledge it briefly and wait for the user's question or feedback."
        )
        opening = CoachMessage(user_id=user.id, role=MessageRole.ASSISTANT, content=advice)
        history = [*history, opening]
    else:
        prompt = data.message
        opening = CoachMessage(user_id=user.id, role=MessageRole.USER, content=data.message)
    return coach_agent.build_user_context(db, user), history, prompt, opening


def _store(db: Session, user: User, opening: CoachMessage, reply_text: str) -> CoachMessage:
    reply = CoachMessage(user_id=user.id, role=MessageRole.ASSISTANT, content=reply_text)
    db.add(opening)
    db.flush()  # the opening gets the lower id, so it sorts first within the same second
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return reply


async def send_message(db: Session, user: User, data: CoachMessageRequest) -> CoachMessage:
    """
    Ask the coach and store the exchange. Nothing is stored when the model fails (503), so
    a retry does not duplicate the question.

    With `food_log_id` the meal's advice is added to the chat as a coach message and the
    coach acknowledges it; the instruction sent to the model is not stored. Database work
    runs in the threadpool (sync session), so it never blocks the event loop.
    """
    context, history, prompt, opening = await run_in_threadpool(_prepare, db, user, data)
    try:
        reply_text = await coach_agent.generate_reply(context, history, prompt)
    except coach_agent.CoachUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=COACH_UNAVAILABLE) from exc
    return await run_in_threadpool(_store, db, user, opening, reply_text)


def clear_history(db: Session, user: User) -> None:
    db.query(CoachMessage).filter(CoachMessage.user_id == user.id).delete()
    db.commit()
