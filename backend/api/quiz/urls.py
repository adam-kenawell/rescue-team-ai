from django.urls import path
from . import views

urlpatterns = [
    path("start/", views.start_quiz, name="quiz-start"),
    path("submit/", views.submit_quiz, name="quiz-submit"),
    path("partner/", views.select_partner, name="quiz-partner"),
]
