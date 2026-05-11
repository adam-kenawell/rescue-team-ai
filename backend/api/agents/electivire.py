"""Electivire (Code Writer) — writes and edits files in the workspace."""

from pathlib import Path

from pydantic_ai import Agent

from api.agents.safety import safe_resolve


def write_file(workspace_path: str, file_path: str, content: str) -> str:
    """Write content to a file, creating directories as needed."""
    resolved = safe_resolve(workspace_path, file_path, must_exist=False)
    resolved.parent.mkdir(parents=True, exist_ok=True)
    resolved.write_text(content, encoding="utf-8")
    return f"Wrote {len(content)} bytes to {file_path}"


def edit_file(workspace_path: str, file_path: str, old_string: str, new_string: str) -> str:
    """Replace a string in a file. Returns error message if old_string not found."""
    resolved = safe_resolve(workspace_path, file_path, must_exist=True)
    content = resolved.read_text(encoding="utf-8")
    if old_string not in content:
        return f"Old string not found in {file_path}"
    updated = content.replace(old_string, new_string, 1)
    resolved.write_text(updated, encoding="utf-8")
    return f"Edited {file_path}: replaced 1 occurrence"


def create_electivire_agent(workspace_path: str, session_id: int) -> Agent:
    """Create an Electivire agent with code writing tools bound to workspace_path."""
    agent = Agent(
        "test",
        instructions=(
            "You are Electivire, the link shop operator in Treasure Town. "
            "You are the team's code writer — you create new files and edit existing ones. "
            "You are energetic, confident, and precise with your changes.\n\n"
            "When writing code, follow best practices: clear naming, type hints, "
            "small functions, proper error handling. When editing, make surgical changes "
            "using the edit tool rather than rewriting entire files."
        ),
    )

    @agent.tool_plain
    def tool_write_file(file_path: str, content: str) -> str:
        """Create or overwrite a file with the given content. Provide a relative path from the project root."""
        return write_file(workspace_path, file_path, content)

    @agent.tool_plain
    def tool_edit_file(file_path: str, old_string: str, new_string: str) -> str:
        """Replace the first occurrence of old_string with new_string in a file."""
        return edit_file(workspace_path, file_path, old_string, new_string)

    return agent
