"""
View 
    -BookingList
    -BookingCreateView
    -BookingStatusUpdate
"""

from rest_framework.views import APIView
from rest_framework.response import Response 
from rest_framework import status 
from rest_framework.permissions import  IsAuthenticated
from api.accounts_api.permissions import IsStudent

from bookings.models import Booking
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
    permission_classes = [IsStudent]
    
    def post( self , request ):
        serializer = BookingCreateSerializer( data = request.data , context={"request":request} )
        serializer.is_valid(raise_exception=True)
        booking = serializer.save(tenant=request.user)
        return Response( BookingSerializer( booking ).data , status=status.HTTP_201_CREATED )



class BookingStatusView(APIView):
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
                "pending":  ["approved", "rejected"],
                "approved": ["completed"],
            }
        else:
            if booking.tenant != request.user:
                return Response({"error": "This is not your booking."}, status=status.HTTP_403_FORBIDDEN)
            
            allowed_transitions = {
                "pending":  ["cancelled"],
                "approved": ["cancelled"],
            }

        current = booking.status
        new_status = request.data.get("status")
        if current not in allowed_transitions or new_status not in allowed_transitions.get(current, []):
            return Response(
                {"error": f"Cannot change status from '{current}' to '{new_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        serializer = BookingStatusSerializer(booking, data={"status": new_status}, partial=True)

        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response(BookingSerializer( booking ).data,status=status.HTTP_200_OK)
