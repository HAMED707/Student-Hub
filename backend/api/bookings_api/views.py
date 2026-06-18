"""
Booking views:
    - MyBookingView       → list student's or landlord's bookings
    - BookingCreateView   → student creates a booking (single total, no deposit split)
    - BookingStatusView   → student cancels a pending_payment booking only;
                            all other status transitions are handled by webhooks/check-in
"""

from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from api.accounts_api.permissions import IsStudent

from bookings.models import Booking
from properties.models import Property

from api.bookings_api.serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingStatusSerializer,
)


class MyBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == "student":
            bookings = Booking.objects.filter(tenant=request.user)
        else:
            bookings = Booking.objects.filter(property__landlord=request.user)

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)


class BookingCreateView(APIView):
    """
    1. Validate request data.
    2. Lock the property row (select_for_update) to prevent double-booking.
    3. Ensure property is still available.
    4. Ensure student has no active booking on this property.
    5. Compute total from unit price × duration.
    6. Create booking (status=pending_payment, expires in 30 min).
    7. Mark property as reserved.
    """
    permission_classes = [IsStudent]

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        property_id = serializer.validated_data["property"].id

        try:
            with transaction.atomic():
                prop = Property.objects.select_for_update().get(id=property_id)

                if prop.status != "available":
                    return Response(
                        {"error": "This property is no longer available."},
                        status=status.HTTP_409_CONFLICT,
                    )

                already_exists = Booking.objects.filter(
                    tenant=request.user,
                    property=prop,
                    status__in=["pending_payment", "paid"],
                ).exists()
                if already_exists:
                    return Response(
                        {"error": "You already have an active booking for this property."},
                        status=status.HTTP_409_CONFLICT,
                    )

                booking_unit = request.data.get("booking_unit", "whole")
                any_price = prop.price or prop.room_price or prop.bed_price
                unit_price_map = {
                    "whole": prop.price or any_price,
                    "room":  prop.room_price or any_price,
                    "bed":   prop.bed_price  or any_price,
                }
                unit_price = unit_price_map.get(booking_unit, any_price)

                if unit_price is None:
                    return Response(
                        {"error": "This property has no price set for the selected booking unit."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                duration_months = serializer.validated_data["duration_months"]
                total = int(unit_price * 100)  # deposit = 1 month only; duration is informational

                booking = serializer.save(
                    tenant             = request.user,
                    booking_unit       = booking_unit,
                    total_amount_cents = total,
                    expires_at         = timezone.now() + timedelta(minutes=30),
                    status             = "pending_payment",
                )

                prop.status = "reserved"
                prop.save()

        except Property.DoesNotExist:
            return Response({"error": "Property not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingStatusView(APIView):
    """
    Landlords: all status changes are now handled automatically by the
    Stripe webhook (pending_payment → paid) and the check-in scan (paid → finished).
    Landlords cannot manually transition bookings.

    Students: may cancel a booking that is still in pending_payment.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == "landlord":
            return Response(
                {"error": "Booking status is managed automatically by payment and check-in events."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if booking.tenant != request.user:
            return Response({"error": "This is not your booking."}, status=status.HTTP_403_FORBIDDEN)

        allowed_transitions = {
            "pending_payment": ["cancelled"],
        }

        current = booking.status
        allowed = allowed_transitions.get(current, [])
        new_status = request.data.get("status")

        if new_status not in allowed:
            return Response(
                {
                    "error": f"Cannot change status from '{current}' to '{new_status}'.",
                    "allowed": allowed,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            serializer = BookingStatusSerializer(booking, data={"status": new_status}, partial=True)
            serializer.is_valid(raise_exception=True)
            booking = serializer.save()

            if new_status == "cancelled":
                booking.property.status = "available"
                booking.property.save()

        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)
