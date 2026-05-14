from django.urls import path

from game_engine.views import MapView, OnboardingQuizView

app_name = "game_engine"

urlpatterns = [
    path("onboarding/", OnboardingQuizView.as_view(), name="onboarding_quiz"),
    path("map/", MapView.as_view(), name="map"),
]
