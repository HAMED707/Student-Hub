"""
api/services_api/views.py

Four endpoints:

1. GET /api/services/nearby/
   ?lat=&lng=&type=&radius=
   → finds amenities near the student's current GPS location

2. GET /api/services/university/
   ?name=&type=&radius=
   → finds amenities near a named Egyptian university

3. GET /api/services/universities/
   → returns all supported university names (public, no auth)

4. GET /api/services/distance/
   ?property_id=&mode=walking
   → returns distance + travel time from a property to its nearby_university
     using Google Distance Matrix API

Cache strategy (for endpoints 1 & 2)
──────────────────────────────────────
Lat/lng rounded to 3 decimal places (~111m buckets).
Fresh = cached_at within CACHE_TTL_HOURS.
Fresh rows → return from DB immediately.
Stale/missing → call Google Places → delete old rows → bulk_create new rows.
"""

import logging
from datetime import timedelta

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from services.models import NearbyPlace
from services.google_maps import fetch_nearby, get_distance_to_university, GoogleMapsError
from services.universities import get_university_coords, list_universities
from properties.models import Property
from .serializers import NearbyPlaceSerializer

logger = logging.getLogger(__name__)

CACHE_TTL_HOURS  = 24
DEFAULT_RADIUS_M = 1500
MAX_RADIUS_M     = 5000
VALID_PLACE_TYPES = [pt[0] for pt in NearbyPlace.PLACE_TYPE_CHOICES]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _round_coord(value: float, decimals: int = 3) -> float:
    return round(value, decimals)


def _get_or_refresh_cache(lat: float, lng: float, place_type: str, radius_m: int) -> list:
    """
    Returns fresh NearbyPlace rows from DB cache.
    Falls back to Google Places API if cache is stale or empty.
    """
    q_lat  = _round_coord(lat)
    q_lng  = _round_coord(lng)
    cutoff = timezone.now() - timedelta(hours=CACHE_TTL_HOURS)

    fresh_qs = NearbyPlace.objects.filter(
        query_lat  = q_lat,
        query_lng  = q_lng,
        place_type = place_type,
        radius_m   = radius_m,
        cached_at__gte = cutoff,
    ).order_by("distance_m")

    if fresh_qs.exists():
        return list(fresh_qs)

    # Cache miss — call Google Places
    raw_places = fetch_nearby(lat, lng, place_type, radius_m)

    # Wipe stale rows for this bucket
    NearbyPlace.objects.filter(
        query_lat  = q_lat,
        query_lng  = q_lng,
        place_type = place_type,
        radius_m   = radius_m,
    ).delete()

    if not raw_places:
        return []

    objs = [
        NearbyPlace(
            query_lat   = q_lat,
            query_lng   = q_lng,
            place_type  = place_type,
            radius_m    = radius_m,
            external_id = p["external_id"],
            name        = p["name"],
            address     = p["address"],
            latitude    = p["latitude"],
            longitude   = p["longitude"],
            distance_m  = p["distance_m"],
            rating      = p["rating"],
            open_now    = p["open_now"],
        )
        for p in raw_places
    ]
    created = NearbyPlace.objects.bulk_create(objs)
    return sorted(created, key=lambda x: x.distance_m)


def _parse_nearby_params(request):
    """Parses and validates ?lat, ?lng, ?type, ?radius."""
    errors = []

    try:
        lat = float(request.query_params.get("lat"))
    except (TypeError, ValueError):
        lat = None
        errors.append("`lat` must be a valid decimal number (e.g. 30.026).")

    try:
        lng = float(request.query_params.get("lng"))
    except (TypeError, ValueError):
        lng = None
        errors.append("`lng` must be a valid decimal number (e.g. 31.213).")

    type_raw = request.query_params.get("type", "supermarket")
    if type_raw not in VALID_PLACE_TYPES:
        errors.append(f"`type` must be one of: {', '.join(VALID_PLACE_TYPES)}.")
        type_raw = None

    try:
        radius_m = min(int(request.query_params.get("radius", DEFAULT_RADIUS_M)), MAX_RADIUS_M)
        if radius_m <= 0:
            raise ValueError
    except (TypeError, ValueError):
        radius_m = DEFAULT_RADIUS_M
        errors.append(f"`radius` must be a positive integer (max {MAX_RADIUS_M}).")

    return lat, lng, type_raw, radius_m, errors


