





##  urls ##

"""
    Properties API URL configuration

"""
from django.urls import path
from api.properties_api.views import (
    PropertyListView,
    FeaturedPropertiesView,
    UniversityPropertiesView,
    PropertyDetailView,
    PropertyCreateView,
    PropertyEditView,
    PropertyImageUploadView,
    PropertyImageDeleteView,
    LandlordPropertiesView,
)

urlpatterns = [
    # ── Public Listings ───────────────────────────────────────────────────────
    path(""                   , PropertyListView.as_view(),         name="property-list"),
    path("featured/"          , FeaturedPropertiesView.as_view(),   name="property-featured"),
    path("university/"        , UniversityPropertiesView.as_view(), name="property-university"),
    path("<int:property_id>/" , PropertyDetailView.as_view(),       name="property-detail"),

    # ── Landlord — Listing Management ─────────────────────────────────────────
    path("create/"                 , PropertyCreateView.as_view(),   name="property-create"),
    path("<int:property_id>/edit/" , PropertyEditView.as_view(),     name="property-edit"),

    # ── Landlord — Image Management ───────────────────────────────────────────
    path("<int:property_id>/images/"                , PropertyImageUploadView.as_view(), name="property-image-upload"),
    path("<int:property_id>/images/<int:image_id>/" , PropertyImageDeleteView.as_view(), name="property-image-delete"),

    # ── Owner Dashboard ───────────────────────────────────────────────────────
    path("landlord/properties/", LandlordPropertiesView.as_view(), name="landlord-properties"),
]


##  end urls ##



##  views ##

