"""
Notifications API serializers.

Serializers:
    - NotificationSerializer → read serializer for the bell feed
"""

from rest_framework import serializers
from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Read serializer for a single notification item.
    actor_name is included so the frontend can show "Ahmed sent you a request"
    without a second profile request.
    """

    actor_name   = serializers.SerializerMethodField()
    actor_avatar = serializers.SerializerMethodField()

    class Meta:
        model  = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "data",
            "is_read",
            "actor_name",
            "actor_avatar",
            "created_at",
        ]
        read_only_fields = fields  # this serializer is read-only

    def get_actor_name(self, obj):
        """Returns the actor's full display name, or None for system notifications."""
        if obj.actor is None:
            return None
        full = f"{obj.actor.first_name or ''} {obj.actor.last_name or ''}".strip()
        return full or obj.actor.username

    def get_actor_avatar(self, obj):
        """Returns the actor's profile picture URL, or None."""
        if obj.actor is None or not obj.actor.profile_picture:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.actor.profile_picture.url)
        return obj.actor.profile_picture.url
