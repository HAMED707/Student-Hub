"""
Accounts app services.
Business logic layer — keeps views and serializers clean.

Functions:
    - create_user_account → creates a new user with hashed password
    - authenticated       → verifies credentials and returns user or None
"""

from django.contrib.auth import authenticate
from accounts.models import Users


# ──────────────────────────────────────────────────────────────────────────────────────────


def create_user_account(password, **kwargs):
    """
    Creates a new user with a properly hashed password.

    Using create_user() instead of create() is critical —
    create() stores the password in plain text which breaks authentication.

    Called by: RegisterSerializer.create()
    """
    user = Users.objects.create_user(password=password, **kwargs)
    return user


def authenticated(username, password):
    """
    Checks credentials and returns the user object if valid, otherwise None.

    Using Django's built-in authenticate() so it respects
    any auth backends configured in settings.

    Called by: LoginSerializer.validate()
    """
    user = authenticate(username=username, password=password)
    return user  # None if credentials are wrong