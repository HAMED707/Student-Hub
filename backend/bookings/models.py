"""
Booking models — Stripe Connect marketplace flow.

Status flow: pending_payment → paid → finished
             pending_payment → cancelled
             pending_payment → expired (auto, via is_expired property)

qr_token: UUID embedded in the check-in QR code; looked up server-side at scan time.
payout_done: double-payout guard; always checked inside select_for_update().
"""
import uuid

from django.utils import timezone
from datetime import timedelta
import builtins

from django.db import models
from accounts.models import Users
from properties.models import Property


class Booking(models.Model):

    STATUS_CHOICES = [
        ("pending_payment", "Pending Payment"),
        ("paid", "Paid"),
        ("finished", "Finished"),
        ("cancelled", "Cancelled"),
        ("expired", "Expired"),
    ]

    BOOKING_UNIT_CHOICES = [
        ("whole", "Whole Property"),
        ("room", "By Room"),
        ("bed", "By Bed"),
    ]

    # ── Parties ──────────────────────────────────────────────
    tenant   = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="bookings", limit_choices_to={"role": "student"})
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="bookings")

    # ── Booking Details ───────────────────────────────────────
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending_payment")
    booking_unit    = models.CharField(max_length=10, choices=BOOKING_UNIT_CHOICES, default="whole")
    move_in_date    = models.DateField()
    duration_months = models.PositiveIntegerField()
    message         = models.TextField(null=True, blank=True)

    # ── Financial Snapshot ────────────────────────────────────
    # total_amount_cents  = deposit only (20% of unit price).
    # remaining_amount_cents = the 80% balance, paid later if landlord requests.
    # Copied from property price at booking time; never changes even if
    # the landlord later edits the listing.
    total_amount_cents      = models.PositiveIntegerField()
    remaining_amount_cents  = models.PositiveIntegerField(default=0)

    # Set to True by the landlord from the QR-scan success screen when they
    # want the student to pay the remaining 80% on the platform.
    remaining_payment_requested = models.BooleanField(default=False)
    remaining_paid              = models.BooleanField(default=False)

    # ── Check-in / payout ─────────────────────────────────────
    qr_token    = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    payout_done = models.BooleanField(default=False)

    # ── Expiration ────────────────────────────────────────────
    expires_at = models.DateTimeField()

    # ── Timestamps ────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tenant.username} - {self.property.title} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.pk and not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=30)
        super().save(*args, **kwargs)

    @builtins.property
    def is_expired(self):
        return self.status == "pending_payment" and timezone.now() > self.expires_at
