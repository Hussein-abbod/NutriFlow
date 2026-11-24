"""Pydantic schemas for the Coach AI endpoints (mirrored by frontend/src/features/coach/schemas)."""

from datetime import datetime
from typing import Annotated, Optional

from pydantic import BaseModel, Field, StringConstraints, model_validator

from app.models.coach_message import MessageRole

MESSAGE_MAX_LENGTH = 2000
HISTORY_DEFAULT_LIMIT = 20
HISTORY_MAX_LIMIT = 100

CoachText = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=MESSAGE_MAX_LENGTH)
]


class CoachMessageRequest(BaseModel):
    """
    A chat message, or (with `food_log_id`) the opening of a chat about the AI advice of one
    of the user's logged meals ("Discuss with Coach AI"). The advice is read from the food
    log on the server, never taken from the client.
    """
    message: Optional[CoachText] = None
    food_log_id: Optional[int] = Field(None, ge=1)

    @model_validator(mode="after")
    def _message_or_meal(self) -> "CoachMessageRequest":
        if (self.message is None) == (self.food_log_id is None):
            raise ValueError("Send either a message or the food log to discuss.")
        return self


class CoachMessageOut(BaseModel):
    id: int
    role: MessageRole
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
