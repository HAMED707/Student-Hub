"""
Payments app signals.
Releases held funds to the landlord when a booking is marked completed.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from bookings.models import Booking
from django.db.models import F

@receiver(post_save, sender=Booking)
def release_payment_on_completion(sender, instance, **kwargs):
    """
    When a booking moves to 'completed', find the held Payment and:
        1. Mark it as 'released'
        2. Credit landlord's available_balance
        3. Increment landlord's total_income
    """
    if instance.status != "completed":
        return

    # Import here to avoid circular import
    from payments.models import Payment

    payment = Payment.objects.filter(
        booking=instance,
        status="held",
        is_success=True,
    ).first()

    if not payment:
        return

    payment.status = "released"
    payment.save(update_fields=["status", "updated_at"])

    # Credit the landlord using F() to avoid race conditions
    landlord_profile = instance.property.owner.landlord_profile
    type(landlord_profile).objects.filter(pk=landlord_profile.pk).update(
        available_balance=F("available_balance") + payment.amount,
        total_income=F("total_income") + payment.amount,
    )