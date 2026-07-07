"""
Coach AI agent for NutriFlow.
Uses LangChain + Groq to provide personalized nutrition advice.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import date, timedelta

from app.services.llm_config import get_groq_llm
from app.models.user import User
from app.models.goal import Goal
from app.models.food_log import FoodLog
from app.models.coach_message import CoachMessage

from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

# Store conversation memory per user ID
_user_histories: Dict[int, InMemoryChatMessageHistory] = {}

def get_session_history(session_id: str):
    """Get or create InMemoryChatMessageHistory for a user."""
    user_id = int(session_id)
    if user_id not in _user_histories:
        _user_histories[user_id] = InMemoryChatMessageHistory()
    
    # Keep only the last 20 messages (10 exchanges) to simulate window memory
    if len(_user_histories[user_id].messages) > 20:
        _user_histories[user_id].messages = _user_histories[user_id].messages[-20:]
        
    return _user_histories[user_id]

def clear_user_memory(user_id: int):
    """Clear the in-memory chat history for a user."""
    if user_id in _user_histories:
        _user_histories[user_id].clear()

def get_user_context(db: Session, user: User) -> str:
    """Compile all relevant user data into a prompt context."""
    # Active goal
    active_goal = db.query(Goal).filter(
        Goal.user_id == user.id, Goal.is_active == True
    ).first()
    
    goal_str = "No active goal."
    if active_goal:
        goal_str = (
            f"Goal: {active_goal.goal_type.value}. "
            f"Start weight: {active_goal.start_weight}kg, Target weight: {active_goal.target_weight}kg. "
            f"Days remaining: {(active_goal.target_date - date.today()).days} days."
        )

    # Today's logs
    today = date.today()
    today_logs = db.query(FoodLog).filter(
        FoodLog.user_id == user.id, FoodLog.log_date == today
    ).all()
    
    today_cal = sum(log.total_calories or 0 for log in today_logs)
    today_pro = sum(log.total_protein or 0 for log in today_logs)
    today_carbs = sum(log.total_carbs or 0 for log in today_logs)
    today_fat = sum(log.total_fat or 0 for log in today_logs)
    
    today_str = (
        f"Today's intake: {today_cal:.0f} kcal, {today_pro:.0f}g protein, "
        f"{today_carbs:.0f}g carbs, {today_fat:.0f}g fat. "
        f"Target: {user.daily_calories_target or 2000:.0f} kcal."
    )

    # Last 7 days summary
    seven_days_ago = today - timedelta(days=7)
    recent_logs = db.query(FoodLog).filter(
        FoodLog.user_id == user.id, 
        FoodLog.log_date >= seven_days_ago,
        FoodLog.log_date < today
    ).all()
    
    if recent_logs:
        avg_cal = sum(log.total_calories or 0 for log in recent_logs) / 7
        weekly_str = f"Avg calories last 7 days: {avg_cal:.0f} kcal/day."
    else:
        weekly_str = "No log data for the past 7 days."

    # Profile
    allergies = user.food_allergies or []
    if isinstance(allergies, str):
        import json
        try:
            allergies = json.loads(allergies)
        except:
            allergies = []
    
    allergies_str = ", ".join(allergies) if allergies else "None"

    context = f"""
    USER PROFILE:
    Age: {user.age or 'Unknown'}, Gender: {user.gender or 'Unknown'}, 
    Height: {user.height_cm or 'Unknown'}cm, Weight: {user.weight_kg or 'Unknown'}kg
    Allergies: {allergies_str}
    
    GOAL STATUS:
    {goal_str}
    
    DIETARY LOG:
    {today_str}
    {weekly_str}
    """
    return context

def generate_coach_response(db: Session, user: User, message: str) -> str:
    """Generate a response using the Coach AI agent."""
    llm = get_groq_llm()
    if not llm:
        return "I'm currently unavailable. Please check your API keys."

    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

    user_context = get_user_context(db, user)
    
    system_prompt = f"""You are NutriFlow's personal nutrition coach. You have full 
access to the user's dietary data, goals, and health profile. 
Your role is to provide personalised, evidence-based nutrition 
and dietary advice. You are friendly, motivating, and practical. 
Always tailor advice to the user's specific goal, remaining daily targets, and 
food allergies. Never recommend foods the user is allergic to. 
Keep responses clear, concise, and conversational. Do not use markdown formatting like bolding or lists unless necessary.

Current Context:
{user_context}
"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}")
    ])
    
    # New LCEL syntax
    chain = prompt | llm
    chain_with_history = RunnableWithMessageHistory(
        chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history"
    )

    try:
        response = chain_with_history.invoke(
            {"input": message},
            config={"configurable": {"session_id": str(user.id)}}
        )
        return response.content.strip()
    except Exception as e:
        print(f"Error generating coach response: {e}")
        return "Sorry, I encountered an error processing your request."
