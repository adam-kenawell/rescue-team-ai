from django.urls import path

from users_auth.views import (
    GitHubCallbackView,
    GitHubRedirectView,
    LoginPageView,
    LogoutView,
)

app_name = "users_auth"

urlpatterns = [
    path("login/", LoginPageView.as_view(), name="login"),
    path("github/", GitHubRedirectView.as_view(), name="github_redirect"),
    path("callback/", GitHubCallbackView.as_view(), name="github_callback"),
    path("logout/", LogoutView.as_view(), name="logout"),
]
