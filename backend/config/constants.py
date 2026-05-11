"""Guardrail constants for session safety."""

# Maximum messages allowed in a single session before auto-ending
MAX_MESSAGES_PER_SESSION = 100

# Maximum agent calls the orchestrator can make per single user message
# Prevents infinite orchestrator -> planner -> orchestrator cycles
MAX_AGENT_CALLS_PER_MESSAGE = 5

# Session timeout in minutes — inactive sessions auto-end
SESSION_TIMEOUT_MINUTES = 30
