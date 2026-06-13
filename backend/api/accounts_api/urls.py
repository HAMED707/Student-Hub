"""
Accounts API URL configuration.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from api.accounts_api.views import (
    ChangePasswordView,
    CompleteOnboardingView,
    GoogleLoginView,
    LoginView,
    ProfileView,
    PublicProfileView,
    RegisterView,
    SettingsView,
    SupportRequestView,
    VerificationDocumentView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("google/", GoogleLoginView.as_view(), name="google-login"),
    path("complete-onboarding/", CompleteOnboardingView.as_view(), name="complete-onboarding"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("profile/", ProfileView.as_view(), name="my-profile"),
    path("profile/<int:user_id>/", PublicProfileView.as_view(), name="public-profile"),
    path("settings/", SettingsView.as_view(), name="settings"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("verify/documents/", VerificationDocumentView.as_view(), name="verify-documents"),
    path("support-requests/", SupportRequestView.as_view(), name="support-requests"),
]
