"""
Notifications app services.
Single entry point for creating notifications.

Import this function in any signal or view that needs to fire a notification:

    from notifications.services import push_notification
"""

from notifications.models import Notification


def push_notification(recipient, notification_type, title, message, actor=None, data=None):
    """
    Create and persist a single notification.

    Args:
        recipient         (Users)  : the user who will see this in their bell feed
        notification_type (str)   : one of Notification.TYPE_CHOICES keys
        title             (str)   : short heading shown in the notification card
        message           (str)   : one-sentence body text
        actor             (Users) : user who caused the event (None for system notices)
        data              (dict)  : optional extra payload for frontend deep-linking

    Returns:
        Notification instance
    """
    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        notification_type=notification_type,
        title=title,
        message=message,
        data=data or {},
    )
