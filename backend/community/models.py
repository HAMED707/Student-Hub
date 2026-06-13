"""
Community models: Group, GroupMembership, Post, and live group chat state.

Groups are student-created spaces (e.g. "Cairo University 2025", "Engineers Only").
Any authenticated user can browse groups; students join/post.
"""

from django.db import models
from django.conf import settings


class Group(models.Model):
    """A community group that students can join and post in."""

    CATEGORY_CHOICES = [
        ("university", "University"),
        ("housing",    "Housing"),
        ("social",     "Social"),
        ("study",      "Study"),
        ("other",      "Other"),
    ]

    creator     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_groups",
    )
    name        = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    category    = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    cover_image = models.ImageField(upload_to="group_covers/", null=True, blank=True)

    # Denormalised counter — updated by signals to avoid COUNT(*) on every list request
    member_count = models.PositiveIntegerField(default=0)

    is_private  = models.BooleanField(
        default=False,
        help_text="Private groups require approval to join (reserved for future use).",
    )

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    """
    Through-model between Users and Group.
    One row = one member.  unique_together prevents duplicate joins.
    """

    ROLE_CHOICES = [
        ("member", "Member"),
        ("admin",  "Admin"),
    ]

    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="group_memberships",
    )
    group      = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role       = models.CharField(max_length=10, choices=ROLE_CHOICES, default="member")
    joined_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "group")
        ordering        = ["joined_at"]

    def __str__(self):
        return f"{self.user} → {self.group} ({self.role})"


class Post(models.Model):
    """A post inside a Group."""

    author  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="community_posts",
    )
    group   = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    content = models.TextField()
    image   = models.ImageField(upload_to="post_images/", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Post by {self.author} in {self.group} @ {self.created_at:%Y-%m-%d}"


class GroupChatMessage(models.Model):
    """A text message sent inside a community group chat."""

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="chat_messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_group_messages",
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender} in {self.group}: {self.body[:40]}"


class GroupChatReadState(models.Model):
    """Tracks the latest read point for one user in one group chat."""

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="chat_read_states",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="group_chat_read_states",
    )
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("group", "user")

    def __str__(self):
        return f"{self.user} read {self.group}"
