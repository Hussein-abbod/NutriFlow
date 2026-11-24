"""Coach AI: POST /coach/message, GET /coach/history, DELETE /coach/history (LLM faked)."""

from datetime import date

import pytest
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.models.coach_message import CoachMessage
from app.services import coach_agent
from tests.helpers import submit


class FakeLLM:
    """Stands in for ChatGroq: records every prompt and answers from a script."""

    def __init__(self, replies=None, error: Exception | None = None):
        self.replies = list(replies or [])
        self.error = error
        self.prompts: list[list] = []

    async def ainvoke(self, messages):
        self.prompts.append(messages)
        if self.error:
            raise self.error
        reply = self.replies.pop(0) if self.replies else f"Coach reply #{len(self.prompts)}"
        return AIMessage(content=reply)


@pytest.fixture
def llm(monkeypatch) -> FakeLLM:
    fake = FakeLLM()
    monkeypatch.setattr(coach_agent, "get_groq_llm", lambda: fake)
    return fake


def ask(client, headers, message="What should I eat for dinner?"):
    return client.post("/coach/message", json={"message": message}, headers=headers)


def history(client, headers, **params):
    return client.get("/coach/history", params=params, headers=headers)


# ---------- Auth ----------


@pytest.mark.parametrize(
    "method,path",
    [("post", "/coach/message"), ("get", "/coach/history"), ("delete", "/coach/history")],
)
def test_coach_endpoints_require_auth(client, method, path):
    assert getattr(client, method)(path).status_code == 401


# ---------- POST /message ----------


def test_message_returns_the_reply_and_stores_the_exchange(client, auth_headers, llm):
    llm.replies = ["  Try grilled fish with vegetables.  "]
    response = ask(client, auth_headers, "  What should I eat for dinner?  ")

    assert response.status_code == 200
    reply = response.json()
    assert reply["role"] == "assistant"
    assert reply["content"] == "Try grilled fish with vegetables."
    stored = history(client, auth_headers).json()
    assert [(m["role"], m["content"]) for m in stored] == [
        ("user", "What should I eat for dinner?"),
        ("assistant", "Try grilled fish with vegetables."),
    ]
    assert stored[1]["id"] == reply["id"]


def test_the_model_gets_the_users_data_and_earlier_messages(client, onboarded_headers, llm):
    client.put("/users/allergies", json={"allergies": ["Peanuts", "{curly}"]}, headers=onboarded_headers)
    submit(client, onboarded_headers, log_date=date.today().isoformat())
    ask(client, onboarded_headers, "Hi coach")
    ask(client, onboarded_headers, "And for lunch?")

    system, *conversation = llm.prompts[1]
    assert isinstance(system, SystemMessage)
    assert "Allergies: Peanuts, {curly}" in system.content  # braces are not template syntax
    assert "Goal: lose_weight" in system.content
    assert "Today's intake: 260 kcal" in system.content
    assert [type(message) for message in conversation] == [HumanMessage, AIMessage, HumanMessage]
    assert conversation[0].content == "Hi coach"
    assert conversation[-1].content == "And for lunch?"


def test_the_model_sees_at_most_the_last_20_messages(client, auth_headers, llm):
    for index in range(12):
        ask(client, auth_headers, f"question {index}")
    last_prompt = llm.prompts[-1]
    assert len(last_prompt) == 1 + 20 + 1  # system + memory window + the new question
    assert last_prompt[1].content == "question 1"


@pytest.mark.parametrize(
    "body",
    [
        {"message": ""},
        {"message": "   "},
        {"message": "x" * 2001},
        {},
        {"message": "hi", "food_log_id": 1},
        {"food_log_id": 0},
        {"message": 42},
    ],
)
def test_message_validation(client, auth_headers, llm, body):
    assert client.post("/coach/message", json=body, headers=auth_headers).status_code == 422
    assert llm.prompts == []


def test_a_2000_character_message_is_accepted(client, auth_headers, llm):
    assert ask(client, auth_headers, "x" * 2000).status_code == 200


@pytest.mark.parametrize("fake", [None, FakeLLM(error=RuntimeError("groq down")), FakeLLM(replies=["   "])])
def test_unavailable_model_is_a_503_and_nothing_is_stored(client, auth_headers, monkeypatch, fake):
    monkeypatch.setattr(coach_agent, "get_groq_llm", lambda: fake)
    response = ask(client, auth_headers)
    assert response.status_code == 503
    assert response.json() == {"detail": "Coach AI is unavailable right now. Please try again in a moment."}
    assert history(client, auth_headers).json() == []


