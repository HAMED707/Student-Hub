"""Messaging API URL configuration."""

from django.urls import path
from api.messaging_api.views import (
    ConversationListView,
    ConversationDetailView,
    SendMessageView,
    StartConversationView,
)

urlpatterns = [
    # ── Inbox ─────────────────────────────────────────────────────────────────
    path("messages/",               ConversationListView.as_view(),   name="messaging-inbox"),

    # ── Start a DM ────────────────────────────────────────────────────────────
    path("messages/start/",         StartConversationView.as_view(),  name="messaging-start"),

    # ── Open thread ───────────────────────────────────────────────────────────
    path("messages/<int:conversation_id>/",       ConversationDetailView.as_view(), name="messaging-detail"),

    # ── Send message ──────────────────────────────────────────────────────────
    path("messages/<int:conversation_id>/send/",  SendMessageView.as_view(),        name="messaging-send"),
]
