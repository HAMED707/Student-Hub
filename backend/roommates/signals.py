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
    """Only fires on creation and only for students."""
    if not created:
        return
    if instance.role == "student":
        RoommateProfile.objects.create(user=instance)
