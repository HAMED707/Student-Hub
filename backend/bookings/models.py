"""
booking models 
    -handel all room booking BTW student and landloard

"""
from django.utils import timezone
from datetime import timedelta

from django.db import models
from accounts.models import Users
from properties.models import Property


class Booking(models.Model):


    STATUS_CHOICES = [
        ("pending_payment", "Pending Payment"),
        ("deposit_paid", "Deposit Paid"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
        ("expired", "Expired"),
    ]

    # ────Parties──────────────────────────────────────────────────────────────────────────────────────────────────────────
    tenant     = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="bookings" , limit_choices_to={ "role" : "student" })
    property   = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="bookings")

    # ────Booking Details─────────────────────────────────────────────────────────────────────────────────────────────────
    status          = models.CharField(max_length=15 ,choices=STATUS_CHOICES ,default='pending_payment')
    move_in_date    = models.DateField()
    duration_months = models.PositiveIntegerField()
    message         = models.TextField(null=True , blank=True)

    # ── Financial Snapshot ───────────────────────────────────
    # Copied from property.price at booking time — never changes even if landlord later edits the listing price
    total_amount_cents   = models.PositiveIntegerField()    # full rent agreed
    deposit_amount_cents = models.PositiveIntegerField()    # what student pays now
    remaining_amount_cents = models.PositiveIntegerField()  # what's left after deposit

    # ── Expiration ───────────────────────────────────────────
    # If student doesn't pay deposit within 30 min, booking auto-expires
    expires_at = models.DateTimeField()

    # ── Timestamps ───────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    #TODO: custom validation to prevent the tenant booking the same property more than one time

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tenant.username} - {self.property.title} -({self.status})"
    
    def save(self, *args, **kwargs):
        # Auto-set expiry to 30 min from creation on first save
        if not self.pk and not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=30)
        super().save(*args, **kwargs)