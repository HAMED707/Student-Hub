"""Payments API URL configuration."""
from django.urls import path
from api.payments_api.views import (
    InitiatePaymentView,
    PaymobWebhookView,
    PaymentListView,
    PaymentSummaryView,
    WithdrawalView,
)

urlpatterns = [
    path("initiate/",      InitiatePaymentView.as_view(),  name="payment-initiate"),
    path("webhook/",       PaymobWebhookView.as_view(),    name="payment-webhook"),
    path("transactions/",  PaymentListView.as_view(),      name="payment-list"),
    path("summary/",       PaymentSummaryView.as_view(),   name="payment-summary"),
    path("withdraw/",      WithdrawalView.as_view(),       name="payment-withdraw"),
]