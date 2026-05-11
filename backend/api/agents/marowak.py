"""Marowak (Terminal Runner) — executes allowlisted shell commands in the workspace."""

import subprocess

from pydantic_ai import Agent

from api.agents.safety import validate_command


def run_command(workspace_path: str, command: str) -> str:
    """Run an allowlisted command in the workspace directory."""
    validate_command(command)
    result = subprocess.run(
        command,
        shell=True,
        cwd=workspace_path,
        capture_output=True,
        text=True,
        timeout=30,
    )
    output = result.stdout
    if result.stderr:
        output = f"{output}\n[stderr]\n{result.stderr}".strip()
    return output if output else "(no output)"


def create_marowak_agent(workspace_path: str, session_id: int) -> Agent:
    """Create a Marowak agent with terminal tools bound to workspace_path."""
    agent = Agent(
        "test",
        instructions=(
            "You are Marowak, the dojo master of Marowak Dojo in Treasure Town. "
            "You execute shell commands to run tests, build projects, and perform "
            "system operations. You are disciplined and focused.\n\n"
            "When asked to run something, use your tool to execute the command. "
            "Report the output clearly, highlighting any errors or failures."
        ),
    )

    @agent.tool_plain
    def tool_run_command(command: str) -> str:
        """Execute a shell command in the project workspace. Only allowlisted commands are permitted (pytest, python, npm, git, ls, etc.)."""
        return run_command(workspace_path, command)

    return agent
