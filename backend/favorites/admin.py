"""
Favorites app admin.
Registers Favorite model in /admin for visibility and debugging.
"""

from django.contrib import admin
from favorites.models import Favorite


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    """Admin view for student shortlists."""

    list_display  = ["user", "property", "created_at"]
    list_filter   = ["created_at"]
    search_fields = ["user__username", "property__title"]
    readonly_fields = ["created_at"]