"""
Accounts app signals.
Auto-creates the correct profile when a new user registers.

Signals:
    - create_user_profile → fires after Users is saved, creates StudentProfile or LandlordProfile
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import Users, StudentProfile, LandlordProfile


# ──────────────────────────────────────────────────────────────────────────────────────────


@receiver(post_save, sender=Users)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Fires every time a Users object is saved.
    Only runs on creation (created=True) to avoid duplicate profiles.

    role = student  → creates StudentProfile
    role = landlord → creates LandlordProfile
    """
    if not created:
        return  # user is being updated, not created — do nothing

    if instance.role == "student":
        StudentProfile.objects.create(user=instance)

    elif instance.role == "landlord":
        LandlordProfile.objects.create(user=instance)