"""
Properties API views.

Views:
    - PropertyListView          → GET  /api/properties/            (filtered list)
    - FeaturedPropertiesView    → GET  /api/properties/featured/   (is_featured=True)
    - UniversityPropertiesView  → GET  /api/properties/university/ (filter by nearby_university)
    - PropertyDetailView        → GET  /api/properties/<id>/       (increments view_count)
    - PropertyCreateView        → POST /api/properties/create/     (landlords only)
    - PropertyEditView          → PATCH /api/properties/<id>/edit/ (landlord only)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework import status
from django.db.models import Q
from properties.models import Property, PropertyImage
from api.accounts_api.permissions import IsLandlord
from api.properties_api.serializers import (
    PropertySerializer,
    PropertyListSerializer,
    PropertyCreateSerializer,
    PropertyUpdateSerializer,
    PropertyImageSerializer,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def apply_filters(queryset, params):
    """
    Applies query-param filters to a Property queryset.
    Called by PropertyListView and UniversityPropertiesView.

    Supported params:
        city, district, type (property_type), status,
        price_min, price_max, num_beds, num_rooms,
        gender, university, amenity (single value, checks if list contains it)
    """
    city = params.get("city")
    district = params.get("district")
    property_type = params.get("type")
    prop_status = params.get("status")
    price_min = params.get("price_min")
    price_max = params.get("price_max")
    num_beds = params.get("num_beds")
    num_rooms = params.get("num_rooms")
    gender = params.get("gender")
    university = params.get("university")
    amenity = params.get("amenity")

    if city:
        queryset = queryset.filter(city__icontains=city)
    if district:
        queryset = queryset.filter(district__icontains=district)
    if property_type:
        queryset = queryset.filter(property_type=property_type)
    if prop_status:
        queryset = queryset.filter(status=prop_status)
    if price_min:
        queryset = queryset.filter(price__gte=price_min)
    if price_max:
        queryset = queryset.filter(price__lte=price_max)
    if num_beds:
        queryset = queryset.filter(num_beds=num_beds)
    if num_rooms:
        queryset = queryset.filter(num_rooms=num_rooms)
    if gender:
        queryset = queryset.filter(gender_preference=gender)
    if university:
        queryset = queryset.filter(nearby_university__icontains=university)
    if amenity:
        # JSONField list — filter rows where the amenity string appears in the array
        queryset = queryset.filter(amenities__contains=amenity)

    return queryset


# ── Views ─────────────────────────────────────────────────────────────────────

class PropertyListView(APIView):
    """
    GET /api/properties/
    Public listing. Returns all available properties with optional filters.

    Example: /api/properties/?city=Cairo&type=studio&price_min=1000&num_beds=2
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        queryset = Property.objects.select_related("landlord").prefetch_related("images")

        # Default to available only — frontend can pass status=rented to override
        if not request.query_params.get("status"):
            queryset = queryset.filter(status="available")

        queryset = apply_filters(queryset, request.query_params)
        serializer = PropertyListSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class FeaturedPropertiesView(APIView):
    """
    GET /api/properties/featured/
    Returns is_featured=True available listings.
    Used in the 'Featured Properties' section on the home page.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        queryset = (
            Property.objects
            .filter(is_featured=True, status="available")
            .select_related("landlord")
            .prefetch_related("images")
        )
        serializer = PropertyListSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class UniversityPropertiesView(APIView):
    """
    GET /api/properties/university/?university=Cairo+University
    Returns listings near a specific university.
    Falls back to all properties with a university set if no param provided.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        queryset = (
            Property.objects
            .filter(status="available")
            .exclude(nearby_university__isnull=True)
            .exclude(nearby_university="")
            .select_related("landlord")
            .prefetch_related("images")
        )
        queryset = apply_filters(queryset, request.query_params)
        serializer = PropertyListSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class PropertyDetailView(APIView):
    """
    GET /api/properties/<id>/
    Full detail page. Increments view_count on every request.
    Public — no auth required to browse.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, property_id):
        try:
            prop = (
                Property.objects
                .select_related("landlord")
                .prefetch_related("images")
                .get(id=property_id)
            )
        except Property.DoesNotExist:
            return Response({"error": "Property not found."}, status=status.HTTP_404_NOT_FOUND)

        # NOTE: use F() to avoid race conditions if we ever add concurrency
        from django.db.models import F
        Property.objects.filter(id=property_id).update(view_count=F("view_count") + 1)
        prop.refresh_from_db(fields=["view_count"])

        serializer = PropertySerializer(prop, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class PropertyCreateView(APIView):
    """
    POST /api/properties/create/
    Landlords only. landlord is injected server-side — never trust the client to send it.
    """
    permission_classes = [IsLandlord]

    def post(self, request):
        serializer = PropertyCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        prop = serializer.save(landlord=request.user)

        # Return full detail so the frontend can immediately show the new listing
        return Response(
            PropertySerializer(prop, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class PropertyEditView(APIView):
    """
    PATCH /api/properties/<id>/edit/
    Owner only. Landlord can only edit their own listings.
    """
    permission_classes = [IsLandlord]

    def patch(self, request, property_id):
        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"error": "Property not found."}, status=status.HTTP_404_NOT_FOUND)

        # Prevent landlords from editing other landlords' listings
        if prop.landlord != request.user:
            return Response({"error": "You do not own this property."}, status=status.HTTP_403_FORBIDDEN)

        serializer = PropertyUpdateSerializer(prop, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(
            PropertySerializer(prop, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class PropertyImageUploadView(APIView):
    """
    POST /api/properties/<id>/images/
    Add images to an existing listing. Only the landlord can upload.
    Send images as multipart/form-data with key 'images' (multiple files allowed).
    """
    permission_classes = [IsLandlord]

    def post(self, request, property_id):
        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"error": "Property not found."}, status=status.HTTP_404_NOT_FOUND)

        if prop.landlord != request.user:
            return Response({"error": "You do not own this property."}, status=status.HTTP_403_FORBIDDEN)

        images = request.FILES.getlist("images")
        if not images:
            return Response({"error": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)

        has_cover = prop.images.filter(is_cover=True).exists()
        created = []

        for index, image_file in enumerate(images):
            # First image becomes cover only if property has no cover yet
            is_cover = (index == 0) and not has_cover
            img = PropertyImage.objects.create(property=prop, image=image_file, is_cover=is_cover)
            created.append(img)

        return Response(
            PropertyImageSerializer(created, many=True, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class PropertyImageDeleteView(APIView):
    """
    DELETE /api/properties/<id>/images/<image_id>/
    Owner removes a single image. If the deleted image was the cover,
    the next oldest image is promoted automatically.
    """
    permission_classes = [IsLandlord]

    def delete(self, request, property_id, image_id):
        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"error": "Property not found."}, status=status.HTTP_404_NOT_FOUND)

        if prop.landlord != request.user:
            return Response({"error": "You do not own this property."}, status=status.HTTP_403_FORBIDDEN)

        try:
            image = PropertyImage.objects.get(id=image_id, property=prop)
        except PropertyImage.DoesNotExist:
            return Response({"error": "Image not found."}, status=status.HTTP_404_NOT_FOUND)

        was_cover = image.is_cover
        image.delete()

        # Promote oldest remaining image as cover if we just deleted the cover
        if was_cover:
            next_image = prop.images.order_by("uploaded_at").first()
            if next_image:
                next_image.is_cover = True
                next_image.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


class LandlordPropertiesView(APIView):
    """
    GET /api/owner/properties/
    Returns all properties belonging to the logged-in landlord.
    Used in the landlord dashboard 'My Properties' tab.
    """
    permission_classes = [IsLandlord]

    def get(self, request):
        queryset = (
            Property.objects
            .filter(landlord=request.user)
            .prefetch_related("images")
        )
        serializer = PropertyListSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


##  end views ##


## serializers ##

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
        model            = PropertyImage
        fields           = ["id", "image", "is_cover", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class PropertySerializer(serializers.ModelSerializer):
    """
    Full detail view — used on the property detail page.
    Includes nested images, owner info, and computed rating fields.
    """

    # used many=True because one property has many images (reverse relation)
    images = PropertyImageSerializer(many=True, read_only=True)

    # Computed fields from model properties
    average_rating = serializers.FloatField(read_only=True)
    review_count   = serializers.IntegerField(read_only=True)

    # Landlord info — needed when showing property (ForeignKey relation).
    # Only expose specific fields to avoid exposing sensitive User data.
    landlord_id           = serializers.IntegerField(source="landlord.id", read_only=True)
    landlord_name         = serializers.CharField(source="landlord.get_full_name", read_only=True)
    landlord_picture      = serializers.ImageField(source="landlord.profile_picture", read_only=True)
    landlord_is_verified  = serializers.BooleanField(source="landlord.is_verified", read_only=True)
    landlord_is_top_rated = serializers.BooleanField(source="landlord.is_top_rated", read_only=True)

    class Meta:
        model = Property
        fields = [
            "id",
            # ── Ownership ────────────────────────────────────
            "landlord_id", "landlord_name", "landlord_picture",
            "landlord_is_verified", "landlord_is_top_rated",
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

    class Meta:
        model  = Property
        fields = [
            "id", "title", "property_type", "price",
            "city", "district",
            "nearby_university", "distance_to_university", "transport_type",
            "num_beds", "num_roommates", "gender_preference",
            "amenities", "status", "is_featured",
            "average_rating", "review_count",
            "cover_image",
            "landlord_name", "landlord_is_verified",
            "created_at",
        ]

    def get_cover_image(self, obj):
        """Returns the URL of the cover image, or None if no images uploaded."""
        cover = obj.images.filter(is_cover=True).first() or obj.images.first()
        if not cover:
            return None
        request = self.context.get("request")
        # Build absolute URL so frontend doesn't need to prefix the media root
        # request.build_absolute_uri() adds full domain (e.g., http://localhost:8000) to URL
        # Without it, frontend only gets "/media/image.jpg" which may not work
        return request.build_absolute_uri(cover.image.url) if request else cover.image.url



class PropertyCreateSerializer(serializers.ModelSerializer):
    """
    POST /api/properties/create/ — landlord creates a new listing.
    owner is injected in the view via save(owner=request.user), not sent by client.
    
    """

    # Accept uploaded images at creation time (optional)
    uploaded_images = serializers.ListField(child=serializers.ImageField(),write_only=True,required=False,)

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

## end serializers ##



##  filters ##

"""
Properties API filters.
Replaces the manual apply_filters() helper in views.py.

