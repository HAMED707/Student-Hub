"""
Accounts app configuration.
The ready() method imports signals so they register when Django starts.
Without this, signals.py exists but never fires.
"""

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """Configuration class for the accounts app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        """Import signals when the app is ready so they connect to the dispatcher."""
        import accounts.signals  # noqa: F401