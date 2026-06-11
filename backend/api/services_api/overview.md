## services app + google map integration ## 



# ────────────────────────Start URL─────────────────────────────────────

```
"""Services API URL configuration."""
from django.urls import path
from api.services_api.views import (
    NearbyView,
    NearbyUniversityView,
    UniversityListView,
    PropertyDistanceView,
)

urlpatterns = [
    path("nearby/",       NearbyView.as_view(),          name="services-nearby"),
    path("university/",   NearbyUniversityView.as_view(), name="services-university"),
    path("universities/", UniversityListView.as_view(),   name="services-universities-list"),
    path("distance/",     PropertyDistanceView.as_view(), name="services-distance"),
]
        
```

# ────────────────────────End URL───────────────────────────────────────



# ────────────────────────Start Serializer──────────────────────────────

```
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

```

# ────────────────────────End Serializer────────────────────────────────




# ────────────────────────Start View────────────────────────────────────

```
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
```

# ────────────────────────End View──────────────────────────────────────


# ────────────────────────Start Google Maps────────────────────────────────────
```
"""
services/google_maps.py

Unified Google Maps service.
Wraps three Google APIs used across the StudentHub backend:

    1. Geocoding API      → address text → (lat, lng)
    2. Places API         → nearby POIs around a coordinate
    3. Distance Matrix API → distance + travel time between two points

All methods return clean Python dicts and raise GoogleMapsError on failure.
The views/signals that call these methods handle the exception.

Requires GOOGLE_MAPS_API_KEY in settings.py.
"""

import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

GMAPS_BASE = "https://maps.googleapis.com/maps/api"

# Maps our internal place_type to Google Places API type
GOOGLE_PLACE_TYPE_MAP: dict[str, str] = {
    "supermarket":   "supermarket",
    "pharmacy":      "pharmacy",
    "restaurant":    "restaurant",
    "cafe":          "cafe",
    "gym":           "gym",
    "hospital":      "hospital",
    "bank":          "bank",
    "atm":           "atm",
    "bus_station":   "bus_station",
    "metro_station": "subway_station",
    "mosque":        "mosque",
    "library":       "library",
    "laundry":       "laundry",
}

# Maps our internal place_type to Distance Matrix travel mode
TRAVEL_MODE_MAP: dict[str, str] = {
    "walk":      "walking",
    "metro":     "transit",
    "transport": "transit",
}


class GoogleMapsError(Exception):
    """Raised when a Google Maps API call fails."""
    pass


def _api_key() -> str:
    key = getattr(settings, "GOOGLE_MAPS_API_KEY", None)
    if not key:
        raise GoogleMapsError("GOOGLE_MAPS_API_KEY is not set in settings.")
    return key


# ── 1. Geocoding ──────────────────────────────────────────────────────────────

def geocode_address(address: str) -> dict:
    """
    Converts a free-text address to lat/lng.

    Returns:
        {
            "lat":              float,
            "lng":              float,
            "formatted_address": str,
        }

    Raises GoogleMapsError if address cannot be resolved.

    Example:
        geocode_address("15 Tahrir Square, Cairo")
        → {"lat": 30.0444, "lng": 31.2357, "formatted_address": "Tahrir Square, Cairo..."}
    """
    try:
        resp = requests.get(
            f"{GMAPS_BASE}/geocode/json",
            params={"address": address, "key": _api_key(), "region": "eg"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise GoogleMapsError(f"Geocoding request failed: {exc}") from exc

    if data.get("status") != "OK" or not data.get("results"):
        raise GoogleMapsError(
            f"Geocoding failed for '{address}'. Status: {data.get('status')}"
        )

    result   = data["results"][0]
    location = result["geometry"]["location"]

    return {
        "lat":               location["lat"],
        "lng":               location["lng"],
        "formatted_address": result.get("formatted_address", address),
    }


# ── 2. Places API ─────────────────────────────────────────────────────────────

def fetch_nearby(lat: float, lng: float, place_type: str, radius_m: int = 1500) -> list[dict]:
    """
    Finds POIs near (lat, lng) using Google Places Nearby Search.

    Returns a list of dicts (max 20, sorted by distance):
        {
            "external_id": str,      # Google place_id
            "name":        str,
            "address":     str,
            "latitude":    float,
            "longitude":   float,
            "distance_m":  int,      # straight-line metres from query point
            "rating":      float | None,
            "open_now":    bool | None,
        }

    Returns [] on any error (caller falls back to DB cache).
    """
    google_type = GOOGLE_PLACE_TYPE_MAP.get(place_type)
    if not google_type:
        return []

    try:
        resp = requests.get(
            f"{GMAPS_BASE}/place/nearbysearch/json",
            params={
                "location": f"{lat},{lng}",
                "radius":   radius_m,
                "type":     google_type,
                "key":      _api_key(),
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        logger.warning("Google Places request failed: %s", exc)
        return []

    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        logger.warning("Google Places API status: %s", data.get("status"))
        return []

    results = []
    for place in data.get("results", []):
        loc      = place.get("geometry", {}).get("location", {})
        place_lat = loc.get("lat")
        place_lng = loc.get("lng")
        if place_lat is None or place_lng is None:
            continue

        name = place.get("name", "").strip()
        if not name:
            continue

        open_periods = place.get("opening_hours", {})
        open_now     = open_periods.get("open_now") if open_periods else None
        rating       = place.get("rating")

        results.append({
            "external_id": place.get("place_id", ""),
            "name":        name,
            "address":     place.get("vicinity", ""),
            "latitude":    place_lat,
            "longitude":   place_lng,
            "distance_m":  _haversine_m(lat, lng, place_lat, place_lng),
            "rating":      rating,
            "open_now":    open_now,
        })

    results.sort(key=lambda x: x["distance_m"])
    return results[:20]


# ── 3. Distance Matrix ────────────────────────────────────────────────────────

def get_distance_to_university(
    origin_lat: float,
    origin_lng: float,
    destination: str,
    mode: str = "walking",
) -> dict:
    """
    Calculates distance and travel time from a property to a university.

    Args:
        origin_lat:   property latitude
        origin_lng:   property longitude
        destination:  university name or address string
        mode:         "walking" | "transit" | "driving" (default: walking)

    Returns:
        {
            "distance_text":  "1.2 km",
            "distance_value": 1200,        # metres
            "duration_text":  "15 mins",
            "duration_value": 900,         # seconds
            "mode":           "walking",
        }

    Raises GoogleMapsError if the API call fails or no route is found.
    """
    try:
        resp = requests.get(
            f"{GMAPS_BASE}/distancematrix/json",
            params={
                "origins":      f"{origin_lat},{origin_lng}",
                "destinations": destination,
                "mode":         mode,
                "key":          _api_key(),
                "region":       "eg",
                "language":     "en",
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise GoogleMapsError(f"Distance Matrix request failed: {exc}") from exc

    if data.get("status") != "OK":
        raise GoogleMapsError(
            f"Distance Matrix failed. Status: {data.get('status')}"
        )

    try:
        element = data["rows"][0]["elements"][0]
    except (IndexError, KeyError) as exc:
        raise GoogleMapsError("Unexpected Distance Matrix response structure.") from exc

    if element.get("status") != "OK":
        raise GoogleMapsError(
            f"No route found. Element status: {element.get('status')}"
        )

    return {
        "distance_text":  element["distance"]["text"],
        "distance_value": element["distance"]["value"],
        "duration_text":  element["duration"]["text"],
        "duration_value": element["duration"]["value"],
        "mode":           mode,
    }


# ── Utility ───────────────────────────────────────────────────────────────────

def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> int:
    """Straight-line distance in metres between two GPS coordinates."""
    import math
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return int(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))

```
# ────────────────────────End Google Maps──────────────────────────────────────


