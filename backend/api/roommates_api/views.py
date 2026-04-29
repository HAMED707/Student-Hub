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