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