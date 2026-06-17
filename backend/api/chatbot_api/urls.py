"""Chatbot API URL configuration."""

from django.urls import path
from api.chatbot_api.views import ChatView

urlpatterns = [
    path("", ChatView.as_view(), name="chatbot"),
]
