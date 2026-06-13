"""
Notifications app services.
"""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from api.notifications_api.serializers import NotificationSerializer
from notifications.models import Notification


def push_notification(recipient, notification_type, title, message, actor=None, data=None, broadcast=False):
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
    notification = Notification.objects.create(
        recipient=recipient,
        actor=actor,
        notification_type=notification_type,
        title=title,
        message=message,
        data=data or {},
    )
    if broadcast:
        channel_layer = get_channel_layer()
        if channel_layer is not None:
            async_to_sync(channel_layer.group_send)(
                f"notifications_{notification.recipient.id}",
                {
                    "type": "notify",
                    **NotificationSerializer(notification).data,
                },
            )
    return notification
