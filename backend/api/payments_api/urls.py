"""
Payments API URL configuration.

StripeWebhookView is registered directly in api/urls.py at
/api/webhooks/stripe/, not nested here — mirrors the Persona webhook
pattern and keeps webhook paths grouped together at the top level.
"""

from django.urls import path
from api.payments_api.views import (
    CreateCheckoutSessionView,
    CreateRemainingCheckoutSessionView,
    CheckinScanView,
    ConnectOnboardingView,
    ConnectStatusView,
    LandlordPayoutsView,
    RequestRemainingPaymentView,
)

urlpatterns = [
    path("create-checkout-session/", CreateCheckoutSessionView.as_view(), name="payments-create-checkout-session"),
    path("pay-remaining/", CreateRemainingCheckoutSessionView.as_view(), name="payments-pay-remaining"),
    path("request-remaining/", RequestRemainingPaymentView.as_view(), name="payments-request-remaining"),
    path("checkin/", CheckinScanView.as_view(), name="payments-checkin"),
    path("connect/onboard/", ConnectOnboardingView.as_view(), name="payments-connect-onboard"),
    path("connect/status/", ConnectStatusView.as_view(), name="payments-connect-status"),
    path("payouts/", LandlordPayoutsView.as_view(), name="payments-landlord-payouts"),
]