Usage in views:
    from api.properties_api.filters import PropertyFilter

    queryset = Property.objects.all()
    filtered = PropertyFilter(request.query_params, queryset=queryset).qs

Supported query params:
    city, district, type, status,
    price_min, price_max,
    num_beds, num_rooms, num_bathrooms,
    gender, university,
    is_featured, amenity
"""
import django_filters
from properties.models import Property


class PropertyFilter(django_filters.FilterSet):
    """
    FilterSet for Property listings.
    Each filter maps a clean query-param name to the correct ORM lookup.
    """

    # ── Location ─────────────────────────────────────────────────────────────
    city = django_filters.CharFilter(field_name="city", lookup_expr="icontains")
    district = django_filters.CharFilter(field_name="district", lookup_expr="icontains")

    # ── Type & Status ─────────────────────────────────────────────────────────
    # 'type' is a reserved word in Python, so we alias it here
    type = django_filters.CharFilter(field_name="property_type", lookup_expr="exact")
    status = django_filters.CharFilter(field_name="status", lookup_expr="exact")

    # ── Pricing ───────────────────────────────────────────────────────────────
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    # ── Room Details ──────────────────────────────────────────────────────────
    num_beds = django_filters.NumberFilter(field_name="num_beds", lookup_expr="exact")
    num_rooms = django_filters.NumberFilter(field_name="num_rooms", lookup_expr="exact")
    num_bathrooms = django_filters.NumberFilter(field_name="num_bathrooms", lookup_expr="exact")

    # ── Preferences ───────────────────────────────────────────────────────────
    gender = django_filters.CharFilter(field_name="gender_preference", lookup_expr="exact")

    # ── University ────────────────────────────────────────────────────────────
    university = django_filters.CharFilter(field_name="nearby_university", lookup_expr="icontains")

    # ── Visibility ────────────────────────────────────────────────────────────
    is_featured = django_filters.BooleanFilter(field_name="is_featured")

    # ── Amenities (JSON list) ─────────────────────────────────────────────────
    # NOTE: checks if the amenity string appears anywhere in the JSON array
    # Example: /api/properties/?amenity=WiFi
    amenity = django_filters.CharFilter(field_name="amenities", lookup_expr="contains")

    class Meta:
        model = Property
        fields = [
            "city", "district", "type", "status",
            "price_min", "price_max",
            "num_beds", "num_rooms", "num_bathrooms",
            "gender", "university",
            "is_featured", "amenity",
        ]

##  end filters ##



##  permissions ##

"""
Properties API permissions.
Object-level permission so ownership checks don't live inside every view.
"""
from rest_framework.permissions import BasePermission, IsAuthenticated


class IsPropertyOwner(BasePermission):
    """
    Object-level permission — allows access only if the requesting user
    owns the property being accessed.

    Usage in views:
        permission_classes = [IsPropertyOwner]

        def patch(self, request, property_id):
            prop = get_object_or_404(Property, id=property_id)
            self.check_object_permissions(request, prop)   ← triggers has_object_permission
            ...
    """
    message = "You do not own this property."

    def has_permission(self, request, view):
        """User must be authenticated and be a landlord."""
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "landlord"
        )

    def has_object_permission(self, request, view, obj):
        """obj is the Property instance. Checks landlord field directly."""
        return obj.landlord == request.user


##  end permissions ##



## models ##

"""
Properties app models.
Handles property listings and their images.

