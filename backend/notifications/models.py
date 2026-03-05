"""
Notifications app models.
Stores the bell icon feed for every user.

Models:
    - Notification → a single notification item for one recipient
"""

from django.db import models
from accounts.models import Users


class Notification(models.Model):
    """
    One notification entry in a user's bell feed.

    actor   → who triggered it (e.g. the student who sent a roommate request)
    target  → always the person receiving the notification
    type    → determines the icon, copy, and deep-link the frontend renders
    data    → optional JSON payload for dynamic content (e.g. property title, booking id)
    """

    TYPE_CHOICES = [
        ("welcome",          "Welcome"),
        ("booking_request",  "Booking Request"),
        ("booking_update",   "Booking Update"),
        ("roommate_request", "Roommate Request"),
        ("roommate_update",  "Roommate Update"),
        ("new_message",      "New Message"),
        ("new_review",       "New Review"),
        ("rating_update",    "Rating Update"),
        ("payment",          "Payment"),
        ("system",           "System"),
    ]

    # ── Recipients & actors ───────────────────────────────────────────────────
    recipient = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        Users,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_notifications",
        # NULL for system / welcome notifications that have no actor
    )

    # ── Content ───────────────────────────────────────────────────────────────
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title   = models.CharField(max_length=255)
    message = models.TextField()

    # Optional JSON bag: e.g. {"booking_id": 7, "property_title": "Studio in Maadi"}
    data = models.JSONField(default=dict, blank=True)

    # ── State ─────────────────────────────────────────────────────────────────
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]  # newest first in every queryset

    def __str__(self):
        return f"[{self.notification_type}] → {self.recipient.username}: {self.title}"