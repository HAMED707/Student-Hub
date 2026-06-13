"""
Accounts app signals.
Ensures each user has the right related profile/settings records.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import Users, StudentProfile, LandlordProfile, UserSettings


# ──────────────────────────────────────────────────────────────────────────────────────────


@receiver(post_save, sender=Users)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Ensures the correct related rows exist for the user's current role.
    """
    UserSettings.objects.get_or_create(user=instance)

    if instance.role == "student":
        StudentProfile.objects.get_or_create(user=instance)

    elif instance.role == "landlord":
        LandlordProfile.objects.get_or_create(user=instance)
