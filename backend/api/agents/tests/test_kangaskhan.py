"""Tests for Kangaskhan (Memory/Context) agent tools."""

import pytest

from api.models import Player, Session, Message, SessionSummary
from api.agents.kangaskhan import (
    create_kangaskhan_agent,
    get_session_history,
    search_messages,
    summarize_context,
    compact_memory,
)


@pytest.fixture
def session_with_messages(db):
    player = Player.objects.create(
        starter_pokemon="Pikachu", partner_pokemon="Charmander", quiz_nature="Brave"
    )
    session = Session.objects.create(player=player)
    messages = []
    for i in range(10):
        msg = Message.objects.create(
            session=session,
            role=Message.Role.USER if i % 2 == 0 else Message.Role.ORCHESTRATOR,
            content=f"Message number {i}: {'user request' if i % 2 == 0 else 'agent response'}",
        )
        messages.append(msg)
    return session, messages


@pytest.mark.django_db
class TestGetSessionHistory:
    def test_returns_last_n_messages(self, session_with_messages):
        session, messages = session_with_messages
        result = get_session_history(session.pk, n=3)
        assert "Message number 7" in result
        assert "Message number 8" in result
        assert "Message number 9" in result

    def test_returns_all_if_n_exceeds_count(self, session_with_messages):
        session, messages = session_with_messages
        result = get_session_history(session.pk, n=100)
        assert "Message number 0" in result
        assert "Message number 9" in result

    def test_default_returns_recent(self, session_with_messages):
        session, _ = session_with_messages
        result = get_session_history(session.pk)
        assert "Message number 9" in result


@pytest.mark.django_db
class TestSearchMessages:
    def test_finds_matching_messages(self, session_with_messages):
        session, _ = session_with_messages
        result = search_messages(session.pk, "user request")
        assert "user request" in result

    def test_no_matches(self, session_with_messages):
        session, _ = session_with_messages
        result = search_messages(session.pk, "zzz_nonexistent")
        assert "No matches" in result


@pytest.mark.django_db
class TestSummarizeContext:
    def test_returns_messages_when_no_summaries(self, session_with_messages):
        session, _ = session_with_messages
        result = summarize_context(session.pk)
        assert "Message number" in result

    def test_includes_summaries_when_present(self, session_with_messages):
        session, messages = session_with_messages
        SessionSummary.objects.create(
            session=session,
            content="This is a compacted summary of the first batch.",
            message_range_start=messages[0].pk,
            message_range_end=messages[4].pk,
        )
        result = summarize_context(session.pk)
        assert "compacted summary" in result


@pytest.mark.django_db
class TestCompactMemory:
    def test_compacts_messages(self, session_with_messages):
        session, messages = session_with_messages
        result = compact_memory(session.pk)
        assert SessionSummary.objects.filter(session=session).count() == 1
        summary = SessionSummary.objects.get(session=session)
        assert summary.message_range_start == messages[0].pk
        assert summary.message_range_end == messages[-1].pk

    def test_skips_already_compacted_messages(self, session_with_messages):
        session, messages = session_with_messages
        SessionSummary.objects.create(
            session=session,
            content="previous summary",
            message_range_start=messages[0].pk,
            message_range_end=messages[7].pk,
        )
        result = compact_memory(session.pk)
        # Should only compact messages 8 and 9
        summaries = SessionSummary.objects.filter(session=session).order_by("created_at")
        assert summaries.count() == 2
        latest = summaries.last()
        assert latest.message_range_start == messages[8].pk
        assert latest.message_range_end == messages[9].pk

    def test_nothing_to_compact(self, db):
        player = Player.objects.create(
            starter_pokemon="Pikachu", partner_pokemon="Charmander", quiz_nature="Brave"
        )
        session = Session.objects.create(player=player)
        result = compact_memory(session.pk)
        assert "nothing" in result.lower() or "no messages" in result.lower()


@pytest.mark.django_db
class TestKangaskhanAgent:
    def test_agent_creation(self, session_with_messages):
        session, _ = session_with_messages
        agent = create_kangaskhan_agent("/tmp/workspace", session.pk)
        assert agent is not None
