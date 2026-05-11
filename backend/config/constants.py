"""Guardrail constants for session safety."""

# Maximum messages allowed in a single session before auto-ending
MAX_MESSAGES_PER_SESSION = 100

# Maximum agent calls the orchestrator can make per single user message
# Prevents infinite orchestrator -> planner -> orchestrator cycles
MAX_AGENT_CALLS_PER_MESSAGE = 5

# Session timeout in minutes — inactive sessions auto-end
SESSION_TIMEOUT_MINUTES = 30

# Number of messages before Kangaskhan triggers memory compaction
COMPACTION_THRESHOLD = 50

# Allowed commands for Marowak (Terminal Runner)
ALLOWED_COMMANDS = [
    "pytest", "python", "npm", "node", "npx", "git",
    "ls", "dir", "cat", "head", "tail", "grep", "find", "wc",
    "echo", "pwd", "cd", "mkdir", "touch", "rm", "cp", "mv",
    "pip", "poetry",
]
