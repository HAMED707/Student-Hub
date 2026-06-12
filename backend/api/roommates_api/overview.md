## roommate app ##


# ────────────────────────Start URL─────────────────────────────────────

```
"""Roommates API URL configuration."""
from django.urls import path
from api.roommates_api.views import (
    RoommateListView,
    RoommateProfileView,
    RoommateProfileDetailView,
    RoommateRequestCreateView,
    RoommateRequestListView,
    RoommateRequestStatusView,
    RoommateMatchView,
)

urlpatterns = [
    # ── Browse & Profile ──────────────────────────────────────
    path(""                       , RoommateListView.as_view(),          name="roommate-list"),
    path("profile/"               , RoommateProfileView.as_view(),       name="roommate-profile"),
    path("profile/<int:user_id>/" , RoommateProfileDetailView.as_view(), name="roommate-profile-detail"),

    # ── Requests ─────────────────────────────────────────────
    path("request/"                  , RoommateRequestCreateView.as_view(), name="roommate-request-create"),
    path("requests/"                 , RoommateRequestListView.as_view(),   name="roommate-request-list"),
    path("request/<int:request_id>/" , RoommateRequestStatusView.as_view(), name="roommate-request-status"),

    # ── AI ─────────────────────────────────────────────
    path("matches/"                  , RoommateMatchView.as_view(), name="roommate-matches"),
]

        
```

# ────────────────────────End URL───────────────────────────────────────



# ────────────────────────Start Serializer──────────────────────────────

```
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

```

# ────────────────────────End Serializer────────────────────────────────




# ────────────────────────Start View────────────────────────────────────

