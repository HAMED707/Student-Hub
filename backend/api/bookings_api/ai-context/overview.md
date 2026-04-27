


# ────────────────────────Start URL─────────────────────────────────────

```
"""Bookings API URL configuration."""
from django.urls import path
from api.bookings_api.views import (
    BookingCreateView,
    MyBookingView,
    BookingStatusView,
)

urlpatterns = [

    path(""                        , BookingCreateView.as_view() , name="booking-create"),
    path("my/"                     , MyBookingView.as_view() ,     name="booking-my"),
    path("<int:pk>/status/"        , BookingStatusView.as_view() , name="booking-status"),
]
        
```

# ────────────────────────End URL───────────────────────────────────────



# ────────────────────────Start Serializer──────────────────────────────

```
"""
    Serializers
        -BookingSerializer
        -BookingCreateSerializer
        -BookingStatusSerializer
"""

from rest_framework import serializers 
from bookings.models import Booking




class BookingSerializer(serializers.ModelSerializer):

    class Meta:
        model=Booking
        fields = [  
                    "id" ,
                    "property" ,
                    "tenant" ,
                    "status" ,
                    "move_in_date" ,
                    "duration_months" ,
                    "message" ,
                    "created_at" ,
                    "updated_at",
                    ]
        read_only_fields =[
            "id",
            "tenant",
            "status",
            "created_at",
            "updated_at",
        ]

class BookingCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model=Booking
        fields= [ "property" , "move_in_date" , "duration_months" , "message" ]
        
    def validate(self , data):
        prop            = data.get("property")
        duration_months = data.get("duration_months")

        if prop.min_stay_months and duration_months < prop.min_stay_months:
            raise serializers.ValidationError(f"This property requires a minimum stay of {prop.min_stay_months} months.")
        
        if prop.max_stay_months and duration_months > prop.max_stay_months:
            raise serializers.ValidationError(f"This property requires a maximum stay of {prop.max_stay_months} months.")
        
        if prop.status != "available":
            raise serializers.ValidationError("This property is not available for booking.")
        
        request = self.context.get("request")
        if Booking.objects.filter(
                tenant=request.user,
                property=prop,
                status__in=["pending", "approved"]
            ).exists():
                raise serializers.ValidationError("You already have an active booking for this property.")

            

        return data


class BookingStatusSerializer(serializers.ModelSerializer):

    class Meta:
        model=Booking
        fields= [ "status" ]
```

# ────────────────────────End Serializer────────────────────────────────




# ────────────────────────Start View────────────────────────────────────

```
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

```

# ────────────────────────End View──────────────────────────────────────





# ────────────────────────Start Signals────────────────────────────────────
```
"""
Bookings app signals.
Keeps property status in sync when a booking changes status.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from bookings.models import Booking


@receiver(post_save, sender=Booking)
def sync_property_status(sender, instance, **kwargs):
    """
    Automatically updates the property's status based on booking outcome.

    - approved  → property becomes 'rented'   (no longer searchable)
    - cancelled → property reverts to 'available' (back in listings)
    - rejected  → property reverts to 'available'
    """
    prop = instance.property

    if instance.status == "approved":
        if prop.status != "rented":
            prop.status = "rented"
            prop.save(update_fields=["status"])

    elif instance.status in ("cancelled", "rejected"):
        if prop.status == "rented":
            prop.status = "available"
            prop.save(update_fields=["status"])

```
# ────────────────────────End Signals──────────────────────────────────────





# ────────────────────────Start Apps────────────────────────────────────
```
"""Without ready() importing signals, signals.py exists but never fires."""
from django.apps import AppConfig


class BookingsConfig(AppConfig):
    """Configuration class for the bookings app."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "bookings"

    def ready(self):
        import bookings.signals  # noqa: F401 — registers signal handlers

```
# ────────────────────────End Apps──────────────────────────────────────






# ────────────────────────Start Model────────────────────────────────────

```
"""
booking models 
    -handel all room booking BTW student and landloard

"""

from django.db import models
from accounts.models import Users
from properties.models import Property


class Booking(models.Model):


    STATUS_CHOICES=[
        ("pending" , "Pending"),
        ("approved" , "Approved"),
        ("rejected" , "Rejected"),
        ("cancelled" , "Cancelled"),
        ("completed" , "Completed"),
    ]

    # ────Parties──────────────────────────────────────────────────────────────────────────────────────────────────────────
    tenant     = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="bookings" , limit_choices_to={ "role" : "student" })
    property   = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="bookings")

    # ────Booking Details─────────────────────────────────────────────────────────────────────────────────────────────────
    status          = models.CharField(max_length=15 ,choices=STATUS_CHOICES ,default='pending')
    move_in_date    = models.DateField()
    duration_months = models.PositiveIntegerField()
    message         = models.TextField(null=True , blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    #TODO: custom validation to prevent the tenant booking the same property more than one time

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tenant.username} - {self.property.title} -({self.status})"
```

# ────────────────────────End Model──────────────────────────────────────
