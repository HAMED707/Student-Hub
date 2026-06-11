## notifications app ##


# ────────────────────────Start URL─────────────────────────────────────

```
"""Notifications API URL configuration."""

from django.urls import path
from api.notifications_api.views import (
    NotificationListView,
    MarkAllReadView,
    MarkOneReadView,
)

urlpatterns = [
    # ── Bell feed ─────────────────────────────────────────────────────────────
    path("",                    NotificationListView.as_view(), name="notifications-list"),

    # ── Mark all read ─────────────────────────────────────────────────────────
    path("read/",               MarkAllReadView.as_view(),      name="notifications-read-all"),

    # ── Mark one read ─────────────────────────────────────────────────────────
    path("<int:notification_id>/read/", MarkOneReadView.as_view(), name="notifications-read-one"),
]

        
```

# ────────────────────────End URL───────────────────────────────────────



# ────────────────────────Start Serializer──────────────────────────────

```
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

```

# ────────────────────────End Serializer────────────────────────────────




# ────────────────────────Start View────────────────────────────────────

```
"""
Notifications API views.

Views:
    - NotificationListView   → GET  /api/notifications/         ← bell feed
    - MarkAllReadView        → POST /api/notifications/read/    ← mark all as read
    - MarkOneReadView        → PATCH /api/notifications/<id>/read/ ← mark one as read
"""

from rest_framework.views    import APIView
from rest_framework.response import Response
from rest_framework          import status
from rest_framework.permissions import IsAuthenticated

from notifications.models import Notification
from api.notifications_api.serializers import NotificationSerializer


class NotificationListView(APIView):
    """
    GET /api/notifications/
    Returns the requesting user's full notification feed, newest first.
    Also returns unread_count so the bell badge renders without parsing the list.

    Optional query param: ?unread=true → returns only unread notifications.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(recipient=request.user)
        unread_count = qs.filter(is_read=False).count()

        if request.query_params.get("unread") == "true":
            qs = qs.filter(is_read=False)

        serializer = NotificationSerializer(qs, many=True, context={"request": request})
        return Response(
            {
                "unread_count":    unread_count,
                "notifications":   serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class MarkAllReadView(APIView):
    """
    POST /api/notifications/read/
    Bulk-marks every unread notification for the requesting user as read.
    Body: (none required)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = (
            Notification.objects
            .filter(recipient=request.user, is_read=False)
            .update(is_read=True)
        )
        return Response(
            {"marked_read": updated},
            status=status.HTTP_200_OK,
        )


class MarkOneReadView(APIView):
    """
    PATCH /api/notifications/<id>/read/
    Marks a single notification as read.
    Returns 404 if the notification doesn't belong to the requesting user.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=request.user,
            )
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.save(update_fields=["is_read"])

        return Response(
            NotificationSerializer(notification, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

```

# ────────────────────────End View──────────────────────────────────────



# ────────────────────────Start Services────────────────────────────────────
```
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

```
# ────────────────────────End Services────────────────────────────────────


