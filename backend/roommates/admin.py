"""
Roommates app admin.
Registers RoommateProfile and RoommateRequest for manual management in /admin.
"""

from django.contrib import admin
from roommates.models import RoommateProfile, RoommateRequest


@admin.register(RoommateProfile)
class RoommateProfileAdmin(admin.ModelAdmin):
    list_display  = [
        "user", "is_active", "university", "city",
        "budget_min", "budget_max", "move_in_date", "created_at",
    ]
    list_filter   = [
        "is_active", "sleeping_time", "cleanliness",
        "personality", "smoking", "room_type_preference",
    ]
    search_fields = ["user__username", "university", "city"]
    readonly_fields = ["created_at", "updated_at"]
    list_editable = ["is_active"]
    fieldsets = (
        ("Ownership", {"fields": ("user", "is_active")}),
        ("About", {"fields": ("bio", "university", "city", "move_in_date")}),
        ("Budget", {"fields": ("budget_min", "budget_max")}),
        ("My Lifestyle Habits", {"fields": (
            "sleeping_time", "cleanliness", "personality",
            "smoking", "guests_policy",
        )}),
        ("Roommate Preferences", {"fields": (
            "room_type_preference", "smoking_preference",
            "sleep_schedule_pref", "cleanliness_pref", "personality_pref",
        )}),
        ("Timestamps (read-only)", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(RoommateRequest)
class RoommateRequestAdmin(admin.ModelAdmin):
    list_display  = ["sender", "receiver", "status", "created_at"]
    list_filter   = ["status", "created_at"]
    search_fields = ["sender__username", "receiver__username"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]