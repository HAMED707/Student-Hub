"""
Accounts API custom permissions.
Used as permission_classes in views instead of repeating role checks everywhere.

Permissions:
    - IsStudent  → only students can access
    - IsLandlord → only landlords can access
"""

from rest_framework.permissions import BasePermission


# ──────────────────────────────────────────────────────────────────────────────────────────


class IsStudent(BasePermission):
    """
    Allows access only to users with role = 'student'.
    Used on: roommate matching, shortlist, student profile endpoints.
    """

    message = "Access restricted to students only."

    def has_permission(self, request, view):
        """Return True only if the user is authenticated and is a student."""
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "student"
        )


class IsLandlord(BasePermission):
    """
    Allows access only to users with role = 'landlord'.
    Used on: create property, owner dashboard, payments endpoints.
    """

    message = "Access restricted to landlords only."

    def has_permission(self, request, view):
        """Return True only if the user is authenticated and is a landlord."""
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "landlord"
        )