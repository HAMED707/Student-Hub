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
    owner = models.ForeignKey(
        Users, on_delete=models.CASCADE, related_name="properties"
    )

    # ── Basic Info ───────────────────────────────────────────
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES)

    # ── Pricing ──────────────────────────────────────────────
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )  # EGP per month

    # ── Location ─────────────────────────────────────────────
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )  # for map pin
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )  # for map pin

    # ── University Proximity ─────────────────────────────────
    # Used in FindRoom university tab filter
    nearby_university = models.CharField(max_length=255, blank=True, null=True)
    distance_to_university = models.CharField(
        max_length=50, blank=True, null=True
    ) 
    transport_type = models.CharField(
        max_length=20, choices=TRANSPORT_CHOICES, blank=True, null=True
    )

    # ── Room Details ─────────────────────────────────────────
    num_rooms = models.IntegerField(default=1)
    num_beds = models.IntegerField(default=1)  
    num_bathrooms = models.IntegerField(default=1)
    num_roommates = models.IntegerField(default=0)  
    floor = models.IntegerField(blank=True, null=True)
    area_sqm = models.IntegerField(blank=True, null=True)  
    gender_preference = models.CharField(
        max_length=10, choices=GENDER_CHOICES, default="mixed"
    )

    # ── Amenities ────────────────────────────────────────────
    # Stored as JSON list e.g. ["WiFi", "AC", "Washing Machine", "Parking"]
    amenities = models.JSONField(default=list, blank=True)

    # ── Stay Duration ────────────────────────────────────────
    # Matches "Length of Stay" filter on FindRoom page
    min_stay_months = models.IntegerField(default=1)
    max_stay_months = models.IntegerField(blank=True, null=True)

    # ── Status & Visibility ──────────────────────────────────
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
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
        return f"{self.title} — {self.owner.username}"

    # ── Computed Properties ──────────────────────────────────
    @property
    def average_rating(self):
        """Average star rating from all reviews on this property. """
        reviews = self.reviews.all() # NOTE: not connected yet
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

    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="property_images/")
    is_cover = models.BooleanField(default=False)  # main thumbnail shown on cards
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_cover", "uploaded_at"]  

    def __str__(self):
        return f"Image for {self.property.title} ({'Cover' if self.is_cover else 'Gallery'})"