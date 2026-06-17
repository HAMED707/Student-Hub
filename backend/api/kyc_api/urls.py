"""
KYC API URL configuration.

Only create/ and status/ live here. PersonaWebhookView is registered
directly in api/urls.py at /api/webhooks/persona/, matching the feature
spec's exact path rather than nesting it under /api/kyc/.
"""

from django.urls import path
from api.kyc_api.views import CreateVerificationView, KycStatusView

urlpatterns = [
    path("create/", CreateVerificationView.as_view(), name="kyc-create"),
    path("status/", KycStatusView.as_view(), name="kyc-status"),
]
