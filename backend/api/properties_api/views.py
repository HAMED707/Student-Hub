"""
Properties API views.

Views:
    - PropertyListView          → GET  /api/properties/            (filtered list)
    - FeaturedPropertiesView    → GET  /api/properties/featured/   (is_featured=True)
    - UniversityPropertiesView  → GET  /api/properties/university/ (filter by nearby_universities)
    - UniversitiesByCityView    → GET  /api/properties/universities/?city=Cairo (lookup list for a city)
    - PropertyDetailView        → GET  /api/properties/<id>/       (increments view_count)
    - PropertyCreateView        → POST /api/properties/create/     (landlords only)
    - PropertyEditView          → PATCH /api/properties/<id>/edit/ (landlord only)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework import status
from django.db.models import Count, Q
from properties.models import Property, PropertyImage, University
from api.accounts_api.permissions import IsLandlord
from api.properties_api.serializers import (
    PropertySerializer,
    PropertyListSerializer,
    PropertyCreateSerializer,
    PropertyUpdateSerializer,
    PropertyImageSerializer,
    UniversitySerializer,
)

import logging

from services.google_maps import (
    get_distance_to_university,
    GoogleMapsError,
)

logger = logging.getLogger(__name__)

TRANSPORT_TO_MODE = {
    "walk": "walking",
    "metro": "transit",
    "transport": "transit",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def apply_filters(queryset, params):
    """
    Applies query-param filters to a Property queryset.
    Called by PropertyListView and UniversityPropertiesView.

    Supported params:
        city, district, type (unit_type, comma-separated), status,
        price_min, price_max, num_beds, num_rooms, gender, university,
        has_internet, has_ac, has_water, has_electricity, has_gas ("true"/"false")
    """
    query = params.get("q")
    city = params.get("city")
    district = params.get("district")
    unit_type = params.get("type")
    prop_status = params.get("status")
    price_min = params.get("price_min")
    price_max = params.get("price_max")
    num_beds = params.get("num_beds")
    num_rooms = params.get("num_rooms")
    gender = params.get("gender")
    university = params.get("university")

    if query:
        queryset = queryset.filter(
            Q(title__icontains=query)
            | Q(city__name__icontains=query)
            | Q(district__icontains=query)
            | Q(address__icontains=query)
            | Q(nearby_universities__name__icontains=query)
        ).distinct()
    if city:
        queryset = queryset.filter(city__name__icontains=city)
    if district:
        queryset = queryset.filter(district__icontains=district)
    if unit_type:
        unit_types = [item.strip() for item in unit_type.split(",") if item.strip()]
        if unit_types:
            queryset = queryset.filter(unit_type__in=unit_types)
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
        queryset = queryset.filter(nearby_universities__name__icontains=university).distinct()

    for bool_param in ("has_internet", "has_ac", "has_water", "has_electricity", "has_gas"):
        value = params.get(bool_param)
        if value is not None:
            queryset = queryset.filter(**{bool_param: value.lower() == "true"})

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
            .exclude(nearby_universities__isnull=True)
            .distinct()
            .select_related("landlord")
            .prefetch_related("images")
        )
        queryset = apply_filters(queryset, request.query_params)
        serializer = PropertyListSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class UniversitiesByCityView(APIView):
    """
    GET /api/properties/universities/?city=Cairo
    Lookup list for the listing form: a landlord must pick a city first,
    then this returns only the universities that belong to that city.
    Returns an empty list if no city is given, so the frontend can leave
    the universities field disabled/empty until a city is chosen.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        city = request.query_params.get("city")
        if not city:
            return Response([], status=status.HTTP_200_OK)

        queryset = University.objects.filter(city__name__iexact=city)
        serializer = UniversitySerializer(queryset, many=True)
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

        university_distance = None
        nearest_university = prop.nearby_universities.first()

        if prop.latitude and prop.longitude and nearest_university:
            first_transport = prop.transport_types.first()
            mode = TRANSPORT_TO_MODE.get(
                first_transport.name if first_transport else None,
                "walking"
            )

            try:
                university_distance = get_distance_to_university(
                    origin_lat=float(prop.latitude),
                    origin_lng=float(prop.longitude),
                    destination=nearest_university.name,
                    mode=mode,
                )
            except GoogleMapsError as exc:
                logger.warning(
                    "Distance Matrix failed for property %s: %s",
                    property_id,
                    exc,
                )

        serializer = PropertySerializer(
            prop,
            context={
                "request": request,
                "university_distance": university_distance,
            },
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, property_id):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        if request.user.role != "landlord":
            return Response({"error": "Only landlords can delete properties."}, status=status.HTTP_403_FORBIDDEN)

        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"error": "Property not found."}, status=status.HTTP_404_NOT_FOUND)

        if prop.landlord != request.user:
            return Response({"error": "You do not own this property."}, status=status.HTTP_403_FORBIDDEN)

        prop.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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