# ────────────────────────Start university────────────────────────────────────
```

"""
services/universities.py

Coordinate registry for Egyptian universities.
Used for:
  1. NearbyUniversityView  → find amenities near a university
  2. Distance Matrix calls → resolve university name to a searchable string

Add more entries as the platform expands.
"""

EGYPTIAN_UNIVERSITIES: dict[str, dict] = {
    # ── Cairo ──────────────────────────────────────────────────────
    "Cairo University":                          {"lat": 30.0262,  "lng": 31.2132,  "city": "Giza"},
    "Ain Shams University":                      {"lat": 30.0730,  "lng": 31.2798,  "city": "Cairo"},
    "Helwan University":                         {"lat": 29.8497,  "lng": 31.3238,  "city": "Cairo"},
    "Misr University for Science and Technology":{"lat": 29.8814,  "lng": 31.3506,  "city": "Giza"},
    "German University in Cairo":                {"lat": 29.9878,  "lng": 31.4414,  "city": "Cairo"},
    "American University in Cairo":              {"lat": 30.0220,  "lng": 31.4999,  "city": "Cairo"},
    "Future University in Egypt":                {"lat": 30.0281,  "lng": 31.4762,  "city": "Cairo"},
    "Modern Sciences and Arts University":       {"lat": 30.0617,  "lng": 31.2281,  "city": "Giza"},
    "Nile University":                           {"lat": 30.0618,  "lng": 30.8426,  "city": "Giza"},
    "October 6 University":                      {"lat": 29.9350,  "lng": 30.9296,  "city": "6th of October"},
    "Badr University in Cairo":                  {"lat": 30.1290,  "lng": 31.7439,  "city": "Cairo"},

    # ── Alexandria ────────────────────────────────────────────────
    "Alexandria University":                     {"lat": 31.2001,  "lng": 29.9187,  "city": "Alexandria"},
    "Arab Academy for Science and Technology":   {"lat": 31.1842,  "lng": 29.9370,  "city": "Alexandria"},
    "Pharos University in Alexandria":           {"lat": 31.1697,  "lng": 29.9663,  "city": "Alexandria"},

    # ── Delta / Canal ─────────────────────────────────────────────
    "Mansoura University":                       {"lat": 31.0409,  "lng": 31.3785,  "city": "Mansoura"},
    "Tanta University":                          {"lat": 30.7969,  "lng": 31.0039,  "city": "Tanta"},
    "Zagazig University":                        {"lat": 30.5855,  "lng": 31.5027,  "city": "Zagazig"},
    "Suez Canal University":                     {"lat": 30.6057,  "lng": 32.2694,  "city": "Ismailia"},
    "Port Said University":                      {"lat": 31.2544,  "lng": 32.2940,  "city": "Port Said"},
    "Benha University":                          {"lat": 30.4628,  "lng": 31.1856,  "city": "Benha"},
    "Kafr El Sheikh University":                 {"lat": 31.1063,  "lng": 30.9388,  "city": "Kafr El Sheikh"},
    "Damietta University":                       {"lat": 31.4218,  "lng": 31.8131,  "city": "Damietta"},

    # ── Upper Egypt ───────────────────────────────────────────────
    "Assiut University":                         {"lat": 27.1810,  "lng": 31.1655,  "city": "Assiut"},
    "Sohag University":                          {"lat": 26.5569,  "lng": 31.6948,  "city": "Sohag"},
    "South Valley University":                   {"lat": 25.6872,  "lng": 32.6439,  "city": "Qena"},
    "Aswan University":                          {"lat": 24.0889,  "lng": 32.8998,  "city": "Aswan"},
    "Luxor University":                          {"lat": 25.6872,  "lng": 32.6439,  "city": "Luxor"},

    # ── Sinai / Red Sea ───────────────────────────────────────────
    "Sinai University":                          {"lat": 30.9753,  "lng": 33.7959,  "city": "Arish"},
    "Galala University":                         {"lat": 29.4938,  "lng": 32.1197,  "city": "Ain Sokhna"},

    # ── New cities ────────────────────────────────────────────────
    "Zewail City of Science and Technology":     {"lat": 29.9338,  "lng": 30.9323,  "city": "6th of October"},
    "New Mansoura University":                   {"lat": 31.5173,  "lng": 32.0256,  "city": "New Mansoura"},
}


def get_university_coords(name: str) -> dict | None:
    """
    Case-insensitive lookup.
    Returns {"lat": float, "lng": float, "city": str} or None.
    Falls back to partial match if exact match not found.
    """
    name_lower = name.strip().lower()
    for uni_name, coords in EGYPTIAN_UNIVERSITIES.items():
        if uni_name.lower() == name_lower:
            return coords
    for uni_name, coords in EGYPTIAN_UNIVERSITIES.items():
        if name_lower in uni_name.lower():
            return coords
    return None


def list_universities() -> list[str]:
    return sorted(EGYPTIAN_UNIVERSITIES.keys())
```
# ────────────────────────End university──────────────────────────────────────



