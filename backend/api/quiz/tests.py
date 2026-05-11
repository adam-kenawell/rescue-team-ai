import json
import pytest
from django.test import Client as DjangoClient

from api.models import Player
from api.quiz.data import NATURE_STARTERS, QUESTIONS, POKEMON_TYPES, types_overlap
from api.quiz.logic import tally_nature, get_starter


# ─── Unit tests for quiz logic ───


class TestTallyNature:
    def test_single_dominant_nature(self):
        """If only Brave points are given, result is Brave."""
        answers = [{"Brave": 2}, {"Brave": 2}]
        assert tally_nature(answers) == "Brave"

    def test_mixed_scores_highest_wins(self):
        """Brave=4 beats Calm=1."""
        answers = [{"Brave": 2, "Calm": 1}, {"Brave": 2}]
        assert tally_nature(answers) == "Brave"

    def test_tie_returns_valid_nature(self):
        """When tied, result should be one of the tied natures."""
        answers = [{"Brave": 2}, {"Calm": 2}]
        result = tally_nature(answers)
        assert result in ("Brave", "Calm")


class TestGetStarter:
    def test_brave_male_is_pikachu(self):
        assert get_starter("Brave", "male") == "Pikachu"

    def test_brave_female_is_charmander(self):
        assert get_starter("Brave", "female") == "Charmander"

    def test_relaxed_male_is_phanpy(self):
        assert get_starter("Relaxed", "male") == "Phanpy"

    def test_relaxed_female_is_vulpix(self):
        assert get_starter("Relaxed", "female") == "Vulpix"

    def test_all_natures_have_both_genders(self):
        """Every nature must map to a starter for both male and female."""
        for nature, mapping in NATURE_STARTERS.items():
            assert "male" in mapping, f"{nature} missing male"
            assert "female" in mapping, f"{nature} missing female"
            assert mapping["male"] in POKEMON_TYPES, f"{nature} male starter not in type table"
            assert mapping["female"] in POKEMON_TYPES, f"{nature} female starter not in type table"


class TestTypesOverlap:
    def test_same_type_overlaps(self):
        """Charmander (Fire) and Torchic (Fire) share a type."""
        assert types_overlap("Charmander", "Torchic") is True

    def test_different_types_no_overlap(self):
        """Pikachu (Electric) and Charmander (Fire) don't share a type."""
        assert types_overlap("Pikachu", "Charmander") is False

    def test_bulbasaur_chikorita_overlap(self):
        """Both are Grass type."""
        assert types_overlap("Bulbasaur", "Chikorita") is True


# ─── API endpoint tests ───


