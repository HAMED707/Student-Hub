"""
Bookings API views.

Endpoints:
    POST   /api/bookings/              → BookingCreateView   (student only)
    GET    /api/bookings/my/           → MyBookingsView      (student sees their requests; landlord sees incoming)
    PATCH  /api/bookings/<id>/status/  → BookingStatusView   (landlord: approve/reject | student: cancel)
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from bookings.models import Booking
from api.bookings_api.serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingStatusSerializer,
)
from api.accounts_api.permissions import IsStudent, IsLandlord


class BookingCreateView(APIView):
    """
    POST /api/bookings/
    Student submits a booking request for a property.
    """
    permission_classes = [IsStudent]

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Inject the authenticated student as the tenant
        booking = serializer.save(tenant=request.user)
        return Response(
            BookingSerializer(booking, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MyBookingsView(APIView):
    """
    GET /api/bookings/my/

    - Student  → returns all their own booking requests
    - Landlord → returns all booking requests for properties they own
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == "student":
            # Student sees bookings they submitted
            queryset = (
                Booking.objects
                .filter(tenant=request.user)
                .select_related("property", "property__owner")
                .prefetch_related("property__images")
            )
        else:
            # Landlord sees booking requests coming in for their properties
            queryset = (
                Booking.objects
                .filter(property__owner=request.user)
                .select_related("property", "tenant")
                .prefetch_related("property__images")
            )

        serializer = BookingSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class BookingStatusView(APIView):
    """
    PATCH /api/bookings/<id>/status/

    Allowed transitions (enforced here, not in serializer):
        Landlord  → pending → approved | rejected
        Landlord  → approved → completed
        Student   → pending | approved → cancelled
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, booking_id):
        try:
            booking = Booking.objects.select_related("property", "tenant").get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        user       = request.user

        # ── Permission & Transition Rules ─────────────────────────────────────
        if user.role == "landlord":
            # Only the property owner can act on this booking
            if booking.property.owner != user:
                return Response({"error": "You do not own this property."}, status=status.HTTP_403_FORBIDDEN)

            allowed_transitions = {
                "pending":  ["approved", "rejected"],
                "approved": ["completed"],
            }

        elif user.role == "student":
            # Only the tenant can cancel their own booking
            if booking.tenant != user:
                return Response({"error": "This is not your booking."}, status=status.HTTP_403_FORBIDDEN)

            allowed_transitions = {
                "pending":  ["cancelled"],
                "approved": ["cancelled"],
            }

        else:
            return Response({"error": "Invalid role."}, status=status.HTTP_403_FORBIDDEN)

        # Check if the transition is valid from the current status
        current = booking.status
        if current not in allowed_transitions or new_status not in allowed_transitions.get(current, []):
            return Response(
                {"error": f"Cannot change status from '{current}' to '{new_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BookingStatusSerializer(booking, data={"status": new_status}, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(
            BookingSerializer(booking, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )
