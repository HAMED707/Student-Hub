"""Without ready() importing signals, signals.py exists but never fires."""
from django.apps import AppConfig


class BookingsConfig(AppConfig):
    """Configuration class for the bookings app."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "bookings"

    def ready(self):
        import bookings.signals  # noqa: F401 — registers signal handlers
