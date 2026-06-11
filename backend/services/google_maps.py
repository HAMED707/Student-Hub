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