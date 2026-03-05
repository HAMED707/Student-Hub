"""Bookings API URL configuration."""
from django.urls import path
from api.bookings_api.views import (
    BookingCreateView,
    MyBookingsView,
    BookingStatusView,
)

urlpatterns = [
    # ── Student: Submit a booking request ─────────────────────────────────────
    path("bookings/",               BookingCreateView.as_view(),  name="booking-create"),

    # ── Both: View own bookings (student) or incoming requests (landlord) ─────
    path("bookings/my/",            MyBookingsView.as_view(),     name="booking-my"),

    # ── Both: Update booking status ───────────────────────────────────────────
    path("bookings/<int:booking_id>/status/", BookingStatusView.as_view(), name="booking-status"),
]
