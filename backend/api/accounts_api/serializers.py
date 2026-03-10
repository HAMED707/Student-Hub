"""
Accounts API serializers.
Handles serialization for auth, profiles, and verification.

Serializers:
    - UserSerializer                → read user data (used inside other serializers)
    - RegisterSerializer            → POST /api/auth/register/
    - LoginSerializer               → POST /api/auth/login/
    - TokenSerializer               → login response shape (tokens + user)
    - UserUpdateSerializer          → PATCH /api/profile/
    - StudentProfileSerializer      → GET/PATCH student profile section
    - LandlordProfileSerializer     → GET/PATCH landlord profile section
    - VerificationDocumentSerializer → POST /api/verify/documents/
"""

from rest_framework import serializers
from accounts.models import Users, StudentProfile, LandlordProfile, VerificationDocument
from accounts.services import create_user_account, authenticated
from accounts.validators import validate_phone_number

# ──────────────────────────────────────────────────────────────────────────────────────────


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Serializes the StudentProfile model.
    Nested inside UserSerializer so the profile page gets everything in one request.
    Also used standalone for PATCH /api/profile/ (student section only).
    """

    class Meta:
        model = StudentProfile
        fields = [
            # ── About Me ──────────────────────────────────────
            "bio",
            "university",
            "faculty",
            "year_of_study",
            "languages",
            "profile_strength",
            "is_looking_for_room",
            # ── Roommate Matching ─────────────────────────────
            "lifestyle_tags",
            # ── Interests & Lifestyle ─────────────────────────
            "sleeping_time",
            "study_environment",
            "music_preference",
            "guests_policy",
            "personality",
            "cleanliness",
            "smoking",
            "budget_min",
            "budget_max",
            "room_type_preference",
            # ── Personal Preferences ──────────────────────────
            "preferred_room_type",
            "smoking_preference",
            "sleep_schedule_pref",
            "cleanliness_pref",
            "personality_pref",
        ]


# ──────────────────────────────────────────────────────────────────────────────────────────


class LandlordProfileSerializer(serializers.ModelSerializer):
    """
    Serializes the LandlordProfile model.
    Nested inside UserSerializer for landlord profile page.
    Also used standalone for PATCH /api/profile/ (landlord section only).

    NOTE: total_income and available_balance are read-only —
          they get updated by the payments app, not by the user.
    """

    class Meta:
        model = LandlordProfile
        fields = [
            "company_name",
            "national_id",
            "is_id_verified",   # read-only — admin sets this
            "total_income",     # read-only — calculated from payments
            "available_balance", # read-only — calculated from payments
        ]
        read_only_fields = ["is_id_verified", "total_income", "available_balance"]


# ──────────────────────────────────────────────────────────────────────────────────────────


class UserSerializer(serializers.ModelSerializer):
    """
    Full user profile serializer.
    Used for GET /api/profile/ and GET /api/profile/<id>/

    Nests the correct profile based on role:
        role = student  → student_profile is populated, landlord_profile is null
        role = landlord → landlord_profile is populated, student_profile is null
    """

    # Nested profiles — read only, updated via their own serializers
    student_profile = StudentProfileSerializer(read_only=True)
    landlord_profile = LandlordProfileSerializer(read_only=True)

    class Meta:
        model = Users
        fields = [
            # ── Identity ──────────────────────────────────────
            "id",
            "username",
            "email",
            "role",             
            # ── Personal Info ─────────────────────────────────
            "first_name",
            "last_name",
            "phone_number",
            "gender",
            "date_of_birth",
            "profile_picture",
            "city",
            # ── Profile Badges ────────────────────────────────
            "is_verified",          
            "is_top_rated",         
            "is_quick_responder",   
            # ── Nested Profiles ───────────────────────────────
            "student_profile",
            "landlord_profile",
        ]
        read_only_fields = ["id", "role", "is_verified", "is_top_rated", "is_quick_responder"]


# ──────────────────────────────────────────────────────────────────────────────────────────


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles new user registration.
    Used for POST /api/auth/register/

    IMPORTANT: `role` must be included — it triggers the signal that
    auto-creates either StudentProfile or LandlordProfile.
    """

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Users
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "phone_number",
            "gender",
            "date_of_birth",
            "profile_picture",
            "role",             # required — determines which profile gets created
        ]
        extra_kwargs = {
            "email": {"required": True},
        }

    def validate_phone_number(self, value):
        """Delegate phone validation to the shared validator."""
        return validate_phone_number(value)

    def validate_role(self, value):
        """Only allow valid role values — reject anything unexpected."""
        if value not in ["student", "landlord"]:
            raise serializers.ValidationError("Role must be 'student' or 'landlord'.")
        return value

    def create(self, validated_data):
        """Pop password and delegate user creation to the service layer."""
        password = validated_data.pop("password")
        user = create_user_account(password=password, **validated_data)
        return user