# ────────────────────────Start Signals────────────────────────────────────
```

"""
notifications/signals.py
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from accounts.models  import Users
from bookings.models  import Booking
from reviews.models   import Review
from messaging.models import Message

from notifications.services import push_notification


def _broadcast(notification):
    """
    After saving a notification to DB, push it live to the user's
    personal WebSocket group: notifications_<user_id>
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    async_to_sync(channel_layer.group_send)(
        f"notifications_{notification.recipient.id}",
        {
            "type":              "notify",           # maps to NotificationConsumer.notify()
            "id":                notification.id,
            "notification_type": notification.notification_type,
            "title":             notification.title,
            "message":           notification.message,
            "data":              notification.data,
            "is_read":           notification.is_read,
            "created_at":        str(notification.created_at),
        },
    )


# ── Accounts: welcome ─────────────────────────────────────────────────────────

@receiver(post_save, sender=Users)
def welcome_notification(sender, instance, created, **kwargs):
    if not created:
        return
    n = push_notification(
        recipient=instance,
        notification_type="welcome",
        title="Welcome to StudentHub! 🎉",
        message="Your account is ready. Start exploring rooms and finding roommates.",
    )
    _broadcast(n)


# ── Bookings ──────────────────────────────────────────────────────────────────

@receiver(post_save, sender=Booking)
def booking_notification(sender, instance, created, **kwargs):
    property_title = instance.property.title

    if created:
        n = push_notification(
            recipient=instance.property.landlord,          # ← was .owner (bug fixed)
            actor=instance.tenant,
            notification_type="booking_request",
            title="New Booking Request",
            message=f"{instance.tenant.username} wants to book '{property_title}'.",
            data={
                "booking_id":     instance.id,
                "property_id":    instance.property.id,
                "property_title": property_title,
            },
        )
        _broadcast(n)
        return

    STATUS_MESSAGES = {
        "deposit_paid": ("Deposit Received 💰",   f"Deposit paid for '{property_title}'. Please confirm the booking."),
        "confirmed":    ("Booking Confirmed ✅",   f"Your booking for '{property_title}' has been confirmed."),
        "completed":    ("Stay Completed 🏁",      f"Your stay at '{property_title}' has been marked as completed."),
        "cancelled":    ("Booking Cancelled",      f"Your booking for '{property_title}' has been cancelled."),
    }

    if instance.status not in STATUS_MESSAGES:
        return

    title, message = STATUS_MESSAGES[instance.status]

    # deposit_paid → landlord needs to act; everything else → tenant is informed
    recipient = (
        instance.property.landlord
        if instance.status == "deposit_paid"
        else instance.tenant
    )

    n = push_notification(
        recipient=recipient,
        actor=instance.property.landlord,
        notification_type="booking_update",
        title=title,
        message=message,
        data={
            "booking_id":     instance.id,
            "property_id":    instance.property.id,
            "property_title": property_title,
            "new_status":     instance.status,
        },
    )
    _broadcast(n)


# ── Reviews ───────────────────────────────────────────────────────────────────

@receiver(post_save, sender=Review)
def review_notification(sender, instance, created, **kwargs):
    if not created:
        return

    if instance.property:
        recipient = instance.property.landlord          # ← was .owner (bug fixed)
        subject   = f"your property '{instance.property.title}'"
        data      = {"property_id": instance.property.id}
    elif instance.reviewed_user:
        recipient = instance.reviewed_user
        subject   = "your profile"
        data      = {"reviewer_id": instance.reviewer.id}
    else:
        return

    n = push_notification(
        recipient=recipient,
        actor=instance.reviewer,
        notification_type="new_review",
        title="New Review Posted ⭐",
        message=f"{instance.reviewer.username} left a {instance.rating}-star review on {subject}.",
        data=data,
    )
    _broadcast(n)


# ── Messaging ─────────────────────────────────────────────────────────────────

@receiver(post_save, sender=Message)
def message_notification(sender, instance, created, **kwargs):
    if not created:
        return

    # ← was instance.conversation.participants (bug fixed — use initiator/receiver)
    conv = instance.conversation
    recipients = [conv.initiator, conv.receiver]

    for user in recipients:
        if user == instance.sender:
            continue
        n = push_notification(
            recipient=user,
            actor=instance.sender,
            notification_type="new_message",
            title="New Message 💬",
            message=f"{instance.sender.username} sent you a message.",
            data={
                "conversation_id": conv.id,
                "message_id":      instance.id,
            },
        )
        _broadcast(n)

```
# ────────────────────────End Signals──────────────────────────────────────





# ────────────────────────Start Apps────────────────────────────────────
```

"""Notifications app config — wires signals on startup."""

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notifications"

    def ready(self):
        import notifications.signals  # noqa: F401 — registers all signal handlers
```
# ────────────────────────End Apps──────────────────────────────────────






# ────────────────────────Start Model────────────────────────────────────

```
"""
Notifications app models.
Stores the bell icon feed for every user.

Models:
    - Notification → a single notification item for one recipient
"""

from django.db import models
from accounts.models import Users


class Notification(models.Model):
    """
    One notification entry in a user's bell feed.

    actor   → who triggered it (e.g. the student who sent a roommate request)
    target  → always the person receiving the notification
    type    → determines the icon, copy, and deep-link the frontend renders
    data    → optional JSON payload for dynamic content (e.g. property title, booking id)
    """

    TYPE_CHOICES = [
        ("welcome",          "Welcome"),
        ("booking_request",  "Booking Request"),
        ("booking_update",   "Booking Update"),
        ("roommate_request", "Roommate Request"),
        ("roommate_update",  "Roommate Update"),
        ("new_message",      "New Message"),
        ("new_review",       "New Review"),
        ("rating_update",    "Rating Update"),
        ("payment",          "Payment"),
        ("system",           "System"),
    ]

    # ── Recipients & actors ───────────────────────────────────────────────────
    recipient = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        Users,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_notifications",
        # NULL for system / welcome notifications that have no actor
    )

    # ── Content ───────────────────────────────────────────────────────────────
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title   = models.CharField(max_length=255)
    message = models.TextField()

    # Optional JSON bag: e.g. {"booking_id": 7, "property_title": "Studio in Maadi"}
    data = models.JSONField(default=dict, blank=True)

    # ── State ─────────────────────────────────────────────────────────────────
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]  # newest first in every queryset

    def __str__(self):
        return f"[{self.notification_type}] → {self.recipient.username}: {self.title}"
```

# ────────────────────────End Model──────────────────────────────────────

