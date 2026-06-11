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