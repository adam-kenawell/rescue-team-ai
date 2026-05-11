from django.urls import path, include

urlpatterns = [
    path("quiz/", include("api.quiz.urls")),
    path("session/", include("api.session.urls")),
]
