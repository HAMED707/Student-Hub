"""
payments/services.py

Replaces payments/paymob.py entirely. Wraps three Stripe surfaces:
    1. Checkout — student pays the platform
    2. Connect (Express) — landlord onboarding so they have a destination
       account capable of receiving transfers
    3. Transfers — platform -> landlord payout, triggered by check-in only

Uses the official `stripe` library rather than hand-rolled requests calls,
since it handles webhook signature verification, retries, and API
versioning for us.
"""

import logging

import stripe
from django.conf import settings

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeError(Exception):
    """Raised when a Stripe API call fails."""


# ---------------------------------------------------------------------------
# Checkout — student pays the platform
# ---------------------------------------------------------------------------

def create_checkout_session(booking) -> dict:
    """
    Creates a Stripe Checkout Session for the FULL booking total. The
    amount always comes from booking.total_amount_cents — never from
    anything the client sends — per the spec's core security rule.
    """
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "aed",
                    "unit_amount": booking.total_amount_cents,
                    "product_data": {"name": f"Booking #{booking.id} — {booking.property.title}"},
                },
                "quantity": 1,
            }],
            metadata={"booking_id": str(booking.id)},
            success_url=f"{settings.FRONTEND_URL}/bookings?payment=success&booking_id={booking.id}",
            cancel_url=f"{settings.FRONTEND_URL}/bookings?payment=cancelled&booking_id={booking.id}",
        )
    except Exception as exc:
        raise StripeError(f"Checkout session creation failed: {exc}") from exc

    return {
        "checkout_session_id": session.id,
        "checkout_url": session.url,
    }


def construct_webhook_event(payload: bytes, sig_header: str):
    """
    Verifies and parses an incoming Stripe webhook. Raises StripeError on
    any signature/parsing failure — callers should return 400/403, never
    process an unverified payload.
    """
    try:
        return stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except Exception as exc:
        raise StripeError(f"Webhook verification failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Connect onboarding — landlord side
# ---------------------------------------------------------------------------

def create_minimal_connect_account(landlord) -> str:
    """
    Creates a minimal Express account (country only) silently at signup.
    No redirect, no form. The landlord can list and earn immediately.
    Full onboarding (KYC) is deferred until they have pending earnings.
    """
    profile = landlord.landlord_profile

    if profile.stripe_account_id:
        return profile.stripe_account_id

    try:
        account = stripe.Account.create(
            type="express",
            country="AE",
            capabilities={"transfers": {"requested": True}},
        )
    except Exception as exc:
        raise StripeError(f"Minimal Connect account creation failed: {exc}") from exc

    profile.stripe_account_id = account.id
    profile.save(update_fields=["stripe_account_id"])
    return account.id


def ensure_connect_account(landlord) -> str:
    """Returns existing account id, or creates a minimal one if needed.
    Used by ConnectOnboardingView before generating an onboarding link."""
    return create_minimal_connect_account(landlord)


def flush_pending_payouts(stripe_account_id: str) -> list:
    """
    Transfers all PENDING payouts for the landlord whose onboarding just
    completed. Called from the account.updated webhook handler.
    Returns list of transfer ids that succeeded.
    """
    from django.utils import timezone
    from payments.models import Payout

    pending = Payout.objects.filter(
        status=Payout.Status.PENDING,
        booking__property__landlord__landlord_profile__stripe_account_id=stripe_account_id,
    ).select_related("booking")

    transfer_ids = []
    for payout in pending:
        try:
            transfer_id = create_transfer(
                stripe_account_id, payout.landlord_amount_cents, payout.booking_id
            )
            payout.stripe_transfer_id = transfer_id
            payout.status = Payout.Status.DONE
            payout.triggered_at = timezone.now()
            payout.save()
            transfer_ids.append(transfer_id)
        except StripeError as exc:
            logger.error("Deferred payout flush failed for payout %s: %s", payout.id, exc)
            payout.status = Payout.Status.FAILED
            payout.failure_reason = str(exc)
            payout.save()
    return transfer_ids


def create_onboarding_link(stripe_account_id: str) -> str:
    """Returns a one-time hosted onboarding URL for a Connect account."""
    try:
        link = stripe.AccountLink.create(
            account=stripe_account_id,
            refresh_url=f"{settings.FRONTEND_URL}/owner?onboarding=refresh",
            return_url=f"{settings.FRONTEND_URL}/owner?onboarding=complete",
            type="account_onboarding",
        )
    except Exception as exc:
        raise StripeError(f"Onboarding link creation failed: {exc}") from exc

    return link.url


def get_connect_account_status(stripe_account_id: str) -> dict:
    """Synchronous status check — call this rather than building a second
    webhook subscriber for account.updated events, at least for v1."""
    try:
        account = stripe.Account.retrieve(stripe_account_id)
    except Exception as exc:
        raise StripeError(f"Could not retrieve Connect account: {exc}") from exc

    capabilities = account.capabilities or {}
    transfers_active = getattr(capabilities, "transfers", None) == "active"

    return {
        "charges_enabled": account.charges_enabled,
        "payouts_enabled": account.payouts_enabled,
        "details_submitted": account.details_submitted,
        "transfers_active": transfers_active,
    }


# ---------------------------------------------------------------------------
# Payout — platform -> landlord, triggered only by check-in
# ---------------------------------------------------------------------------

def calculate_commission(total_cents: int) -> tuple[int, int]:
    """Returns (commission_cents, landlord_cents) using the configured
    platform commission percentage."""
    commission_cents = int(total_cents * settings.PLATFORM_COMMISSION_PERCENT / 100)
    landlord_cents = total_cents - commission_cents
    return commission_cents, landlord_cents


def create_transfer(stripe_account_id: str, amount_cents: int, booking_id: int) -> str:
    """Executes the actual platform -> landlord transfer. Returns the
    Stripe transfer id. Raises StripeError on failure — callers must NOT
    mark payout_done=True unless this succeeds."""
    try:
        transfer = stripe.Transfer.create(
            amount=amount_cents,
            currency="aed",
            destination=stripe_account_id,
            metadata={"booking_id": str(booking_id)},
        )
    except Exception as exc:
        raise StripeError(f"Transfer failed: {exc}") from exc

    return transfer.id
