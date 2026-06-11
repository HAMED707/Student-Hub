"""
properties/apps.py
Registers the auto-geocode signal so it fires on every Property save.
"""
from django.apps import AppConfig


class PropertiesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name               = "properties"

    def ready(self):
        import properties.signals  # noqa: F401 — registers geocoding signal