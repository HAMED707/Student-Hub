"""
Payments API serializers.

Serializers:
    - PaymentSerializer          → GET responses (full read)
    - InitiatePaymentSerializer  → POST /api/payments/initiate/ — start checkout
    - WithdrawalSerializer       → GET /api/payments/withdrawals/
    - WithdrawalCreateSerializer → POST /api/payments/withdraw/
    - PaymentSummarySerializer   → GET /api/payments/summary/ (landlord dashboard)
"""

from rest_framework import serializers
from payments.models import Payment, WithdrawalRequest

class PaymentSerializer(serializers.ModelSerializer):
    student_username  = serializers.CharField(source="student.username",  read_only=True)
    landlord_username = serializers.CharField(source="landlord.username", read_only=True)
    property_title    = serializers.CharField(source="booking.property.title", read_only=True)

    class Meta:
        model  = Payment
        fields = [
            "id", "student", "student_username",
            "landlord", "landlord_username",
            "booking", "property_title",
            "amount", "status", "is_success",
            "paymob_order_id", "paymob_transaction_id",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

class InitiatePaymentSerializer(serializers.Serializer):
    """
    Student POSTs booking_id to start checkout.
    Server creates the Payment record and returns the Paymob iframe URL.
    """
    booking_id = serializers.IntegerField()

    def validate_booking_id(self, value):
        from bookings.models import Booking
        request = self.context["request"]
        try:
            booking = Booking.objects.select_related("property__owner", "tenant").get(id=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found.")

        if booking.tenant != request.user:
            raise serializers.ValidationError("This is not your booking.")

        if booking.status != "approved":
            raise serializers.ValidationError("Payment is only allowed for approved bookings.")

        # Block duplicate payments
        if Payment.objects.filter(booking=booking, status__in=["held", "pending"]).exists():
            raise serializers.ValidationError("A payment is already in progress for this booking.")

        return value


class WithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WithdrawalRequest
        fields = ["id", "amount", "status", "account_name", "account_number",
                  "bank_name", "notes", "created_at"]
        read_only_fields = ["id", "status", "created_at"]

class WithdrawalCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WithdrawalRequest
        fields = ["amount", "account_name", "account_number", "bank_name", "notes"]

    def validate_amount(self, value):
        landlord = self.context["request"].user
        available = landlord.landlord_profile.available_balance
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        if value > available:
            raise serializers.ValidationError(
                f"Insufficient balance. Available: {available} EGP."
            )
        return value

    def create(self, validated_data):
        # Deduct from available_balance immediately on request
        from django.db.models import F
        landlord = validated_data["landlord"]
        landlord.landlord_profile.__class__.objects.filter(
            pk=landlord.landlord_profile.pk
        ).update(available_balance=F("available_balance") - validated_data["amount"])
        return WithdrawalRequest.objects.create(**validated_data)