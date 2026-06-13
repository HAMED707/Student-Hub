"""
Roommates app signals.
Auto-creates a RoommateProfile when a new student registers.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import Users
from roommates.models import RoommateProfile


@receiver(post_save, sender=Users)
def create_roommate_profile(sender, instance, created, **kwargs):
    """Keeps the roommate profile in sync for student-role users."""
    if instance.role == "student":
        RoommateProfile.objects.get_or_create(user=instance)
