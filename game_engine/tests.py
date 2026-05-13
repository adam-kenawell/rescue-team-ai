from django.test import TestCase, Client
from django.urls import reverse, resolve

from game_engine.views import OnboardingQuizView


class OnboardingQuizViewTests(TestCase):
    """Tests for the CP2 onboarding quiz page."""

    def setUp(self):
        self.client = Client()
        self.url = reverse("game_engine:onboarding_quiz")

    # -- Routing --

    def test_url_resolves_to_correct_view(self):
        match = resolve("/game/onboarding/")
        self.assertEqual(match.func.view_class, OnboardingQuizView)

    # -- GET --

    def test_get_returns_200(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_get_uses_correct_template(self):
        response = self.client.get(self.url)
        self.assertTemplateUsed(response, "game_engine/onboarding_quiz.html")

    def test_get_contains_base_template_structure(self):
        response = self.client.get(self.url)
        self.assertContains(response, "<!DOCTYPE html>")

    # -- Context / Data Contract --

    def test_context_contains_pokemon_choices(self):
        response = self.client.get(self.url)
        self.assertIn("pokemon_choices", response.context)

    def test_pokemon_choices_is_list_of_dicts(self):
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
        response = self.client.get(self.url)
        self.assertContains(response, "pmd-visualizer/index.js")

    def test_page_loads_quiz_script(self):
        response = self.client.get(self.url)
        self.assertContains(response, "quiz.js")

    # -- Chat bubble container --

    def test_page_has_chat_bubble_container(self):
        response = self.client.get(self.url)
        self.assertContains(response, 'id="chat-bubble"')

    # -- Sprite display area --

    def test_page_has_sprite_display_area(self):
        response = self.client.get(self.url)
        self.assertContains(response, 'id="sprite-display"')
