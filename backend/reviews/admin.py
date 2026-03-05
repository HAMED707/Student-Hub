"""
Reviews app admin.
Registers Review model for manual inspection and moderation in /admin.
"""

from django.contrib import admin
from reviews.models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin view for all reviews. Allows filtering by type and rating."""

    list_display  = ["reviewer", "reviewer_role", "rating", "property", "reviewed_user", "created_at"]
    list_filter   = ["reviewer_role", "rating", "created_at"]
    search_fields = ["reviewer__username", "property__title", "reviewed_user__username", "comment"]
    readonly_fields = ["created_at"]

    # NOTE: is_property_review / is_user_review determined by which FK is set
    fieldsets = (
        ("Reviewer", {
            "fields": ("reviewer", "reviewer_role"),
        }),
        ("Target (set exactly one)", {
            "fields": ("property", "reviewed_user"),
        }),
        ("Review Content", {
            "fields": ("rating", "comment"),
        }),
        ("Metadata", {
            "fields": ("created_at",),
        }),
    )