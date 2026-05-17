import secrets
from urllib.parse import urlencode

import httpx
from django.conf import settings
from django.contrib.auth import login, logout
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views import View
from django.views.generic import TemplateView

from users_auth.models import User


class LoginPageView(TemplateView):
    """Renders the login page with the 'Sign in with GitHub' button."""

    template_name = "users_auth/login.html"

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            if hasattr(request.user, "player_profile"):
                return redirect("game_engine:map")
            return redirect("game_engine:onboarding_quiz")
        return super().dispatch(request, *args, **kwargs)


class GitHubRedirectView(View):
    """Redirects the user to GitHub's OAuth authorization page."""

    def get(self, request):
        state = secrets.token_urlsafe(32)
        request.session["github_oauth_state"] = state

        params = urlencode({
            "client_id": settings.GITHUB_CLIENT_ID,
            "scope": settings.GITHUB_OAUTH_SCOPES,
            "state": state,
        })
        return redirect(f"https://github.com/login/oauth/authorize?{params}")


class GitHubCallbackView(View):
    """Handles the OAuth callback from GitHub.

    Exchanges the authorization code for an access token, fetches the
    user's GitHub profile, and creates/updates the local User record.
    """

    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        expected_state = request.session.pop("github_oauth_state", None)

        if not code or not state or state != expected_state:
            return JsonResponse({"error": "Invalid OAuth state"}, status=400)

        # Exchange code for access token
        token_response = httpx.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            return JsonResponse({"error": "Failed to obtain access token"}, status=400)

        # Fetch GitHub user profile
        user_response = httpx.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        github_user = user_response.json()

        github_id = github_user["id"]
        github_username = github_user["login"]
        avatar_url = github_user.get("avatar_url", "")

        # Create or update local user
        user, _created = User.objects.update_or_create(
            github_id=github_id,
            defaults={
                "username": github_username,
                "github_username": github_username,
                "github_avatar_url": avatar_url,
                "github_token": access_token,
            },
        )

        login(request, user)

        # Route: no profile yet -> quiz, otherwise -> map
        if hasattr(user, "player_profile"):
            return redirect("game_engine:map")
        return redirect("game_engine:onboarding_quiz")


class LogoutView(View):
    """Logs the user out and redirects to the login page."""

    def get(self, request):
        logout(request)
        return redirect("users_auth:login")
