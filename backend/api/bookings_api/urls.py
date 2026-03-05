"""Bookings API URL configuration."""
from django.urls import path
from api.bookings_api.views import (
    BookingCreateView,
    MyBookingsView,
    BookingStatusView,
)

urlpatterns = [
    # ── Student: Submit a booking request ─────────────────────────────────────
    path("",               BookingCreateView.as_view(),  name="booking-create"),

    # ── Both: View own bookings (student) or incoming requests (landlord) ─────
    path("my/",            MyBookingsView.as_view(),     name="booking-my"),

    # ── Both: Update booking status ───────────────────────────────────────────
    path("<int:booking_id>/status/", BookingStatusView.as_view(), name="booking-status"),
]
