from django.views.generic import TemplateView


# Mystery Dungeon starter Pokemon available for the onboarding quiz.
# Each entry maps a display name to its National Dex ID (used by pmd-visualizer).
STARTER_POKEMON = [
    {"name": "Bulbasaur", "dex_id": 1},
    {"name": "Charmander", "dex_id": 4},
    {"name": "Squirtle", "dex_id": 7},
    {"name": "Pikachu", "dex_id": 25},
    {"name": "Chikorita", "dex_id": 152},
    {"name": "Cyndaquil", "dex_id": 155},
    {"name": "Totodile", "dex_id": 158},
    {"name": "Treecko", "dex_id": 252},
    {"name": "Torchic", "dex_id": 255},
    {"name": "Mudkip", "dex_id": 258},
    {"name": "Skitty", "dex_id": 300},
    {"name": "Cubone", "dex_id": 104},
    {"name": "Psyduck", "dex_id": 54},
    {"name": "Machop", "dex_id": 66},
    {"name": "Eevee", "dex_id": 133},
    {"name": "Meowth", "dex_id": 52},
]


class OnboardingQuizView(TemplateView):
    """Serves the onboarding quiz page where players pick their leader and partner."""

    template_name = "game_engine/onboarding_quiz.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["pokemon_choices"] = STARTER_POKEMON
        return context
