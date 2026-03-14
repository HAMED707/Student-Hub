"""
services/overpass.py

Fetches nearby POIs from the Overpass API (OpenStreetMap).
100 % free — no API key required.

Overpass QL docs: https://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
"""

import math
import logging
import requests

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
TIMEOUT_SECONDS = 10

# Maps our internal place_type to OSM amenity/shop/etc. tags
OSM_TAG_MAP: dict[str, list[str]] = {
    "supermarket":   ['shop="supermarket"', 'shop="grocery"', 'shop="convenience"'],
    "pharmacy":      ['amenity="pharmacy"'],
    "restaurant":    ['amenity="restaurant"'],
    "cafe":          ['amenity="cafe"'],
    "gym":           ['leisure="fitness_centre"', 'amenity="gym"'],
    "hospital":      ['amenity="hospital"', 'amenity="clinic"'],
    "bank":          ['amenity="bank"'],
    "atm":           ['amenity="atm"'],
    "bus_station":   ['amenity="bus_station"', 'highway="bus_stop"'],
    "metro_station": ['station="subway"', 'railway="station"'],
    "mosque":        ['amenity="place_of_worship"[religion="muslim"]'],
    "library":       ['amenity="library"'],
    "laundry":       ['shop="laundry"', 'shop="dry_cleaning"'],
}


def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> int:
    """Returns distance in metres between two GPS coordinates."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi  = math.radians(lat2 - lat1)
    dlam  = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return int(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def fetch_nearby(lat: float, lng: float, place_type: str, radius_m: int = 1500) -> list[dict]:
    """
    Queries Overpass for amenities near (lat, lng).

    Returns a list of dicts:
        {
            "external_id": str,
            "name":        str,
            "address":     str,
            "latitude":    float,
            "longitude":   float,
            "distance_m":  int,
            "rating":      None,   # OSM has no ratings
            "open_now":    None,
        }
    Sorted by distance ascending, max 20 results.
    Returns [] on any network/parse error (caller falls back to cache).
    """
    tags = OSM_TAG_MAP.get(place_type)
    if not tags:
        return []

    # Build union of tag filters
    node_blocks = ""
    way_blocks  = ""
    for tag in tags:
        node_blocks += f'  node[{tag}](around:{radius_m},{lat},{lng});\n'
        way_blocks  += f'  way[{tag}](around:{radius_m},{lat},{lng});\n'

    query = f"""
[out:json][timeout:{TIMEOUT_SECONDS}];
(
{node_blocks}{way_blocks}
);
out center 20;
"""

    try:
        resp = requests.post(OVERPASS_URL, data={"data": query}, timeout=TIMEOUT_SECONDS + 5)
        resp.raise_for_status()
        elements = resp.json().get("elements", [])
    except Exception as exc:
        logger.warning("Overpass API error: %s", exc)
        return []

    results = []
    for el in elements:
        # Ways have a 'center'; nodes have direct lat/lng
        if el["type"] == "way":
            el_lat = el.get("center", {}).get("lat")
            el_lng = el.get("center", {}).get("lon")
        else:
            el_lat = el.get("lat")
            el_lng = el.get("lon")

        if el_lat is None or el_lng is None:
            continue

        tags_data = el.get("tags", {})
        name = tags_data.get("name") or tags_data.get("name:en") or tags_data.get("name:ar")
        if not name:
            continue  # skip unnamed places

        # Build a rough address string from available OSM tags
        addr_parts = filter(None, [
            tags_data.get("addr:street"),
            tags_data.get("addr:housenumber"),
            tags_data.get("addr:city"),
        ])
        address = ", ".join(addr_parts)

        results.append({
            "external_id": str(el.get("id", "")),
            "name":        name,
            "address":     address,
            "latitude":    el_lat,
            "longitude":   el_lng,
            "distance_m":  _haversine_m(lat, lng, el_lat, el_lng),
            "rating":      None,
            "open_now":    None,
        })

    results.sort(key=lambda x: x["distance_m"])
    return results[:20]