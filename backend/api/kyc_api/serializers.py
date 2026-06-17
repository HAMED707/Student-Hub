"""KYC API serializers."""

from rest_framework import serializers
from kyc.models import LandlordVerification


class LandlordVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandlordVerification
        fields = ["id", "status", "verification_url", "completed_at", "created_at"]
        read_only_fields = fields
