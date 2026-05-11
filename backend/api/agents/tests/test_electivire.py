"""Tests for Electivire (Code Writer) agent tools."""

from pathlib import Path

import pytest

from api.agents.electivire import create_electivire_agent, write_file, edit_file
from api.agents.safety import PathTraversalError


class TestWriteFile:
    def test_creates_new_file(self, workspace):
        write_file(workspace, "new_file.py", "print('hello')\n")
        assert (Path(workspace) / "new_file.py").read_text() == "print('hello')\n"

    def test_creates_nested_file(self, workspace):
        write_file(workspace, "deep/nested/file.py", "content\n")
        assert (Path(workspace) / "deep" / "nested" / "file.py").read_text() == "content\n"

    def test_overwrites_existing_file(self, workspace):
        write_file(workspace, "src/main.py", "new content\n")
        assert (Path(workspace) / "src" / "main.py").read_text() == "new content\n"

    def test_rejects_traversal(self, workspace):
        with pytest.raises(PathTraversalError):
            write_file(workspace, "../escape.py", "bad\n")


class TestEditFile:
    def test_replaces_string(self, workspace):
        edit_file(workspace, "src/main.py", "print('hello')", "print('world')")
        content = (Path(workspace) / "src" / "main.py").read_text()
        assert "print('world')" in content
        assert "print('hello')" not in content

    def test_old_string_not_found(self, workspace):
        result = edit_file(workspace, "src/main.py", "nonexistent_string", "replacement")
        assert "not found" in result.lower()

    def test_rejects_traversal(self, workspace):
        with pytest.raises(PathTraversalError):
            edit_file(workspace, "../escape.py", "a", "b")

    def test_nonexistent_file(self, workspace):
        with pytest.raises(FileNotFoundError):
            edit_file(workspace, "nope.py", "a", "b")


class TestElectivireAgent:
    def test_agent_creation(self, workspace):
        agent = create_electivire_agent(workspace, session_id=1)
        assert agent is not None
