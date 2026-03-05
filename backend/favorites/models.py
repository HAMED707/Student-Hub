"""
Favorites app models.
Handles the student shortlist — the heart button on property cards.

Models:
    - Favorite → a saved property belonging to a student
"""

from django.db import models
from accounts.models import Users
from properties.models import Property


class Favorite(models.Model):
    """
    Represents a property saved to a student's shortlist.

    unique_together prevents the same student from hearting the same
    property twice — the API treats a duplicate POST as a 400 error.
    """

    # ── Parties ───────────────────────────────────────────────────────────────
    user = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        related_name="favorites",
        limit_choices_to={"role": "student"},   # only students can shortlist
    )
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="favorited_by",
    )

    # ── Timestamp ─────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        # One heart per student per property — enforced at DB level
        unique_together = ("user", "property")

    def __str__(self):
        return f"{self.user.username} ♥ {self.property.title}"