"""Services API URL configuration."""
from django.urls import path
from api.services_api.views import (
    NearbyView,
    NearbyUniversityView,
    UniversityListView,
)

urlpatterns = [
    path("nearby/",        NearbyView.as_view(),           name="services-nearby"),
    path("university/",    NearbyUniversityView.as_view(), name="services-university"),
    path("universities/",  UniversityListView.as_view(),   name="services-universities-list"),
]