# ── Views ─────────────────────────────────────────────────────────────────────

class NearbyView(APIView):
    """
    GET /api/services/nearby/
    Finds amenities near the student's current GPS location.

    Params:
        lat     (required)
        lng     (required)
        type    (optional, default: supermarket)
        radius  (optional, default: 1500, max: 5000)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lat, lng, place_type, radius_m, errors = _parse_nearby_params(request)
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        places = _get_or_refresh_cache(lat, lng, place_type, radius_m)
        serializer = NearbyPlaceSerializer(places, many=True)
        return Response({
            "count":      len(places),
            "place_type": place_type,
            "radius_m":   radius_m,
            "results":    serializer.data,
        })


class NearbyUniversityView(APIView):
    """
    GET /api/services/university/
    Finds amenities near a named Egyptian university.

    Params:
        name    (required)  — must match universities registry
        type    (optional, default: supermarket)
        radius  (optional, default: 1500, max: 5000)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        uni_name   = request.query_params.get("name", "").strip()
        type_raw   = request.query_params.get("type", "supermarket")
        radius_raw = request.query_params.get("radius", str(DEFAULT_RADIUS_M))

        if not uni_name:
            return Response(
                {"error": "`name` is required. Use /api/services/universities/ to see valid names."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        coords = get_university_coords(uni_name)
        if not coords:
            return Response(
                {
                    "error": f"University '{uni_name}' not found.",
                    "hint":  "Use GET /api/services/universities/ to see supported names.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if type_raw not in VALID_PLACE_TYPES:
            return Response(
                {"error": f"`type` must be one of: {', '.join(VALID_PLACE_TYPES)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            radius_m = min(int(radius_raw), MAX_RADIUS_M)
            if radius_m <= 0:
                raise ValueError
        except (TypeError, ValueError):
            radius_m = DEFAULT_RADIUS_M

        lat = float(coords["lat"])
        lng = float(coords["lng"])

        places = _get_or_refresh_cache(lat, lng, type_raw, radius_m)
        serializer = NearbyPlaceSerializer(places, many=True)
        return Response({
            "university": uni_name,
            "city":       coords.get("city", ""),
            "count":      len(places),
            "place_type": type_raw,
            "radius_m":   radius_m,
            "results":    serializer.data,
        })


class UniversityListView(APIView):
    """
    GET /api/services/universities/
    Returns all supported university names for frontend dropdowns.
    Public — no auth required.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"universities": list_universities()})


class PropertyDistanceView(APIView):
    """
    GET /api/services/distance/
    Returns real distance and travel time from a property to its nearby_university
    using Google Distance Matrix API.

    Params:
        property_id  (required)  — ID of the property
        mode         (optional)  — walking | transit | driving (default: walking)

    Response:
        {
            "property_id":    1,
            "university":     "Cairo University",
            "distance_text":  "1.2 km",
            "distance_value": 1200,
            "duration_text":  "15 mins",
            "duration_value": 900,
            "mode":           "walking"
        }
    """
    permission_classes = [IsAuthenticated]

    VALID_MODES = ["walking", "transit", "driving"]

    def get(self, request):
        property_id = request.query_params.get("property_id")
        mode        = request.query_params.get("mode", "walking")

        if not property_id:
            return Response(
                {"error": "`property_id` is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if mode not in self.VALID_MODES:
            return Response(
                {"error": f"`mode` must be one of: {', '.join(self.VALID_MODES)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response(
                {"error": "Property not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not prop.latitude or not prop.longitude:
            return Response(
                {"error": "Property has no coordinates. Address may not have been geocoded yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not prop.nearby_university:
            return Response(
                {"error": "This property has no university set."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = get_distance_to_university(
                origin_lat  = float(prop.latitude),
                origin_lng  = float(prop.longitude),
                destination = prop.nearby_university,
                mode        = mode,
            )
        except GoogleMapsError as exc:
            logger.warning("Distance Matrix error for property %s: %s", property_id, exc)
            return Response(
                {"error": "Could not calculate distance. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({
            "property_id":    prop.id,
            "university":     prop.nearby_university,
            **result,
        })