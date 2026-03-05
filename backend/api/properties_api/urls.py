"""Properties API URL configuration."""
from django.urls import path
from api.properties_api.views import (
    PropertyListView,
    FeaturedPropertiesView,
    UniversityPropertiesView,
    PropertyDetailView,
    PropertyCreateView,
    PropertyEditView,
    PropertyImageUploadView,
    PropertyImageDeleteView,
    OwnerPropertiesView,
)

urlpatterns = [
    # ── Public Listings ───────────────────────────────────────────────────────
    path("properties/", PropertyListView.as_view(), name="property-list"),
    path("properties/featured/", FeaturedPropertiesView.as_view(), name="property-featured"),
    path("properties/university/", UniversityPropertiesView.as_view(), name="property-university"),
    path("properties/<int:property_id>/", PropertyDetailView.as_view(), name="property-detail"),

    # ── Landlord — Listing Management ─────────────────────────────────────────
    path("properties/create/", PropertyCreateView.as_view(), name="property-create"),
    path("properties/<int:property_id>/edit/", PropertyEditView.as_view(), name="property-edit"),

    # ── Landlord — Image Management ───────────────────────────────────────────
    path("properties/<int:property_id>/images/", PropertyImageUploadView.as_view(), name="property-image-upload"),
    path("properties/<int:property_id>/images/<int:image_id>/", PropertyImageDeleteView.as_view(), name="property-image-delete"),

    # ── Owner Dashboard ───────────────────────────────────────────────────────
    path("owner/properties/", OwnerPropertiesView.as_view(), name="owner-properties"),
]
