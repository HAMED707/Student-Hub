from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    register_api,
    login_api,
    logout_api,
    profile_api,
)

urlpatterns = [
    path("register/", register_api, name='register'),
    path("login/", login_api, name='login'),
    path("logout/", logout_api, name='logout'),
    path("profile/", profile_api, name='profile'),
    path("token/refresh/", TokenRefreshView.as_view(), name='token_refresh'),
]
