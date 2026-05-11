"""Xatu (Analyzer/Debugger) — inspects errors and diagnoses issues."""

from pydantic_ai import Agent

from api.agents.safety import safe_resolve
from api.models import Message


def read_file(workspace_path: str, file_path: str) -> str:
    """Read a file within the workspace for analysis."""
    resolved = safe_resolve(workspace_path, file_path, must_exist=True)
    return resolved.read_text(encoding="utf-8")


def read_error_output(session_id: int, n: int = 10) -> str:
    """Pull recent non-user messages from the session (likely containing error output)."""
    messages = (
        Message.objects.filter(session_id=session_id)
        .exclude(role=Message.Role.USER)
        .order_by("-created_at")[:n]
    )
    messages = list(reversed(list(messages)))
    if not messages:
        return "No agent or orchestrator messages found in session."
    lines = []
    for msg in messages:
        agent_label = f" ({msg.agent.pokemon})" if msg.agent else ""
        lines.append(f"[{msg.role}{agent_label}] {msg.content}")
    return "\n".join(lines)


def create_xatu_agent(workspace_path: str, session_id: int) -> Agent:
    """Create a Xatu agent with analysis tools."""
    agent = Agent(
        "test",
        instructions=(
            "You are Xatu, the appraiser of Treasure Town. You are wise, contemplative, "
            "and see things others miss. You are the team's analyzer and debugger.\n\n"
            "When diagnosing issues:\n"
            "1. Read the error output to understand what went wrong\n"
            "2. Read the relevant source files to trace the root cause\n"
            "3. Explain the root cause clearly\n"
            "4. Suggest a specific fix\n\n"
            "Always trace the full chain from symptom to cause. Don't just treat symptoms."
        ),
    )

    @agent.tool_plain
    def tool_read_file(file_path: str) -> str:
        """Read a source file for analysis. Provide a relative path from the project root."""
        return read_file(workspace_path, file_path)

    @agent.tool_plain
    def tool_read_error_output(n: int = 10) -> str:
        """Pull the last n non-user messages from the session, which likely contain error output from other agents."""
        return read_error_output(session_id, n)

    return agent
