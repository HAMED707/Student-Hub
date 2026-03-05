"""Roommates API URL configuration."""
from django.urls import path
from api.roommates_api.views import (
    RoommateListView,
    RoommateProfileView,
    RoommateProfileDetailView,
    RoommateRequestCreateView,
    RoommateRequestListView,
    RoommateRequestStatusView,
)

urlpatterns = [
    # ── Browse & Profile ──────────────────────────────────────
    path("roommates/",                         RoommateListView.as_view(),          name="roommate-list"),
    path("roommates/profile/",                 RoommateProfileView.as_view(),       name="roommate-profile"),
    path("roommates/profile/<int:user_id>/",   RoommateProfileDetailView.as_view(), name="roommate-profile-detail"),

    # ── Requests ─────────────────────────────────────────────
    path("roommates/request/",                 RoommateRequestCreateView.as_view(), name="roommate-request-create"),
    path("roommates/requests/",                RoommateRequestListView.as_view(),   name="roommate-request-list"),
    path("roommates/request/<int:request_id>/",RoommateRequestStatusView.as_view(), name="roommate-request-status"),
]
