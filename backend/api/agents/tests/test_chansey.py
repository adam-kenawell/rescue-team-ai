"""Tests for Chansey (Code Reviewer) agent tools."""

from pathlib import Path

import pytest

from api.agents.chansey import create_chansey_agent, review_diff, review_file, REVIEW_RUBRIC
from api.agents.safety import PathTraversalError


class TestReviewDiff:
    def test_returns_nonempty_for_diff(self):
        diff = """
--- a/main.py
+++ b/main.py
@@ -1,3 +1,3 @@
 def main():
-    print('hello')
+    print('world')
"""
        result = review_diff(diff)
        # Tool just frames the diff for LLM review, returns it with rubric context
        assert "main.py" in result
        assert "print" in result

    def test_empty_diff(self):
        result = review_diff("")
        assert "no changes" in result.lower() or "empty" in result.lower()


class TestReviewFile:
    def test_reads_and_returns_file(self, workspace):
        result = review_file(workspace, "src/main.py")
        assert "def main():" in result

    def test_rejects_traversal(self, workspace):
        with pytest.raises(PathTraversalError):
            review_file(workspace, "../etc/passwd")

    def test_nonexistent_file(self, workspace):
        with pytest.raises(FileNotFoundError):
            review_file(workspace, "nope.py")


class TestReviewRubric:
    def test_rubric_has_all_principles(self):
        assert len(REVIEW_RUBRIC) == 11

    def test_rubric_includes_concision(self):
        assert any("concision" in r.lower() for r in REVIEW_RUBRIC)

    def test_rubric_includes_deep_modules(self):
        assert any("deep module" in r.lower() for r in REVIEW_RUBRIC)


class TestChanseyAgent:
    def test_agent_creation(self, workspace):
        agent = create_chansey_agent(workspace, session_id=1)
        assert agent is not None

    def test_agent_instructions_contain_rubric(self, workspace):
        agent = create_chansey_agent(workspace, session_id=1)
        instructions_text = " ".join(str(i) for i in agent._instructions).lower()
        assert "concision" in instructions_text
