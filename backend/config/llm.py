"""LLM model factory — creates Pydantic AI model instances from provider + API key."""

from __future__ import annotations

from pydantic_ai.models import Model
from pydantic_ai.models.test import TestModel

from config.models import MODEL_TIERS


def get_model_for_tier(provider: str, api_key: str, tier: str) -> Model:
    """Create a real Pydantic AI model for the given provider, key, and tier.

    Falls back to TestModel if provider/key are missing (e.g. during tests).
    """
    if not provider or not api_key:
        return TestModel()

    tier_models = MODEL_TIERS.get(provider)
    if not tier_models:
        return TestModel()

    model_name = tier_models.get(tier)
    if not model_name:
        return TestModel()

    if provider == "anthropic":
        from pydantic_ai.models.anthropic import AnthropicModel
        from pydantic_ai.providers.anthropic import AnthropicProvider

        return AnthropicModel(model_name, provider=AnthropicProvider(api_key=api_key))

    if provider == "openai":
        from pydantic_ai.models.openai import OpenAIModel
        from pydantic_ai.providers.openai import OpenAIProvider

        return OpenAIModel(model_name, provider=OpenAIProvider(api_key=api_key))

    if provider == "gemini":
        from pydantic_ai.models.gemini import GeminiModel
        from pydantic_ai.providers.google_gla import GoogleGLAProvider

        return GeminiModel(model_name, provider=GoogleGLAProvider(api_key=api_key))

    return TestModel()
