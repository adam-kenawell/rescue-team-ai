from django.urls import path

from game_engine.views import OnboardingQuizView

app_name = "game_engine"

urlpatterns = [
    path("onboarding/", OnboardingQuizView.as_view(), name="onboarding_quiz"),
]
