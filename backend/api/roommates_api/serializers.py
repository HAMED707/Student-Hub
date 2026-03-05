"""
Roommates API serializers.

Serializers:
    - RoommateProfileSerializer        → GET /api/roommates/ (list + detail)
    - RoommateProfileUpdateSerializer  → PATCH /api/roommates/profile/
    - RoommateRequestSerializer        → GET responses for requests
    - RoommateRequestCreateSerializer  → POST /api/roommates/request/
    - RoommateRequestStatusSerializer  → PATCH /api/roommates/request/<id>/
"""

from rest_framework import serializers
from roommates.models import RoommateProfile, RoommateRequest
from accounts.models import Users


class RoommateProfileSerializer(serializers.ModelSerializer):
    """
    Full read serializer for a roommate profile card.
    Includes match_score when `requesting_user` is passed in context.
    """

    username        = serializers.CharField(source="user.username",        read_only=True)
    profile_picture = serializers.ImageField(source="user.profile_picture", read_only=True)
    gender          = serializers.CharField(source="user.gender",           read_only=True)
    user_id         = serializers.IntegerField(source="user.id",            read_only=True)
    match_score     = serializers.SerializerMethodField()

    class Meta:
        model  = RoommateProfile
        fields = [
            "id", "user_id", "username", "profile_picture", "gender",
            "is_active",
            "bio", "university", "city", "move_in_date",
            "budget_min", "budget_max",
            # My habits
            "sleeping_time", "cleanliness", "personality", "smoking", "guests_policy",
            # Preferences
            "room_type_preference", "smoking_preference",
            "sleep_schedule_pref", "cleanliness_pref", "personality_pref",
            "match_score",
            "created_at", "updated_at",
        ]

    def get_match_score(self, obj):
        """
        Returns match % vs the requesting user's own RoommateProfile.
        Returns None if the viewer has no profile or is viewing their own card.
        """
        requesting_user = self.context.get("requesting_user")
        if not requesting_user or requesting_user == obj.user:
            return None
        try:
            my_profile = requesting_user.roommate_profile
        except RoommateProfile.DoesNotExist:
            return None
        return obj.match_score(my_profile)


class RoommateProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Write serializer for the student to update their own roommate profile.
    All fields are optional (partial=True in the view).
    """

    class Meta:
        model  = RoommateProfile
        fields = [
            "is_active",
            "bio", "university", "city", "move_in_date",
            "budget_min", "budget_max",
            "sleeping_time", "cleanliness", "personality", "smoking", "guests_policy",
            "room_type_preference", "smoking_preference",
            "sleep_schedule_pref", "cleanliness_pref", "personality_pref",
        ]

    def validate(self, data):
        budget_min = data.get("budget_min", self.instance.budget_min if self.instance else 0)
        budget_max = data.get("budget_max", self.instance.budget_max if self.instance else 0)
        if budget_max and budget_min and budget_max < budget_min:
            raise serializers.ValidationError("budget_max must be >= budget_min.")
        return data


class RoommateRequestSerializer(serializers.ModelSerializer):
    """Full read serializer. Shown in the Requests inbox."""

    sender_username   = serializers.CharField(source="sender.username",   read_only=True)
    receiver_username = serializers.CharField(source="receiver.username", read_only=True)
    sender_picture    = serializers.ImageField(source="sender.profile_picture",   read_only=True)
    receiver_picture  = serializers.ImageField(source="receiver.profile_picture", read_only=True)

    class Meta:
        model  = RoommateRequest
        fields = [
            "id",
            "sender", "sender_username", "sender_picture",
            "receiver", "receiver_username", "receiver_picture",
            "message", "status",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "sender", "receiver", "status", "created_at", "updated_at"]


class RoommateRequestCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for sending a new roommate request.
    sender is injected from request.user.
    Rules:
        - Cannot send to yourself
        - Cannot send to a non-student
        - Cannot send a duplicate (unique_together enforced at DB level too)
        - Cannot send if there's already an accepted request between this pair
    """

    class Meta:
        model  = RoommateRequest
        fields = ["receiver", "message"]

    def validate_receiver(self, value):
        if value.role != "student":
            raise serializers.ValidationError("You can only send roommate requests to students.")
        return value

    def validate(self, data):
        sender   = self.context["request"].user
        receiver = data.get("receiver")

        if sender == receiver:
            raise serializers.ValidationError("You cannot send a roommate request to yourself.")

        # Block duplicate — catches both directions (A→B and B→A)
        already_exists = RoommateRequest.objects.filter(
            sender=sender, receiver=receiver
        ).exclude(status="withdrawn").exists()
        if already_exists:
            raise serializers.ValidationError("You already have an active request with this user.")

        reverse_exists = RoommateRequest.objects.filter(
            sender=receiver, receiver=sender
        ).exclude(status="withdrawn").exists()
        if reverse_exists:
            raise serializers.ValidationError("This user has already sent you a request. Check your inbox.")

        return data

    def create(self, validated_data):
        return RoommateRequest.objects.create(**validated_data)


class RoommateRequestStatusSerializer(serializers.ModelSerializer):
    """
    Write serializer for updating request status.
    Valid transitions enforced in the view — this just validates the value.
    """

    class Meta:
        model  = RoommateRequest
        fields = ["status"]

    def validate_status(self, value):
        allowed = ["accepted", "rejected", "withdrawn"]
        if value not in allowed:
            raise serializers.ValidationError(f"Invalid status. Choose from: {', '.join(allowed)}.")
        return value
