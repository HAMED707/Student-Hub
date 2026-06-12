## accounts app ##


# ────────────────────────Start URL─────────────────────────────────────

```
"""
Accounts API URL configuration.
Maps all account-related endpoints to their views.

Endpoints:
    POST   /api/auth/register/          → RegisterView
    POST   /api/auth/login/             → LoginView
    POST   /api/auth/token/refresh/     → TokenRefreshView (built-in simplejwt)
    GET    /api/profile/                → ProfileView
    PATCH  /api/profile/                → ProfileView
    GET    /api/profile/<id>/           → PublicProfileView
    POST   /api/verify/documents/       → VerificationDocumentView
    GET    /api/verify/documents/       → VerificationDocumentView
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from api.accounts_api.views import (
    RegisterView,
    LoginView,
    ProfileView,
    PublicProfileView,
    VerificationDocumentView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),  # built-in

    # ── Profile ───────────────────────────────────────────────
    path("profile/", ProfileView.as_view(), name="my-profile"),
    path("profile/<int:user_id>/", PublicProfileView.as_view(), name="public-profile"),

    # ── Verification ──────────────────────────────────────────
    path("verify/documents/", VerificationDocumentView.as_view(), name="verify-documents"),
]

        
```

# ────────────────────────End URL───────────────────────────────────────



# ────────────────────────Start Serializer──────────────────────────────

```
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
            "city",
            "role",             # required — determines which profile gets created
        ]
        extra_kwargs = {
            "email": {"required": True},
        }

    def validate_gender(self, value):
        """Allow either Male/Female or M/F from the client."""
        return normalize_gender_value(value)

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

    def validate_gender(self, value):
        """Allow either Male/Female or M/F from the client."""
        return normalize_gender_value(value)

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


```

# ────────────────────────End Serializer────────────────────────────────




# ────────────────────────Start View────────────────────────────────────

```
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
```

# ────────────────────────End View──────────────────────────────────────




# ────────────────────────Start permissions────────────────────────────────────
```
"""
Accounts API custom permissions.
Used as permission_classes in views instead of repeating role checks everywhere.

Permissions:
    - IsStudent  → only students can access
    - IsLandlord → only landlords can access
"""

from rest_framework.permissions import BasePermission


# ──────────────────────────────────────────────────────────────────────────────────────────


class IsStudent(BasePermission):
    """
    Allows access only to users with role = 'student'.
    Used on: roommate matching, shortlist, student profile endpoints.
    """

    message = "Access restricted to students only."

    def has_permission(self, request, view):
        """Return True only if the user is authenticated and is a student."""
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "student"
        )


class IsLandlord(BasePermission):
    """
    Allows access only to users with role = 'landlord'.
    Used on: create property, owner dashboard, payments endpoints.
    """

    message = "Access restricted to landlords only."

    def has_permission(self, request, view):
        """Return True only if the user is authenticated and is a landlord."""
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "landlord"
        )

```
# ────────────────────────End permissions──────────────────────────────────────






# ────────────────────────Start Signals────────────────────────────────────
```
"""
Accounts app signals.
Auto-creates the correct profile when a new user registers.

Signals:
    - create_user_profile → fires after Users is saved, creates StudentProfile or LandlordProfile
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import Users, StudentProfile, LandlordProfile


# ──────────────────────────────────────────────────────────────────────────────────────────


@receiver(post_save, sender=Users)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Fires every time a Users object is saved.
    Only runs on creation (created=True) to avoid duplicate profiles.

    role = student  → creates StudentProfile
    role = landlord → creates LandlordProfile
    """
    if not created:
        return  # user is being updated, not created — do nothing

    if instance.role == "student":
        StudentProfile.objects.create(user=instance)

    elif instance.role == "landlord":
        LandlordProfile.objects.create(user=instance)

```
# ────────────────────────End Signals──────────────────────────────────────





# ────────────────────────Start Apps────────────────────────────────────
```
"""
Accounts app configuration.
The ready() method imports signals so they register when Django starts.
Without this, signals.py exists but never fires.
"""

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """Configuration class for the accounts app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        """Import signals when the app is ready so they connect to the dispatcher."""
        import accounts.signals  # noqa: F401

```
# ────────────────────────End Apps──────────────────────────────────────



# ────────────────────────Start Validators────────────────────────────────────
```

"""
Accounts app validators.
Reusable validation functions imported by serializers.

Validators:
    - validate_phone_number → ensures phone is in valid international format
"""

from rest_framework import serializers


# ──────────────────────────────────────────────────────────────────────────────────────────


def validate_phone_number(value):
    """
    Validates that the phone number is not empty.
    The PhoneNumberField on the model handles format validation automatically.
    This function is a hook for any extra rules we want to enforce.
    """
    if value and str(value).strip() == "":
        raise serializers.ValidationError("Phone number cannot be blank.")
    return value
```
# ────────────────────────End Validators──────────────────────────────────────



# ────────────────────────Start Services────────────────────────────────────
```
"""
Accounts app services.
Business logic layer — keeps views and serializers clean.

Functions:
    - create_user_account → creates a new user with hashed password
    - authenticated       → verifies credentials and returns user or None
"""

from django.contrib.auth import authenticate
from accounts.models import Users


# ──────────────────────────────────────────────────────────────────────────────────────────


def create_user_account(password, **kwargs):
    """
    Creates a new user with a properly hashed password.

    Using create_user() instead of create() is critical —
    create() stores the password in plain text which breaks authentication.

    Called by: RegisterSerializer.create()
    """
    user = Users.objects.create_user(password=password, **kwargs)
    return user


def authenticated(username, password):
    """
    Checks credentials and returns the user object if valid, otherwise None.

    Using Django's built-in authenticate() so it respects
    any auth backends configured in settings.

    Called by: LoginSerializer.validate()
    """
    user = authenticate(username=username, password=password)
    return user  # None if credentials are wrong

```
# ────────────────────────End Services──────────────────────────────────────






# ────────────────────────Start Model────────────────────────────────────

```
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
    ROLE_CHOICES = [("student", "Student"), ("landlord", "Landlord")]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="student")

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
    ]

    user = models.ForeignKey(
        Users, on_delete=models.CASCADE, related_name="documents"
    )  # one user has many docs
    doc_type = models.CharField(max_length=20, choices=DOC_TYPES)
    file = models.FileField(upload_to="verifications/", null=True, blank=True)
    is_verified = models.BooleanField(default=False)  # (Admin) sets this after review
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.doc_type}"

```

# ────────────────────────End Model──────────────────────────────────────

