from django.urls import path
from . import views

urlpatterns = [
    path("start/", views.start_session_view, name="session-start"),
    path("<int:session_id>/message/", views.send_message_view, name="session-message"),
    path("<int:session_id>/state/", views.session_state_view, name="session-state"),
    path("<int:session_id>/end/", views.end_session_view, name="session-end"),
    path("<int:session_id>/ack/", views.ack_view, name="session-ack"),
]
