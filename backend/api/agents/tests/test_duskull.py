"""Tests for Duskull (Git Agent) tools."""

import subprocess

import pytest

from api.agents.duskull import create_duskull_agent, git_status, git_diff, git_commit, git_branch, git_log


@pytest.fixture
def git_workspace(tmp_path):
    """Create a workspace with an initialized git repo."""
    subprocess.run(["git", "init"], cwd=tmp_path, capture_output=True, check=True)
    subprocess.run(["git", "config", "user.email", "test@test.com"], cwd=tmp_path, capture_output=True)
    subprocess.run(["git", "config", "user.name", "Test"], cwd=tmp_path, capture_output=True)

    (tmp_path / "README.md").write_text("# Test\n")
    subprocess.run(["git", "add", "."], cwd=tmp_path, capture_output=True, check=True)
    subprocess.run(["git", "commit", "-m", "initial"], cwd=tmp_path, capture_output=True, check=True)

    return str(tmp_path)


class TestGitStatus:
    def test_clean_status(self, git_workspace):
        result = git_status(git_workspace)
        assert "nothing to commit" in result or "clean" in result

    def test_modified_file_shows_in_status(self, git_workspace):
        (tmp_path := __import__("pathlib").Path(git_workspace))
        (tmp_path / "README.md").write_text("# Modified\n")
        result = git_status(git_workspace)
        assert "README.md" in result


class TestGitDiff:
    def test_diff_shows_changes(self, git_workspace):
        p = __import__("pathlib").Path(git_workspace)
        (p / "README.md").write_text("# Modified\n")
        result = git_diff(git_workspace)
        assert "Modified" in result

    def test_diff_empty_when_clean(self, git_workspace):
        result = git_diff(git_workspace)
        assert result.strip() == ""

    def test_diff_specific_file(self, git_workspace):
        p = __import__("pathlib").Path(git_workspace)
        (p / "README.md").write_text("# Modified\n")
        (p / "new.txt").write_text("new file\n")
        subprocess.run(["git", "add", "new.txt"], cwd=git_workspace, capture_output=True)
        result = git_diff(git_workspace, file_path="README.md")
        assert "Modified" in result


class TestGitCommit:
    def test_commit_staged_changes(self, git_workspace):
        p = __import__("pathlib").Path(git_workspace)
        (p / "new.txt").write_text("content\n")
        subprocess.run(["git", "add", "new.txt"], cwd=git_workspace, capture_output=True)
        result = git_commit(git_workspace, message="add new file")
        assert "add new file" in result

    def test_commit_nothing_staged(self, git_workspace):
        result = git_commit(git_workspace, message="empty")
        assert "nothing" in result.lower() or "clean" in result.lower()


class TestGitBranch:
    def test_list_branches(self, git_workspace):
        result = git_branch(git_workspace)
        assert "main" in result or "master" in result

    def test_create_branch(self, git_workspace):
        result = git_branch(git_workspace, create="feature-test")
        assert "feature-test" in result


class TestGitLog:
    def test_shows_commit_history(self, git_workspace):
        result = git_log(git_workspace)
        assert "initial" in result

    def test_log_with_limit(self, git_workspace):
        result = git_log(git_workspace, n=1)
        assert "initial" in result


class TestDuskullAgent:
    def test_agent_creation(self, git_workspace):
        agent = create_duskull_agent(git_workspace, session_id=1)
        assert agent is not None
