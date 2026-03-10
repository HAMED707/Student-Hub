"""
Properties API permissions.
Object-level permission so ownership checks don't live inside every view.
"""
from rest_framework.permissions import BasePermission, IsAuthenticated


class IsPropertyOwner(BasePermission):
    """
    Object-level permission — allows access only if the requesting user
    owns the property being accessed.

    Usage in views:
        permission_classes = [IsPropertyOwner]

        def patch(self, request, property_id):
            prop = get_object_or_404(Property, id=property_id)
            self.check_object_permissions(request, prop)   ← triggers has_object_permission
            ...
    """
    message = "You do not own this property."

    def has_permission(self, request, view):
        """User must be authenticated and be a landlord."""
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "landlord"
        )

    def has_object_permission(self, request, view, obj):
        """obj is the Property instance. Checks landlord field directly."""
        return obj.landlord == request.user
