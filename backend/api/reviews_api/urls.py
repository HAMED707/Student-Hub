"""Reviews API URL configuration."""
from django.urls import path
from api.reviews_api.views import PropertyReviewListView, UserReviewListView

urlpatterns = [
    # ── Property Reviews ──────────────────────────────────────────────────────
    path("reviews/property/<int:property_id>/", PropertyReviewListView.as_view(), name="property-reviews"),

    # ── User Reviews ──────────────────────────────────────────────────────────
    path("reviews/user/<int:user_id>/", UserReviewListView.as_view(), name="user-reviews"),
]
