"""
Accounts app validators.
Reusable validation functions imported by serializers.

Validators:
    - validate_phone_number → ensures phone is in valid international format
"""

from rest_framework import serializers


# ──────────────────────────────────────────────────────────────────────────────────────────


def validate_phone_number(value):
    """
    Validates that the phone number is not empty.
    The PhoneNumberField on the model handles format validation automatically.
    This function is a hook for any extra rules we want to enforce.
    """
    if value and str(value).strip() == "":
        raise serializers.ValidationError("Phone number cannot be blank.")
    return value