# ────────────────────────Start Signals────────────────────────────────────
```


```
# ────────────────────────End Signals──────────────────────────────────────





# ────────────────────────Start Apps────────────────────────────────────
```


```
# ────────────────────────End Apps──────────────────────────────────────






# ────────────────────────Start Model────────────────────────────────────

```
"""
services/models.py

Cache layer for Google Places API results.
Rows are refreshed after CACHE_TTL_HOURS (set in views.py).
"""

from django.db import models


class NearbyPlace(models.Model):

    PLACE_TYPE_CHOICES = [
        ("supermarket",   "Supermarket"),
        ("pharmacy",      "Pharmacy"),
        ("restaurant",    "Restaurant"),
        ("cafe",          "Café"),
        ("gym",           "Gym"),
        ("hospital",      "Hospital"),
        ("bank",          "Bank"),
        ("atm",           "ATM"),
        ("bus_station",   "Bus Station"),
        ("metro_station", "Metro Station"),
        ("mosque",        "Mosque"),
        ("library",       "Library"),
        ("laundry",       "Laundry"),
        ("other",         "Other"),
    ]

    # ── Query context (cache bucket) ──────────────────────────
    query_lat  = models.DecimalField(max_digits=9, decimal_places=6)
    query_lng  = models.DecimalField(max_digits=9, decimal_places=6)
    place_type = models.CharField(max_length=30, choices=PLACE_TYPE_CHOICES)
    radius_m   = models.PositiveIntegerField(default=1500)

    # ── Place details ─────────────────────────────────────────
    external_id = models.CharField(max_length=255, blank=True)  # Google place_id
    name        = models.CharField(max_length=255)
    address     = models.CharField(max_length=500, blank=True)
    latitude    = models.DecimalField(max_digits=9, decimal_places=6)
    longitude   = models.DecimalField(max_digits=9, decimal_places=6)
    distance_m  = models.PositiveIntegerField(default=0)
    rating      = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    open_now    = models.BooleanField(null=True, blank=True)

    cached_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["distance_m"]
        indexes  = [
            models.Index(fields=["query_lat", "query_lng", "place_type"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.place_type}) — {self.distance_m}m"
```

# ────────────────────────End Model──────────────────────────────────────