Models:
    - Property      → main listing created by landlords
    - PropertyImage → multiple photos per property
"""


from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import Users

# ──────────────────────────────────────────────────────────────────────────────────────────


class Property(models.Model):
    """
    Main listing model. Created by landlords, browsed by students.

    Shown on: Home page cards, FindRoom page, Property detail page,
              Owner 'My Properties' dashboard.
    """

    # ── Choices ──────────────────────────────────────────────
    PROPERTY_TYPE_CHOICES = [
        ("apartment", "Apartment"),
        ("studio", "Studio"),
        ("room", "Room"),
        ("shared", "Shared Room"),
    ]
    STATUS_CHOICES = [
        ("available", "Available"),
        ("rented", "Rented"),
        ("unavailable", "Unavailable"),
    ]
    TRANSPORT_CHOICES = [
        ("walk", "Walking"),
        ("metro", "Metro"),
        ("transport", "Public Transport"),
    ]
    GENDER_CHOICES = [
        ("male", "Males Only"),
        ("female", "Females Only"),
    ]

    # ── Ownership ────────────────────────────────────────────
    # Only landlords can own properties — enforced at the API layer
    landlord = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="landlord_properties")

    # ── Basic Info ───────────────────────────────────────────
    title         = models.CharField(max_length=255)
    description   = models.TextField(blank=True, null=True)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES)

    # ── Pricing ──────────────────────────────────────────────
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])  

    # ── Location ─────────────────────────────────────────────
    city      = models.CharField(max_length=100)
    district  = models.CharField(max_length=100, blank=True, null=True)
    address   = models.TextField(blank=True, null=True)
    latitude  = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)  

    # ── University Proximity ─────────────────────────────────
    # Used in FindRoom university tab filter
    nearby_university      = models.CharField(max_length=255, blank=True, null=True)
    distance_to_university = models.CharField(max_length=50, blank=True, null=True) 
    transport_type         = models.CharField(max_length=20, choices=TRANSPORT_CHOICES, blank=True, null=True)

    # ── Room Details ─────────────────────────────────────────
    num_rooms         = models.IntegerField(default=1)
    num_beds          = models.IntegerField(default=1)  
    num_bathrooms     = models.IntegerField(default=1)
    num_roommates     = models.IntegerField(default=0)  
    floor             = models.IntegerField(blank=True, null=True)
    area_sqm          = models.IntegerField(blank=True, null=True)  
    gender_preference = models.CharField(max_length=10, choices=GENDER_CHOICES)

    # ── Amenities ────────────────────────────────────────────
    # Stored as JSON list e.g. ["WiFi", "AC", "Washing Machine", "Parking"]
    amenities = models.JSONField(default=list, blank=True)

    # ── Stay Duration ────────────────────────────────────────
    # Matches "Length of Stay" filter on FindRoom page
    min_stay_months = models.IntegerField(default=1)
    max_stay_months = models.IntegerField(blank=True, null=True)

    # ── Status & Visibility ──────────────────────────────────
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    is_featured = models.BooleanField(default=False)  # shown in "Featured Properties" section

    # ── Analytics ────────────────────────────────────────────
    # NOTE: Increment view_count in the detail view each time a user opens a listing
    view_count = models.IntegerField(default=0)  # tracked for Owner dashboard analytics

    # ── Timestamps ───────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Properties"
        ordering = ["-created_at"]  # newest listings first

    def __str__(self):
        return f"{self.title} — {self.landlord.username}"

    # ── Computed Properties ──────────────────────────────────
    @property
    def average_rating(self):
        """Average star rating from all reviews on this property. """
        reviews = self.reviews.all()
        if not reviews.exists():
            return 0
        return round(reviews.aggregate(models.Avg("rating"))["rating__avg"], 1)

    @property
    def review_count(self):
        """Total number of reviews for this property."""
        return self.reviews.count()


# ──────────────────────────────────────────────────────────────────────────────────────────


class PropertyImage(models.Model):
    """
    Multiple photos per property.
    The first image (is_cover=True) is used as the card thumbnail.

    Shown on: Property cards, Property detail photo gallery
    """

    property    = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="images")
    image       = models.ImageField(upload_to="property_images/")
    is_cover    = models.BooleanField(default=False)  # main thumbnail shown on cards
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_cover", "uploaded_at"]  

    def __str__(self):
        return f"Image for {self.property.title} ({'Cover' if self.is_cover else 'Gallery'})"

## end models ##
