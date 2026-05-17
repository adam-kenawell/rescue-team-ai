import json

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views import View
from django.views.generic import TemplateView

from game_engine.models import PlayerProfile


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
    {"name": "Magnemite", "dex_id": 82, "types": ["electric", "steel"]},
    {"name": "Igglybuff", "dex_id": 174, "types": ["normal", "fairy"]},
]


class OnboardingQuizView(LoginRequiredMixin, TemplateView):
    """Serves the onboarding quiz page where players pick their leader and partner."""

    template_name = "game_engine/onboarding_quiz.html"

    def dispatch(self, request, *args, **kwargs):
        # If user already has a profile, skip the quiz
        if request.user.is_authenticated and hasattr(request.user, "player_profile"):
            return redirect("game_engine:map")
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["pokemon_choices"] = STARTER_POKEMON
        return context


class MapView(LoginRequiredMixin, TemplateView):
    """Serves the town map page with canvas-based tile rendering."""

    template_name = "game_engine/map.html"

    def dispatch(self, request, *args, **kwargs):
        # If user has no profile, redirect to quiz first
        if request.user.is_authenticated and not hasattr(request.user, "player_profile"):
            return redirect("game_engine:onboarding_quiz")
        return super().dispatch(request, *args, **kwargs)


class CreateProfileView(LoginRequiredMixin, View):
    """POST endpoint to create a PlayerProfile from quiz completion data."""

    def post(self, request):
        if hasattr(request.user, "player_profile"):
            return JsonResponse({"error": "Profile already exists"}, status=409)

        try:
            data = json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        team_name = data.get("team_name", "").strip()
        starter_pokemon = data.get("starter_pokemon", "").strip()
        partner_pokemon = data.get("partner_pokemon", "").strip()

        if not all([team_name, starter_pokemon, partner_pokemon]):
            return JsonResponse(
                {"error": "team_name, starter_pokemon, and partner_pokemon are required"},
                status=400,
            )

        profile = PlayerProfile.objects.create(
            user=request.user,
            team_name=team_name,
            starter_pokemon=starter_pokemon,
            partner_pokemon=partner_pokemon,
            starter_nickname=data.get("starter_nickname", "").strip(),
            partner_nickname=data.get("partner_nickname", "").strip(),
        )

        return JsonResponse({
            "id": profile.id,
            "team_name": profile.team_name,
            "starter_pokemon": profile.starter_pokemon,
            "partner_pokemon": profile.partner_pokemon,
        }, status=201)
