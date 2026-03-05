"""
Bookings app models.
Handles all room booking requests between students and landlords.

Models:
    - Booking → a request from a student to rent a specific property
"""

from django.db import models
from accounts.models import Users
from properties.models import Property


class Booking(models.Model):
    """
    Represents a booking request made by a student for a property.

    Status flow:
        pending → approved → completed
        pending → rejected
        pending/approved → cancelled (by student)
    """

    STATUS_CHOICES = [
        ("pending",   "Pending"),
        ("approved",  "Approved"),
        ("rejected",  "Rejected"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
    ]

    # ── Parties ───────────────────────────────────────────────────────────────
    tenant   = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        related_name="bookings",
        limit_choices_to={"role": "student"},   # only students can be tenants
    )
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="bookings",
    )

    # ── Booking Details ───────────────────────────────────────────────────────
    status          = models.CharField(max_length=15, choices=STATUS_CHOICES, default="pending")
    move_in_date    = models.DateField()
    duration_months = models.PositiveIntegerField()  # how many months the student wants to stay

    # ── Optional Message ──────────────────────────────────────────────────────
    # Student can write a short intro message when sending the request
    message = models.TextField(blank=True, null=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Prevent duplicate active bookings for the same tenant + property
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tenant.username} → {self.property.title} ({self.status})"