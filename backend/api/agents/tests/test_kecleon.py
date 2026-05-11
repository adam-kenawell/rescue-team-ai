"""Tests for Kecleon (File Navigator) agent tools."""

import pytest

from api.agents.kecleon import create_kecleon_agent, read_file, list_directory, search_files
from api.agents.safety import PathTraversalError


class TestReadFile:
    def test_reads_existing_file(self, workspace):
        result = read_file(workspace, "src/main.py")
        assert "def main():" in result
        assert "print('hello')" in result

    def test_reads_markdown(self, workspace):
        result = read_file(workspace, "README.md")
        assert "# Test Project" in result

    def test_rejects_traversal(self, workspace):
        with pytest.raises(PathTraversalError):
            read_file(workspace, "../etc/passwd")

    def test_nonexistent_file(self, workspace):
        with pytest.raises(FileNotFoundError):
            read_file(workspace, "nonexistent.py")


class TestListDirectory:
    def test_lists_root(self, workspace):
        result = list_directory(workspace, ".")
        assert "src" in result
        assert "tests" in result
        assert "README.md" in result

    def test_lists_subdirectory(self, workspace):
        result = list_directory(workspace, "src")
        assert "main.py" in result
        assert "utils.py" in result

    def test_rejects_traversal(self, workspace):
        with pytest.raises(PathTraversalError):
            list_directory(workspace, "../")

    def test_nonexistent_directory(self, workspace):
        with pytest.raises(FileNotFoundError):
            list_directory(workspace, "nonexistent")


class TestSearchFiles:
    def test_finds_matching_content(self, workspace):
        result = search_files(workspace, "def main")
        assert "main.py" in result

    def test_finds_in_multiple_files(self, workspace):
        result = search_files(workspace, "def ")
        assert "main.py" in result
        assert "utils.py" in result

    def test_no_matches(self, workspace):
        result = search_files(workspace, "zzz_nonexistent_string")
        assert "No matches" in result or result.strip() == ""

    def test_searches_recursively(self, workspace):
        result = search_files(workspace, "assert True")
        assert "test_main.py" in result


class TestKecleonAgent:
    def test_agent_creation(self, workspace):
        agent = create_kecleon_agent(workspace, session_id=1)
        assert agent is not None
