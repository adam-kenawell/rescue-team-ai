from django.views.generic import TemplateView


# Mystery Dungeon starter Pokemon available for the onboarding quiz.
# Each entry maps a display name to its National Dex ID and types (for partner filtering).
STARTER_POKEMON = [
    {"name": "Beldum", "dex_id": 374, "types": ["steel", "psychic"]},
    {"name": "Goomy", "dex_id": 704, "types": ["dragon"]},
    {"name": "Deino", "dex_id": 633, "types": ["dark", "dragon"]},
    {"name": "Dratini", "dex_id": 147, "types": ["dragon"]},
    {"name": "Elekid", "dex_id": 239, "types": ["electric"]},
    {"name": "Magby", "dex_id": 240, "types": ["fire"]},
    {"name": "Gastly", "dex_id": 92, "types": ["ghost", "poison"]},
    {"name": "Abra", "dex_id": 63, "types": ["psychic"]},
    {"name": "Rookidee", "dex_id": 821, "types": ["flying"]},
    {"name": "Axew", "dex_id": 610, "types": ["dragon"]},
    {"name": "Gothita", "dex_id": 574, "types": ["psychic"]},
    {"name": "Sandile", "dex_id": 551, "types": ["ground", "dark"]},
    {"name": "Roggenrola", "dex_id": 524, "types": ["rock"]},
    {"name": "Gible", "dex_id": 443, "types": ["dragon", "ground"]},
    {"name": "Trapinch", "dex_id": 328, "types": ["ground"]},
    {"name": "Budew", "dex_id": 406, "types": ["grass", "poison"]},
    {"name": "Aron", "dex_id": 304, "types": ["steel", "rock"]},
    {"name": "Whismur", "dex_id": 293, "types": ["normal"]},
    {"name": "Lotad", "dex_id": 270, "types": ["water", "grass"]},
    {"name": "Seedot", "dex_id": 273, "types": ["grass"]},
    {"name": "Larvitar", "dex_id": 246, "types": ["rock", "ground"]},
    {"name": "Swinub", "dex_id": 220, "types": ["ice", "ground"]},
    {"name": "Togepi", "dex_id": 175, "types": ["fairy"]},
    {"name": "Mareep", "dex_id": 179, "types": ["electric"]},
    {"name": "Porygon", "dex_id": 137, "types": ["normal"]},
    {"name": "Magneton", "dex_id": 82, "types": ["electric", "steel"]},
    {"name": "Igglybuff", "dex_id": 174, "types": ["normal", "fairy"]},
]


class OnboardingQuizView(TemplateView):
    """Serves the onboarding quiz page where players pick their leader and partner."""

    template_name = "game_engine/onboarding_quiz.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["pokemon_choices"] = STARTER_POKEMON
        return context
