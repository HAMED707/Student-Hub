"""Without ready() importing signals, signals.py exists but never fires."""
from django.apps import AppConfig


class FavoritesConfig(AppConfig):
    """Configuration class for the favorites app."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "favorites"

    def ready(self):
        """
        Import signals when the app loads so they connect to the dispatcher.
        NOTE: uncomment the line below when favorites/signals.py is created.
        """
        pass  # import favorites.signals  # noqa: F401