class LandlordDashboardView(APIView):
    """
    GET /api/properties/landlord/dashboard/
    Returns aggregate owner dashboard data backed by live properties/bookings.
    """

    permission_classes = [IsLandlord]

    def get(self, request):
        properties = (
            Property.objects
            .filter(landlord=request.user)
            .prefetch_related("images")
        )
        booking_qs = (
            request.user.landlord_properties
            .prefetch_related("bookings")
            .values_list("bookings__id", flat=True)
        )

        from bookings.models import Booking

        bookings = (
            Booking.objects
            .filter(id__in=booking_qs)
            .select_related("tenant", "property")
            .order_by("-created_at")
        )

        total_properties = properties.count()
        total_views = sum(property_obj.view_count for property_obj in properties)
        booked_units = bookings.filter(status__in=["confirmed", "completed"]).count()
        pending_requests = bookings.filter(status="deposit_paid").count()
        booked_progress = round((booked_units / total_properties) * 100) if total_properties else 0

        recent_bookings = []
        for booking in bookings[:6]:
            tenant_name = (
                f"{booking.tenant.first_name or ''} {booking.tenant.last_name or ''}".strip()
                or booking.tenant.username
            )
            recent_bookings.append(
                {
                    "id": booking.id,
                    "tenant_id": booking.tenant_id,
                    "tenant_name": tenant_name,
                    "tenant_avatar": request.build_absolute_uri(booking.tenant.profile_picture.url)
                    if booking.tenant.profile_picture
                    else None,
                    "property_id": booking.property_id,
                    "property_title": booking.property.title,
                    "unit_type": booking.property.unit_type,
                    "status": booking.status,
                    "move_in_date": booking.move_in_date,
                    "duration_months": booking.duration_months,
                    "message": booking.message or "",
                    "created_at": booking.created_at,
                }
            )

        top_properties = []
        for property_obj in (
            properties.annotate(booking_count=Count("bookings")).order_by("-view_count", "-created_at")[:5]
        ):
            serializer = PropertyListSerializer(property_obj, context={"request": request})
            top_properties.append(
                {
                    **serializer.data,
                    "booking_count": property_obj.booking_count,
                }
            )

        return Response(
            {
                "summary": {
                    "total_properties": total_properties,
                    "available_properties": properties.filter(status="available").count(),
                    "reserved_properties": properties.filter(status="reserved").count(),
                    "rented_properties": properties.filter(status="rented").count(),
                    "total_views": total_views,
                    "booked_units": booked_units,
                    "booked_progress": booked_progress,
                    "pending_requests": pending_requests,
                    "wallet_balance": str(getattr(request.user.landlord_profile, "available_balance", 0)),
                    "total_income": str(getattr(request.user.landlord_profile, "total_income", 0)),
                },
                "recent_bookings": recent_bookings,
                "top_properties": top_properties,
            },
            status=status.HTTP_200_OK,
        )
