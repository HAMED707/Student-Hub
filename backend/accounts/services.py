"""
Accounts app services.
"""

from __future__ import annotations

from typing import Any

import requests
from django.conf import settings
from django.contrib.auth import authenticate

from accounts.models import Users
from bookings.models import Booking
from properties.models import Property

GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
ACTIVE_BOOKING_STATUSES = ["pending_payment", "deposit_paid", "confirmed"]


def create_user_account(password, **kwargs):
    """
    Creates a new user with a properly hashed password.
    """
    user = Users.objects.create_user(password=password, **kwargs)
    return user


def authenticated(username, password):
    """
    Checks credentials and returns the user object if valid, otherwise None.
    """
    user = authenticate(username=username, password=password)
    return user


def generate_unique_username(email: str = "", first_name: str = "", last_name: str = "") -> str:
    """
    Builds a unique username for social-auth-created accounts.
    """
    base_parts = [
        (first_name or "").strip().lower(),
        (last_name or "").strip().lower(),
    ]
    base = ".".join(part for part in base_parts if part)
    if not base and email:
        base = email.split("@", 1)[0].strip().lower()
    base = "".join(char for char in (base or "user") if char.isalnum() or char in {"_", "."})
    base = base[:140] or "user"

    candidate = base
    suffix = 1
    while Users.objects.filter(username=candidate).exists():
        candidate = f"{base[:140-len(str(suffix))]}{suffix}"
        suffix += 1
    return candidate


def verify_google_id_token(id_token: str) -> dict[str, Any]:
    """
    Verifies a Google ID token using Google's tokeninfo endpoint.
    """
    response = requests.get(
        GOOGLE_TOKENINFO_URL,
        params={"id_token": id_token},
        timeout=10,
    )
    if not response.ok:
        raise ValueError("Unable to verify Google token.")

    payload = response.json()
    issuer = payload.get("iss")
    if issuer not in {"accounts.google.com", "https://accounts.google.com"}:
        raise ValueError("Invalid Google token issuer.")

    expected_audience = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "")
    if expected_audience and payload.get("aud") != expected_audience:
        raise ValueError("Google token audience mismatch.")

    if str(payload.get("email_verified", "")).lower() != "true":
        raise ValueError("Google account email is not verified.")

    if not payload.get("sub"):
        raise ValueError("Google token subject is missing.")

    return payload


def get_or_create_google_user(google_payload: dict[str, Any]) -> tuple[Users, bool]:
    """
    Finds or creates the matching user for a verified Google identity.
    """
    google_sub = google_payload["sub"]
    email = (google_payload.get("email") or "").strip().lower()

    user = Users.objects.filter(google_sub=google_sub).first()
    created = False

    if not user and email:
        matched = Users.objects.filter(email__iexact=email).first()
        if matched and matched.google_sub and matched.google_sub != google_sub:
            raise ValueError("This email is already linked to another Google account.")
        user = matched

    if not user:
        user = Users(
            username=generate_unique_username(
                email=email,
                first_name=google_payload.get("given_name", ""),
                last_name=google_payload.get("family_name", ""),
            ),
            email=email,
            first_name=google_payload.get("given_name") or "",
            last_name=google_payload.get("family_name") or "",
            role="pending",
            google_sub=google_sub,
        )
        user.set_unusable_password()
        user.save()
        created = True
        return user, created

    changed_fields: list[str] = []
    if user.google_sub != google_sub:
        user.google_sub = google_sub
        changed_fields.append("google_sub")
    if email and user.email != email:
        user.email = email
        changed_fields.append("email")
    if not user.first_name and google_payload.get("given_name"):
        user.first_name = google_payload["given_name"]
        changed_fields.append("first_name")
    if not user.last_name and google_payload.get("family_name"):
        user.last_name = google_payload["family_name"]
        changed_fields.append("last_name")
    if changed_fields:
        user.save(update_fields=changed_fields)

    return user, created


def deactivate_user_account(user: Users) -> None:
    """
    Soft-deactivates a user after business-rule checks pass.
    """
    if user.is_landlord:
        has_active_listings = Property.objects.filter(landlord=user).exclude(status="unavailable").exists()
        has_active_booking_flows = Booking.objects.filter(
            property__landlord=user,
            status__in=ACTIVE_BOOKING_STATUSES,
        ).exists()
        if has_active_listings:
            raise ValueError("You must remove or unpublish active property listings before deleting your account.")
        if has_active_booking_flows:
            raise ValueError("You cannot delete your account while active booking flows still exist.")
    elif user.is_student:
        has_active_bookings = Booking.objects.filter(
            tenant=user,
            status__in=ACTIVE_BOOKING_STATUSES,
        ).exists()
        if has_active_bookings:
            raise ValueError("You cannot delete your account while you still have active bookings.")

    user.is_active = False
    user.save(update_fields=["is_active"])