```
"""
Roommates API views.

Views:
    - RoommateListView          → GET    /api/roommates/
    - RoommateProfileView       → GET/PATCH /api/roommates/profile/
    - RoommateProfileDetailView → GET    /api/roommates/profile/<user_id>/
    - RoommateRequestCreateView → POST   /api/roommates/request/
    - RoommateRequestListView   → GET    /api/roommates/requests/
    - RoommateRequestStatusView → PATCH  /api/roommates/request/<id>/
    - RoommateMatchView         → GET    /api/roommates/matches/
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from roommates.models import RoommateProfile, RoommateRequest
from accounts.models import Users
from api.roommates_api.serializers import (
    RoommateProfileSerializer,
    RoommateProfileUpdateSerializer,
    RoommateRequestSerializer,
    RoommateRequestCreateSerializer,
    RoommateRequestStatusSerializer,
)
from api.accounts_api.permissions import IsStudent
from api.roommates_api.ml_utils import process_and_match


class RoommateListView(APIView):
    """
    GET /api/roommates/
    Returns all active roommate profiles, sorted by match score descending.
    Students see match %. Landlords can browse but see no score.

    Optional query params:
        university=  → filter by university (case-insensitive)
        city=        → filter by city (case-insensitive)
        budget_max=  → profiles whose budget_min <= this value
        room_type=   → filter by room_type_preference
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = RoommateProfile.objects.filter(is_active=True).select_related("user")

        # ── Filters ──────────────────────────────────────────
        university = request.query_params.get("university")
        city       = request.query_params.get("city")
        budget_max = request.query_params.get("budget_max")
        room_type  = request.query_params.get("room_type")

        if university:
            queryset = queryset.filter(university__icontains=university)
        if city:
            queryset = queryset.filter(city__icontains=city)
        if budget_max:
            queryset = queryset.filter(budget_min__lte=budget_max)
        if room_type:
            queryset = queryset.filter(room_type_preference=room_type)

        # Exclude the requesting student's own profile from the list
        if request.user.role == "student":
            queryset = queryset.exclude(user=request.user)

        serializer = RoommateProfileSerializer(
            queryset,
            many=True,
            context={"request": request, "requesting_user": request.user},
        )

        # Sort by match_score descending so best matches appear first
        data = sorted(serializer.data, key=lambda x: x.get("match_score") or 0, reverse=True)
        return Response(data, status=status.HTTP_200_OK)


class RoommateProfileView(APIView):
    """
    GET   /api/roommates/profile/  → view own roommate profile
    PATCH /api/roommates/profile/  → update own roommate profile
    Students only.
    """
    permission_classes = [IsStudent]

    def get(self, request):
        try:
            profile = request.user.roommate_profile
        except RoommateProfile.DoesNotExist:
            return Response({"error": "Roommate profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = RoommateProfileSerializer(profile, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        try:
            profile = request.user.roommate_profile
        except RoommateProfile.DoesNotExist:
            return Response({"error": "Roommate profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = RoommateProfileUpdateSerializer(profile, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(
            RoommateProfileSerializer(profile, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class RoommateProfileDetailView(APIView):
    """
    GET /api/roommates/profile/<user_id>/
    View any student's public roommate profile.
    Returns match score relative to the requesting student.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            profile = RoommateProfile.objects.select_related("user").get(user__id=user_id)
        except RoommateProfile.DoesNotExist:
            return Response({"error": "Roommate profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = RoommateProfileSerializer(
            profile,
            context={"request": request, "requesting_user": request.user},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class RoommateRequestCreateView(APIView):
    """
    POST /api/roommates/request/
    Send a roommate connection request to another student.
    Students only.
    """
    permission_classes = [IsStudent]

    def post(self, request):
        serializer = RoommateRequestCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        roommate_request = serializer.save(sender=request.user)
        return Response(
            RoommateRequestSerializer(roommate_request).data,
            status=status.HTTP_201_CREATED,
        )


class RoommateRequestListView(APIView):
    """
    GET /api/roommates/requests/
    Returns two lists:
        - sent:     requests this student has sent
        - received: requests this student has received
    Students only.
    """
    permission_classes = [IsStudent]

    def get(self, request):
        sent     = RoommateRequest.objects.filter(sender=request.user).select_related("sender", "receiver")
        received = RoommateRequest.objects.filter(receiver=request.user).select_related("sender", "receiver")
        return Response(
            {
                "sent":     RoommateRequestSerializer(sent, many=True).data,
                "received": RoommateRequestSerializer(received, many=True).data,
            },
            status=status.HTTP_200_OK,
        )


class RoommateRequestStatusView(APIView):
    """
    PATCH /api/roommates/request/<id>/
    Update status of a roommate request.

    Transition rules:
        Receiver: pending → accepted | rejected
        Sender:   pending → withdrawn
    Students only.
    """
    permission_classes = [IsStudent]

    def patch(self, request, request_id):
        try:
            roommate_request = RoommateRequest.objects.select_related("sender", "receiver").get(id=request_id)
        except RoommateRequest.DoesNotExist:
            return Response({"error": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

        user       = request.user
        new_status = request.data.get("status")

        # ── Permission & transition rules ─────────────────────
        if user == roommate_request.receiver:
            allowed_transitions = {"pending": ["accepted", "rejected"]}
        elif user == roommate_request.sender:
            allowed_transitions = {"pending": ["withdrawn"]}
        else:
            return Response({"error": "You are not part of this request."}, status=status.HTTP_403_FORBIDDEN)

        current = roommate_request.status
        if current not in allowed_transitions or new_status not in allowed_transitions.get(current, []):
            return Response(
                {"error": f"Cannot change status from '{current}' to '{new_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RoommateRequestStatusSerializer(roommate_request, data={"status": new_status}, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(RoommateRequestSerializer(roommate_request).data, status=status.HTTP_200_OK)


class RoommateMatchView(APIView):
    """
    GET /api/roommates/matches/

    Returns the top 5 AI-matched roommates for the requesting student.

    Hard constraints (filtered at DB level):
        - is_active = True
        - Same gender     (Users.gender)
        - Same university (RoommateProfile.university)
        - Same city       (RoommateProfile.city)

    Soft matching via cosine similarity (ml_utils.py):
        sleeping_time, cleanliness, personality, smoking,
        guests_policy, budget range

    Students only. Requires an active RoommateProfile.

    Response:
        {
            "status": "success",
            "matches": [
                {"username": "ahmed99", "compatibility_score": 91.5},
                ...
            ]
        }
    """
    permission_classes = [IsStudent]

    def get(self, request):
        current_user = request.user

        # Requesting student must have an active profile themselves
        try:
            current_profile = RoommateProfile.objects.get(user=current_user, is_active=True)
        except RoommateProfile.DoesNotExist:
            return Response(
                {"error": "You need an active roommate profile to see matches."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ── Hard Constraints (DB-level, fast) ─────────────────
        compatible_profiles = RoommateProfile.objects.filter(
            is_active=True,
            user__gender=current_user.gender,       # gender lives on Users
            university=current_profile.university,  # university on RoommateProfile
            city=current_profile.city,              # city on RoommateProfile
        )

        # Only pull the columns the AI actually needs
        profiles_data = compatible_profiles.values(
            "user__username",
            "sleeping_time",
            "cleanliness",
            "personality",
            "smoking",
            "guests_policy",
            "budget_min",
            "budget_max",
            "room_type_preference",
        )

        # ── Soft Matching (cosine similarity AI) ──────────────
        matches = process_and_match(
            current_user_username=current_user.username,
            profiles_queryset=profiles_data,
            top_n=5,
        )

        return Response(
            {"status": "success", "matches": matches},
            status=status.HTTP_200_OK,
        )
```

# ────────────────────────End View──────────────────────────────────────





# ────────────────────────Start Signals────────────────────────────────────
```
"""
Roommates app signals.
Auto-creates a RoommateProfile when a new student registers.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import Users
from roommates.models import RoommateProfile


@receiver(post_save, sender=Users)
def create_roommate_profile(sender, instance, created, **kwargs):
    """Only fires on creation and only for students."""
    if not created:
        return
    if instance.role == "student":
        RoommateProfile.objects.create(user=instance)


```
# ────────────────────────End Signals──────────────────────────────────────





