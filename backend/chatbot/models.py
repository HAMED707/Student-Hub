"""
Chatbot app models.

Stores conversation turns per user so we can reconstruct a Gemini chat
session across requests. Gemini's chat object only exists in memory for
one request — Django doesn't keep it alive between requests, and won't
share it across multiple server workers, so the history has to live here.
"""

from django.db import models
from accounts.models import Users


class ChatMessage(models.Model):
    """One turn in a student's conversation with the assistant."""

    ROLE_CHOICES = [
        ("user", "User"),
        ("model", "Assistant"),
    ]

    user = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="chat_messages")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user.username} [{self.role}]: {self.content[:40]}"
