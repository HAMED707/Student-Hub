"""
Bookings app signals.
Keeps property status in sync when a booking changes status.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from bookings.models import Booking


@receiver(post_save, sender=Booking)
def sync_property_status(sender, instance, **kwargs):
    """
    Automatically updates the property's status based on booking outcome.

    - approved  → property becomes 'rented'   (no longer searchable)
    - cancelled → property reverts to 'available' (back in listings)
    - rejected  → property reverts to 'available'
    """
    prop = instance.property

    if instance.status == "approved":
        if prop.status != "rented":
            prop.status = "rented"
            prop.save(update_fields=["status"])

    elif instance.status in ("cancelled", "rejected"):
        if prop.status == "rented":
            prop.status = "available"
            prop.save(update_fields=["status"])
