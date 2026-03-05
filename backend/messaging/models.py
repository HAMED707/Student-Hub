"""
Messaging app models.
Handles direct messages between two users and group chat inside community groups.

Models:
    - Conversation → a thread between 2 users (DM) or linked to a Group (group chat)
    - Message      → a single message inside a Conversation
"""

from django.db import models
from django.conf import settings


class Conversation(models.Model):
    """
    A conversation thread.
    - DM:         is_group=False, participants has 2 users, group is NULL
    - Group chat: is_group=True,  participants mirrors group members, group is set
    """

    # ── Type ─────────────────────────────────────────────────────────────────
    is_group = models.BooleanField(default=False)

    # ── Participants ──────────────────────────────────────────────────────────
    # For DMs:         exactly 2 users
    # For group chats: kept in sync with GroupMembership via signals (future)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="conversations",
        blank=True,
    )

    # ── Group link (group chats only) ─────────────────────────────────────────
    # NULL for DMs.  One-to-one: each Group has at most one Conversation.
    group = models.OneToOneField(
        "community.Group",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="conversation",
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)   # bumped on every new message

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        if self.is_group and self.group:
            return f"GroupChat: {self.group.name}"
        ids = list(self.participants.values_list("id", flat=True))
        return f"DM({ids})"


class Message(models.Model):
    """
    A single message inside a Conversation.
    Soft-delete via is_deleted — content replaced with placeholder, never hard-removed.
    """

    # ── Relationships ─────────────────────────────────────────────────────────
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sent_messages",
    )

    # ── Content ───────────────────────────────────────────────────────────────
    body       = models.TextField()
    is_deleted = models.BooleanField(default=False)  # soft-delete

    # ── Read tracking ─────────────────────────────────────────────────────────
    # Many-to-many so each participant can independently mark a message as read
    read_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="read_messages",
        blank=True,
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        sender_name = self.sender.username if self.sender else "deleted"
        preview     = self.body[:40] if not self.is_deleted else "[deleted]"
        return f"{sender_name}: {preview}"