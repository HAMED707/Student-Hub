"""
Roommates app models.
Handles roommate profile discovery and connection requests between students.

Models:
    - RoommateProfile → extended preferences for matching (links to StudentProfile)
    - RoommateRequest → a connection request from one student to another
"""

from django.db import models
from accounts.models import Users


class RoommateProfile(models.Model):
    """
    Stores roommate-matching preferences for a student.
    Auto-created by signal when a student registers.
    Visible on the FindRoommate page as a card.

    Match % is calculated from overlapping preference fields.
    """

    SLEEPING_CHOICES = [
        ("early",  "Early (9–10 PM)"),
        ("normal", "Normal (11 PM)"),
        ("late",   "Late (12+ AM)"),
    ]
    CLEANLINESS_CHOICES = [
        ("low",    "Low"),
        ("medium", "Medium"),
        ("high",   "High"),
    ]
    PERSONALITY_CHOICES = [
        ("quiet",    "Quiet"),
        ("social",   "Social"),
        ("moderate", "Moderate"),
    ]
    SMOKING_CHOICES = [
        ("smoker",     "Smoker"),
        ("non_smoker", "Non-Smoker"),
    ]
    GUESTS_CHOICES = [
        ("never",     "Never"),
        ("sometimes", "Sometimes"),
        ("often",     "Often"),
    ]
    ROOM_TYPE_CHOICES = [
        ("single", "Single"),
        ("shared", "Shared"),
        ("both",   "Both"),
    ]

    # ── Ownership ────────────────────────────────────────────
    user = models.OneToOneField(
        Users, on_delete=models.CASCADE, related_name="roommate_profile",
        limit_choices_to={"role": "student"},
    )

    # ── Visibility ───────────────────────────────────────────
    # Student must opt in to appear on the FindRoommate page
    is_active = models.BooleanField(default=False)

    # ── About ────────────────────────────────────────────────
    bio             = models.TextField(blank=True, null=True)
    university      = models.CharField(max_length=255, blank=True, null=True)
    city            = models.CharField(max_length=100, blank=True, null=True)
    move_in_date    = models.DateField(blank=True, null=True)

    # ── Budget ───────────────────────────────────────────────
    budget_min = models.IntegerField(default=0)  # EGP/month
    budget_max = models.IntegerField(default=0)  # EGP/month

    # ── Lifestyle (My Habits) ────────────────────────────────
    sleeping_time = models.CharField(max_length=20, choices=SLEEPING_CHOICES, blank=True, null=True)
    cleanliness   = models.CharField(max_length=10, choices=CLEANLINESS_CHOICES, blank=True, null=True)
    personality   = models.CharField(max_length=20, choices=PERSONALITY_CHOICES, blank=True, null=True)
    smoking       = models.CharField(max_length=15, choices=SMOKING_CHOICES, blank=True, null=True)
    guests_policy = models.CharField(max_length=20, choices=GUESTS_CHOICES, blank=True, null=True)

    # ── Preferences (What I want in a roommate) ──────────────
    room_type_preference  = models.CharField(max_length=10, choices=ROOM_TYPE_CHOICES, blank=True, null=True)
    smoking_preference    = models.CharField(max_length=15, choices=SMOKING_CHOICES, blank=True, null=True)
    sleep_schedule_pref   = models.CharField(max_length=20, choices=SLEEPING_CHOICES, blank=True, null=True)
    cleanliness_pref      = models.CharField(max_length=10, choices=CLEANLINESS_CHOICES, blank=True, null=True)
    personality_pref      = models.CharField(max_length=20, choices=PERSONALITY_CHOICES, blank=True, null=True)

    # ── Timestamp ────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} — Roommate Profile"

    def match_score(self, other):
        """
        Returns a match percentage (0–100) between this profile and another.
        Each matching field adds equal weight to the final score.
        Fields compared: sleeping_time, personality, cleanliness, smoking,
                         guests_policy, budget overlap, room_type_preference.
        """
        fields = [
            ("sleeping_time",  self.sleeping_time,        other.sleep_schedule_pref),
            ("personality",    self.personality,           other.personality_pref),
            ("cleanliness",    self.cleanliness,           other.cleanliness_pref),
            ("smoking",        self.smoking,               other.smoking_preference),
            ("guests_policy",  self.guests_policy,         other.guests_policy),
            ("room_type",      self.room_type_preference,  other.room_type_preference),
        ]

        score  = 0
        weight = 0

        for _, my_val, their_pref in fields:
            if my_val and their_pref:
                weight += 1
                # "both" on room_type means any room type is acceptable
                if their_pref == "both" or my_val == their_pref:
                    score += 1

        # Budget overlap check
        if self.budget_min and self.budget_max and other.budget_min and other.budget_max:
            weight += 1
            overlap = min(self.budget_max, other.budget_max) - max(self.budget_min, other.budget_min)
            if overlap >= 0:
                score += 1

        if weight == 0:
            return 0
        return round((score / weight) * 100)


class RoommateRequest(models.Model):
    """
    A connection request from one student to another.
    Status flow: pending → accepted | rejected | withdrawn.
    """

    STATUS_CHOICES = [
        ("pending",   "Pending"),
        ("accepted",  "Accepted"),
        ("rejected",  "Rejected"),
        ("withdrawn", "Withdrawn"),
    ]

    # ── Parties ──────────────────────────────────────────────
    sender   = models.ForeignKey(
        Users, on_delete=models.CASCADE, related_name="sent_roommate_requests",
        limit_choices_to={"role": "student"},
    )
    receiver = models.ForeignKey(
        Users, on_delete=models.CASCADE, related_name="received_roommate_requests",
        limit_choices_to={"role": "student"},
    )

    # ── Content ──────────────────────────────────────────────
    message = models.TextField(blank=True, null=True)
    status  = models.CharField(max_length=15, choices=STATUS_CHOICES, default="pending")

    # ── Timestamps ───────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        # One active request per pair at a time (enforced in serializer validate())
        unique_together = ("sender", "receiver")

    def __str__(self):
        return f"{self.sender.username} → {self.receiver.username} ({self.status})"