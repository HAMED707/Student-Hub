

from django.db import models
from django.utils import timezone

from accounts.models import Users
from bookings.models import Booking
from properties.models import Property



class Conversation(models.Model):
    """
    A conversation between two users.
    Can be standalone (DM) or linked to a booking/property.

    booking=None  → standalone DM
    booking=<id>  → linked to a specific booking (tenant ↔ landlord)
    """
    initiator = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="initiated_conversations")
    receiver  = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="received_conversations")

    booking  = models.ForeignKey(Booking,  on_delete=models.SET_NULL, null=True, blank=True, related_name="conversations")
    property = models.ForeignKey(Property, on_delete=models.SET_NULL, null=True, blank=True, related_name="conversations")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            # Prevent duplicate conversations for the same pair + booking
            models.UniqueConstraint(
                fields=["initiator", "receiver", "booking"],
                name="unique_conversation_per_booking",
            )
        ]

    def __str__(self):
        return f"{self.initiator.username} ↔ {self.receiver.username} ({self.booking or 'DM'})"

    def touch(self):
        self.updated_at = timezone.now()
        self.save(update_fields=["updated_at"])
    
 
#─────────────────────────────────────────────────────────────────────────────────────────────────────────────

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender       = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="sent_messages")

    body    = models.TextField()
    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.username}: {self.body[:40]}"
