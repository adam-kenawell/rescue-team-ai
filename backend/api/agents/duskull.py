"""Duskull (Git Agent) — manages git operations within the workspace."""

import subprocess

from pydantic_ai import Agent


def _run_git(workspace_path: str, *args: str) -> str:
    """Run a git command in the workspace and return stdout."""
    result = subprocess.run(
        ["git", *args],
        cwd=workspace_path,
        capture_output=True,
        text=True,
    )
    output = result.stdout.strip()
    if result.returncode != 0 and result.stderr.strip():
        output = f"{output}\n{result.stderr.strip()}".strip()
    return output


def git_status(workspace_path: str) -> str:
    """Get git status of the workspace."""
    return _run_git(workspace_path, "status")


def git_diff(workspace_path: str, file_path: str | None = None) -> str:
    """Get git diff. Optionally scoped to a specific file."""
    args = ["diff"]
    if file_path:
        args.append(file_path)
    return _run_git(workspace_path, *args)


def git_commit(workspace_path: str, message: str) -> str:
    """Commit staged changes with the given message."""
    result = _run_git(workspace_path, "commit", "-m", message)
    if not result:
        return _run_git(workspace_path, "status")
    return result


def git_branch(workspace_path: str, create: str | None = None) -> str:
    """List branches, or create a new branch if 'create' is provided."""
    if create:
        _run_git(workspace_path, "checkout", "-b", create)
        return _run_git(workspace_path, "branch")
    return _run_git(workspace_path, "branch")


def git_log(workspace_path: str, n: int = 10) -> str:
    """Show recent commit history."""
    return _run_git(workspace_path, "log", "--oneline", f"-{n}")


def create_duskull_agent(workspace_path: str, session_id: int) -> Agent:
    """Create a Duskull agent with git tools bound to workspace_path."""
    agent = Agent(
        "test",
        instructions=(
            "You are Duskull, the banker of Duskull Bank in Treasure Town. "
            "You manage version control for the team's projects using git. "
            "You are quiet, precise, and meticulous about tracking changes.\n\n"
            "When asked about code changes, use your tools to inspect git status, "
            "diffs, and history. When asked to save work, stage and commit changes."
        ),
    )

    @agent.tool_plain
    def tool_git_status() -> str:
        """Check the current git status of the project."""
        return git_status(workspace_path)

    @agent.tool_plain
    def tool_git_diff(file_path: str = "") -> str:
        """Show unstaged changes. Optionally provide a file path to scope the diff."""
        return git_diff(workspace_path, file_path or None)

    @agent.tool_plain
    def tool_git_commit(message: str) -> str:
        """Commit all staged changes with the given commit message."""
        return git_commit(workspace_path, message)

    @agent.tool_plain
    def tool_git_branch(create: str = "") -> str:
        """List branches, or create a new branch if a name is provided."""
        return git_branch(workspace_path, create or None)

    @agent.tool_plain
    def tool_git_log(n: int = 10) -> str:
        """Show recent git commit history. Default: last 10 commits."""
        return git_log(workspace_path, n)

    return agent
