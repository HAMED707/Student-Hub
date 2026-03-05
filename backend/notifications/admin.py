"""Notifications admin — exposes the bell feed in /admin."""

from django.contrib import admin
from notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ("id", "recipient", "notification_type", "title", "is_read", "created_at")
    list_filter   = ("notification_type", "is_read")
    search_fields = ("recipient__username", "title", "message")
    readonly_fields = ("created_at",)
    list_editable = ("is_read",)  # lets admins bulk-mark as read from the list view