"""
Favorites API serializers.

Serializers:
    - FavoriteSerializer       → GET /api/favorites/ (full read with nested property)
    - FavoriteCreateSerializer → POST /api/favorites/ (write — accepts property id only)
"""

from rest_framework import serializers
from favorites.models import Favorite
from api.properties_api.serializers import PropertyListSerializer


class FavoriteSerializer(serializers.ModelSerializer):
    """
    Full read serializer. Used in all GET responses.
    Nests lightweight property card so the frontend can render the shortlist grid.
    """

    property_detail = PropertyListSerializer(source="property", read_only=True)

    class Meta:
        model  = Favorite
        fields = ["id", "property", "property_detail", "created_at"]
        read_only_fields = ["id", "created_at"]


class FavoriteCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for adding a property to the shortlist.
    User is injected from request.user in the view — not accepted from input.
    Raises a 400 if the student has already hearted this property.
    """

    class Meta:
        model  = Favorite
        fields = ["property"]

    def validate(self, data):
        user     = self.context["request"].user
        property = data.get("property")

        # unique_together is enforced at DB level, but we surface a clear error here
        if Favorite.objects.filter(user=user, property=property).exists():
            raise serializers.ValidationError("You have already saved this property.")

        return data

    def create(self, validated_data):
        # User is passed from the view via serializer.save(user=request.user)
        return Favorite.objects.create(**validated_data)
