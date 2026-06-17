"""
Properties app models.
Handles property listings and their images.

Models:
    - Property      → main listing created by landlords
    - PropertyImage → multiple photos per property
"""


from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import Users

# ──────────────────────────────────────────────────────────────────────────────────────────


class City(models.Model):
    """
    Hardcoded reference list of cities. Seeded via a data migration from
    constants.CITIES — the options live in the DB, not just a Python list.
    """

    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Transport(models.Model):
    """
    Hardcoded reference list of transport modes (e.g. Walk, Metro, Bus).
    Seeded via a data migration from constants.TRANSPORT_OPTIONS.
    """

    name = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class University(models.Model):
    """
    Hardcoded reference list of universities, scoped to a city.
    Seeded via a data migration from constants.UNIVERSITIES_BY_CITY — the
    options landlords can pick from live in the DB, not just a Python list.
    """

    name = models.CharField(max_length=255, unique=True)
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="universities")

    class Meta:
        ordering = ["city__name", "name"]

    def __str__(self):
        return f"{self.name} ({self.city})"


# ──────────────────────────────────────────────────────────────────────────────────────────


class Property(models.Model):
    """
    Main listing model. Created by landlords, browsed by students.

    Shown on: Home page cards, FindRoom page, Property detail page,
              Owner 'My Properties' dashboard.
    """

    # ── Choices ──────────────────────────────────────────────
    UNIT_TYPE_CHOICES = [
        ("apartment", "Apartment"),
        ("room", "Room"),
        ("bed", "Bed"),
    ]
    RENTAL_MODE_CHOICES = [
        ("whole_apartment", "Whole Apartment"),
        ("by_unit", "By Room/Bed"),
    ]
    STATUS_CHOICES = [
        ("available", "Available"),
        ("rented", "Rented"),
        ("unavailable", "Unavailable"),
        ("reserved", "Reserved"),
    ]
    GENDER_CHOICES = [
        ("male", "Males Only"),
        ("female", "Females Only"),
    ]

    # ── Ownership ────────────────────────────────────────────
    # Only landlords can own properties — enforced at the API layer
    landlord = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="landlord_properties")

    # ── Basic Info ───────────────────────────────────────────
    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    unit_type   = models.CharField(max_length=20, choices=UNIT_TYPE_CHOICES)

    # ── Pricing ──────────────────────────────────────────────
    # rental_mode only applies when unit_type == "apartment"
    rental_mode = models.CharField(max_length=20, choices=RENTAL_MODE_CHOICES, blank=True, null=True)

    # price: whole-apartment price — required for unit_type=apartment + rental_mode=whole_apartment
    price      = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    # room_price: required for unit_type=room, or apartment + by_unit
    room_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    # bed_price: required for unit_type=bed, or apartment + by_unit
    bed_price  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])

    # ── Location ─────────────────────────────────────────────
    city      = models.ForeignKey(City, on_delete=models.PROTECT, related_name="properties")
    district  = models.CharField(max_length=100, blank=True, null=True)
    address   = models.TextField(blank=True, null=True)
    latitude  = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    # ── University Proximity ─────────────────────────────────
    # Used in FindRoom university tab filter. Options come from the University
    # table (seeded, city-scoped) — at least one required, validated in clean().
    nearby_universities     = models.ManyToManyField(University, blank=True, related_name="properties")
    distance_to_university  = models.CharField(max_length=50, blank=True, null=True)
    # Multi-select from the hardcoded Transport reference table.
    transport_types         = models.ManyToManyField(Transport, blank=True, related_name="properties")

    # ── Room Details ─────────────────────────────────────────
    num_rooms     = models.IntegerField(default=1)
    num_beds      = models.IntegerField(default=1)
    num_bathrooms = models.IntegerField(default=1)
    floor         = models.IntegerField(blank=True, null=True)
    area_sqm          = models.IntegerField(blank=True, null=True)  
    gender_preference = models.CharField(max_length=10, choices=GENDER_CHOICES)

    # ── Amenities & Bills ────────────────────────────────────
    # Static hardcoded options — no longer a free-form JSON list
    has_internet    = models.BooleanField(default=False)
    has_ac          = models.BooleanField(default=False)
    has_water       = models.BooleanField(default=False)
    has_electricity = models.BooleanField(default=False)
    has_gas         = models.BooleanField(default=False)

    # ── Stay Duration ────────────────────────────────────────
    # Matches "Length of Stay" filter on FindRoom page
    min_stay_months = models.IntegerField(default=1)
    max_stay_months = models.IntegerField(blank=True, null=True)

    # ── Status & Visibility ──────────────────────────────────
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    available_from = models.DateField(null=True, blank=True, help_text="Date property becomes available. Null = available now.")
    is_featured    = models.BooleanField(default=False)  # shown in "Featured Properties" section

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

    def clean(self):
        """
        Cross-field rules tying unit_type/rental_mode to which price fields
        are required. nearby_universities/transport_types (M2M) can't be
        checked here on an unsaved instance — that's validated in the
        serializer instead.
        """
        errors = {}

        if self.unit_type == "apartment":
            if not self.rental_mode:
                errors["rental_mode"] = "Required when unit_type is apartment."
            elif self.rental_mode == "whole_apartment":
                if not self.price:
                    errors["price"] = "Required when renting the whole apartment."
                if self.room_price or self.bed_price:
                    errors["room_price"] = "room_price/bed_price must be empty in whole_apartment mode."
            elif self.rental_mode == "by_unit":
                if not self.room_price:
                    errors["room_price"] = "Required when renting by room/bed."
                if not self.bed_price:
                    errors["bed_price"] = "Required when renting by room/bed."
                if self.price:
                    errors["price"] = "price must be empty in by_unit mode."
        elif self.unit_type == "room":
            if self.rental_mode:
                errors["rental_mode"] = "Not applicable for unit_type room."
            if not self.room_price:
                errors["room_price"] = "Required for unit_type room."
            if self.price or self.bed_price:
                errors["price"] = "Only room_price applies to unit_type room."
        elif self.unit_type == "bed":
            if self.rental_mode:
                errors["rental_mode"] = "Not applicable for unit_type bed."
            if not self.bed_price:
                errors["bed_price"] = "Required for unit_type bed."
            if self.price or self.room_price:
                errors["price"] = "Only bed_price applies to unit_type bed."

        if errors:
            raise ValidationError(errors)

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