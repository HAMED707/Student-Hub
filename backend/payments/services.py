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
                    "currency": "egp",
                    "unit_amount": booking.total_amount_cents,
                    "product_data": {"name": f"Booking #{booking.id} — {booking.property.title}"},
                },
                "quantity": 1,
            }],
            metadata={"booking_id": str(booking.id)},
            success_url=f"{settings.FRONTEND_URL}/bookings/{booking.id}?payment=success",
            cancel_url=f"{settings.FRONTEND_URL}/bookings/{booking.id}?payment=cancelled",
        )
    except stripe.error.StripeError as exc:
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
    except (stripe.error.SignatureVerificationError, ValueError) as exc:
        raise StripeError(f"Webhook verification failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Connect onboarding — landlord side
# ---------------------------------------------------------------------------

def ensure_connect_account(landlord) -> str:
    """
    Returns the landlord's Stripe Express account id, creating one if it
    doesn't exist yet. Does NOT complete onboarding — that happens via the
    hosted Account Link the landlord is redirected to.
    """
    profile = landlord.landlord_profile

    if profile.stripe_account_id:
        return profile.stripe_account_id

    try:
        account = stripe.Account.create(
            type="express",
            country="EG",
            email=landlord.email,
            capabilities={"transfers": {"requested": True}},
        )
    except stripe.error.StripeError as exc:
        raise StripeError(f"Connect account creation failed: {exc}") from exc

    profile.stripe_account_id = account.id
    profile.save(update_fields=["stripe_account_id"])
    return account.id


def create_onboarding_link(stripe_account_id: str) -> str:
    """Returns a one-time hosted onboarding URL for a Connect account."""
    try:
        link = stripe.AccountLink.create(
            account=stripe_account_id,
            refresh_url=f"{settings.FRONTEND_URL}/landlord/payouts/refresh",
            return_url=f"{settings.FRONTEND_URL}/landlord/payouts/complete",
            type="account_onboarding",
        )
    except stripe.error.StripeError as exc:
        raise StripeError(f"Onboarding link creation failed: {exc}") from exc

    return link.url


def get_connect_account_status(stripe_account_id: str) -> dict:
    """Synchronous status check — call this rather than building a second
    webhook subscriber for account.updated events, at least for v1."""
    try:
        account = stripe.Account.retrieve(stripe_account_id)
    except stripe.error.StripeError as exc:
        raise StripeError(f"Could not retrieve Connect account: {exc}") from exc

    return {
        "charges_enabled": account.charges_enabled,
        "payouts_enabled": account.payouts_enabled,
        "details_submitted": account.details_submitted,
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
            currency="egp",
            destination=stripe_account_id,
            metadata={"booking_id": str(booking_id)},
        )
    except stripe.error.StripeError as exc:
        raise StripeError(f"Transfer failed: {exc}") from exc

    return transfer.id
