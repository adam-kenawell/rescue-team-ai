"""Session API views."""

import json

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET

from .services import start_session, send_message, get_session_state, end_session, SessionError


@csrf_exempt
@require_POST
def start_session_view(request: HttpRequest) -> JsonResponse:
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    player_id = body.get("player_id")
    if player_id is None:
        return JsonResponse({"error": "player_id is required"}, status=400)

    try:
        session = start_session(player_id)
    except SessionError as e:
        return JsonResponse({"error": e.message}, status=e.status_code)

    return JsonResponse({"session_id": session.pk}, status=201)


@csrf_exempt
@require_POST
def send_message_view(request: HttpRequest, session_id: int) -> JsonResponse:
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    content = body.get("content", "")

    try:
        result = send_message(session_id, content)
    except SessionError as e:
        return JsonResponse({"error": e.message}, status=e.status_code)

    return JsonResponse(result)


@require_GET
def session_state_view(request: HttpRequest, session_id: int) -> JsonResponse:
    since = request.GET.get("since")

    try:
        state = get_session_state(session_id, since)
    except SessionError as e:
        return JsonResponse({"error": e.message}, status=e.status_code)

    return JsonResponse(state)


@csrf_exempt
@require_POST
def end_session_view(request: HttpRequest, session_id: int) -> JsonResponse:
    try:
        end_session(session_id)
    except SessionError as e:
        return JsonResponse({"error": e.message}, status=e.status_code)

    return JsonResponse({"status": "completed"})
