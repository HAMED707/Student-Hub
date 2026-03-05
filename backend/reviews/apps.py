"""Without ready() importing signals, signals.py exists but never fires."""
from django.apps import AppConfig


class ReviewsConfig(AppConfig):
    """Configuration class for the reviews app."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "reviews"

    def ready(self):
        """
        Import signals when the app loads so they connect to the dispatcher.
        NOTE: uncomment the line below when reviews/signals.py is created.
        """
        pass  # import reviews.signals  # noqa: F401