def test_coach_messages_are_rate_limited(client, auth_headers, llm, rate_limited):
    statuses = [ask(client, auth_headers).status_code for _ in range(21)]
    assert statuses[:20] == [200] * 20
    assert statuses[20] == 429


# ---------- Discuss a meal's advice ----------


def test_discussing_a_meal_adds_its_advice_and_the_acknowledgement(client, auth_headers, llm):
    log = submit(client, auth_headers).json()
    llm.replies = ["Happy to talk about it. What would you like to know?"]

    response = client.post("/coach/message", json={"food_log_id": log["id"]}, headers=auth_headers)

    assert response.status_code == 200
    stored = history(client, auth_headers).json()
    assert [(m["role"], m["content"]) for m in stored] == [
        ("assistant", log["ai_advice"]),
        ("assistant", "Happy to talk about it. What would you like to know?"),
    ]
    instruction = llm.prompts[0][-1]
    assert log["ai_advice"] in instruction.content
    assert "wait for the user's question" in instruction.content


def test_a_meal_of_another_user_cannot_be_discussed(client, auth_headers, other_auth_headers, llm):
    log = submit(client, other_auth_headers).json()
    response = client.post("/coach/message", json={"food_log_id": log["id"]}, headers=auth_headers)
    assert response.status_code == 404
    assert llm.prompts == []


def test_a_meal_without_advice_cannot_be_discussed(client, auth_headers, llm, db_session):
    log_id = submit(client, auth_headers).json()["id"]
    from app.models.food_log import FoodLog

    db_session.query(FoodLog).filter(FoodLog.id == log_id).update({"ai_advice": None})
    db_session.commit()
    response = client.post("/coach/message", json={"food_log_id": log_id}, headers=auth_headers)
    assert response.status_code == 400


# ---------- History ----------


def test_history_is_oldest_first_and_limited(client, auth_headers, llm):
    for index in range(3):
        ask(client, auth_headers, f"question {index}")
    contents = [message["content"] for message in history(client, auth_headers, limit=4).json()]
    assert contents == ["question 1", "Coach reply #2", "question 2", "Coach reply #3"]


@pytest.mark.parametrize("limit", [0, 101, -1, "abc"])
def test_history_limit_is_validated(client, auth_headers, limit):
    assert history(client, auth_headers, limit=limit).status_code == 422


def test_users_only_see_and_clear_their_own_chat(client, auth_headers, other_auth_headers, llm):
    ask(client, auth_headers, "Alice asks")
    ask(client, other_auth_headers, "Bob asks")

    assert [m["content"] for m in history(client, auth_headers).json()] == ["Alice asks", "Coach reply #1"]
    assert client.delete("/coach/history", headers=other_auth_headers).status_code == 204
    assert history(client, other_auth_headers).json() == []
    assert len(history(client, auth_headers).json()) == 2
    # Bob's next question starts a fresh conversation for the model too.
    ask(client, other_auth_headers, "Bob again")
    assert len(llm.prompts[-1]) == 2


def test_clear_history_deletes_the_rows(client, auth_headers, llm, db_session):
    ask(client, auth_headers)
    assert client.delete("/coach/history", headers=auth_headers).status_code == 204
    assert db_session.query(CoachMessage).count() == 0


@pytest.mark.parametrize(
    "stored, expected",
    [('["Peanuts", "Fish"]', "Peanuts, Fish"), ("Kiwi", "Kiwi"), ("", "None"), (None, "None"), (["Soy"], "Soy")],
)
def test_allergies_are_read_from_lists_and_legacy_json_strings(stored, expected):
    from types import SimpleNamespace

    class NoRows:
        def query(self, *args):
            return self

        def filter(self, *args):
            return self

        def first(self):
            return None

        def all(self):
            return []

    user = SimpleNamespace(
        id=1, age=30, gender="female", height_cm=165, weight_kg=70, food_allergies=stored, daily_calories_target=None
    )
    assert f"Allergies: {expected}\n" in coach_agent.build_user_context(NoRows(), user)
