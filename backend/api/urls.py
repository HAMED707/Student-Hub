from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # JWT auth endpoints for obtaining and refreshing tokens
    path('token/'        , TokenObtainPairView.as_view() , name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view() ,    name='token_refresh'),
    
    path('auth/'         , include('api.accounts_api.urls')),
    path('properties/'   , include('api.properties_api.urls')),
    path('bookings/'     , include('api.bookings_api.urls')),
    path('favorites/'    , include('api.favorites_api.urls')),
    path('reviews/'      , include('api.reviews_api.urls')),
    path('roommates/'    , include('api.roommates_api.urls')),
    path('community/'    , include('api.community_api.urls')),
    path('messaging/'    , include('api.messaging_api.urls')),
    path('notifications/', include('api.notifications_api.urls')),
    path('payments/'     , include('api.payments_api.urls')),
    path('services/'     , include('api.services_api.urls')),
]
