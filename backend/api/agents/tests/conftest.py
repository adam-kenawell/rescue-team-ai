"""Shared test fixtures for agent tests."""

import pytest


@pytest.fixture
def workspace(tmp_path):
    """Create a fake workspace with sample files for testing."""
    # Project structure
    src = tmp_path / "src"
    src.mkdir()
    (src / "main.py").write_text("def main():\n    print('hello')\n")
    (src / "utils.py").write_text("def add(a, b):\n    return a + b\n")

    tests = tmp_path / "tests"
    tests.mkdir()
    (tests / "test_main.py").write_text("def test_main():\n    assert True\n")

    (tmp_path / "README.md").write_text("# Test Project\n")
    (tmp_path / ".gitignore").write_text("__pycache__/\n*.pyc\n")

    return str(tmp_path)
