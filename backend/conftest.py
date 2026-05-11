import pytest


@pytest.fixture(autouse=True)
def load_agents(db):
    """Load agent seed data for all tests."""
    from django.core.management import call_command
    call_command("loaddata", "agents", verbosity=0)
