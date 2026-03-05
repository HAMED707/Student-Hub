"""
Bookings app admin.
Registers Booking model in /admin panel with useful display and filters.
"""

from django.contrib import admin
from bookings.models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """Admin view for booking requests."""

    list_display  = ("id", "tenant", "property", "status", "move_in_date", "duration_months", "created_at")
    list_filter   = ("status", "move_in_date")
    search_fields = ("tenant__username", "property__title")
    ordering      = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")