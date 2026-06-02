## booking overview


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
                    "total_amount_cents",        
                    "deposit_amount_cents",      
                    "remaining_amount_cents",    
                    "expires_at", 
                    "created_at" ,
                    "updated_at",
                    ]
        read_only_fields =[
            "id",
            "tenant",
            "status",
            "total_amount_cents",        
            "deposit_amount_cents",      
            "remaining_amount_cents",    
            "expires_at", 
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
from django.utils import timezone
from datetime import timedelta
import builtins 

from django.db import models
from accounts.models import Users
from properties.models import Property


class Booking(models.Model):


    STATUS_CHOICES = [
        ("pending_payment", "Pending Payment"),
        ("deposit_paid", "Deposit Paid"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
        ("expired", "Expired"),
    ]

    # ────Parties──────────────────────────────────────────────────────────────────────────────────────────────────────────
    tenant     = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="bookings" , limit_choices_to={ "role" : "student" })
    property   = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="bookings")

    # ────Booking Details─────────────────────────────────────────────────────────────────────────────────────────────────
    status          = models.CharField(max_length=15 ,choices=STATUS_CHOICES ,default='pending_payment')
    move_in_date    = models.DateField()
    duration_months = models.PositiveIntegerField()
    message         = models.TextField(null=True , blank=True)

    # ── Financial Snapshot ───────────────────────────────────
    # Copied from property.price at booking time — never changes even if landlord later edits the listing price
    total_amount_cents   = models.PositiveIntegerField()    # full rent agreed
    deposit_amount_cents = models.PositiveIntegerField()    # what student pays now
    remaining_amount_cents = models.PositiveIntegerField()  # what's left after deposit

    # ── Expiration ───────────────────────────────────────────
    # If student doesn't pay deposit within 30 min, booking auto-expires
    expires_at = models.DateTimeField()

    # ── Timestamps ───────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    #TODO: custom validation to prevent the tenant booking the same property more than one time

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tenant.username} - {self.property.title} -({self.status})"
    
    def save(self, *args, **kwargs):
        # Auto-set expiry to 30 min from creation on first save
        if not self.pk and not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=30)
        super().save(*args, **kwargs)
    
    @builtins.property
    def is_expired(self):
        return self.status == "pending_payment" and timezone.now() > self.expires_at
```

# ────────────────────────End Model──────────────────────────────────────
