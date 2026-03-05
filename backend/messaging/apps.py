"""Messaging app config."""

from django.apps import AppConfig


class MessagingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name               = "messaging"

    def ready(self):
        pass  # TODO: import messaging.signals when notifications are wired