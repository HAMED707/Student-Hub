"""
    Properties API URL configuration

"""
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
    LandlordPropertiesView,
)

urlpatterns = [
    # ── Public Listings ───────────────────────────────────────────────────────
    path(""                   , PropertyListView.as_view(),         name="property-list"),
    path("featured/"          , FeaturedPropertiesView.as_view(),   name="property-featured"),
    path("university/"        , UniversityPropertiesView.as_view(), name="property-university"),
    path("<int:property_id>/" , PropertyDetailView.as_view(),       name="property-detail"),

    # ── Landlord — Listing Management ─────────────────────────────────────────
    path("create/"                 , PropertyCreateView.as_view(),   name="property-create"),
    path("<int:property_id>/edit/" , PropertyEditView.as_view(),     name="property-edit"),

    # ── Landlord — Image Management ───────────────────────────────────────────
    path("<int:property_id>/images/"                , PropertyImageUploadView.as_view(), name="property-image-upload"),
    path("<int:property_id>/images/<int:image_id>/" , PropertyImageDeleteView.as_view(), name="property-image-delete"),

    # ── Owner Dashboard ───────────────────────────────────────────────────────
    path("landlord/properties/", LandlordPropertiesView.as_view(), name="landlord-properties"),
]
