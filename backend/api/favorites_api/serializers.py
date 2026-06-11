"""Favorites API serializers."""
from django.db import IntegrityError
from rest_framework import serializers
from favorites.models import Favorite
from api.properties_api.serializers import PropertyListSerializer


class FavoriteSerializer(serializers.ModelSerializer):
    property_detail = PropertyListSerializer(source="property", read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "property", "property_detail", "created_at"]
        read_only_fields = ["id", "created_at"]


class FavoriteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ["property"]

    def validate(self, data):
        user = self.context["request"].user
        prop = data.get("property")

        # 1. Prevent favoriting rented/unavailable properties
        if prop.status != "available":
            raise serializers.ValidationError("You can only save available properties.")

        # 2. Prevent duplicates
        if Favorite.objects.filter(user=user, property=prop).exists():
            raise serializers.ValidationError("You have already saved this property.")

        return data

    def create(self, validated_data, **extra_kwargs):
        """
        extra_kwargs captures the `user=request.user` passed from the view.
        IntegrityError catches rare race conditions (e.g., double-clicking the heart button).
        """
        try:
            return Favorite.objects.create(**validated_data, **extra_kwargs)
        except IntegrityError:
            raise serializers.ValidationError("You have already saved this property.")