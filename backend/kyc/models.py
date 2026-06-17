"""
KYC app models.
Stores Persona identity verification records for landlords.

Note: this is intentionally a SEPARATE table from accounts.VerificationDocument
(the existing manual document-upload review system) and LandlordProfile.is_id_verified
(the existing manual boolean). Keeping verification data separate lets multiple
verification attempts exist over time and keeps this feature additive rather
than a rewrite of the existing manual review flow.
"""

from django.db import models
from accounts.models import Users


class LandlordVerification(models.Model):
    """One Persona inquiry attempt for a landlord."""

    STATUS_CHOICES = [
        ("NOT_STARTED", "Not Started"),
        ("CREATED", "Created"),
        ("STARTED", "Started"),
        ("PROCESSING", "Processing"),
        ("PENDING_REVIEW", "Pending Review"),
        ("APPROVED", "Approved"),
        ("FAILED", "Failed"),
        ("REJECTED", "Rejected"),
    ]

    landlord = models.ForeignKey(
        Users, on_delete=models.CASCADE, related_name="kyc_verifications"
    )

    # ── Persona identifiers ──────────────────────────────────
    persona_inquiry_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    inquiry_template_id = models.CharField(max_length=100, blank=True, null=True)

    # ── Status tracking ───────────────────────────────────────
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="NOT_STARTED")
    verification_url = models.URLField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    # ── Webhook audit trail ──────────────────────────────────
    webhook_event = models.JSONField(default=dict, blank=True)
    webhook_received_at = models.DateTimeField(blank=True, null=True)

    # ── Timestamps ───────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.landlord.username} - {self.status}"
