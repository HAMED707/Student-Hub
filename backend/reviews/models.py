"""
Reviews app models.
Handles star ratings and written reviews for both properties and users.

Models:
    - Review → a rating left on a property OR on another user
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import Users
from properties.models import Property



class Review(models.Model):
    """
    Unified review model for both property reviews and user reviews.

    A review targets EITHER a property or a user — never both at once.
    The target type is determined by which FK is set (property vs reviewed_user).

    reviewer_role tells us the relationship between the reviewer and the subject:
        - property reviews: reviewer is always a student (past tenant)
        - user reviews:     landlord ↔ student, or student ↔ student (roommate, classmate, neighbor)
    """

    REVIEWER_ROLE_CHOICES = [
        ("landlord",  "Landlord"),
        ("roommate",  "Roommate"),
        ("classmate", "Classmate"),
        ("neighbor",  "Neighbor"),
    ]

    # ── Who is reviewing ──────────────────────────────────────────────────────
    reviewer = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        related_name="reviews_given",
    )
    reviewer_role = models.CharField(max_length=20, choices=REVIEWER_ROLE_CHOICES)

    # ── What is being reviewed (exactly one must be set) ──────────────────────
    # Property review — student reviews a property they stayed at
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="reviews",
        blank=True,
        null=True,
    )

    # User review — one user reviews another (landlord reviews tenant, or vice versa)
    reviewed_user = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        related_name="reviews_received",
        blank=True,
        null=True,
    )

    # ── Review Content ────────────────────────────────────────────────────────
    rating  = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)

    # ── Timestamp ─────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        # One review per reviewer per target
        # NOTE: Django doesn't support conditional unique_together,
        # so uniqueness per target type is enforced in the serializer.
        verbose_name_plural = "Reviews"

    def __str__(self):
        target = self.property or self.reviewed_user
        return f"{self.reviewer.username} → {target} ({self.rating}★)"
