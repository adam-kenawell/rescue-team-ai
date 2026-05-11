"""Kecleon (File Navigator) — reads, searches, and lists files in the workspace."""

import os
from pathlib import Path

from pydantic_ai import Agent, RunContext

from api.agents.safety import safe_resolve


def read_file(workspace_path: str, file_path: str) -> str:
    """Read the contents of a file within the workspace."""
    resolved = safe_resolve(workspace_path, file_path, must_exist=True)
    return resolved.read_text(encoding="utf-8")


def list_directory(workspace_path: str, dir_path: str) -> str:
    """List contents of a directory within the workspace."""
    resolved = safe_resolve(workspace_path, dir_path, must_exist=True)
    if not resolved.is_dir():
        raise FileNotFoundError(f"Not a directory: {dir_path}")
    entries = sorted(os.listdir(resolved))
    return "\n".join(entries)


def search_files(workspace_path: str, query: str) -> str:
    """Search for a string across all text files in the workspace recursively."""
    workspace = Path(workspace_path)
    matches = []
    for root, _dirs, files in os.walk(workspace):
        for fname in files:
            fpath = Path(root) / fname
            try:
                content = fpath.read_text(encoding="utf-8")
            except (UnicodeDecodeError, PermissionError):
                continue
            for i, line in enumerate(content.splitlines(), 1):
                if query in line:
                    rel = fpath.relative_to(workspace)
                    matches.append(f"{rel}:{i}: {line.strip()}")
    if not matches:
        return "No matches found."
    return "\n".join(matches)


def create_kecleon_agent(workspace_path: str, session_id: int) -> Agent:
    """Create a Kecleon agent with file navigation tools bound to workspace_path."""
    agent = Agent(
        "test",
        instructions=(
            "You are Kecleon, the shopkeeper of Kecleon Shop in Treasure Town. "
            "You are a file navigator who helps the team read, list, and search files "
            "in the project workspace. You are cheerful, helpful, and always eager to "
            "find what the team needs.\n\n"
            "When asked to find something, use your tools to locate it. "
            "Report what you find clearly and concisely."
        ),
    )

    @agent.tool_plain
    def tool_read_file(file_path: str) -> str:
        """Read the contents of a file. Provide a relative path from the project root."""
        return read_file(workspace_path, file_path)

    @agent.tool_plain
    def tool_list_directory(dir_path: str) -> str:
        """List the contents of a directory. Use '.' for the project root."""
        return list_directory(workspace_path, dir_path)

    @agent.tool_plain
    def tool_search_files(query: str) -> str:
        """Search for a text string across all files in the project. Returns matching lines with file paths and line numbers."""
        return search_files(workspace_path, query)

    return agent
