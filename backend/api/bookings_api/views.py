"""
View 
    -BookingList
    -BookingCreateView
    -BookingStatusUpdate
"""

from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response 
from rest_framework import status 
from rest_framework.permissions import  IsAuthenticated
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

    def get( self , request ):

        if request.user.role == "student":
            booking = Booking.objects.filter( tenant= request.user)
        else:
            booking = Booking.objects.filter( property__landlord= request.user)

        serilaizer = BookingSerializer( booking , many=True )
            
        return Response( serilaizer.data )



class BookingCreateView(APIView):
    """
    Booking creation flow:

    1. Validate incoming request data using BookingCreateSerializer.
    2. Start a database transaction to ensure data consistency.
    3. Lock the selected property row using select_for_update()
    to prevent concurrent reservations for the same property.
    4. Check if the property is still available.
    5. Check if the student already has an active booking
    for this property.
    6. Calculate booking financial snapshot:
        - total amount
        - deposit amount (20%)
        - remaining amount
    7. Create booking with temporary expiration time
    and status "pending_payment".
    8. Mark property as "reserved".
    9. Serialize created booking and return response data.
    """
    permission_classes = [IsStudent]
    
    def post( self , request ):
        serializer = BookingCreateSerializer( data = request.data , context={"request":request} )
        serializer.is_valid(raise_exception=True)

        property_id=serializer.validated_data["property"].id
        
        try:
            #transaction.atomic()= "treat these operations as one safe package"
            with transaction.atomic():
                #select_for_update()= "lock this row so others must wait"
                prop = Property.objects.select_for_update().get(id=property_id)

                if prop.status != "available":
                    return Response( {"error":"This property is no longer available."} , 
                                      status=status.HTTP_409_CONFLICT)
                
                already_exists=Booking.objects.filter(tenant=request.user , property=prop , status__in=["pending_payment", "deposit_paid", "confirmed"]).exists()
                if already_exists:
                    return Response(
                        {"error": "You already have an active booking for this property."},
                        status=status.HTTP_409_CONFLICT
                    )
                
                # Calculate financial snapshot from property price
                total     = int(prop.price * 100)
                deposit   = int(total * 0.20)
                remaining = total - deposit

                booking = serializer.save(
                            tenant                 = request.user,
                            total_amount_cents     = total,
                            deposit_amount_cents   = deposit,
                            remaining_amount_cents = remaining,
                            expires_at             = timezone.now() + timedelta(minutes=30),
                            status                 = "pending_payment",
                    )
                
                prop.status = "reserved"
                prop.save()

        except Property.DoesNotExist:
            return Response(
                {"error": "Property not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response( BookingSerializer( booking ).data , status=status.HTTP_201_CREATED )



class BookingStatusView(APIView):
    """
    Booking status update flow:

    1. Retrieve booking by ID.
    2. Verify booking exists.
    3. Determine user role (landlord or tenant).
    4. Validate that the user has permission
    to modify this booking.
    5. Define allowed status transitions
    based on the current booking status
    and user role.
    6. Validate requested new status.
    7. Start database transaction to ensure
    consistent booking/property updates.
    8. Update booking status using serializer validation.
    9. Synchronize property status:
        - cancelled  -> property becomes available
        - confirmed  -> property becomes rented
    10. Serialize updated booking and return response data.
    """
    permission_classes = [IsAuthenticated]


    def patch( self , request , pk ):

        try:
            booking = Booking.objects.get( pk=pk )
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        
        
        if request.user.role == "landlord":
            if request.user != booking.property.landlord:
                return Response({"error": "You do not own this property."}, status=status.HTTP_403_FORBIDDEN)
            
            allowed_transitions = {
                "deposit_paid": ["confirmed", "cancelled"],   # landlord confirms after deposit
                "confirmed":    ["completed"],                # landlord marks stay as done
            }

        else:
            if booking.tenant != request.user:
                return Response({"error": "This is not your booking."}, status=status.HTTP_403_FORBIDDEN)
            
            allowed_transitions = {
                "pending_payment": ["cancelled"],             # student cancels before paying
                "deposit_paid":    ["cancelled"],             # student cancels after deposit (refund logic goes here later)
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
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            serializer = BookingStatusSerializer(
                booking,
                data={"status": new_status},
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            booking = serializer.save()

            # Free up the property if booking is cancelled
            if new_status == "cancelled":
                booking.property.status = "available"
                booking.property.save()

            # Mark property as fully rented when confirmed
            if new_status == "confirmed":
                booking.property.status = "rented"
                booking.property.save()

        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_200_OK
        )
