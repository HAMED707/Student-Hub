from django.apps import AppConfig


class RoommatesConfig(AppConfig):
    """Configuration class for the roommates app."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "roommates"

    def ready(self):
        """Import signals when the app is ready so they connect to the dispatcher."""
        import roommates.signals  # noqa: F401