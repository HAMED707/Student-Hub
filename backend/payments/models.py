"""
Payments app models.
Handles rent payments from students to landlords, routed through Paymob.

Models:
    - Payment           → a single rent payment tied to a booking
    - WithdrawalRequest → landlord requests to withdraw their available_balance
"""

from django.db import models
from accounts.models import Users
from bookings.models import Booking

class Payment(models.Model):
    """
    Represents a single payment made by a student for a booking.

    Status flow:
        pending   → student initiated checkout but hasn't paid yet
        held      → Paymob confirmed the charge; money held on platform
        released  → landlord's available_balance credited (booking completed)
        refunded  → money returned to student (booking cancelled/rejected)
        failed    → Paymob reported a failed transaction
    """

    STATUS_CHOICES = [
        ("pending",  "Pending"),
        ("held",     "Held"),
        ("released", "Released"),
        ("refunded", "Refunded"),
        ("failed",   "Failed"),
    ]

    # ── Parties ──────────────────────────────────────────────
    student  = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="payments",
                                  limit_choices_to={"role": "student"})
    landlord = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="received_payments",
                                  limit_choices_to={"role": "landlord"})
    booking  = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="payments")

    # ── Amount ───────────────────────────────────────────────
    amount = models.DecimalField(max_digits=12, decimal_places=2)   # EGP
    #NOTE: Paymob works in piasters (cents). amount * 100 when calling the API.

    # ── Paymob references ────────────────────────────────────
    paymob_order_id       = models.CharField(max_length=100, blank=True, null=True)  # from step 2
    paymob_transaction_id = models.CharField(max_length=100, blank=True, null=True)  # from webhook
    payment_token         = models.TextField(blank=True, null=True)                   # short-lived, step 3

    # ── Status ───────────────────────────────────────────────
    status     = models.CharField(max_length=15, choices=STATUS_CHOICES, default="pending")
    is_success = models.BooleanField(default=False)  # mirrors Paymob's `success` field

    # ── Timestamps ───────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student.username} → {self.landlord.username} | {self.amount} EGP ({self.status})"


class WithdrawalRequest(models.Model):
    """
    Landlord requests to withdraw part or all of their available_balance.
    Processed manually (or via bank API later).
    """

    STATUS_CHOICES = [
        ("pending",   "Pending"),
        ("approved",  "Approved"),
        ("rejected",  "Rejected"),
    ]

    landlord    = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="withdrawals",
                                     limit_choices_to={"role": "landlord"})
    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    status      = models.CharField(max_length=15, choices=STATUS_CHOICES, default="pending")

    # Bank / Instapay details provided by the landlord
    account_name   = models.CharField(max_length=255, blank=True, null=True)
    account_number = models.CharField(max_length=100, blank=True, null=True)
    bank_name      = models.CharField(max_length=100, blank=True, null=True)
    notes          = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.landlord.username} withdrawal: {self.amount} EGP ({self.status})"