"""
Accounts API URL configuration.
Maps all account-related endpoints to their views.

Endpoints:
    POST   /api/auth/register/          → RegisterView
    POST   /api/auth/login/             → LoginView
    POST   /api/auth/token/refresh/     → TokenRefreshView (built-in simplejwt)
    GET    /api/profile/                → ProfileView
    PATCH  /api/profile/                → ProfileView
    GET    /api/profile/<id>/           → PublicProfileView
    POST   /api/verify/documents/       → VerificationDocumentView
    GET    /api/verify/documents/       → VerificationDocumentView
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from api.accounts_api.views import (
    RegisterView,
    LoginView,
    ProfileView,
    PublicProfileView,
    VerificationDocumentView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),  # built-in

    # ── Profile ───────────────────────────────────────────────
    path("profile/", ProfileView.as_view(), name="my-profile"),
    path("profile/<int:user_id>/", PublicProfileView.as_view(), name="public-profile"),

    # ── Verification ──────────────────────────────────────────
    path("verify/documents/", VerificationDocumentView.as_view(), name="verify-documents"),
]
