"""Structured output schemas for agent responses."""

from pydantic import BaseModel


class TaskStep(BaseModel):
    """A single step in a task plan."""

    agent: str  # Pokemon name of the agent responsible (e.g. "Electivire")
    description: str  # What this agent should do


class TaskPlan(BaseModel):
    """A structured task plan produced by the Planner (Wigglytuff)."""

    summary: str  # Brief overview of the plan
    steps: list[TaskStep]  # Ordered list of steps to execute