@pytest.mark.django_db
class TestStartQuizEndpoint:
    def test_returns_8_questions(self):
        client = DjangoClient()
        resp = client.get("/api/quiz/start/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["questions"]) == 8

    def test_questions_have_no_points(self):
        """Client should NOT see the nature points — only text + index."""
        client = DjangoClient()
        resp = client.get("/api/quiz/start/")
        for q in resp.json()["questions"]:
            for answer in q["answers"]:
                assert "points" not in answer
                assert "text" in answer
                assert "index" in answer


@pytest.mark.django_db
class TestSubmitQuizEndpoint:
    def _brave_answers(self):
        """Build answers that guarantee a Brave result."""
        # Find all questions with Brave points and pick the Brave answer
        brave_answers = []
        for q in QUESTIONS:
            for i, a in enumerate(q["answers"]):
                if "Brave" in a["points"]:
                    brave_answers.append({"question_id": q["id"], "answer_index": i})
                    break
            if len(brave_answers) >= 8:
                break
        return brave_answers

    def test_brave_male_returns_pikachu(self):
        client = DjangoClient()
        resp = client.post(
            "/api/quiz/submit/",
            data=json.dumps({"answers": self._brave_answers(), "gender": "male"}),
            content_type="application/json",
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["nature"] == "Brave"
        assert data["starter"] == "Pikachu"

    def test_brave_female_returns_charmander(self):
        client = DjangoClient()
        resp = client.post(
            "/api/quiz/submit/",
            data=json.dumps({"answers": self._brave_answers(), "gender": "female"}),
            content_type="application/json",
        )
        data = resp.json()
        assert data["nature"] == "Brave"
        assert data["starter"] == "Charmander"

    def test_missing_gender_returns_400(self):
        client = DjangoClient()
        resp = client.post(
            "/api/quiz/submit/",
            data=json.dumps({"answers": [{"question_id": 1, "answer_index": 0}], "gender": ""}),
            content_type="application/json",
        )
        assert resp.status_code == 400

    def test_no_answers_returns_400(self):
        client = DjangoClient()
        resp = client.post(
            "/api/quiz/submit/",
            data=json.dumps({"answers": [], "gender": "male"}),
            content_type="application/json",
        )
        assert resp.status_code == 400


@pytest.mark.django_db
class TestSelectPartnerEndpoint:
    def test_valid_partner_creates_player(self):
        """Pikachu (Electric) + Charmander (Fire) = valid, no type overlap."""
        client = DjangoClient()
        resp = client.post(
            "/api/quiz/partner/",
            data=json.dumps({
                "starter": "Pikachu",
                "partner": "Charmander",
                "nature": "Brave",
                "gender": "male",
            }),
            content_type="application/json",
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["starter"] == "Pikachu"
        assert data["partner"] == "Charmander"
        assert Player.objects.count() == 1

    def test_same_type_partner_rejected(self):
        """Pikachu (Electric) + Shinx (Electric) = rejected."""
        client = DjangoClient()
        resp = client.post(
            "/api/quiz/partner/",
            data=json.dumps({
                "starter": "Pikachu",
                "partner": "Shinx",
                "nature": "Brave",
                "gender": "male",
            }),
            content_type="application/json",
        )
        assert resp.status_code == 400
        assert "type" in resp.json()["error"].lower()

    def test_same_pokemon_partner_rejected(self):
        """Can't partner with yourself."""
        client = DjangoClient()
        resp = client.post(
            "/api/quiz/partner/",
            data=json.dumps({
                "starter": "Pikachu",
                "partner": "Pikachu",
                "nature": "Brave",
                "gender": "male",
            }),
            content_type="application/json",
        )
        assert resp.status_code == 400

    def test_wrong_starter_for_nature_rejected(self):
        """Brave male should be Pikachu, not Charmander."""
        client = DjangoClient()
        resp = client.post(
            "/api/quiz/partner/",
            data=json.dumps({
                "starter": "Charmander",
                "partner": "Squirtle",
                "nature": "Brave",
                "gender": "male",
            }),
            content_type="application/json",
        )
        assert resp.status_code == 400


@pytest.mark.django_db
class TestFullQuizFlow:
    def test_start_submit_partner_creates_player(self):
        """End-to-end: start quiz → submit answers → pick partner → player in DB."""
        client = DjangoClient()

        # 1. Start quiz
        resp = client.get("/api/quiz/start/")
        assert resp.status_code == 200
        questions = resp.json()["questions"]
        assert len(questions) == 8

        # 2. Submit — always pick first answer for each question, with male gender
        answers = [{"question_id": q["id"], "answer_index": 0} for q in questions]
        resp = client.post(
            "/api/quiz/submit/",
            data=json.dumps({"answers": answers, "gender": "male"}),
            content_type="application/json",
        )
        assert resp.status_code == 200
        result = resp.json()
        starter = result["starter"]
        nature = result["nature"]

        # 3. Pick a partner that doesn't share a type
        starter_types = set(POKEMON_TYPES[starter])
        for candidate in POKEMON_TYPES:
            if candidate == starter:
                continue
            if not starter_types & set(POKEMON_TYPES[candidate]):
                partner = candidate
                break

        resp = client.post(
            "/api/quiz/partner/",
            data=json.dumps({
                "starter": starter,
                "partner": partner,
                "nature": nature,
                "gender": "male",
            }),
            content_type="application/json",
        )
        assert resp.status_code == 201
        assert Player.objects.count() == 1
        player = Player.objects.first()
        assert player.starter_pokemon == starter
        assert player.partner_pokemon == partner
        assert player.quiz_nature == nature
