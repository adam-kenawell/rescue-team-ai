"""Safety utilities — path validation and command allowlisting."""

import re
import shlex
from pathlib import Path

from config.constants import ALLOWED_COMMANDS


class PathTraversalError(Exception):
    """Raised when a path resolves outside the workspace."""

    pass


class CommandNotAllowedError(Exception):
    """Raised when a command is not on the allowlist."""

    pass


def safe_resolve(
    workspace_path: str, relative_path: str, must_exist: bool = True
) -> Path:
    """Resolve a relative path within a workspace, rejecting escapes.

    Args:
        workspace_path: Absolute path to the workspace root.
        relative_path: User-provided path to resolve.
        must_exist: If True, raises FileNotFoundError when the path doesn't exist.

    Returns:
        Resolved absolute Path guaranteed to be within workspace_path.

    Raises:
        PathTraversalError: If the resolved path escapes the workspace.
        FileNotFoundError: If must_exist=True and the path doesn't exist.
    """
    workspace = Path(workspace_path).resolve()

    # Reject absolute paths
    if Path(relative_path).is_absolute():
        raise PathTraversalError(f"Absolute paths not allowed: {relative_path}")

    # Build candidate path
    candidate = (workspace / relative_path).resolve()

    # Check containment
    try:
        candidate.relative_to(workspace)
    except ValueError:
        raise PathTraversalError(
            f"Path escapes workspace: {relative_path} -> {candidate}"
        )

    # Check symlink escape — resolve again to follow symlinks
    if candidate.exists():
        real = candidate.resolve(strict=True)
        try:
            real.relative_to(workspace)
        except ValueError:
            raise PathTraversalError(
                f"Symlink escapes workspace: {relative_path} -> {real}"
            )
    elif must_exist:
        raise FileNotFoundError(f"Path does not exist: {candidate}")

    return candidate


# Shell metacharacters that indicate chaining/piping
_SHELL_METACHAR_PATTERN = re.compile(r"[|;&]")


def validate_command(command: str) -> None:
    """Validate that a command string only uses allowlisted programs.

    Rejects empty commands, shell chaining (|, ;, &&), and any program
    not in ALLOWED_COMMANDS.

    Raises:
        CommandNotAllowedError: If the command is rejected.
    """
    command = command.strip()
    if not command:
        raise CommandNotAllowedError("Empty command")

    # Reject shell metacharacters (pipes, semicolons, &&)
    if _SHELL_METACHAR_PATTERN.search(command):
        raise CommandNotAllowedError(
            f"Shell operators not allowed in command: {command}"
        )

    # Extract the base command (first token)
    try:
        tokens = shlex.split(command)
    except ValueError:
        raise CommandNotAllowedError(f"Malformed command: {command}")

    base_command = Path(tokens[0]).name  # handle paths like /usr/bin/python
    if base_command not in ALLOWED_COMMANDS:
        raise CommandNotAllowedError(f"Command not allowed: {base_command}")