# ────────────────────────Start Apps────────────────────────────────────
```
from django.apps import AppConfig


class RoommatesConfig(AppConfig):
    """Configuration class for the roommates app."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "roommates"

    def ready(self):
        """Import signals when the app is ready so they connect to the dispatcher."""
        import roommates.signals  # noqa: F401

```
# ────────────────────────End Apps──────────────────────────────────────






# ────────────────────────Start Model────────────────────────────────────

```
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
```

# ────────────────────────End Model──────────────────────────────────────



# ────────────────────────Start Ml_utils──────────────────────────────────────

```
"""
ml_utils.py — Roommate Matching AI
====================================
Cosine similarity on ordinal-encoded lifestyle fields.
Field values match RoommateProfile model choices exactly.

Encoding:
    sleeping_time        → early=0,  normal=0.5, late=1.0
    cleanliness          → medium=0, high=1.0
    personality          → quiet=0,  social=1.0
    smoking              → non_smoker=0, smoker=1.0
    guests_policy        → never=0,  sometimes=0.5, often=1.0
    room_type_preference → single=0, shared=1.0
    budget               → min-max scaled average (relative to current data)
"""

import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


def process_and_match(current_user_username: str, profiles_queryset, top_n: int = 5):
    """
    Parameters
    ----------
    current_user_username : str
        Username of the student requesting matches.
    profiles_queryset : QuerySet .values() result
        Already filtered by hard constraints (gender, city, university, is_active).
        Must include the current user's own row.
    top_n : int
        Number of matches to return (default 5).

    Returns
    -------
    list[dict]
        [{"user__username": "...", "compatibility_score": 87.5}, ...]
        Sorted best → worst. Empty list if not enough profiles.
    """

    # 1. Convert to DataFrame
    df = pd.DataFrame(list(profiles_queryset))

    if df.empty or len(df) <= 1:
        return []

    # 2. Ordinal encoding — values match model choices exactly
    sleep_map       = {'early': 0, 'normal': 0.5, 'late': 1.0}
    clean_map       = {'low': 0, 'medium': 0.5, 'high': 1.0}
    personality_map = {'quiet': 0, 'moderate': 0.5, 'social': 1.0}
    smoking_map     = {'non_smoker': 0, 'smoker': 1.0}
    guests_map      = {'never': 0, 'sometimes': 0.5, 'often': 1.0}
    room_map        = {'single': 0, 'both': 0.5, 'shared': 1.0}

    df['sleep_encoded']       = df['sleeping_time'].map(sleep_map).fillna(0.5)
    df['clean_encoded']       = df['cleanliness'].map(clean_map).fillna(0.5)
    df['personality_encoded'] = df['personality'].map(personality_map).fillna(0.5)
    df['smoking_encoded']     = df['smoking'].map(smoking_map).fillna(0.5)
    df['guests_encoded']      = df['guests_policy'].map(guests_map).fillna(0.5)
    df['room_type_encoded']   = df['room_type_preference'].map(room_map).fillna(0.5)

    # 3. Budget — min-max scaling on the average of min/max budget
    #    Scales relative to actual data so no hardcoded cap needed
    if 'budget_min' in df.columns and 'budget_max' in df.columns:
        df['budget_avg'] = (df['budget_min'].fillna(0) + df['budget_max'].fillna(0)) / 2.0
        max_b = df['budget_avg'].max()
        min_b = df['budget_avg'].min()
        if max_b > min_b:
            df['budget_encoded'] = (df['budget_avg'] - min_b) / (max_b - min_b)
        else:
            df['budget_encoded'] = 0.5  # all budgets identical — no signal
    else:
        df['budget_encoded'] = 0.5

    # 4. Build numeric feature matrix
    numeric_columns = [
        'sleep_encoded',
        'clean_encoded',
        'personality_encoded',
        'smoking_encoded',
        'guests_encoded',
        'room_type_encoded',
        'budget_encoded',
    ]
    matrix = df[numeric_columns].fillna(0)

    # 5. Extract current user's vector
    target_mask = df['user__username'] == current_user_username
    if not target_mask.any():
        return []

    target_vector = matrix[target_mask]

    # 6. Cosine similarity → score out of 100
    similarities = cosine_similarity(target_vector, matrix)[0]
    df['compatibility_score'] = np.round(similarities * 100, 2)

    # 7. Exclude self, sort, cap at top_n
    matches = (
        df[~target_mask]
        .sort_values('compatibility_score', ascending=False)
        .head(top_n)
    )

    return [
        {
            "username": row["user__username"],
            "compatibility_score": row["compatibility_score"],
        }
        for _, row in matches.iterrows()
    ]
```
# ────────────────────────End Ml_utils──────────────────────────────────────
