"""
Accounts app admin configuration.
Registers all models so they appear in the Django admin panel at /admin.
Useful during development for manually verifying users and checking profiles.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from accounts.models import Users, StudentProfile, LandlordProfile, VerificationDocument


# ──────────────────────────────────────────────────────────────────────────────────────────


@admin.register(Users)
class UsersAdmin(UserAdmin):
    """
    Custom admin view for Users.
    Extends Django's built-in UserAdmin so password hashing still works in admin.
    """

    # Columns shown in the users list page
    list_display = [
        "username", "email", "role",
        "is_verified", "is_top_rated", "is_quick_responder",
        "is_active", "date_joined",
    ]

    # Filters in the right sidebar
    list_filter = ["role", "is_verified", "is_top_rated", "is_active"]

    # Add role and badge fields to the edit form
    fieldsets = UserAdmin.fieldsets + (
        ("StudentHub Info", {
            "fields": (
                "role", "phone_number", "gender", "date_of_birth",
                "profile_picture", "city",
                "is_verified", "is_top_rated", "is_quick_responder",
            )
        }),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    """Admin view for StudentProfile."""

    list_display = ["user", "university", "faculty", "is_looking_for_room", "profile_strength"]
    list_filter = ["university", "is_looking_for_room", "smoking", "personality"]
    search_fields = ["user__username", "university", "faculty"]


@admin.register(LandlordProfile)
class LandlordProfileAdmin(admin.ModelAdmin):
    """Admin view for LandlordProfile."""

    list_display = ["user", "company_name", "is_id_verified", "total_income", "available_balance"]
    list_filter = ["is_id_verified"]
    search_fields = ["user__username", "company_name"]

    # Allow admin to verify landlord IDs from this panel
    readonly_fields = ["total_income", "available_balance"]


@admin.register(VerificationDocument)
class VerificationDocumentAdmin(admin.ModelAdmin):
    """
    Admin view for VerificationDocument.
    Main use: admin reviews uploaded documents and sets is_verified = True.
    """

    list_display = ["user", "doc_type", "is_verified", "uploaded_at"]
    list_filter = ["doc_type", "is_verified"]
    search_fields = ["user__username"]

    # Admin can change is_verified directly from the list view
    list_editable = ["is_verified"]