# ──────────────────────────────────────────────────────────────────────────────────────────


class LoginSerializer(serializers.Serializer):
    """
    Validates login credentials.
    Used for POST /api/auth/login/

    Supports login with username or email.
    """

    username = serializers.CharField()  # accepts username or email
    password = serializers.CharField(write_only=True)  # never returned in response

    def validate(self, data):
        """Authenticate user and return user object, or raise error."""
        identifier = data["username"].strip()
        password = data["password"]

        # First try direct username authentication.
        user = authenticated(username=identifier, password=password)

        # Fallback: allow email in the same field.
        if not user and "@" in identifier:
            matched_user = Users.objects.filter(email__iexact=identifier).first()
            if matched_user:
                user = authenticated(username=matched_user.username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid username or password.")

        return {"user": user}


# ──────────────────────────────────────────────────────────────────────────────────────────


class TokenSerializer(serializers.Serializer):
    """
    Shape of the login response.
    Returns both JWT tokens + full user object so the frontend
    can store everything it needs in one request.
    """

    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


# ──────────────────────────────────────────────────────────────────────────────────────────


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Handles partial profile updates.
    Used for PATCH /api/profile/

    Splits into 2 steps:
        1. Update top-level Users fields (name, phone, etc.)
        2. Update nested profile fields (StudentProfile or LandlordProfile)
    """

    # Accept nested profile data in the same PATCH request
    # Both are optional — only the relevant one will be used based on role
    student_profile = StudentProfileSerializer(required=False)
    landlord_profile = LandlordProfileSerializer(required=False)

    class Meta:
        model = Users
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "gender",
            "date_of_birth",
            "profile_picture",
            "city",
            "student_profile",
            "landlord_profile",
        ]

    def validate_phone_number(self, value):
        """Delegate phone validation to the shared validator."""
        return validate_phone_number(value)

    def update(self, instance, validated_data):
        """
        Update Users fields first, then update the nested profile if provided.
        Uses pop() so nested data doesn't get passed to the Users model update.
        """
        # ── Extract nested profile data before updating Users ──
        student_data = validated_data.pop("student_profile", None)
        landlord_data = validated_data.pop("landlord_profile", None)

        # ── Update top-level Users fields ─────────────────────
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        # ── Update StudentProfile if user is a student ─────────
        if student_data and instance.is_student:
            student_profile = instance.student_profile
            for field, value in student_data.items():
                setattr(student_profile, field, value)
            student_profile.save()

        # ── Update LandlordProfile if user is a landlord ───────
        if landlord_data and instance.is_landlord:
            landlord_profile = instance.landlord_profile
            for field, value in landlord_data.items():
                setattr(landlord_profile, field, value)
            landlord_profile.save()

        return instance


# ──────────────────────────────────────────────────────────────────────────────────────────


class VerificationDocumentSerializer(serializers.ModelSerializer):
    """
    Handles document uploads for student verification.
    Used for POST /api/verify/documents/

    Accepted types: national_id, student_id, university_email
    Admin reviews uploads and sets is_verified = True manually.
    """

    class Meta:
        model = VerificationDocument
        fields = [
            "id",
            "doc_type",
            "file",
            "is_verified", 
            "uploaded_at",
        ]
        read_only_fields = ["id", "is_verified", "uploaded_at"]
