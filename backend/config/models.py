"""LLM tier configuration for multi-provider agent system."""

import os

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "anthropic")

MODEL_TIERS = {
    "anthropic": {
        "HIGH_REASONING": "claude-sonnet-4-20250514",
        "MID_REASONING": "claude-sonnet-4-20250514",
        "FAST_EXECUTION": "claude-haiku-3-20250414",
    },
    "openai": {
        "HIGH_REASONING": "o3",
        "MID_REASONING": "gpt-4.1",
        "FAST_EXECUTION": "gpt-4.1-mini",
    },
    "gemini": {
        "HIGH_REASONING": "gemini-2.5-pro",
        "MID_REASONING": "gemini-2.5-flash",
        "FAST_EXECUTION": "gemini-2.0-flash-lite",
    },
}


def get_model(tier: str, override: str | None = None) -> str:
    """Get model name for a tier, or return override if set."""
    if override:
        return override
    return MODEL_TIERS[LLM_PROVIDER][tier]
