"""Chansey (Code Reviewer) — reviews diffs and files against a quality rubric."""

from pydantic_ai import Agent

from api.agents.safety import safe_resolve


REVIEW_RUBRIC = [
    "Concision over verbosity — flag bloated functions, unnecessary abstractions, over-engineering",
    "Readability — clear naming, obvious intent, no clever tricks",
    "Small functions — each function does one thing; flag multi-responsibility functions",
    "Type safety — missing type hints (Python), loose any types (TypeScript)",
    "Test coverage — new logic without tests gets flagged",
    "No dead code — unused imports, commented-out blocks, unreachable branches",
    "Error handling — bare except, swallowed exceptions, missing edge cases",
    "Naming conventions — snake_case (Python), camelCase (TypeScript), consistent casing",
    "DRY but not obsessively — duplication is bad, premature abstraction is worse",
    "Security basics — hardcoded secrets, unsanitized inputs, path traversal",
    "Deep modules over shallow modules — simple interfaces hiding meaningful complexity; flag thin wrappers with complex interfaces",
]


def review_diff(diff: str) -> str:
    """Prepare a diff for review. Returns the diff with rubric context."""
    if not diff.strip():
        return "Empty diff — no changes to review."
    return f"Review this diff against the code quality rubric:\n\n{diff}"


def review_file(workspace_path: str, file_path: str) -> str:
    """Read a file for review."""
    resolved = safe_resolve(workspace_path, file_path, must_exist=True)
    content = resolved.read_text(encoding="utf-8")
    return f"Review this file ({file_path}):\n\n{content}"


def create_chansey_agent(workspace_path: str, session_id: int) -> Agent:
    """Create a Chansey agent with code review tools."""
    rubric_text = "\n".join(f"  {i+1}. {r}" for i, r in enumerate(REVIEW_RUBRIC))

    agent = Agent(
        "test",
        instructions=(
            "You are Chansey, the caretaker of Chansey's Day Care in Treasure Town. "
            "You are the team's code reviewer — nurturing but firm. You care deeply "
            "about code quality and aren't afraid to push back on structural issues.\n\n"
            "You do NOT nitpick formatting (that's what linters are for). You focus on "
            "structural quality, design decisions, and maintainability.\n\n"
            "Your review rubric (apply these in order of priority):\n"
            f"{rubric_text}\n\n"
            "When reviewing, be specific: cite line numbers, suggest concrete alternatives, "
            "and explain WHY something matters. Praise good patterns too."
        ),
    )

    @agent.tool_plain
    def tool_review_diff(diff: str) -> str:
        """Review a git diff for code quality issues. Provide the full diff text."""
        return review_diff(diff)

    @agent.tool_plain
    def tool_review_file(file_path: str) -> str:
        """Read a file for full-file code review. Provide a relative path from the project root."""
        return review_file(workspace_path, file_path)

    return agent
