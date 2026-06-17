"""
KYC app services.
Business logic layer — wraps the Persona REST API and webhook signature
verification so views stay thin.
"""

import hashlib
import hmac
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

PERSONA_BASE_URL = "https://api.withpersona.com/api/v1"

# Maps Persona's real inquiry status strings to our internal KYC status enum.
# IMPORTANT: verify this against real webhook payloads once you're testing in
# sandbox. Persona's inquiry.status values (pending/completed/approved/
# declined/failed/needs_review/expired/created) don't map perfectly 1:1 onto
# the 8-value enum in the spec, so the "pending" -> STARTED and
# "completed" -> PROCESSING choices below are a reasonable interpretation,
# not a guarantee — adjust once you see real payloads.
PERSONA_STATUS_MAP = {
    "created": "CREATED",
    "pending": "STARTED",
    "completed": "PROCESSING",
    "approved": "APPROVED",
    "declined": "REJECTED",
    "failed": "FAILED",
    "needs_review": "PENDING_REVIEW",
    "expired": "FAILED",
}


class PersonaError(Exception):
    """Raised when a Persona API call fails."""


def create_inquiry(landlord) -> dict:
    """
    Creates a new Persona Inquiry for a landlord.

    Returns:
        {"inquiry_id": str, "status": str (raw Persona status),
         "verification_url": str | None}

    Raises PersonaError on any request failure.
    """
    try:
        resp = requests.post(
            f"{PERSONA_BASE_URL}/inquiries",
            headers={
                "Authorization": f"Bearer {settings.PERSONA_API_KEY}",
                "Content-Type": "application/json",
                "Persona-Version": "2023-01-05",
            },
            json={
                "data": {
                    "attributes": {
                        "inquiry-template-id": settings.PERSONA_INQUIRY_TEMPLATE_ID,
                        # reference-id ties the inquiry back to our own user —
                        # this is how we re-identify the landlord on webhook events.
                        "reference-id": str(landlord.id),
                    }
                }
            },
            timeout=10,
        )
        resp.raise_for_status()
        payload = resp.json()
    except requests.RequestException as exc:
        raise PersonaError(f"Persona inquiry creation failed: {exc}") from exc

    data = payload.get("data", {})
    inquiry_id = data.get("id")
    status = data.get("attributes", {}).get("status", "pending")

    # one-time-link is null on creation — requires a separate call to generate it.
    verification_url = _generate_one_time_link(inquiry_id)

    return {
        "inquiry_id": inquiry_id,
        "status": status,
        "verification_url": verification_url,
    }


def _generate_one_time_link(inquiry_id: str) -> str | None:
    """Calls Persona's generate-one-time-link endpoint and returns the short URL."""
    try:
        resp = requests.post(
            f"{PERSONA_BASE_URL}/inquiries/{inquiry_id}/generate-one-time-link",
            headers={
                "Authorization": f"Bearer {settings.PERSONA_API_KEY}",
                "Content-Type": "application/json",
                "Persona-Version": "2023-01-05",
            },
            timeout=10,
        )
        resp.raise_for_status()
        meta = resp.json().get("meta", {})
        return meta.get("one-time-link-short") or meta.get("one-time-link")
    except requests.RequestException as exc:
        logger.warning("Could not generate one-time-link for inquiry %s: %s", inquiry_id, exc)
        return None


def verify_webhook_signature(raw_body: bytes, signature_header: str) -> bool:
    """
    Verifies the Persona-Signature header against the configured webhook
    secret. Header format: "t=<unix_timestamp>,v1=<hex_signature>".

    Always use the raw request body bytes here, not a re-serialized/parsed
    version — re-encoding JSON can change whitespace/float formatting and
    break the signature comparison.
    """
    if not signature_header:
        return False

    try:
        parts = dict(p.split("=", 1) for p in signature_header.split(",") if "=" in p)
    except ValueError:
        return False

    timestamp = parts.get("t")
    signature = parts.get("v1")
    if not timestamp or not signature:
        return False

    signed_payload = f"{timestamp}.".encode() + raw_body
    expected = hmac.new(
        settings.PERSONA_WEBHOOK_SECRET.encode(),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, signature)


def fetch_inquiry_status(inquiry_id: str) -> str:
    """
    Fetches the current status of a Persona inquiry directly from the API.
    Returns the raw Persona status string (e.g. 'approved', 'created').
    Raises PersonaError on request failure.
    """
    try:
        resp = requests.get(
            f"{PERSONA_BASE_URL}/inquiries/{inquiry_id}",
            headers={
                "Authorization": f"Bearer {settings.PERSONA_API_KEY}",
                "Persona-Version": "2023-01-05",
            },
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json().get("data", {}).get("attributes", {}).get("status", "created")
    except requests.RequestException as exc:
        raise PersonaError(f"Persona inquiry fetch failed: {exc}") from exc


def map_persona_status(persona_status: str) -> str:
    """Maps a raw Persona inquiry status string to our internal enum.
    Falls back to PROCESSING for any status we don't explicitly recognize,
    rather than silently defaulting to something more permissive."""
    return PERSONA_STATUS_MAP.get(persona_status, "PROCESSING")


def is_kyc_approved(user) -> bool:
    """Convenience check used by other apps (e.g. properties) before
    allowing a landlord to publish a listing."""
    return getattr(user, "kyc_status", "NOT_STARTED") == "APPROVED"
