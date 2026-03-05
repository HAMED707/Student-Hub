"""
Properties app configuration.
ready() is already wired for when signals are added later
(e.g. auto-update landlord stats when a property gets reviewed or booked).
"""
from django.apps import AppConfig


class PropertiesConfig(AppConfig):
    """Configuration class for the properties app."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "properties"

    def ready(self):
        """
        Import signals when the app loads so they connect to the dispatcher.
        NOTE: uncomment the line below when properties/signals.py is created.
        """
        pass  # import properties.signals  # noqa: F401