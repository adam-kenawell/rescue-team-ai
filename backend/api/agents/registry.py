"""Agent registry — maps Pokemon names to agent factories."""

from pydantic_ai import Agent

from api.agents.kecleon import create_kecleon_agent
from api.agents.duskull import create_duskull_agent
from api.agents.marowak import create_marowak_agent
from api.agents.electivire import create_electivire_agent
from api.agents.kangaskhan import create_kangaskhan_agent
from api.agents.chansey import create_chansey_agent
from api.agents.xatu import create_xatu_agent


AGENT_FACTORIES: dict[str, callable] = {
    "Kecleon": create_kecleon_agent,
    "Duskull": create_duskull_agent,
    "Marowak": create_marowak_agent,
    "Electivire": create_electivire_agent,
    "Kangaskhan": create_kangaskhan_agent,
    "Chansey": create_chansey_agent,
    "Xatu": create_xatu_agent,
}


def get_agent(pokemon_name: str, workspace_path: str, session_id: int) -> Agent:
    """Look up and create an agent by Pokemon name.

    Raises KeyError if the Pokemon isn't in the registry.
    """
    factory = AGENT_FACTORIES[pokemon_name]
    return factory(workspace_path, session_id)
