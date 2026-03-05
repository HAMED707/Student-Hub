"""Community app config — wires signals on startup."""

from django.apps import AppConfig


class CommunityConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "community"

    def ready(self):
        import community.signals  # noqa: F401 — registers signal handlers