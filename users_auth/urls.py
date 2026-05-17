from django.urls import path

from users_auth.views import GitHubCallbackView, GitHubLoginView, LogoutView

app_name = "users_auth"

urlpatterns = [
    path("login/", GitHubLoginView.as_view(), name="login"),
    path("callback/", GitHubCallbackView.as_view(), name="github_callback"),
    path("logout/", LogoutView.as_view(), name="logout"),
]
