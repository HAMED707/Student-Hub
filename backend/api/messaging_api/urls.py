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
    path("",               ConversationListView.as_view(),   name="messaging-inbox"),

    # ── Start a DM ────────────────────────────────────────────────────────────
    path("start/",         StartConversationView.as_view(),  name="messaging-start"),

    # ── Open thread ───────────────────────────────────────────────────────────
    path("<int:conversation_id>/",       ConversationDetailView.as_view(), name="messaging-detail"),

    # ── Send message ──────────────────────────────────────────────────────────
    path("<int:conversation_id>/send/",  SendMessageView.as_view(),        name="messaging-send"),
]
