"""
api/services_api/serializers.py

Read-only serializers for nearby place results.
No write serializers needed — NearbyPlace rows are managed internally.
"""

from rest_framework import serializers
from services.models import NearbyPlace
from services.universities import list_universities


class NearbyPlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = NearbyPlace
        fields = [
            "id",
            "external_id",
            "name",
            "address",
            "latitude",
            "longitude",
            "distance_m",
            "place_type",
            "rating",
            "open_now",
        ]


class UniversityListSerializer(serializers.Serializer):
    """Returns the list of supported universities."""
    universities = serializers.ListField(child=serializers.CharField())

    def to_representation(self, instance):
        return {"universities": list_universities()}
