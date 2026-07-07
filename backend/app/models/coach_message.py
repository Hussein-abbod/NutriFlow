"""Coach message model for NutriFlow."""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base

class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"

class CoachMessage(Base):
    """Conversation history for Coach AI."""

    __tablename__ = "coach_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role = Column(Enum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User")

    def __repr__(self) -> str:
        return f"<CoachMessage id={self.id} user_id={self.user_id} role={self.role}>"
