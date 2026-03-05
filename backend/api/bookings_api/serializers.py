"""
Bookings API serializers.

Serializers:
    - BookingCreateSerializer  → POST /api/bookings/       (student creates request)
    - BookingStatusSerializer  → PATCH /api/bookings/<id>/status/  (landlord approves/rejects, student cancels)
    - BookingSerializer        → GET responses (full detail)
"""

from rest_framework import serializers
from bookings.models import Booking
from api.properties_api.serializers import PropertyListSerializer


class BookingSerializer(serializers.ModelSerializer):
    """
    Full read serializer. Used in all GET responses.
    Nests lightweight property info so the frontend can display the card.
    """

    property_detail = PropertyListSerializer(source="property", read_only=True)
    tenant_username = serializers.CharField(source="tenant.username", read_only=True)

    class Meta:
        model  = Booking
        fields = [
            "id",
            "tenant", "tenant_username",
            "property", "property_detail",
            "status",
            "move_in_date", "duration_months",
            "message",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "tenant", "status", "created_at", "updated_at"]


class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for students creating a new booking request.
    Tenant is injected from request.user in the view — not accepted from input.
    Validates stay duration against property min/max constraints.
    """

    class Meta:
        model  = Booking
        fields = ["property", "move_in_date", "duration_months", "message"]

    def validate(self, data):
        prop             = data.get("property")
        duration_months  = data.get("duration_months")

        # Enforce property's min/max stay limits
        if prop.min_stay_months and duration_months < prop.min_stay_months:
            raise serializers.ValidationError(
                f"This property requires a minimum stay of {prop.min_stay_months} months."
            )
        if prop.max_stay_months and duration_months > prop.max_stay_months:
            raise serializers.ValidationError(
                f"This property allows a maximum stay of {prop.max_stay_months} months."
            )

        # Prevent booking a property that isn't available
        if prop.status != "available":
            raise serializers.ValidationError("This property is not available for booking.")

        return data

    def create(self, validated_data):
        # Tenant is passed from the view via serializer.save(tenant=request.user)
        return Booking.objects.create(**validated_data)


class BookingStatusSerializer(serializers.ModelSerializer):
    """
    Write serializer for updating booking status only.
    Used by both landlord (approve/reject) and student (cancel).
    Allowed transitions are enforced in the view, not here.
    """

    class Meta:
        model  = Booking
        fields = ["status"]

    def validate_status(self, value):
        allowed = ["approved", "rejected", "cancelled", "completed"]
        if value not in allowed:
            raise serializers.ValidationError(
                f"Invalid status. Choose from: {', '.join(allowed)}."
            )
        return value
