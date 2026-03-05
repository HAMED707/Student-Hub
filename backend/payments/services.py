"""
Payments app services.
All Paymob API calls live here — views stay clean.

Paymob Accept flow:
    Step 1 → authenticate()         → auth_token
    Step 2 → create_paymob_order()  → paymob_order_id
    Step 3 → get_payment_token()    → payment_token (used in iframe URL)

Environment variables required (add to .env / settings.py):
    PAYMOB_API_KEY       → from Paymob dashboard → Settings → API Key
    PAYMOB_INTEGRATION_ID → from Paymob dashboard → Developers → Payment Integrations
    PAYMOB_IFRAME_ID     → from Paymob dashboard → Developers → iFrames
    PAYMOB_HMAC_SECRET   → from Paymob dashboard → Settings → HMAC
"""

import hmac
import hashlib
import requests
from django.conf import settings

PAYMOB_BASE_URL = "https://accept.paymob.com/api"


# ── Step 1: Authenticate ──────────────────────────────────────────────────────

def authenticate():
    """
    POST /auth/tokens
    Returns a short-lived auth_token valid for ~1 hour.
    Call this fresh before each payment flow — don't cache long-term.
    """
    response = requests.post(
        f"{PAYMOB_BASE_URL}/auth/tokens",
        json={"api_key": settings.PAYMOB_API_KEY},
    )
    response.raise_for_status()
    return response.json()["token"]


# ── Step 2: Register order on Paymob ─────────────────────────────────────────

def create_paymob_order(auth_token, amount_egp, merchant_order_id):
    """
    POST /ecommerce/orders
    Registers this payment session on Paymob's side.

    Args:
        auth_token        → from authenticate()
        amount_egp        → Decimal, e.g. 2500.00
        merchant_order_id → your Payment.id (must be unique)

    Returns:
        paymob_order_id (str)
    """
    amount_cents = int(amount_egp * 100)
    response = requests.post(
        f"{PAYMOB_BASE_URL}/ecommerce/orders",
        json={
            "auth_token":        auth_token,
            "delivery_needed":   False,
            "amount_cents":      amount_cents,
            "currency":          "EGP",
            "merchant_order_id": str(merchant_order_id),
            "items":             [],
        },
    )
    response.raise_for_status()
    return str(response.json()["id"])


# ── Step 3: Get payment token ─────────────────────────────────────────────────

def get_payment_token(auth_token, paymob_order_id, amount_egp, student):
    """
    POST /acceptance/payment_keys
    Returns a short-lived payment_token (~60 min) used to render the Paymob iframe.

    Args:
        auth_token       → from authenticate()
        paymob_order_id  → from create_paymob_order()
        amount_egp       → must match what was registered in step 2
        student          → Users instance (billing data)

    Returns:
        payment_token (str)
    """
    amount_cents = int(amount_egp * 100)
    response = requests.post(
        f"{PAYMOB_BASE_URL}/acceptance/payment_keys",
        json={
            "auth_token":     auth_token,
            "amount_cents":   amount_cents,
            "expiration":     3600,
            "order_id":       paymob_order_id,
            "currency":       "EGP",
            "integration_id": settings.PAYMOB_INTEGRATION_ID,
            "billing_data": {
                "first_name":    student.first_name or "NA",
                "last_name":     student.last_name  or "NA",
                "email":         student.email      or "NA",
                "phone_number":  str(student.phone_number) if student.phone_number else "NA",
                # Required by Paymob but irrelevant for digital rent payments
                "apartment":     "NA",
                "floor":         "NA",
                "street":        "NA",
                "building":      "NA",
                "shipping_method": "NA",
                "postal_code":   "NA",
                "city":          student.city or "Cairo",
                "country":       "EG",
                "state":         "NA",
            },
        },
    )
    response.raise_for_status()
    return response.json()["token"]


# ── Webhook HMAC verification ─────────────────────────────────────────────────

def verify_hmac(data: dict, received_hmac: str) -> bool:
    """
    Verifies the HMAC signature Paymob sends with every webhook callback.
    Prevents fake webhook calls from hitting your endpoint.

    Paymob concatenates specific fields in alphabetical order before hashing.
    Field list from Paymob docs (transaction processed callback).
    """
    fields = [
        "amount_cents", "created_at", "currency", "error_occured",
        "has_parent_transaction", "id", "integration_id", "is_3d_secure",
        "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
        "is_voided", "order", "owner", "pending", "source_data.pan",
        "source_data.sub_type", "source_data.type", "success",
    ]

    # Build the concatenated string from nested data
    obj = data.get("obj", {})
    concat = ""
    for field in fields:
        if "." in field:
            parts = field.split(".")
            val = obj.get(parts[0], {})
            if isinstance(val, dict):
                val = val.get(parts[1], "")
        else:
            val = obj.get(field, "")
        concat += str(val)

    expected = hmac.new(
        settings.PAYMOB_HMAC_SECRET.encode(),
        concat.encode(),
        hashlib.sha512,
    ).hexdigest()

    return hmac.compare_digest(expected, received_hmac)


# ── Build iframe URL ──────────────────────────────────────────────────────────

def get_iframe_url(payment_token):
    """Returns the full Paymob iframe URL the frontend renders."""
    return f"https://accept.paymob.com/api/acceptance/iframes/{settings.PAYMOB_IFRAME_ID}?payment_token={payment_token}"