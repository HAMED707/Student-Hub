from django.urls import path
from .views import (
    ConversationView,
    MessageView,
    MessageReadView,
)

urlpatterns = [
    path("",                       ConversationView.as_view(),  name="conversations"),
    path("<int:conversation_id>/", MessageView.as_view(),   name="messages"),
    path("<int:conversation_id>/read/", MessageReadView.as_view(), name="messages-read"),
]
