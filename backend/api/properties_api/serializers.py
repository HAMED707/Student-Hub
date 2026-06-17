"""
    Properties API serializers.

    Serializers:
        - PropertyImageSerializer   → nested images list in PropertySerializer
        - PropertySerializer        → full detail for GET /api/properties/<id>/
        - PropertyListSerializer    → lightweight card view for GET /api/properties/
        - PropertyCreateSerializer  → POST /api/properties/create/
        - PropertyUpdateSerializer  → PATCH /api/properties/<id>/edit/

"""
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from properties.models import Property, PropertyImage, University, City, Transport


class UniversitySerializer(serializers.ModelSerializer):
    """Nested read representation of a University reference row."""
    city = serializers.SlugRelatedField(read_only=True, slug_field="name")

    class Meta:
        model = University
        fields = ["id", "name", "city"]


class PropertyImageSerializer(serializers.ModelSerializer):
    """Nested inside PropertySerializer. Cover image floats first (model-level ordering)."""

    class Meta:
        model            = PropertyImage
        fields           = ["id", "image", "is_cover", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class PropertySerializer(serializers.ModelSerializer):
    """
    Full detail view — used on the property detail page.
    Includes nested images, owner info, and computed rating fields.
    """

    images              = PropertyImageSerializer(many=True, read_only=True)
    nearby_universities = UniversitySerializer(many=True, read_only=True)
    city                = serializers.SlugRelatedField(read_only=True, slug_field="name")
    transport_types     = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    average_rating      = serializers.FloatField(read_only=True)
    review_count        = serializers.IntegerField(read_only=True)
    landlord_id           = serializers.IntegerField(source="landlord.id", read_only=True)
    landlord_name         = serializers.CharField(source="landlord.get_full_name", read_only=True)
    landlord_picture      = serializers.ImageField(source="landlord.profile_picture", read_only=True)
    landlord_is_verified  = serializers.BooleanField(source="landlord.is_verified", read_only=True)
    landlord_is_top_rated = serializers.BooleanField(source="landlord.is_top_rated", read_only=True)
    university_distance   = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            "id",
            # ── Ownership ────────────────────────────────────
            "landlord_id", "landlord_name", "landlord_picture",
            "landlord_is_verified", "landlord_is_top_rated",
            # ── Basic Info ───────────────────────────────────
            "title", "description", "unit_type",
            # ── Pricing ──────────────────────────────────────
            "rental_mode", "price", "room_price", "bed_price",
            # ── Location ─────────────────────────────────────
            "city", "district", "address", "latitude", "longitude",
            # ── University Proximity ─────────────────────────
            "nearby_universities", "distance_to_university", "transport_types", "university_distance",
            # ── Room Details ─────────────────────────────────
            "num_rooms", "num_beds", "num_bathrooms",
            "floor", "area_sqm", "gender_preference",
            # ── Amenities & Bills ────────────────────────────
            "has_internet", "has_ac", "has_water", "has_electricity", "has_gas",
            # ── Stay Duration ────────────────────────────────
            "min_stay_months", "max_stay_months",
            # ── Status & Visibility ──────────────────────────
            "status", "available_from", "is_featured",
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

    def get_university_distance(self, obj):
        return self.context.get("university_distance", None)


class PropertyListSerializer(serializers.ModelSerializer):
    """
    Lightweight card view — used on FindRoom and Home page listing grids.
    Only the fields needed to render a card. Keeps list responses fast.
    """

    cover_image          = serializers.SerializerMethodField()
    average_rating       = serializers.FloatField(read_only=True)
    review_count         = serializers.IntegerField(read_only=True)
    landlord_name        = serializers.CharField(source="landlord.get_full_name", read_only=True)
    landlord_is_verified = serializers.BooleanField(source="landlord.is_verified", read_only=True)
    nearby_universities  = UniversitySerializer(many=True, read_only=True)
    city                 = serializers.SlugRelatedField(read_only=True, slug_field="name")
    transport_types      = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")

    class Meta:
        model  = Property
        fields = [
            "id", "title", "unit_type", "rental_mode", "price", "room_price", "bed_price",
            "city", "district", "latitude", "longitude",
            "nearby_universities", "distance_to_university", "transport_types",
            "num_beds", "gender_preference",
            "has_internet", "has_ac", "has_water", "has_electricity", "has_gas",
            "status", "available_from", "is_featured",
            "average_rating", "review_count",
            "cover_image",
            "landlord_name", "landlord_is_verified",
            "created_at",
        ]

    def get_cover_image(self, obj):
        cover = obj.images.filter(is_cover=True).first() or obj.images.first()
        if not cover:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(cover.image.url) if request else cover.image.url


class PropertyCreateSerializer(serializers.ModelSerializer):
    """
    POST /api/properties/create/ — landlord creates a new listing.
    landlord is injected in the view via save(landlord=request.user).
    """

    uploaded_images     = serializers.ListField(child=serializers.ImageField(), write_only=True, required=False)
    nearby_universities = serializers.PrimaryKeyRelatedField(many=True, queryset=University.objects.all())
    city                = serializers.SlugRelatedField(queryset=City.objects.all(), slug_field="name")
    transport_types     = serializers.SlugRelatedField(
        many=True, queryset=Transport.objects.all(), slug_field="name", required=False
    )

    class Meta:
        model = Property
        fields = [
            "title", "description", "unit_type",
            "rental_mode", "price", "room_price", "bed_price",
            "city", "district", "address", "latitude", "longitude",
            "nearby_universities", "distance_to_university", "transport_types",
            "num_rooms", "num_beds", "num_bathrooms",
            "floor", "area_sqm", "gender_preference",
            "has_internet", "has_ac", "has_water", "has_electricity", "has_gas",
            "min_stay_months", "max_stay_months",
            "status", "available_from",
            "uploaded_images",
        ]

    def validate(self, data):
        min_stay = data.get("min_stay_months", 1)
        max_stay = data.get("max_stay_months")
        if max_stay and max_stay < min_stay:
            raise serializers.ValidationError("max_stay_months cannot be less than min_stay_months.")

        universities = data.get("nearby_universities") or []
        if not universities:
            raise serializers.ValidationError({"nearby_universities": "At least one nearby university is required."})
        city = data.get("city")
        mismatched = [u.name for u in universities if u.city_id != city.id]
        if mismatched:
            raise serializers.ValidationError({"nearby_universities": f"Not in {city}: {mismatched}"})

        instance = Property(**{
            k: v for k, v in data.items()
            if k not in ("nearby_universities", "transport_types", "uploaded_images")
        })
        try:
            instance.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)

        return data

    def create(self, validated_data):
        images          = validated_data.pop("uploaded_images", [])
        universities    = validated_data.pop("nearby_universities")
        transport_types = validated_data.pop("transport_types", [])
        property_obj    = Property.objects.create(**validated_data)
        property_obj.nearby_universities.set(universities)
        property_obj.transport_types.set(transport_types)

        for index, image_file in enumerate(images):
            PropertyImage.objects.create(
                property=property_obj,
                image=image_file,
                is_cover=(index == 0),
            )

        return property_obj


