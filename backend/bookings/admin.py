"""
Bookings app admin.
Registers Booking model in /admin panel with useful display and filters.
"""

from django.contrib import admin
from bookings.models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """Admin view for booking requests."""

    list_display  = ("id", "tenant", "property", "booking_unit", "status", "total_amount_cents", "payout_done", "move_in_date", "created_at")
    list_filter   = ("status", "booking_unit", "payout_done")
    search_fields = ("tenant__username", "property__title", "qr_token")
    ordering      = ("-created_at",)
    readonly_fields = ("qr_token", "payout_done", "expires_at", "created_at", "updated_at")