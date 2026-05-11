"""Tests for Xatu (Analyzer/Debugger) agent tools."""

import pytest

from api.models import Player, Session, Message, Agent as AgentModel
from api.agents.xatu import create_xatu_agent, read_file, read_error_output
from api.agents.safety import PathTraversalError


class TestXatuReadFile:
    def test_reads_existing_file(self, workspace):
        result = read_file(workspace, "src/main.py")
        assert "def main():" in result

    def test_rejects_traversal(self, workspace):
        with pytest.raises(PathTraversalError):
            read_file(workspace, "../etc/passwd")

    def test_nonexistent_file(self, workspace):
        with pytest.raises(FileNotFoundError):
            read_file(workspace, "nope.py")


@pytest.mark.django_db
class TestReadErrorOutput:
    def test_finds_error_messages(self, db):
        player = Player.objects.create(
            starter_pokemon="Pikachu", partner_pokemon="Charmander", quiz_nature="Brave"
        )
        session = Session.objects.create(player=player)
        marowak = AgentModel.objects.get(pokemon="Marowak")
        Message.objects.create(
            session=session, role=Message.Role.AGENT, content="PASSED: all tests", agent=marowak
        )
        Message.objects.create(
            session=session,
            role=Message.Role.AGENT,
            content="FAILED: test_main.py::test_add - AssertionError: 3 != 4",
            agent=marowak,
        )
        Message.objects.create(
            session=session, role=Message.Role.USER, content="fix the bug please"
        )

        result = read_error_output(session.pk, n=5)
        assert "FAILED" in result
        assert "AssertionError" in result

    def test_returns_recent_agent_messages(self, db):
        player = Player.objects.create(
            starter_pokemon="Pikachu", partner_pokemon="Charmander", quiz_nature="Brave"
        )
        session = Session.objects.create(player=player)
        for i in range(5):
            Message.objects.create(
                session=session, role=Message.Role.ORCHESTRATOR, content=f"Step {i} result"
            )
        result = read_error_output(session.pk, n=3)
        assert "Step 4" in result
        assert "Step 2" in result

    def test_empty_session(self, db):
        player = Player.objects.create(
            starter_pokemon="Pikachu", partner_pokemon="Charmander", quiz_nature="Brave"
        )
        session = Session.objects.create(player=player)
        result = read_error_output(session.pk)
        assert "no" in result.lower()


class TestXatuAgent:
    def test_agent_creation(self, workspace):
        agent = create_xatu_agent(workspace, session_id=1)
        assert agent is not None
