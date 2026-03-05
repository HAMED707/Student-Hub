"""
Properties API serializers.

Serializers:
    - PropertyImageSerializer   → nested images list in PropertySerializer
    - PropertySerializer        → full detail for GET /api/properties/<id>/
    - PropertyListSerializer    → lightweight card view for GET /api/properties/
    - PropertyCreateSerializer  → POST /api/properties/create/
    - PropertyUpdateSerializer  → PATCH /api/properties/<id>/edit/
"""
from rest_framework import serializers
from properties.models import Property, PropertyImage


class PropertyImageSerializer(serializers.ModelSerializer):
    """Nested inside PropertySerializer. Cover image floats first (model-level ordering)."""

    class Meta:
        model = PropertyImage
        fields = ["id", "image", "is_cover", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class PropertySerializer(serializers.ModelSerializer):
    """
    Full detail view — used on the property detail page.
    Includes nested images, owner info, and computed rating fields.
    """

    images = PropertyImageSerializer(many=True, read_only=True)

    # Computed fields from model properties — require reviews app to return real values
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    # Surface owner info without exposing sensitive fields
    owner_id = serializers.IntegerField(source="owner.id", read_only=True)
    owner_name = serializers.SerializerMethodField()
    owner_picture = serializers.ImageField(source="owner.profile_picture", read_only=True)
    owner_is_verified = serializers.BooleanField(source="owner.is_verified", read_only=True)
    owner_is_top_rated = serializers.BooleanField(source="owner.is_top_rated", read_only=True)

    class Meta:
        model = Property
        fields = [
            "id",
            # ── Ownership ────────────────────────────────────
            "owner_id", "owner_name", "owner_picture",
            "owner_is_verified", "owner_is_top_rated",
            # ── Basic Info ───────────────────────────────────
            "title", "description", "property_type",
            # ── Pricing ──────────────────────────────────────
            "price",
            # ── Location ─────────────────────────────────────
            "city", "district", "address", "latitude", "longitude",
            # ── University Proximity ─────────────────────────
            "nearby_university", "distance_to_university", "transport_type",
            # ── Room Details ─────────────────────────────────
            "num_rooms", "num_beds", "num_bathrooms", "num_roommates",
            "floor", "area_sqm", "gender_preference",
            # ── Amenities ────────────────────────────────────
            "amenities",
            # ── Stay Duration ────────────────────────────────
            "min_stay_months", "max_stay_months",
            # ── Status & Visibility ──────────────────────────
            "status", "is_featured",
            # ── Analytics ────────────────────────────────────
            "view_count",
            # ── Reviews (computed) ───────────────────────────
            "average_rating", "review_count",
            # ── Images ───────────────────────────────────────
            "images",
            # ── Timestamps ───────────────────────────────────
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "view_count", "is_featured", "created_at", "updated_at"]

    def get_owner_name(self, obj):
        """Returns full name if set, falls back to username."""
        full_name = f"{obj.owner.first_name or ''} {obj.owner.last_name or ''}".strip()
        return full_name or obj.owner.username


class PropertyListSerializer(serializers.ModelSerializer):
    """
    Lightweight card view — used on FindRoom and Home page listing grids.
    Only the fields needed to render a card. Keeps list responses fast.
    """

    cover_image = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    owner_name = serializers.SerializerMethodField()
    owner_is_verified = serializers.BooleanField(source="owner.is_verified", read_only=True)

    class Meta:
        model = Property
        fields = [
            "id", "title", "property_type", "price",
            "city", "district",
            "nearby_university", "distance_to_university", "transport_type",
            "num_beds", "num_roommates", "gender_preference",
            "amenities", "status", "is_featured",
            "average_rating", "review_count",
            "cover_image",
            "owner_name", "owner_is_verified",
            "created_at",
        ]

    def get_cover_image(self, obj):
        """Returns the URL of the cover image, or None if no images uploaded."""
        cover = obj.images.filter(is_cover=True).first() or obj.images.first()
        if not cover:
            return None
        request = self.context.get("request")
        # Build absolute URL so frontend doesn't need to prefix the media root
        return request.build_absolute_uri(cover.image.url) if request else cover.image.url

    def get_owner_name(self, obj):
        full_name = f"{obj.owner.first_name or ''} {obj.owner.last_name or ''}".strip()
        return full_name or obj.owner.username


class PropertyCreateSerializer(serializers.ModelSerializer):
    """
    POST /api/properties/create/ — landlord creates a new listing.
    owner is injected in the view via save(owner=request.user), not sent by client.
    """

    # Accept uploaded images at creation time (optional)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Property
        fields = [
            "title", "description", "property_type",
            "price",
            "city", "district", "address", "latitude", "longitude",
            "nearby_university", "distance_to_university", "transport_type",
            "num_rooms", "num_beds", "num_bathrooms", "num_roommates",
            "floor", "area_sqm", "gender_preference",
            "amenities",
            "min_stay_months", "max_stay_months",
            "status",
            "uploaded_images",
        ]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0.")
        return value

    def validate(self, data):
        min_stay = data.get("min_stay_months", 1)
        max_stay = data.get("max_stay_months")
        if max_stay and max_stay < min_stay:
            raise serializers.ValidationError("max_stay_months cannot be less than min_stay_months.")
        return data

    def create(self, validated_data):
        images = validated_data.pop("uploaded_images", [])
        property_obj = Property.objects.create(**validated_data)

        for index, image_file in enumerate(images):
            PropertyImage.objects.create(
                property=property_obj,
                image=image_file,
                is_cover=(index == 0),  # first uploaded image is the cover
            )

        return property_obj


class PropertyUpdateSerializer(serializers.ModelSerializer):
    """
    PATCH /api/properties/<id>/edit/ — landlord edits their own listing.
    All fields optional. Images managed separately via PropertyImageSerializer.
    """

    class Meta:
        model = Property
        fields = [
            "title", "description", "property_type",
            "price",
            "city", "district", "address", "latitude", "longitude",
            "nearby_university", "distance_to_university", "transport_type",
            "num_rooms", "num_beds", "num_bathrooms", "num_roommates",
            "floor", "area_sqm", "gender_preference",
            "amenities",
            "min_stay_months", "max_stay_months",
            "status",
        ]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0.")
        return value

    def validate(self, data):
        # On partial update, pull existing values if not being changed
        instance = self.instance
        min_stay = data.get("min_stay_months", instance.min_stay_months)
        max_stay = data.get("max_stay_months", instance.max_stay_months)
        if max_stay and max_stay < min_stay:
            raise serializers.ValidationError("max_stay_months cannot be less than min_stay_months.")
        return data
