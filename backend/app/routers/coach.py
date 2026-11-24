"""Coach AI router for NutriFlow (HTTP only; logic in services/coach_service.py)."""

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.limiter import AI_RATE_LIMIT, limiter
from app.models.user import User
from app.schemas.coach import HISTORY_DEFAULT_LIMIT, HISTORY_MAX_LIMIT, CoachMessageOut, CoachMessageRequest
from app.services import coach_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/coach", tags=["Coach AI"])


@router.post("/message", response_model=CoachMessageOut, summary="Ask the Coach AI")
@limiter.limit(AI_RATE_LIMIT)
async def send_message(
    request: Request,
    data: CoachMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message (or open a chat about a meal's advice) and get the coach's reply."""
    return await coach_service.send_message(db, current_user, data)


@router.get("/history", response_model=list[CoachMessageOut], summary="Recent chat history")
def get_history(
    limit: int = Query(HISTORY_DEFAULT_LIMIT, ge=1, le=HISTORY_MAX_LIMIT),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The user's last `limit` messages, oldest first."""
    return coach_service.recent_messages(db, current_user, limit)


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT, summary="Clear chat history")
def clear_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    coach_service.clear_history(db, current_user)
