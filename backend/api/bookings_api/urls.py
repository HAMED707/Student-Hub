"""Bookings API URL configuration."""
from django.urls import path
from api.bookings_api.views import (
    BookingCreateView,
    MyBookingView,
    BookingStatusView,
)

urlpatterns = [

    path(""                        , BookingCreateView.as_view() , name="booking-create"),
    path("my/"                     , MyBookingView.as_view() ,     name="booking-my"),
    path("<int:pk>/status/"        , BookingStatusView.as_view() , name="booking-status"),
]
