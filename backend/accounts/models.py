"""
Accounts app models.
Handles all user authentication, profiles, and verification.

Models:
    - Users                → base user for both students and landlords
    - StudentProfile       → lifestyle and preferences (students only)
    - LandlordProfile      → business and financial info (landlords only)
    - VerificationDocument → uploaded IDs and documents for verification
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from phonenumber_field.modelfields import PhoneNumberField

# ──────────────────────────────────────────────────────────────────────────────────────────


class Users(AbstractUser):
    """
    Main user model for the entire app.
    Handles both Students and Landlords via the `role` field.

    Student gets → StudentProfile (lifestyle, preferences)
    Landlord gets → LandlordProfile (properties, payments)
    """

    # ── Role ────────────────────────────────────────────────
    ROLE_CHOICES = [
        ("pending", "Pending"),
        ("student", "Student"),
        ("landlord", "Landlord"),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="student")
    google_sub = models.CharField(max_length=255, unique=True, blank=True, null=True)

    # ── Personal Info (shared by both roles) ────────────────
    GENDER_CHOICES = [("M", "Male"), ("F", "Female")]
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    phone_number = PhoneNumberField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(
        max_length=1, choices=GENDER_CHOICES, blank=True, null=True
    )
    profile_picture = models.ImageField(
        upload_to="profile_pics/", blank=True, null=True
    )
    city = models.CharField(max_length=100, blank=True, null=True)

    # ── KYC (Persona identity verification) ─────────────────
    KYC_STATUS_CHOICES = [
        ("NOT_STARTED", "Not Started"),
        ("CREATED", "Created"),
        ("STARTED", "Started"),
        ("PROCESSING", "Processing"),
        ("PENDING_REVIEW", "Pending Review"),
        ("APPROVED", "Approved"),
        ("FAILED", "Failed"),
        ("REJECTED", "Rejected"),
    ]
    kyc_status = models.CharField(max_length=20, choices=KYC_STATUS_CHOICES, default="NOT_STARTED")

    # ── Profile Badges (shown on profile page) ──────────────
    is_verified = models.BooleanField(default=False)  #  Verified badge
    is_top_rated = models.BooleanField(default=False)  #  Top Rated badge
    is_quick_responder = models.BooleanField(default=False)  #  Quick Responder badge

    def __str__(self):
        return self.username

    # ── Helper Properties (use in views/serializers) ────────
    @property
    def is_student(self):
        """Returns True if this user is a student."""
        return self.role == "student"

    @property
    def is_landlord(self):
        """Returns True if this user is a landlord."""
        return self.role == "landlord"

    @property
    def is_pending(self):
        """Returns True if this user still needs to finish onboarding."""
        return self.role == "pending"


# ──────────────────────────────────────────────────────────────────────────────────────────


class StudentProfile(models.Model):
    """
    Extra fields for students only.
    Auto-created by signal when a student registers.

    Sections:
    - About Me (bio, university, faculty)
    - Interests & Lifestyle (sleeping, personality, smoking...)
    - Personal Preferences (what they want in a roommate)

    Used in: Profile page, Roommate Matching page
    """

    # ── Choices ─────────────────────────────────────────────
    SLEEPING_CHOICES = [
        ("early", "Early (9-10 PM)"),
        ("normal", "Normal (11 PM)"),
        ("late", "Late (12+ AM)"),
    ]
    CLEANLINESS_CHOICES = [("low", "Low"), ("medium", "Medium"), ("high", "High")]
    PERSONALITY_CHOICES = [
        ("quiet", "Quiet"),
        ("social", "Social"),
        ("moderate", "Moderate"),
    ]
    SMOKING_CHOICES = [("smoker", "Smoker"), ("non_smoker", "Non-Smoker")]
    GUESTS_CHOICES = [
        ("never", "Never"),
        ("sometimes", "Sometimes"),
        ("often", "Often"),
    ]
    ROOM_TYPE_CHOICES = [("single", "Single"), ("shared", "Shared"), ("both", "Both")]

    # ── Relation ─────────────────────────────────────────────
    # OneToOne means one student = one profile, deleting user deletes this too
    user = models.OneToOneField(
        Users, on_delete=models.CASCADE, related_name="student_profile"
    )

    # ── About Me Section ─────────────────────────────────────
    bio = models.TextField(blank=True, null=True)
    university = models.CharField(max_length=255, blank=True, null=True)
    faculty = models.CharField(max_length=255, blank=True, null=True)
    year_of_study = models.CharField(max_length=50, blank=True, null=True)
    languages = models.JSONField(default=list, blank=True)
    profile_strength = models.IntegerField(default=0)  # 0-100, shown as % on profile
    is_looking_for_room = models.BooleanField(default=False)

    # ── Roommate Matching ─────────────────────────────────────
    # Tags shown on roommate cards e.g. ["Quiet", "Clean", "Night owl"]
    lifestyle_tags = models.JSONField(default=list, blank=True)

    # ── Interests & Lifestyle Section ────────────────────────
    sleeping_time = models.CharField(
        max_length=20, choices=SLEEPING_CHOICES, blank=True, null=True
    )
    study_environment = models.CharField(max_length=50, blank=True, null=True)
    music_preference = models.CharField(max_length=50, blank=True, null=True)
    guests_policy = models.CharField(
        max_length=20, choices=GUESTS_CHOICES, blank=True, null=True
    )
    personality = models.CharField(
        max_length=20, choices=PERSONALITY_CHOICES, blank=True, null=True
    )
    cleanliness = models.CharField(
        max_length=10, choices=CLEANLINESS_CHOICES, blank=True, null=True
    )
    smoking = models.CharField(
        max_length=15, choices=SMOKING_CHOICES, blank=True, null=True
    )
    budget_min = models.IntegerField(default=0)  # minimum monthly budget in EGP
    budget_max = models.IntegerField(default=0)  # maximum monthly budget in EGP
    room_type_preference = models.CharField(
        max_length=10, choices=ROOM_TYPE_CHOICES, blank=True, null=True
    )

    # ── Personal Preferences Section ─────────────────────────
    # What this student WANTS in their ideal roommate
    preferred_room_type = models.CharField(
        max_length=10, choices=ROOM_TYPE_CHOICES, blank=True, null=True
    )
    smoking_preference = models.CharField(
        max_length=15, choices=SMOKING_CHOICES, blank=True, null=True
    )
    sleep_schedule_pref = models.CharField(
        max_length=20, choices=SLEEPING_CHOICES, blank=True, null=True
    )
    cleanliness_pref = models.CharField(
        max_length=10, choices=CLEANLINESS_CHOICES, blank=True, null=True
    )
    personality_pref = models.CharField(
        max_length=20, choices=PERSONALITY_CHOICES, blank=True, null=True
    )

    def __str__(self):
        return f"{self.user.username} - Student Profile"


# ──────────────────────────────────────────────────────────────────────────────────────────


class LandlordProfile(models.Model):
    """
    Extra fields for landlords only.
    Auto-created by signal when a landlord registers.

    Used in: Owner Dashboard, Payments page
    """

    # One landlord = one profile
    user = models.OneToOneField(
        Users, on_delete=models.CASCADE, related_name="landlord_profile"
    )

    # ── Business Info ────────────────────────────────────────
    company_name = models.CharField(
        max_length=255, blank=True, null=True
    )  # ((optional)) business name
    national_id = models.CharField(max_length=50, blank=True, null=True)
    is_id_verified = models.BooleanField(
        default=False
    )  # admin verifies this manually **

    # ── Financial Info (used in Payments dashboard) ──────────
    # NOTE: These are calculated fields — consider computing from Payment model instead
    total_income = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    available_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.user.username} - Landlord Profile"


class UserSettings(models.Model):
    """
    Shared per-user settings used by both student and landlord experiences.
    """

    LANGUAGE_CHOICES = [
        ("en", "English"),
        ("ar", "Arabic"),
    ]

    user = models.OneToOneField(
        Users,
        on_delete=models.CASCADE,
        related_name="settings",
    )
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    profile_visible = models.BooleanField(default=True)

    booking_requests = models.BooleanField(default=True)
    new_messages = models.BooleanField(default=True)
    booking_updates = models.BooleanField(default=True)
    payment_issues = models.BooleanField(default=False)
    roommate_matches = models.BooleanField(default=True)

    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    in_app_notifications = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Settings"


class VerificationDocument(models.Model):
    """
    Documents students upload to get verified.

    Shown on profile sidebar:
         National ID
         Student ID
         University Email

    (Admin) reviews and sets is_verified = True manually.
    """

    DOC_TYPES = [
        ("national_id", "National ID"),
        ("student_id", "Student ID"),
        ("university_email", "University Email"),
        ("ownership", "Property Ownership Contract"),
        ("commercial", "Commercial Registration"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    user = models.ForeignKey(
        Users, on_delete=models.CASCADE, related_name="documents"
    )  # one user has many docs
    doc_type = models.CharField(max_length=20, choices=DOC_TYPES)
    file = models.FileField(upload_to="verifications/", null=True, blank=True)
    is_verified = models.BooleanField(default=False)  # maintained for backward compatibility
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="pending")
    review_note = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.doc_type}"

    def save(self, *args, **kwargs):
        self.is_verified = self.status == "approved"
        super().save(*args, **kwargs)


class SupportRequest(models.Model):
    """
    Lightweight support ticket created from the profile/settings flows.
    """

    ISSUE_TYPE_CHOICES = [
        ("bug", "Bug"),
        ("billing", "Billing"),
        ("verification", "Verification"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("closed", "Closed"),
    ]

    user = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        related_name="support_requests",
    )
    issue_type = models.CharField(max_length=20, choices=ISSUE_TYPE_CHOICES, default="bug")
    description = models.TextField()
    attachment = models.FileField(upload_to="support_requests/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.issue_type} ({self.status})"
