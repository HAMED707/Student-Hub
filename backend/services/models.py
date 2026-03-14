"""
services/models.py

Optional cache layer for nearby place lookups.
Results from Google Places / Overpass are stored here to avoid
hammering the external API on repeated identical queries.
"""

from django.db import models


class NearbyPlace(models.Model):
    """
    Cached result from an external map API call.

    A row represents one POI (point of interest) returned for a
    specific (latitude, longitude, place_type) query.
    Rows are refreshed automatically when they are older than
    CACHE_TTL_HOURS (configured in views.py).
    """

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

    # ── Location context (what query produced this result) ────────
    query_lat   = models.DecimalField(max_digits=9, decimal_places=6)
    query_lng   = models.DecimalField(max_digits=9, decimal_places=6)
    place_type  = models.CharField(max_length=30, choices=PLACE_TYPE_CHOICES)
    radius_m    = models.PositiveIntegerField(default=1500)

    # ── Place details ─────────────────────────────────────────────
    external_id = models.CharField(max_length=255, blank=True)   # Google place_id / OSM node id
    name        = models.CharField(max_length=255)
    address     = models.CharField(max_length=500, blank=True)
    latitude    = models.DecimalField(max_digits=9, decimal_places=6)
    longitude   = models.DecimalField(max_digits=9, decimal_places=6)
    distance_m  = models.PositiveIntegerField(default=0)          # metres from query point
    rating      = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    open_now    = models.BooleanField(null=True, blank=True)

    cached_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["distance_m"]
        indexes  = [
            models.Index(fields=["query_lat", "query_lng", "place_type"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.place_type}) — {self.distance_m}m"