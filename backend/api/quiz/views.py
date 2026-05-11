import json
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET

from api.models import Player
from .data import QUESTIONS, NATURE_STARTERS, ALL_PARTNERS, types_overlap
from .logic import pick_questions, tally_nature, get_starter


@require_GET
def start_quiz(request: HttpRequest) -> JsonResponse:
    """Return 8 random quiz questions."""
    questions = pick_questions()
    # Strip the points from answers — client only sees text + index
    client_questions = []
    for q in questions:
        client_questions.append({
            "id": q["id"],
            "text": q["text"],
            "answers": [{"index": i, "text": a["text"]} for i, a in enumerate(q["answers"])],
        })
    return JsonResponse({"questions": client_questions})


@csrf_exempt
@require_POST
def submit_quiz(request: HttpRequest) -> JsonResponse:
    """
    Accept quiz answers, compute nature + starter.
    Body: {"answers": [{"question_id": 1, "answer_index": 0}, ...], "gender": "male"|"female"}
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    answers_raw = body.get("answers", [])
    gender = body.get("gender", "").lower()

    if gender not in ("male", "female"):
        return JsonResponse({"error": "Gender must be 'male' or 'female'"}, status=400)

    if not answers_raw:
        return JsonResponse({"error": "No answers provided"}, status=400)

    # Build a lookup for questions by id
    q_lookup = {q["id"]: q for q in QUESTIONS}

    # Collect the nature points from each answered question
    answer_points: list[dict[str, int]] = []
    for ans in answers_raw:
        qid = ans.get("question_id")
        aidx = ans.get("answer_index")
        question = q_lookup.get(qid)
        if question is None:
            continue
        if aidx is None or aidx < 0 or aidx >= len(question["answers"]):
            continue
        answer_points.append(question["answers"][aidx]["points"])

    nature = tally_nature(answer_points)
    starter = get_starter(nature, gender)

    return JsonResponse({
        "nature": nature,
        "starter": starter,
        "gender": gender,
    })


@csrf_exempt
@require_POST
def select_partner(request: HttpRequest) -> JsonResponse:
    """
    Create a Player with their starter + chosen partner.
    Body: {"starter": "Pikachu", "partner": "Charmander", "nature": "Brave", "gender": "male"}
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    starter = body.get("starter", "")
    partner = body.get("partner", "")
    nature = body.get("nature", "")
    gender = body.get("gender", "")

    # Validate starter is legit
    if nature not in NATURE_STARTERS:
        return JsonResponse({"error": f"Invalid nature: {nature}"}, status=400)
    if gender not in ("male", "female"):
        return JsonResponse({"error": "Gender must be 'male' or 'female'"}, status=400)

    expected_starter = get_starter(nature, gender)
    if starter != expected_starter:
        return JsonResponse({"error": f"Starter doesn't match nature/gender"}, status=400)

    # Validate partner
    if partner not in ALL_PARTNERS:
        return JsonResponse({"error": f"Invalid partner: {partner}"}, status=400)
    if partner == starter:
        return JsonResponse({"error": "Partner can't be the same as starter"}, status=400)
    if types_overlap(starter, partner):
        return JsonResponse(
            {"error": f"Partner can't share a type with starter"},
            status=400,
        )

    player = Player.objects.create(
        starter_pokemon=starter,
        partner_pokemon=partner,
        quiz_nature=nature,
    )

    return JsonResponse({
        "player_id": player.pk,
        "starter": starter,
        "partner": partner,
        "nature": nature,
    }, status=201)
