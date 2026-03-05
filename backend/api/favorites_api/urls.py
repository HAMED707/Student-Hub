"""Favorites API URL configuration."""
from django.urls import path
from api.favorites_api.views import FavoritesListView, FavoriteDeleteView

urlpatterns = [
    # ── Student: View shortlist + heart a property ────────────────────────────
    path("", FavoritesListView.as_view(), name="favorites-list"),

    # ── Student: Unheart a property (by property id, not favorite id) ─────────
    path("<int:property_id>/", FavoriteDeleteView.as_view(), name="favorite-delete"),
]
