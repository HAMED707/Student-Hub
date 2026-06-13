"""
Accounts API serializers.
"""

from __future__ import annotations

from rest_framework import serializers

from accounts.models import (
    LandlordProfile,
    StudentProfile,
    SupportRequest,
    UserSettings,
    Users,
    VerificationDocument,
)
from accounts.services import (
    authenticated,
    create_user_account,
    get_or_create_google_user,
    verify_google_id_token,
)
from accounts.validators import validate_phone_number


def normalize_gender_value(value):
    """Accept both verbose and compact gender values from the frontend."""
    if value in (None, ""):
        return value

    normalized = str(value).strip().lower()
    if normalized in ("male", "m"):
        return "M"
    if normalized in ("female", "f"):
        return "F"

    raise serializers.ValidationError("Gender must be M/F or Male/Female.")


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = [
            "bio",
            "university",
            "faculty",
            "year_of_study",
            "languages",
            "profile_strength",
            "is_looking_for_room",
            "lifestyle_tags",
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
            "preferred_room_type",
            "smoking_preference",
            "sleep_schedule_pref",
            "cleanliness_pref",
            "personality_pref",
        ]


class LandlordProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandlordProfile
        fields = [
            "company_name",
            "national_id",
            "is_id_verified",
            "total_income",
            "available_balance",
        ]
        read_only_fields = ["is_id_verified", "total_income", "available_balance"]


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = [
            "language",
            "profile_visible",
            "booking_requests",
            "new_messages",
            "booking_updates",
            "payment_issues",
            "roommate_matches",
            "email_notifications",
            "sms_notifications",
            "in_app_notifications",
        ]


class UserSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True)
    landlord_profile = LandlordProfileSerializer(read_only=True)
    settings = serializers.SerializerMethodField()
    has_google_account = serializers.SerializerMethodField()

    class Meta:
        model = Users
        fields = [
            "id",
            "username",
            "email",
            "role",
            "first_name",
            "last_name",
            "phone_number",
            "gender",
            "date_of_birth",
            "profile_picture",
            "city",
            "is_verified",
            "is_top_rated",
            "is_quick_responder",
            "student_profile",
            "landlord_profile",
            "settings",
            "has_google_account",
        ]
        read_only_fields = [
            "id",
            "role",
            "is_verified",
            "is_top_rated",
            "is_quick_responder",
            "has_google_account",
        ]

    def get_has_google_account(self, obj):
        return bool(obj.google_sub)

    def get_settings(self, obj):
        settings_obj, _ = UserSettings.objects.get_or_create(user=obj)
        return UserSettingsSerializer(settings_obj).data


class RegisterSerializer(serializers.ModelSerializer):
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
            "city",
            "role",
        ]
        extra_kwargs = {
            "email": {"required": True},
        }

    def validate_gender(self, value):
        return normalize_gender_value(value)

    def validate_phone_number(self, value):
        return validate_phone_number(value)

    def validate_role(self, value):
        if value not in ["student", "landlord"]:
            raise serializers.ValidationError("Role must be 'student' or 'landlord'.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        return create_user_account(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data["username"].strip()
        password = data["password"]

        user = authenticated(username=identifier, password=password)

        if not user and "@" in identifier:
            matched_user = Users.objects.filter(email__iexact=identifier).first()
            if matched_user:
                user = authenticated(username=matched_user.username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid username or password.")

        return {"user": user}


class TokenSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()
    needs_onboarding = serializers.BooleanField(required=False)
    is_new_user = serializers.BooleanField(required=False)


class GoogleLoginSerializer(serializers.Serializer):
    id_token = serializers.CharField()

    def validate(self, attrs):
        google_payload = verify_google_id_token(attrs["id_token"])
        user, created = get_or_create_google_user(google_payload)
        attrs["google_payload"] = google_payload
        attrs["user"] = user
        attrs["is_new_user"] = created
        attrs["needs_onboarding"] = user.role == "pending"
        return attrs


class CompleteOnboardingSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["student", "landlord"])
    city = serializers.CharField(required=False, allow_blank=True)
    student_profile = StudentProfileSerializer(required=False)
    landlord_profile = LandlordProfileSerializer(required=False)

    def validate(self, attrs):
        user = self.context["request"].user
        if user.role != "pending":
            raise serializers.ValidationError("Onboarding is already complete.")
        return attrs


class UserUpdateSerializer(serializers.ModelSerializer):
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

    def validate_gender(self, value):
        return normalize_gender_value(value)

    def validate_phone_number(self, value):
        return validate_phone_number(value)

    def update(self, instance, validated_data):
        student_data = validated_data.pop("student_profile", None)
        landlord_data = validated_data.pop("landlord_profile", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        if student_data and instance.is_student:
            student_profile = instance.student_profile
            for field, value in student_data.items():
                setattr(student_profile, field, value)
            student_profile.save()

        if landlord_data and instance.is_landlord:
            landlord_profile = instance.landlord_profile
            for field, value in landlord_data.items():
                setattr(landlord_profile, field, value)
            landlord_profile.save()

        return instance


class VerificationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationDocument
        fields = [
            "id",
            "doc_type",
            "file",
            "is_verified",
            "status",
            "review_note",
            "uploaded_at",
        ]
        read_only_fields = ["id", "is_verified", "status", "review_note", "uploaded_at"]


class VerificationDocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationDocument
        fields = [
            "id",
            "doc_type",
            "file",
            "is_verified",
            "status",
            "review_note",
            "uploaded_at",
        ]
        read_only_fields = ["id", "is_verified", "status", "review_note", "uploaded_at"]


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        if attrs["new_password"] == attrs["current_password"]:
            raise serializers.ValidationError({"new_password": "New password must be different from the current password."})
        return attrs


class SupportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportRequest
        fields = [
            "id",
            "issue_type",
            "description",
            "attachment",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at"]
