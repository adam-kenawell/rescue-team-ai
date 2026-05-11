"""Kangaskhan (Memory/Context) — manages conversation history and compaction."""

from pydantic_ai import Agent

from api.models import Message, SessionSummary


def get_session_history(session_id: int, n: int = 20) -> str:
    """Return the last n messages from the session."""
    messages = Message.objects.filter(session_id=session_id).order_by("-created_at")[:n]
    messages = reversed(list(messages))  # chronological order
    lines = []
    for msg in messages:
        agent_label = f" ({msg.agent.pokemon})" if msg.agent else ""
        lines.append(f"[{msg.role}{agent_label}] {msg.content}")
    return "\n".join(lines) if lines else "No messages in session."


def search_messages(session_id: int, query: str) -> str:
    """Search session messages by keyword."""
    messages = Message.objects.filter(session_id=session_id, content__icontains=query)
    if not messages.exists():
        return "No matches found."
    lines = []
    for msg in messages:
        agent_label = f" ({msg.agent.pokemon})" if msg.agent else ""
        lines.append(f"[{msg.role}{agent_label}] {msg.content}")
    return "\n".join(lines)


def summarize_context(session_id: int) -> str:
    """Return compacted summaries + any messages since the last compaction."""
    summaries = SessionSummary.objects.filter(session_id=session_id).order_by("created_at")
    parts = []

    if summaries.exists():
        parts.append("=== Compacted Summaries ===")
        for s in summaries:
            parts.append(f"[Messages {s.message_range_start}-{s.message_range_end}] {s.content}")

        # Get messages after last compaction
        last_summary = summaries.last()
        recent = Message.objects.filter(
            session_id=session_id, pk__gt=last_summary.message_range_end
        ).order_by("created_at")
    else:
        recent = Message.objects.filter(session_id=session_id).order_by("created_at")

    if recent.exists():
        parts.append("=== Recent Messages ===")
        for msg in recent:
            agent_label = f" ({msg.agent.pokemon})" if msg.agent else ""
            parts.append(f"[{msg.role}{agent_label}] {msg.content}")

    return "\n".join(parts) if parts else "No context available."


def compact_memory(session_id: int) -> str:
    """Compact uncompacted messages into a SessionSummary."""
    # Find the last compaction point
    last_summary = (
        SessionSummary.objects.filter(session_id=session_id)
        .order_by("-created_at")
        .first()
    )

    if last_summary:
        messages = Message.objects.filter(
            session_id=session_id, pk__gt=last_summary.message_range_end
        ).order_by("created_at")
    else:
        messages = Message.objects.filter(session_id=session_id).order_by("created_at")

    if not messages.exists():
        return "Nothing to compact — no new messages."

    # Build a text summary of the messages (simple concatenation for now;
    # in production the agent LLM would do the actual summarization)
    msg_list = list(messages)
    lines = []
    for msg in msg_list:
        agent_label = f" ({msg.agent.pokemon})" if msg.agent else ""
        lines.append(f"[{msg.role}{agent_label}] {msg.content}")
    summary_text = "Compacted summary:\n" + "\n".join(lines)

    SessionSummary.objects.create(
        session_id=session_id,
        content=summary_text,
        message_range_start=msg_list[0].pk,
        message_range_end=msg_list[-1].pk,
    )

    return f"Compacted {len(msg_list)} messages (IDs {msg_list[0].pk}-{msg_list[-1].pk})"


def create_kangaskhan_agent(workspace_path: str, session_id: int) -> Agent:
    """Create a Kangaskhan agent with memory tools bound to session_id."""
    agent = Agent(
        "test",
        instructions=(
            "You are Kangaskhan, the keeper of Kangaskhan Storage in Treasure Town. "
            "You manage the team's conversation memory and context. You are warm, "
            "nurturing, and organized — you never lose track of important information.\n\n"
            "When asked about past conversations, use your tools to retrieve history. "
            "When context gets large, compact it to keep things efficient."
        ),
    )

    @agent.tool_plain
    def tool_get_session_history(n: int = 20) -> str:
        """Get the last n messages from the current session."""
        return get_session_history(session_id, n)

    @agent.tool_plain
    def tool_search_messages(query: str) -> str:
        """Search session messages by keyword."""
        return search_messages(session_id, query)

    @agent.tool_plain
    def tool_summarize_context() -> str:
        """Get compacted summaries plus any recent uncompacted messages."""
        return summarize_context(session_id)

    @agent.tool_plain
    def tool_compact_memory() -> str:
        """Compact uncompacted messages into a summary for efficient context retrieval."""
        return compact_memory(session_id)

    return agent
