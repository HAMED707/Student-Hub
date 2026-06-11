"""
properties/signals.py

Auto-geocodes a property's address to lat/lng whenever:
  - A new property is created with an address
  - An existing property's address is changed

Uses Google Geocoding API via services.google_maps.geocode_address().
Fails silently — if geocoding fails the property is still saved,
just without coordinates. The landlord can retry by re-saving.
"""

import logging
from django.db.models.signals import pre_save
from django.dispatch import receiver
from properties.models import Property
from services.google_maps import geocode_address, GoogleMapsError

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Property)
def auto_geocode_address(sender, instance, **kwargs):
    """
    Fires before every Property save.

    Triggers geocoding when:
        1. New property (no pk yet) and has an address
        2. Existing property and address has changed

    Skips geocoding when:
        - No address provided
        - Address hasn't changed
        - lat/lng were manually provided by the landlord (we respect manual coords)
    """
    if not instance.address:
        return

    # Check if address changed (skip for new instances — they have no pk yet)
    address_changed = False
    if instance.pk:
        try:
            old = Property.objects.get(pk=instance.pk)
            address_changed = old.address != instance.address
        except Property.DoesNotExist:
            address_changed = True
    else:
        # New property
        address_changed = True

    if not address_changed:
        return

    # If landlord manually supplied lat/lng alongside a new address, respect them
    if instance.pk is None and instance.latitude and instance.longitude:
        return

    try:
        result = geocode_address(instance.address)
        instance.latitude  = result["lat"]
        instance.longitude = result["lng"]
        logger.info(
            "Geocoded property '%s': lat=%s, lng=%s",
            instance.title,
            result["lat"],
            result["lng"],
        )
    except GoogleMapsError as exc:
        # Log but don't block the save
        logger.warning(
            "Geocoding failed for property '%s' (address: %s): %s",
            instance.title,
            instance.address,
            exc,
        )