from rest_framework import serializers


def validate_phone_number(value):
    """Validate phone number has country code and minimum length"""
    if value is None:
        return value
    
    phone_str = str(value)
    if phone_str and not phone_str.startswith('+'):
        raise serializers.ValidationError(
            "Phone number must include country code (e.g., +1234567890)"
        )
    if phone_str and len(phone_str) < 10:
        raise serializers.ValidationError(
            "Phone number is too short"
        )
    return value
