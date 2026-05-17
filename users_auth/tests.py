from unittest.mock import patch, MagicMock

from django.test import Client, TestCase, override_settings
from django.urls import resolve, reverse

from users_auth.models import User
from users_auth.views import GitHubCallbackView, GitHubLoginView, LogoutView


class UserModelTests(TestCase):
    """Tests for the custom User model."""

    def test_create_user_with_github_fields(self):
        user = User.objects.create_user(
            username="testuser",
            github_id=12345,
            github_username="testuser",
            github_avatar_url="https://avatars.githubusercontent.com/u/12345",
            github_token="ghp_fake_token",
        )
        self.assertEqual(user.github_id, 12345)
        self.assertEqual(user.github_username, "testuser")
        self.assertEqual(user.github_token, "ghp_fake_token")

    def test_github_id_is_unique(self):
        User.objects.create_user(username="user1", github_id=99)
        with self.assertRaises(Exception):
            User.objects.create_user(username="user2", github_id=99)

    def test_github_fields_default_to_empty(self):
        user = User.objects.create_user(username="plainuser")
        self.assertEqual(user.github_username, "")
        self.assertEqual(user.github_avatar_url, "")
        self.assertEqual(user.github_token, "")
        self.assertIsNone(user.github_id)

    def test_str_prefers_github_username(self):
        user = User(username="django_name", github_username="gh_name")
        self.assertEqual(str(user), "gh_name")

    def test_str_falls_back_to_username(self):
        user = User(username="django_name", github_username="")
        self.assertEqual(str(user), "django_name")


class GitHubLoginViewTests(TestCase):
    """Tests for the GitHub OAuth redirect."""

    def setUp(self):
        self.client = Client()
        self.url = reverse("users_auth:login")

    def test_url_resolves_to_correct_view(self):
        match = resolve("/auth/login/")
        self.assertEqual(match.func.view_class, GitHubLoginView)

    @override_settings(GITHUB_CLIENT_ID="test_id", GITHUB_OAUTH_SCOPES="read:user")
    def test_redirects_to_github(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 302)
        self.assertIn("github.com/login/oauth/authorize", response.url)
        self.assertIn("client_id=test_id", response.url)

    def test_sets_state_in_session(self):
        self.client.get(self.url)
        session = self.client.session
        self.assertIn("github_oauth_state", session)


class GitHubCallbackViewTests(TestCase):
    """Tests for the GitHub OAuth callback."""

    def setUp(self):
        self.client = Client()
        self.url = reverse("users_auth:github_callback")

    def test_url_resolves_to_correct_view(self):
        match = resolve("/auth/callback/")
        self.assertEqual(match.func.view_class, GitHubCallbackView)

    def test_rejects_missing_code(self):
        session = self.client.session
        session["github_oauth_state"] = "valid_state"
        session.save()
        response = self.client.get(self.url, {"state": "valid_state"})
        self.assertEqual(response.status_code, 400)

    def test_rejects_mismatched_state(self):
        session = self.client.session
        session["github_oauth_state"] = "expected"
        session.save()
        response = self.client.get(self.url, {"code": "abc", "state": "wrong"})
        self.assertEqual(response.status_code, 400)

    @patch("users_auth.views.httpx.get")
    @patch("users_auth.views.httpx.post")
    def test_creates_user_on_success(self, mock_post, mock_get):
        # Mock token exchange
        mock_post.return_value = MagicMock(
            json=lambda: {"access_token": "ghp_test_token"}
        )
        # Mock user profile fetch
        mock_get.return_value = MagicMock(
            json=lambda: {"id": 42, "login": "octocat", "avatar_url": "https://example.com/avatar.png"}
        )

        session = self.client.session
        session["github_oauth_state"] = "valid"
        session.save()

        response = self.client.get(self.url, {"code": "abc123", "state": "valid"})

        self.assertEqual(response.status_code, 302)
        user = User.objects.get(github_id=42)
        self.assertEqual(user.github_username, "octocat")
        self.assertEqual(user.github_token, "ghp_test_token")

    @patch("users_auth.views.httpx.get")
    @patch("users_auth.views.httpx.post")
    def test_updates_existing_user_on_reauth(self, mock_post, mock_get):
        User.objects.create_user(username="octocat", github_id=42, github_token="old_token")

        mock_post.return_value = MagicMock(json=lambda: {"access_token": "new_token"})
        mock_get.return_value = MagicMock(
            json=lambda: {"id": 42, "login": "octocat", "avatar_url": "https://example.com/av.png"}
        )

        session = self.client.session
        session["github_oauth_state"] = "s"
        session.save()

        self.client.get(self.url, {"code": "abc", "state": "s"})
        user = User.objects.get(github_id=42)
        self.assertEqual(user.github_token, "new_token")
        self.assertEqual(User.objects.count(), 1)

    @patch("users_auth.views.httpx.post")
    def test_rejects_failed_token_exchange(self, mock_post):
        mock_post.return_value = MagicMock(json=lambda: {"error": "bad_code"})

        session = self.client.session
        session["github_oauth_state"] = "s"
        session.save()

        response = self.client.get(self.url, {"code": "bad", "state": "s"})
        self.assertEqual(response.status_code, 400)


class LogoutViewTests(TestCase):
    """Tests for the logout view."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="testuser")

    def test_url_resolves_to_correct_view(self):
        match = resolve("/auth/logout/")
        self.assertEqual(match.func.view_class, LogoutView)

    def test_logs_out_and_redirects(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("users_auth:logout"))
        self.assertEqual(response.status_code, 302)
        self.assertIn("login", response.url)
