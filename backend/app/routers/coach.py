"""
Coach AI router for NutriFlow.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.coach_message import CoachMessage, MessageRole
from app.utils.security import get_current_user
from app.services.coach_agent import generate_coach_response

router = APIRouter(prefix="/coach", tags=["Coach AI"])

class MessageRequest(BaseModel):
    message: str = Field(..., min_length=1)
    is_initial_context: bool = Field(False, description="True if this is the automated opening message from meal advice")
    advice_content: Optional[str] = Field(None, description="The advice text if is_initial_context is True")

class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    
    model_config = {"from_attributes": True}

@router.post("/message", response_model=MessageOut)
def send_message(
    data: MessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message to the Coach AI and get a response."""
    
    if data.is_initial_context and data.advice_content:
        # Save the advice as an AI message first so it appears in chat
        advice_msg = CoachMessage(
            user_id=current_user.id,
            role=MessageRole.ASSISTANT,
            content=data.advice_content
        )
        db.add(advice_msg)
        
        # We don't save the system prompt sent to the LLM in the DB for the user to see,
        # we just pass it to the agent to build context in memory
        agent_response = generate_coach_response(db, current_user, data.message)
        
        # Save the agent's acknowledgment
        reply_msg = CoachMessage(
            user_id=current_user.id,
            role=MessageRole.ASSISTANT,
            content=agent_response
        )
        db.add(reply_msg)
        db.commit()
        db.refresh(reply_msg)
        return reply_msg

    else:
        # Normal chat flow
        user_msg = CoachMessage(
            user_id=current_user.id,
            role=MessageRole.USER,
            content=data.message
        )
        db.add(user_msg)
        db.commit() # Commit to get ID
        
        # Generate response
        agent_response = generate_coach_response(db, current_user, data.message)
        
        reply_msg = CoachMessage(
            user_id=current_user.id,
            role=MessageRole.ASSISTANT,
            content=agent_response
        )
        db.add(reply_msg)
        db.commit()
        db.refresh(reply_msg)
        
        return reply_msg

@router.get("/history", response_model=List[MessageOut])
def get_history(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get recent chat history."""
    messages = db.query(CoachMessage).filter(
        CoachMessage.user_id == current_user.id
    ).order_by(CoachMessage.created_at.desc()).limit(limit).all()
    
    # Return in chronological order
    return list(reversed(messages))

@router.delete("/history", status_code=204)
def clear_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear all chat history for the current user."""
    from app.services.coach_agent import clear_user_memory
    
    # 1. Clear LLM memory
    clear_user_memory(current_user.id)
    
    # 2. Delete from database
    db.query(CoachMessage).filter(CoachMessage.user_id == current_user.id).delete()
    db.commit()
    return None
