"""
api/services_api/views.py

Three endpoints:

1. GET /api/services/nearby/
   ?lat=30.026&lng=31.213&type=pharmacy&radius=1500
   → finds amenities near the student's current GPS location

2. GET /api/services/university/
   ?name=Cairo University&type=supermarket&radius=1500
   → finds amenities near a named Egyptian university

3. GET /api/services/universities/
   → returns the list of all supported university names

Cache strategy
──────────────
Results from Overpass are cached in the NearbyPlace table.
A cached set is considered fresh for CACHE_TTL_HOURS.
If fresh rows exist  → return them immediately (no external call).
If stale / missing   → call Overpass, wipe old rows, store new ones.
"""

import logging
from datetime import timedelta

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from services.models import NearbyPlace
from services.overpass import fetch_nearby
from services.universities import get_university_coords, list_universities
from .serializers import NearbyPlaceSerializer

logger = logging.getLogger(__name__)

CACHE_TTL_HOURS    = 24          # refresh cache after this many hours
DEFAULT_RADIUS_M   = 1500        # metres
MAX_RADIUS_M       = 5000        # cap to avoid abuse
VALID_PLACE_TYPES  = [pt[0] for pt in NearbyPlace.PLACE_TYPE_CHOICES]

# ── Helpers ───────────────────────────────────────────────────────────────────

def _round_coord(value: float, decimals: int = 3) -> float:
    """
    Rounds lat/lng to `decimals` places for cache bucketing.
    3 decimal places ≈ 111-metre precision — fine for nearby search.
    """
    return round(value, decimals)


def _get_or_refresh_cache(lat: float, lng: float, place_type: str, radius_m: int) -> list:
    """
    Returns cached NearbyPlace rows if fresh, otherwise fetches from
    Overpass, stores results, and returns them.
    """
    q_lat  = _round_coord(lat)
    q_lng  = _round_coord(lng)
    cutoff = timezone.now() - timedelta(hours=CACHE_TTL_HOURS)

    fresh_qs = NearbyPlace.objects.filter(
        query_lat=q_lat,
        query_lng=q_lng,
        place_type=place_type,
        radius_m=radius_m,
        cached_at__gte=cutoff,
    ).order_by("distance_m")

    if fresh_qs.exists():
        return list(fresh_qs)

    # ── Cache miss / stale ────────────────────────────────────────
    raw_places = fetch_nearby(lat, lng, place_type, radius_m)

    # Delete stale rows for this bucket
    NearbyPlace.objects.filter(
        query_lat=q_lat,
        query_lng=q_lng,
        place_type=place_type,
        radius_m=radius_m,
    ).delete()

    if not raw_places:
        return []

    # Bulk-create fresh rows
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


def _parse_params(request) -> tuple[float | None, float | None, str | None, int, list[str]]:
    """
    Parses and validates ?lat, ?lng, ?type, ?radius from query params.
    Returns (lat, lng, place_type, radius_m, errors).
    errors is empty if everything is valid.
    """
    errors = []
    lat_raw    = request.query_params.get("lat")
    lng_raw    = request.query_params.get("lng")
    type_raw   = request.query_params.get("type", "supermarket")
    radius_raw = request.query_params.get("radius", str(DEFAULT_RADIUS_M))

    # Validate lat
    try:
        lat = float(lat_raw)
    except (TypeError, ValueError):
        lat = None
        errors.append("`lat` must be a valid decimal number (e.g. 30.026).")

    # Validate lng
    try:
        lng = float(lng_raw)
    except (TypeError, ValueError):
        lng = None
        errors.append("`lng` must be a valid decimal number (e.g. 31.213).")

    # Validate place_type
    if type_raw not in VALID_PLACE_TYPES:
        errors.append(
            f"`type` must be one of: {', '.join(VALID_PLACE_TYPES)}."
        )
        type_raw = None

    # Validate radius
    try:
        radius_m = min(int(radius_raw), MAX_RADIUS_M)
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
    Params:
        lat     (required)  — user's GPS latitude
        lng     (required)  — user's GPS longitude
        type    (optional)  — place_type, default: supermarket
        radius  (optional)  — metres, default: 1500, max: 5000

    Returns list of NearbyPlace objects sorted by distance.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lat, lng, place_type, radius_m, errors = _parse_params(request)
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        places = _get_or_refresh_cache(lat, lng, place_type, radius_m)
        serializer = NearbyPlaceSerializer(places, many=True)
        return Response(
            {
                "count":      len(places),
                "place_type": place_type,
                "radius_m":   radius_m,
                "results":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class NearbyUniversityView(APIView):
    """
    GET /api/services/university/
    Params:
        name    (required)  — university name (must match universities registry)
        type    (optional)  — place_type, default: supermarket
        radius  (optional)  — metres, default: 1500, max: 5000

    Looks up the university's coordinates from the built-in registry,
    then returns nearby places using the same cache logic as NearbyView.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        uni_name   = request.query_params.get("name", "").strip()
        type_raw   = request.query_params.get("type", "supermarket")
        radius_raw = request.query_params.get("radius", str(DEFAULT_RADIUS_M))

        if not uni_name:
            return Response(
                {"error": "`name` param is required. Use GET /api/services/universities/ to see valid names."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        coords = get_university_coords(uni_name)
        if not coords:
            return Response(
                {
                    "error": f"University '{uni_name}' not found in our registry.",
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
        return Response(
            {
                "university": uni_name,
                "city":       coords.get("city", ""),
                "lat":        lat,
                "lng":        lng,
                "count":      len(places),
                "place_type": type_raw,
                "radius_m":   radius_m,
                "results":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class UniversityListView(APIView):
    """
    GET /api/services/universities/
    Returns all supported university names so the frontend can populate
    a dropdown without hardcoding anything.
    Public — no auth required.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {"universities": list_universities()},
            status=status.HTTP_200_OK,
        )
