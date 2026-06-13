"""
Accounts API views.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import UserSettings, Users, VerificationDocument
from accounts.services import deactivate_user_account
from api.accounts_api.serializers import (
    ChangePasswordSerializer,
    CompleteOnboardingSerializer,
    GoogleLoginSerializer,
    LoginSerializer,
    RegisterSerializer,
    SupportRequestSerializer,
    TokenSerializer,
    UserSerializer,
    UserSettingsSerializer,
    UserUpdateSerializer,
    VerificationDocumentSerializer,
    VerificationDocumentUploadSerializer,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def build_auth_response(user, **extra):
    response_data = TokenSerializer(
        {
            **get_tokens_for_user(user),
            "user": user,
            **extra,
        }
    ).data
    return response_data


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        return Response(build_auth_response(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]
        return Response(build_auth_response(user), status=status.HTTP_200_OK)


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]
        return Response(
            build_auth_response(
                user,
                needs_onboarding=serializer.validated_data["needs_onboarding"],
                is_new_user=serializer.validated_data["is_new_user"],
            ),
            status=status.HTTP_200_OK,
        )


class CompleteOnboardingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CompleteOnboardingSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        payload = serializer.validated_data
        user.role = payload["role"]
        if payload.get("city") is not None:
            user.city = payload["city"]
            user.save(update_fields=["role", "city"])
        else:
            user.save(update_fields=["role"])

        update_payload = {}
        if payload.get("student_profile"):
            update_payload["student_profile"] = payload["student_profile"]
        if payload.get("landlord_profile"):
            update_payload["landlord_profile"] = payload["landlord_profile"]
        if update_payload:
            update_serializer = UserUpdateSerializer(user, data=update_payload, partial=True)
            update_serializer.is_valid(raise_exception=True)
            update_serializer.save()

        user.refresh_from_db()
        return Response(
            build_auth_response(user, needs_onboarding=False, is_new_user=False),
            status=status.HTTP_200_OK,
        )


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        request.user.refresh_from_db()
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

    def delete(self, request):
        try:
            deactivate_user_account(request.user)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Account deactivated successfully."}, status=status.HTTP_200_OK)


class PublicProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = Users.objects.get(id=user_id)
        except Users.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class SettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        return Response(
            UserSettingsSerializer(settings_obj).data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        serializer = UserSettingsSerializer(settings_obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)


class VerificationDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerificationDocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request):
        documents = VerificationDocument.objects.filter(user=request.user)
        serializer = VerificationDocumentSerializer(documents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SupportRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SupportRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