class PropertyUpdateSerializer(serializers.ModelSerializer):
    """
    PATCH /api/properties/<id>/edit/ — landlord edits their own listing.
    All fields optional. Images managed separately via PropertyImageSerializer.
    """

    nearby_universities = serializers.PrimaryKeyRelatedField(many=True, queryset=University.objects.all(), required=False)
    city                = serializers.SlugRelatedField(queryset=City.objects.all(), slug_field="name", required=False)
    transport_types     = serializers.SlugRelatedField(
        many=True, queryset=Transport.objects.all(), slug_field="name", required=False
    )

    class Meta:
        model = Property
        fields = [
            "title", "description", "unit_type",
            "rental_mode", "price", "room_price", "bed_price",
            "city", "district", "address", "latitude", "longitude",
            "nearby_universities", "distance_to_university", "transport_types",
            "num_rooms", "num_beds", "num_bathrooms",
            "floor", "area_sqm", "gender_preference",
            "has_internet", "has_ac", "has_water", "has_electricity", "has_gas",
            "min_stay_months", "max_stay_months",
            "status", "available_from",
        ]

    def validate(self, data):
        instance = self.instance
        min_stay = data.get("min_stay_months", instance.min_stay_months)
        max_stay = data.get("max_stay_months", instance.max_stay_months)
        if max_stay and max_stay < min_stay:
            raise serializers.ValidationError("max_stay_months cannot be less than min_stay_months.")

        universities = data.get("nearby_universities")
        if universities is None:
            universities = list(instance.nearby_universities.all())
        if not universities:
            raise serializers.ValidationError({"nearby_universities": "At least one nearby university is required."})
        city = data.get("city", instance.city)
        mismatched = [u.name for u in universities if u.city_id != city.id]
        if mismatched:
            raise serializers.ValidationError({"nearby_universities": f"Not in {city}: {mismatched}"})

        merged = {
            "unit_type": instance.unit_type, "rental_mode": instance.rental_mode,
            "price": instance.price, "room_price": instance.room_price, "bed_price": instance.bed_price,
        }
        merged.update({k: v for k, v in data.items() if k not in ("nearby_universities", "transport_types")})
        temp = Property(**merged)
        try:
            temp.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)

        return data

    def update(self, instance, validated_data):
        universities    = validated_data.pop("nearby_universities", None)
        transport_types = validated_data.pop("transport_types", None)
        instance = super().update(instance, validated_data)
        if universities is not None:
            instance.nearby_universities.set(universities)
        if transport_types is not None:
            instance.transport_types.set(transport_types)
        return instance
