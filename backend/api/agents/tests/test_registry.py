"""Tests for agent registry and dispatch."""

import pytest

from api.agents.registry import get_agent, AGENT_FACTORIES


class TestAgentRegistry:
    def test_all_shop_agents_registered(self):
        expected = {"Kecleon", "Duskull", "Marowak", "Electivire", "Kangaskhan", "Chansey", "Xatu"}
        assert expected == set(AGENT_FACTORIES.keys())

    def test_get_kecleon(self, workspace):
        agent = get_agent("Kecleon", workspace, session_id=1)
        assert agent is not None

    def test_get_duskull(self, workspace):
        agent = get_agent("Duskull", workspace, session_id=1)
        assert agent is not None

    def test_get_all_agents(self, workspace):
        for name in AGENT_FACTORIES:
            agent = get_agent(name, workspace, session_id=1)
            assert agent is not None, f"Failed to create {name}"

    def test_unknown_agent_raises(self, workspace):
        with pytest.raises(KeyError):
            get_agent("Bidoof", workspace, session_id=1)
