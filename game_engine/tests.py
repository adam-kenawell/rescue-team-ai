import json

from django.test import TestCase, Client
from django.urls import reverse, resolve

from game_engine.models import PlayerProfile
from game_engine.views import CreateProfileView, OnboardingQuizView, MapView
from users_auth.models import User


class OnboardingQuizViewTests(TestCase):
    """Tests for the CP2 onboarding quiz page."""

    def setUp(self):
        self.client = Client()
        self.url = reverse("game_engine:onboarding_quiz")
        self.user = User.objects.create_user(username="testplayer")

    # -- Auth gating --

    def test_anonymous_user_redirected_to_login(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 302)
        self.assertIn("login", response.url)

    def test_user_with_profile_redirected_to_map(self):
        self.client.force_login(self.user)
        PlayerProfile.objects.create(
            user=self.user, team_name="T", starter_pokemon="S", partner_pokemon="P",
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 302)
        self.assertIn("map", response.url)

    # -- Routing --

    def test_url_resolves_to_correct_view(self):
        match = resolve("/game/onboarding/")
        self.assertEqual(match.func.view_class, OnboardingQuizView)

    # -- GET (authenticated, no profile) --

    def test_get_returns_200(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_get_uses_correct_template(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertTemplateUsed(response, "game_engine/onboarding_quiz.html")

    def test_get_contains_base_template_structure(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertContains(response, "<!DOCTYPE html>")

    # -- Context / Data Contract --

    def test_context_contains_pokemon_choices(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertIn("pokemon_choices", response.context)

    def test_pokemon_choices_is_list_of_dicts(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        choices = response.context["pokemon_choices"]
        self.assertIsInstance(choices, list)
        self.assertTrue(len(choices) > 0)
        for choice in choices:
            self.assertIn("name", choice)
            self.assertIn("dex_id", choice)
            self.assertIn("types", choice)
            self.assertIsInstance(choice["types"], list)

    # -- Static assets --

    def test_page_loads_pmd_visualizer_module(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertContains(response, "pmd-visualizer/index.js")

    def test_page_loads_quiz_script(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertContains(response, "quiz.js")

    # -- Chat bubble container --

    def test_page_has_chat_bubble_container(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertContains(response, 'id="chat-bubble"')

    # -- Sprite display area --

    def test_page_has_sprite_display_area(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertContains(response, 'id="sprite-display"')


class MapViewTests(TestCase):
    """Tests for the CP3 town map page."""

    def setUp(self):
        self.client = Client()
        self.url = reverse("game_engine:map")
        self.user = User.objects.create_user(username="mapplayer")
        self.profile = PlayerProfile.objects.create(
            user=self.user, team_name="TestTeam",
            starter_pokemon="Beldum", partner_pokemon="Aron",
        )

    # -- Auth gating --

    def test_anonymous_user_redirected_to_login(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 302)
        self.assertIn("login", response.url)

    def test_user_without_profile_redirected_to_quiz(self):
        user2 = User.objects.create_user(username="newplayer")
        self.client.force_login(user2)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 302)
        self.assertIn("onboarding", response.url)

    # -- Routing --

    def test_url_resolves_to_correct_view(self):
        match = resolve("/game/map/")
        self.assertEqual(match.func.view_class, MapView)

    # -- GET (authenticated with profile) --

    def test_get_returns_200(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_get_uses_correct_template(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertTemplateUsed(response, "game_engine/map.html")

    def test_extends_base_template(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertContains(response, "<!DOCTYPE html>")

    # -- Static assets --

    def test_page_loads_map_module(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertContains(response, "map.js")

    def test_page_loads_map_css(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertContains(response, "map.css")

    # -- Canvas element --

    def test_page_has_map_canvas(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertContains(response, 'id="map-canvas"')

    def test_page_has_fade_overlay(self):
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertContains(response, 'id="fade-overlay"')


class PlayerProfileModelTests(TestCase):
    """Tests for the PlayerProfile model."""

    def setUp(self):
        self.user = User.objects.create_user(username="profuser")

    def test_create_profile(self):
        profile = PlayerProfile.objects.create(
            user=self.user, team_name="Blazers",
            starter_pokemon="Beldum", partner_pokemon="Aron",
        )
        self.assertEqual(profile.team_name, "Blazers")
        self.assertEqual(profile.starter_pokemon, "Beldum")

    def test_one_profile_per_user(self):
        PlayerProfile.objects.create(
            user=self.user, team_name="A", starter_pokemon="S", partner_pokemon="P",
        )
        with self.assertRaises(Exception):
            PlayerProfile.objects.create(
                user=self.user, team_name="B", starter_pokemon="S", partner_pokemon="P",
            )

    def test_nicknames_default_to_empty(self):
        profile = PlayerProfile.objects.create(
            user=self.user, team_name="T", starter_pokemon="S", partner_pokemon="P",
        )
        self.assertEqual(profile.starter_nickname, "")
        self.assertEqual(profile.partner_nickname, "")

    def test_str_representation(self):
        profile = PlayerProfile.objects.create(
            user=self.user, team_name="Blazers", starter_pokemon="S", partner_pokemon="P",
        )
        self.assertIn("Blazers", str(profile))

    def test_timestamps_auto_set(self):
        profile = PlayerProfile.objects.create(
            user=self.user, team_name="T", starter_pokemon="S", partner_pokemon="P",
        )
        self.assertIsNotNone(profile.created_at)
        self.assertIsNotNone(profile.updated_at)


class CreateProfileViewTests(TestCase):
    """Tests for the profile creation endpoint."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="quizuser")
        self.url = reverse("game_engine:create_profile")
        self.valid_payload = {
            "team_name": "Blazers",
            "starter_pokemon": "Beldum",
            "partner_pokemon": "Aron",
            "starter_nickname": "Steel",
            "partner_nickname": "Rocky",
        }

    def test_url_resolves_to_correct_view(self):
        match = resolve("/game/api/profile/create/")
        self.assertEqual(match.func.view_class, CreateProfileView)

    def test_anonymous_user_rejected(self):
        response = self.client.post(
            self.url, json.dumps(self.valid_payload), content_type="application/json",
        )
        self.assertEqual(response.status_code, 302)

    def test_creates_profile_on_valid_post(self):
        self.client.force_login(self.user)
        response = self.client.post(
            self.url, json.dumps(self.valid_payload), content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(PlayerProfile.objects.filter(user=self.user).exists())

    def test_returns_profile_data_on_success(self):
        self.client.force_login(self.user)
        response = self.client.post(
            self.url, json.dumps(self.valid_payload), content_type="application/json",
        )
        data = response.json()
        self.assertEqual(data["team_name"], "Blazers")
        self.assertEqual(data["starter_pokemon"], "Beldum")

    def test_rejects_duplicate_profile(self):
        self.client.force_login(self.user)
        PlayerProfile.objects.create(
            user=self.user, team_name="T", starter_pokemon="S", partner_pokemon="P",
        )
        response = self.client.post(
            self.url, json.dumps(self.valid_payload), content_type="application/json",
        )
        self.assertEqual(response.status_code, 409)

    def test_rejects_missing_required_fields(self):
        self.client.force_login(self.user)
        response = self.client.post(
            self.url, json.dumps({"team_name": "T"}), content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_rejects_invalid_json(self):
        self.client.force_login(self.user)
        response = self.client.post(self.url, "not json", content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_nicknames_are_optional(self):
        self.client.force_login(self.user)
        payload = {
            "team_name": "T", "starter_pokemon": "S", "partner_pokemon": "P",
        }
        response = self.client.post(
            self.url, json.dumps(payload), content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        profile = PlayerProfile.objects.get(user=self.user)
        self.assertEqual(profile.starter_nickname, "")
        self.assertEqual(profile.partner_nickname, "")
