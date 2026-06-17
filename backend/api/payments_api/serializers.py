"""Payments API serializers."""

from rest_framework import serializers
from payments.models import Payment, Payout


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "booking", "amount_cents", "status", "paid_at", "created_at"]
        read_only_fields = fields


class CreateCheckoutSessionSerializer(serializers.Serializer):
    """Client sends ONLY the booking id — never an amount. The backend
    looks up booking.total_amount_cents itself."""
    booking_id = serializers.IntegerField()


class CheckinScanSerializer(serializers.Serializer):
    """QR payload is just the booking's qr_token UUID — nothing else
    needed to identify and validate the booking."""
    qr_token = serializers.UUIDField()


class ConnectStatusSerializer(serializers.Serializer):
    stripe_account_id = serializers.CharField(allow_null=True)
    onboarding_complete = serializers.BooleanField()
    charges_enabled = serializers.BooleanField(required=False)
    payouts_enabled = serializers.BooleanField(required=False)
