"""
Signals for the community app.

Keeps Group.member_count in sync whenever a GroupMembership is
created or deleted, avoiding expensive COUNT(*) queries on every
group list request.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from community.models import GroupMembership


@receiver(post_save, sender=GroupMembership)
def increment_member_count(sender, instance, created, **kwargs):
    """Bump member_count when a new membership row is created."""
    if created:
        # Use F() expression to avoid race conditions
        from django.db.models import F
        instance.group.__class__.objects.filter(pk=instance.group_id).update(
            member_count=F("member_count") + 1
        )


@receiver(post_delete, sender=GroupMembership)
def decrement_member_count(sender, instance, **kwargs):
    """Lower member_count when a membership is removed."""
    from django.db.models import F
    instance.group.__class__.objects.filter(pk=instance.group_id).update(
        member_count=F("member_count") - 1
    )
