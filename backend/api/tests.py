import pytest
from django.db import IntegrityError
from api.models import Player, Agent, Session, SessionAgent, Message


@pytest.mark.django_db
class TestPlayerModel:
    def test_create_player(self):
        player = Player.objects.create(
            starter_pokemon="Pikachu",
            partner_pokemon="Charmander",
            quiz_nature="Brave",
        )
        assert player.pk is not None
        assert player.starter_pokemon == "Pikachu"
        assert player.partner_pokemon == "Charmander"
        assert player.quiz_nature == "Brave"
        assert player.sprite == ""
        assert player.created_at is not None

    def test_player_str(self):
        player = Player.objects.create(
            starter_pokemon="Pikachu",
            partner_pokemon="Charmander",
            quiz_nature="Brave",
        )
        assert "Pikachu" in str(player)
        assert "Charmander" in str(player)


@pytest.mark.django_db
class TestAgentModel:
    def test_seed_data_loaded(self):
        """All 8 shop agents should be loadable from fixture."""
        assert Agent.objects.count() == 8

    def test_agent_pokemon_unique(self):
        """Can't have two agents with the same pokemon."""
        Agent.objects.create(
            pokemon="Bulbasaur", role="Test", shop="Test Shop", tier="MID_REASONING"
        )
        with pytest.raises(IntegrityError):
            Agent.objects.create(
                pokemon="Bulbasaur", role="Test2", shop="Test Shop2", tier="MID_REASONING"
            )

    def test_wigglytuff_is_planner(self):
        wigglytuff = Agent.objects.get(pokemon="Wigglytuff")
        assert wigglytuff.role == "Planner"
        assert wigglytuff.shop == "Wigglytuff's Guild"
        assert wigglytuff.tier == "HIGH_REASONING"

    def test_agent_str(self):
        agent = Agent.objects.get(pokemon="Kecleon")
        assert "Kecleon" in str(agent)
        assert "Kecleon Shop" in str(agent)


@pytest.mark.django_db
class TestSessionModel:
    def _make_player(self):
        return Player.objects.create(
            starter_pokemon="Pikachu", partner_pokemon="Charmander", quiz_nature="Brave"
        )

    def test_create_session(self):
        session = Session.objects.create(player=self._make_player())
        assert session.status == "active"
        assert session.started_at is not None
        assert session.ended_at is None

    def test_session_belongs_to_player(self):
        player = self._make_player()
        Session.objects.create(player=player)
        Session.objects.create(player=player)
        assert player.sessions.count() == 2


@pytest.mark.django_db
class TestSessionAgentModel:
    def _setup(self):
        player = Player.objects.create(
            starter_pokemon="Pikachu", partner_pokemon="Charmander", quiz_nature="Brave"
        )
        session = Session.objects.create(player=player)
        agent = Agent.objects.get(pokemon="Wigglytuff")
        return session, agent

    def test_create_session_agent(self):
        session, agent = self._setup()
        sa = SessionAgent.objects.create(session=session, agent=agent)
        assert sa.status == "sleeping"

    def test_unique_agent_per_session(self):
        """Same agent can't be added to the same session twice."""
        session, agent = self._setup()
        SessionAgent.objects.create(session=session, agent=agent)
        with pytest.raises(IntegrityError):
            SessionAgent.objects.create(session=session, agent=agent)

    def test_wake_agent(self):
        session, agent = self._setup()
        sa = SessionAgent.objects.create(session=session, agent=agent)
        sa.status = "awake"
        sa.save()
        sa.refresh_from_db()
        assert sa.status == "awake"


@pytest.mark.django_db
class TestMessageModel:
    def _setup(self):
        player = Player.objects.create(
            starter_pokemon="Pikachu", partner_pokemon="Charmander", quiz_nature="Brave"
        )
        return Session.objects.create(player=player)

    def test_user_message(self):
        session = self._setup()
        msg = Message.objects.create(session=session, role="user", content="Help me debug this")
        assert msg.agent is None
        assert msg.created_at is not None

    def test_agent_message(self):
        session = self._setup()
        agent = Agent.objects.get(pokemon="Xatu")
        msg = Message.objects.create(
            session=session, role="agent", content="Found a null pointer", agent=agent
        )
        assert msg.agent == agent

    def test_messages_ordered_by_created_at(self):
        session = self._setup()
        Message.objects.create(session=session, role="user", content="first")
        Message.objects.create(session=session, role="orchestrator", content="second")
        Message.objects.create(session=session, role="agent", content="third")
        messages = list(session.messages.values_list("content", flat=True))
        assert messages == ["first", "second", "third"]

    def test_cross_agent_memory_query(self):
        """Messages from all agents in a session are queryable (cross-agent memory)."""
        session = self._setup()
        xatu = Agent.objects.get(pokemon="Xatu")
        kecleon = Agent.objects.get(pokemon="Kecleon")
        Message.objects.create(session=session, role="agent", content="error in line 5", agent=xatu)
        Message.objects.create(session=session, role="agent", content="found file", agent=kecleon)
        agent_messages = session.messages.filter(role="agent")
        assert agent_messages.count() == 2
