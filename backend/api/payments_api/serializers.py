

from rest_framework import serializers
from payments.models import Payment
from bookings.models import Booking 




class PaymentSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Payment
        fields = [
            "id",
            "booking",
            "payment_type",
            "payment_method",
            "amount_cents",
            "status",
            "paymob_order_id",
            "transaction_id",
            "failure_reason",
            "paid_at",
            "created_at",
        ]

        read_only_fields = fields



class InitiateDepositSerializer(serializers.Serializer):
    booking_id = serializers.IntegerField()
    phone      = serializers.CharField(max_length=20 , required=False, default="NA")

    def validate_booking_id(self, value):
        request = self.context.get("request")

        try:
            booking = Booking.objects.get(
                id = value,
                tenant = request.user,
                status = "pending_payment",
            )
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found or not in pending_payment status.")
        

        if booking.is_expired:
            booking.status = "expired"
            booking.save()
            raise serializers.ValidationError("Booking has expired. Please create a new booking.")
        
        # Check duplicate pending deposit
        if booking.payments.filter(
            payment_type=Payment.PaymentType.DEPOSIT,
            status=Payment.Status.PENDING,
        ).exists():
            raise serializers.ValidationError("A deposit payment is already in progress.")
        
        return value