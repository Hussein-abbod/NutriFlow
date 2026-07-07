"""
LLM configuration for NutriFlow.

Initializes:
  - Groq  (llama-3.3-70b-versatile) — text parsing & post-meal advice
  - Gemini 1.5 Flash              — image / vision analysis

To swap to paid models when ready:
  - Groq  → change model_name to "mixtral-8x7b-32768" or keep the same key
  - GPT-4o → replace ChatGroq with ChatOpenAI(model="gpt-4o", api_key=...)
  - Gemini Pro → change model to "gemini-1.5-pro"
"""

from app.config import get_settings

settings = get_settings()


def get_groq_llm():
    """Return a ChatGroq instance (llama-3.3-70b-versatile)."""
    if not settings.GROQ_API_KEY:
        return None
    try:
        from langchain_groq import ChatGroq
        return ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=settings.GROQ_API_KEY,
            temperature=0.3,
            max_tokens=512,
        )
    except Exception:
        return None


def get_gemini_llm():
    """Return a ChatGoogleGenerativeAI instance (gemini-1.5-flash)."""
    if not settings.GEMINI_API_KEY:
        return None
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.1,
        )
    except Exception:
        return None
