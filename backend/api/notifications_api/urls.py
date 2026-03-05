"""Notifications API URL configuration."""

from django.urls import path
from api.notifications_api.views import (
    NotificationListView,
    MarkAllReadView,
    MarkOneReadView,
)

urlpatterns = [
    # ── Bell feed ─────────────────────────────────────────────────────────────
    path("notifications/",                    NotificationListView.as_view(), name="notifications-list"),

    # ── Mark all read ─────────────────────────────────────────────────────────
    path("notifications/read/",               MarkAllReadView.as_view(),      name="notifications-read-all"),

    # ── Mark one read ─────────────────────────────────────────────────────────
    path("notifications/<int:notification_id>/read/", MarkOneReadView.as_view(), name="notifications-read-one"),
]
