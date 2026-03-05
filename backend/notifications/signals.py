"""
Notifications app signals.
Listens to events across every app and fires push_notification() for each one.

Covered events:
    accounts  → post_save on Users           : welcome notification on first register
    bookings  → post_save on Booking         : booking_request (to landlord)
                                               booking_update  (to student on status change)
    roommates → post_save on RoommateRequest : roommate_request (to receiver)
                                               roommate_update  (to sender on status change)
    reviews   → post_save on Review          : new_review (to reviewed user or property owner)
    messaging → post_save on Message         : new_message (to all other participants)
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models  import Users
from bookings.models  import Booking
from roommates.models import RoommateRequest
from reviews.models   import Review
from messaging.models import Message

from notifications.services import push_notification


# ── Accounts: welcome on register ────────────────────────────────────────────

@receiver(post_save, sender=Users)
def welcome_notification(sender, instance, created, **kwargs):
    """Fire a welcome notification exactly once when a new user is registered."""
    if not created:
        return

    push_notification(
        recipient=instance,
        notification_type="welcome",
        title="Welcome to StudentHub! ",
        message=(
            "Your account is ready. Start exploring rooms, "
            "finding roommates, and joining communities."
        ),
    )


# ── Bookings ──────────────────────────────────────────────────────────────────

@receiver(post_save, sender=Booking)
def booking_notification(sender, instance, created, **kwargs):
    """
    - New booking → notify the landlord (booking_request).
    - Status change → notify the student (booking_update).
    """
    property_title = instance.property.title

    if created:
        # Tell the landlord a student wants to book their place
        push_notification(
            recipient=instance.property.owner,
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
        return

    # Status changed — tell the student
    STATUS_MESSAGES = {
        "approved":  ("Booking Approved ✅",  f"Your booking for '{property_title}' has been approved."),
        "rejected":  ("Booking Rejected",     f"Your booking for '{property_title}' was not approved this time."),
        "completed": ("Stay Completed",       f"Your stay at '{property_title}' has been marked as completed."),
        "cancelled": ("Booking Cancelled",    f"Your booking for '{property_title}' has been cancelled."),
    }

    if instance.status in STATUS_MESSAGES:
        title, message = STATUS_MESSAGES[instance.status]
        push_notification(
            recipient=instance.tenant,
            actor=instance.property.owner,
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


# ── Roommate Requests ─────────────────────────────────────────────────────────

@receiver(post_save, sender=RoommateRequest)
def roommate_request_notification(sender, instance, created, **kwargs):
    """
    - New request → notify the receiver (roommate_request).
    - Status change → notify the original sender (roommate_update).
    """
    if created:
        push_notification(
            recipient=instance.receiver,
            actor=instance.sender,
            notification_type="roommate_request",
            title="New Roommate Request",
            message=f"{instance.sender.username} wants to connect as a roommate.",
            data={"request_id": instance.id, "sender_id": instance.sender.id},
        )
        return

    STATUS_MESSAGES = {
        "accepted":  ("Roommate Request Accepted ", f"{instance.receiver.username} accepted your roommate request."),
        "rejected":  ("Roommate Request Declined",    f"{instance.receiver.username} declined your roommate request."),
        "withdrawn": ("Request Withdrawn",            f"{instance.sender.username} withdrew their roommate request."),
    }

    if instance.status in STATUS_MESSAGES:
        title, message = STATUS_MESSAGES[instance.status]

        # Accepted/rejected → notify the original sender
        # Withdrawn → notify the receiver (they no longer need to act on it)
        notify_user = instance.sender if instance.status in ("accepted", "rejected") else instance.receiver
        push_notification(
            recipient=notify_user,
            actor=instance.sender if instance.status == "withdrawn" else instance.receiver,
            notification_type="roommate_update",
            title=title,
            message=message,
            data={"request_id": instance.id},
        )


# ── Reviews ───────────────────────────────────────────────────────────────────

@receiver(post_save, sender=Review)
def review_notification(sender, instance, created, **kwargs):
    """
    Notify whoever was reviewed.
    - Property review → notify the property owner.
    - User review     → notify the reviewed user.
    """
    if not created:
        return  # no notification on review edits

    if instance.property:
        recipient = instance.property.owner
        subject   = f"your property '{instance.property.title}'"
        data      = {"property_id": instance.property.id}
    elif instance.reviewed_user:
        recipient = instance.reviewed_user
        subject   = "your profile"
        data      = {"reviewer_id": instance.reviewer.id}
    else:
        return  # malformed review — skip

    push_notification(
        recipient=recipient,
        actor=instance.reviewer,
        notification_type="new_review",
        title="New Review Posted ⭐",
        message=f"{instance.reviewer.username} left a {instance.rating}-star review on {subject}.",
        data=data,
    )


# ── Messaging ─────────────────────────────────────────────────────────────────

@receiver(post_save, sender=Message)
def message_notification(sender, instance, created, **kwargs):
    """
    Notify every conversation participant except the sender when a new message arrives.
    Skips soft-deleted messages — they carry no meaningful content.
    """
    if not created or instance.is_deleted:
        return

    recipients = (
        instance.conversation.participants
        .exclude(id=instance.sender.id)
    )

    for user in recipients:
        push_notification(
            recipient=user,
            actor=instance.sender,
            notification_type="new_message",
            title="New Message 💬",
            message=f"{instance.sender.username} sent you a message.",
            data={
                "conversation_id": instance.conversation.id,
                "message_id":      instance.id,
            },
        )
