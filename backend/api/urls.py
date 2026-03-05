from django.urls import include, path

urlpatterns = [
    path('accounts/', include('api.accounts_api.urls')),
    path('properties/', include('api.properties_api.urls')),
    path('bookings/', include('api.bookings_api.urls')),
    path('favorites/', include('api.favorites_api.urls')),
    path('reviews/', include('api.reviews_api.urls')),
]
