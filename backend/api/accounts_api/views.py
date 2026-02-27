"""
Accounts API views.
Handles all request/response logic for auth and profiles.

Views:
    - RegisterView          → POST /api/auth/register/
    - LoginView             → POST /api/auth/login/
    - ProfileView           → GET/PATCH /api/profile/
    - PublicProfileView     → GET /api/profile/<id>/
    - VerificationDocumentView → POST /api/verify/documents/
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import Users, VerificationDocument
from api.accounts_api.serializers import (
    RegisterSerializer,
    LoginSerializer,
    TokenSerializer,
    UserSerializer,
    UserUpdateSerializer,
    VerificationDocumentSerializer,
)


# ── Helpers ───────────────────────────────────────────────────────────────────────────────


def get_tokens_for_user(user):
    """
    Generates a JWT access + refresh token pair for a given user.
    Called after register and login.
    """
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ──────────────────────────────────────────────────────────────────────────────────────────


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Creates a new user and returns JWT tokens + user data.
    No authentication required.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """Validate registration data, create user, return tokens."""
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        tokens = get_tokens_for_user(user)

        response_data = TokenSerializer({
            **tokens,
            "user": user,
        }).data

        return Response(response_data, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────────────────────────────────────────────────


class LoginView(APIView):
    """
    POST /api/auth/login/
    Validates credentials and returns JWT tokens + user data.
    No authentication required.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """Validate credentials, return tokens if correct."""
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)

        response_data = TokenSerializer({
            **tokens,
            "user": user,
        }).data

        return Response(response_data, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────────────────────────────────────────────────


class ProfileView(APIView):
    """
    GET  /api/profile/ → returns the logged-in user's full profile
    PATCH /api/profile/ → updates the logged-in user's profile

    Must be authenticated. Users can only see/edit their own profile here.
    To view someone else's profile use PublicProfileView.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return full profile of the currently logged-in user."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        """Partially update the logged-in user's profile."""
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,  # allow updating only some fields
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        # Return full updated profile using UserSerializer
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────────────────────────────────────────────────


class PublicProfileView(APIView):
    """
    GET /api/profile/<id>/
    View another user's public profile.
    Used when clicking on a student or landlord profile card.
    Must be authenticated to view.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """Return public profile of any user by ID."""
        try:
            user = Users.objects.get(id=user_id)
        except Users.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────────────────────────────────────────────────


class VerificationDocumentView(APIView):
    """
    POST /api/verify/documents/
    Student uploads a verification document (National ID, Student ID, etc.)
    Admin reviews it manually and sets is_verified = True.
    Must be authenticated.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Upload a new verification document."""
        serializer = VerificationDocumentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Attach the document to the logged-in user
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request):
        """Return all documents uploaded by the logged-in user."""
        documents = VerificationDocument.objects.filter(user=request.user)
        serializer = VerificationDocumentSerializer(documents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)