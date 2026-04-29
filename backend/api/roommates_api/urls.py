"""Roommates API URL configuration."""
from django.urls import path
from api.roommates_api.views import (
    RoommateListView,
    RoommateProfileView,
    RoommateProfileDetailView,
    RoommateRequestCreateView,
    RoommateRequestListView,
    RoommateRequestStatusView,
    RoommateMatchView,
)

urlpatterns = [
    # ── Browse & Profile ──────────────────────────────────────
    path(""                       , RoommateListView.as_view(),          name="roommate-list"),
    path("profile/"               , RoommateProfileView.as_view(),       name="roommate-profile"),
    path("profile/<int:user_id>/" , RoommateProfileDetailView.as_view(), name="roommate-profile-detail"),

    # ── Requests ─────────────────────────────────────────────
    path("request/"                  , RoommateRequestCreateView.as_view(), name="roommate-request-create"),
    path("requests/"                 , RoommateRequestListView.as_view(),   name="roommate-request-list"),
    path("request/<int:request_id>/" , RoommateRequestStatusView.as_view(), name="roommate-request-status"),

    # ── AI ─────────────────────────────────────────────
    path("matches/"                  , RoommateMatchView.as_view(), name="roommate-matches"),
]
