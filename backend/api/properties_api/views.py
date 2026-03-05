"""
Properties API views.

Views:
    - PropertyListView          → GET  /api/properties/            (filtered list)
    - FeaturedPropertiesView    → GET  /api/properties/featured/   (is_featured=True)
    - UniversityPropertiesView  → GET  /api/properties/university/ (filter by nearby_university)
    - PropertyDetailView        → GET  /api/properties/<id>/       (increments view_count)
    - PropertyCreateView        → POST /api/properties/create/     (landlords only)
    - PropertyEditView          → PATCH /api/properties/<id>/edit/ (owner only)
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
        queryset = Property.objects.select_related("owner").prefetch_related("images")

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
            .select_related("owner")
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
            .select_related("owner")
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
                .select_related("owner")
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
    Landlords only. owner is injected server-side — never trust the client to send it.
    """
    permission_classes = [IsLandlord]

    def post(self, request):
        serializer = PropertyCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        prop = serializer.save(owner=request.user)

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
        if prop.owner != request.user:
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
    Add images to an existing listing. Only the owner can upload.
    Send images as multipart/form-data with key 'images' (multiple files allowed).
    """
    permission_classes = [IsLandlord]

    def post(self, request, property_id):
        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"error": "Property not found."}, status=status.HTTP_404_NOT_FOUND)

        if prop.owner != request.user:
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

        if prop.owner != request.user:
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


class OwnerPropertiesView(APIView):
    """
    GET /api/owner/properties/
    Returns all properties belonging to the logged-in landlord.
    Used in the owner dashboard 'My Properties' tab.
    """
    permission_classes = [IsLandlord]

    def get(self, request):
        queryset = (
            Property.objects
            .filter(owner=request.user)
            .prefetch_related("images")
        )
        serializer = PropertyListSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
