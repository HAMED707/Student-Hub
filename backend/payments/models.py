"""
payments/models.py

Replaces the Paymob-based Payment model entirely. Two models now, on
purpose, because collection and distribution are different events with
different failure modes and different timing:

    Payment → student pays the platform (Stripe Checkout)
    Payout  → platform transfers to the landlord's connected account,
              triggered by a QR check-in scan, never by the webhook
"""

from django.db import models
from bookings.models import Booking


class Payment(models.Model):
    """One Stripe Checkout payment from a student for a booking."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="payments")

    stripe_checkout_session_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)

    amount_cents = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    raw_webhook_event = models.JSONField(default=dict, blank=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment for {self.booking} — {self.status}"


class Payout(models.Model):
    """
    The platform-to-landlord transfer, triggered exactly once per booking
    by a successful QR check-in scan. One-to-one with Booking because a
    booking can only ever be paid out once — that's the whole point of
    Booking.payout_done.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        DONE = "done", "Done"
        FAILED = "failed", "Failed"

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="payout")

    stripe_transfer_id = models.CharField(max_length=255, blank=True, null=True)
    commission_amount_cents = models.PositiveIntegerField()
    landlord_amount_cents = models.PositiveIntegerField()

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    failure_reason = models.TextField(blank=True, null=True)

    triggered_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payout for {self.booking} — {self.status}"
