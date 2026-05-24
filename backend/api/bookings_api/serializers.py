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