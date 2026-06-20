from rest_framework import serializers
from bookings.models import Booking


class BookingSerializer(serializers.ModelSerializer):
    can_review_property = serializers.SerializerMethodField()
    has_property_review = serializers.SerializerMethodField()
    property_review_id  = serializers.SerializerMethodField()

    def _get_review(self, obj):
        try:
            return obj.review
        except Exception:
            return None

    def get_has_property_review(self, obj):
        return self._get_review(obj) is not None

    def get_property_review_id(self, obj):
        review = self._get_review(obj)
        return review.id if review else None

    def get_can_review_property(self, obj):
        return obj.status == "finished" and not self.get_has_property_review(obj)

    class Meta:
        model  = Booking
        fields = [
            "id",
            "property",
            "tenant",
            "status",
            "booking_unit",
            "move_in_date",
            "duration_months",
            "message",
            "total_amount_cents",
            "remaining_amount_cents",
            "remaining_payment_requested",
            "remaining_paid",
            "qr_token",
            "payout_done",
            "expires_at",
            "created_at",
            "updated_at",
            "can_review_property",
            "has_property_review",
            "property_review_id",
        ]
        read_only_fields = [
            "id",
            "tenant",
            "status",
            "booking_unit",
            "total_amount_cents",
            "remaining_amount_cents",
            "remaining_payment_requested",
            "remaining_paid",
            "qr_token",
            "payout_done",
            "expires_at",
            "created_at",
            "updated_at",
            "can_review_property",
            "has_property_review",
            "property_review_id",
        ]


class BookingCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Booking
        fields = ["property", "move_in_date", "duration_months", "message"]

    def validate(self, data):
        prop            = data.get("property")
        duration_months = data.get("duration_months")

        if prop.min_stay_months and duration_months < prop.min_stay_months:
            raise serializers.ValidationError(
                f"This property requires a minimum stay of {prop.min_stay_months} months."
            )
        if prop.max_stay_months and duration_months > prop.max_stay_months:
            raise serializers.ValidationError(
                f"This property requires a maximum stay of {prop.max_stay_months} months."
            )
        return data


class BookingStatusSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Booking
        fields = ["status"]
