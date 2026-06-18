"""
Payments API views.

Views:
    - CreateCheckoutSessionView → POST /api/payments/create-checkout-session/
    - StripeWebhookView         → POST /api/webhooks/stripe/
    - CheckinScanView           → POST /api/payments/checkin/
    - ConnectOnboardingView     → POST /api/payments/connect/onboard/
    - ConnectStatusView         → GET  /api/payments/connect/status/
    - LandlordPayoutsView       → GET  /api/payments/payouts/
"""

import json
import logging

from django.db import transaction
from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.accounts_api.permissions import IsLandlord, IsStudent
from accounts.models import LandlordProfile
from bookings.models import Booking
from payments.models import Payment, Payout
from payments.services import (
    StripeError,
    calculate_commission,
    construct_webhook_event,
    create_checkout_session,
    create_minimal_connect_account,
    create_onboarding_link,
    create_transfer,
    ensure_connect_account,
    flush_pending_payouts,
    get_connect_account_status,
)
from api.payments_api.serializers import (
    CheckinScanSerializer,
    CreateCheckoutSessionSerializer,
)

logger = logging.getLogger(__name__)


class CreateCheckoutSessionView(APIView):
    """
    POST /api/payments/create-checkout-session/
    Body: {"booking_id": 123}  — NEVER an amount. The backend always
    computes the amount from booking.total_amount_cents.
    """

    permission_classes = [IsStudent]

    def post(self, request):
        serializer = CreateCheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            booking = Booking.objects.get(
                id=serializer.validated_data["booking_id"], tenant=request.user
            )
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.is_expired:
            booking.status = "expired"
            booking.save(update_fields=["status"])
            return Response({"error": "This booking has expired."}, status=status.HTTP_400_BAD_REQUEST)

        if booking.status != "pending_payment":
            return Response(
                {"error": f"Booking is '{booking.status}', not awaiting payment."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = create_checkout_session(booking)
        except StripeError as exc:
            logger.error("Checkout session creation failed for booking %s: %s", booking.id, exc)
            return Response({"error": "Could not start payment. Please try again."}, status=status.HTTP_502_BAD_GATEWAY)

        Payment.objects.create(
            booking=booking,
            stripe_checkout_session_id=result["checkout_session_id"],
            amount_cents=booking.total_amount_cents,
            status=Payment.Status.PENDING,
        )

        return Response({"checkout_url": result["checkout_url"]}, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(View):
    """
    POST /api/webhooks/stripe/
    Only acts on checkout.session.completed — payment confirmation only,
    NEVER the trigger for payout (that's the QR scan, per the spec's rule
    that webhooks are for confirmation, not release decisions).
    """

    def post(self, request):
        sig_header = request.headers.get("Stripe-Signature", "")
        try:
            event = construct_webhook_event(request.body, sig_header)
        except StripeError as exc:
            logger.warning("Stripe webhook verification failed: %s", exc)
            return HttpResponse(status=400)

        # ── Student pays ───────────────────────────────────────────────
        if event.type == "checkout.session.completed":
            session = event.data.object
            try:
                payment = Payment.objects.select_related("booking").get(
                    stripe_checkout_session_id=session.id
                )
            except Payment.DoesNotExist:
                logger.warning("Stripe webhook: unknown checkout session %s", session.id)
                return HttpResponse(status=200)

            if payment.status == Payment.Status.PAID:
                return HttpResponse(status=200)

            payment.status = Payment.Status.PAID
            payment.stripe_payment_intent_id = getattr(session, "payment_intent", None)
            payment.raw_webhook_event = json.loads(request.body)
            payment.paid_at = timezone.now()
            payment.save()

            booking = payment.booking
            booking.status = "paid"
            booking.save(update_fields=["status"])

        # ── Landlord completes onboarding → flush pending payouts ──────
        elif event.type == "account.updated":
            connected_account_id = getattr(event, "account", None)
            if not connected_account_id:
                return HttpResponse(status=200)

            data_obj = event.data.object
            if not getattr(data_obj, "charges_enabled", False):
                return HttpResponse(status=200)

            try:
                profile = LandlordProfile.objects.get(stripe_account_id=connected_account_id)
            except LandlordProfile.DoesNotExist:
                return HttpResponse(status=200)

            if not profile.stripe_onboarding_complete:
                profile.stripe_onboarding_complete = True
                profile.save(update_fields=["stripe_onboarding_complete"])
                transferred = flush_pending_payouts(connected_account_id)
                logger.info(
                    "Landlord %s onboarding complete — flushed %d pending payout(s)",
                    profile.user_id, len(transferred),
                )

        return HttpResponse(status=200)


class CheckinScanView(APIView):
    """
    POST /api/payments/checkin/
    Body: {"qr_token": "<uuid>"}

    The QR scan does NOT move money itself — it's the trigger that lets
    this view validate everything and then call the Transfer API exactly
    once. Landlords only, and only for their own property's booking.
    """

    permission_classes = [IsLandlord]

    def post(self, request):
        serializer = CheckinScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            try:
                booking = Booking.objects.select_for_update().select_related(
                    "property", "property__landlord", "property__city"
                ).get(qr_token=serializer.validated_data["qr_token"])
            except Booking.DoesNotExist:
                return Response({"error": "Invalid QR code."}, status=status.HTTP_404_NOT_FOUND)

            if booking.property.landlord != request.user:
                return Response({"error": "This booking is not for one of your properties."}, status=status.HTTP_403_FORBIDDEN)

            if booking.status != "paid":
                return Response(
                    {"error": f"Booking is '{booking.status}' — payment must be completed before check-in."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if booking.payout_done:
                return Response({"error": "This booking has already been checked in and paid out."}, status=status.HTTP_409_CONFLICT)

            landlord_profile = request.user.landlord_profile

            # Ensure a Connect account id exists (created at signup, but
            # backfill silently for landlords registered before this change)
            if not landlord_profile.stripe_account_id:
                try:
                    create_minimal_connect_account(request.user)
                    landlord_profile.refresh_from_db()
                except StripeError:
                    pass

            commission_cents, landlord_cents = calculate_commission(booking.total_amount_cents)

            payout, _ = Payout.objects.get_or_create(
                booking=booking,
                defaults={
                    "commission_amount_cents": commission_cents,
                    "landlord_amount_cents": landlord_cents,
                },
            )

            # Transfer immediately if onboarding is done; otherwise hold funds
            # and let the account.updated webhook flush them later.
            if landlord_profile.stripe_account_id and landlord_profile.stripe_onboarding_complete:
                try:
                    transfer_id = create_transfer(
                        landlord_profile.stripe_account_id, landlord_cents, booking.id
                    )
                    payout.stripe_transfer_id = transfer_id
                    payout.status = Payout.Status.DONE
                    payout.triggered_at = timezone.now()
                    payout.save()
                except StripeError as exc:
                    payout.status = Payout.Status.FAILED
                    payout.failure_reason = str(exc)
                    payout.save()
                    logger.error("Immediate payout failed for booking %s: %s", booking.id, exc)
                    # Don't return an error — booking still finishes, payout retried later
            else:
                # Deferred: payout stays PENDING until onboarding completes
                payout.status = Payout.Status.PENDING
                payout.save()

            booking.payout_done = True
            booking.status = "finished"
            booking.save(update_fields=["payout_done", "status"])

        payout_status = payout.status
        return Response(
            {
                "booking_id": booking.id,
                "landlord_amount_aed": landlord_cents / 100,
                "commission_amount_aed": commission_cents / 100,
                "payout_status": payout_status,
                "status": "finished",
            },
            status=status.HTTP_200_OK,
        )


class ConnectOnboardingView(APIView):
    """
    POST /api/payments/connect/onboard/
    Creates (if needed) the landlord's Stripe Express account and returns
    a hosted onboarding URL.
    """

    permission_classes = [IsLandlord]

    def post(self, request):
        try:
            account_id = ensure_connect_account(request.user)
            onboarding_url = create_onboarding_link(account_id)
        except StripeError as exc:
            logger.error("Connect onboarding failed for landlord %s: %s", request.user.id, exc)
            return Response({"error": "Could not start payout onboarding."}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({"onboarding_url": onboarding_url}, status=status.HTTP_200_OK)


class ConnectStatusView(APIView):
    """
    GET /api/payments/connect/status/
    Checks the landlord's Connect account status synchronously (no
    webhook subscriber for account.updated yet — a v2 improvement).
    """

    permission_classes = [IsLandlord]

    def get(self, request):
        profile = request.user.landlord_profile
        if not profile.stripe_account_id:
            return Response(
                {"stripe_account_id": None, "onboarding_complete": False},
                status=status.HTTP_200_OK,
            )

        try:
            account_status = get_connect_account_status(profile.stripe_account_id)
        except StripeError as exc:
            logger.error("Could not fetch Connect status for landlord %s: %s", request.user.id, exc)
            return Response({"error": "Could not check payout status."}, status=status.HTTP_502_BAD_GATEWAY)

        onboarding_complete = account_status["details_submitted"] and account_status["transfers_active"]
        if onboarding_complete != profile.stripe_onboarding_complete:
            profile.stripe_onboarding_complete = onboarding_complete
            profile.save(update_fields=["stripe_onboarding_complete"])

        pending_cents = (
            Payout.objects.filter(
                status=Payout.Status.PENDING,
                booking__property__landlord=request.user,
            ).aggregate(total=Sum("landlord_amount_cents"))["total"] or 0
        )

        return Response(
            {
                "stripe_account_id": profile.stripe_account_id,
                "onboarding_complete": onboarding_complete,
                "pending_earnings_aed": pending_cents / 100,
                **account_status,
            },
            status=status.HTTP_200_OK,
        )


class LandlordPayoutsView(APIView):
    """
    GET /api/payments/payouts/
    Returns all paid/finished bookings for the landlord as a single feed,
    combining deposit-received events with their payout status.
    """

    permission_classes = [IsLandlord]

    def get(self, request):
        bookings = (
            Booking.objects.filter(
                property__landlord=request.user,
                status__in=["paid", "finished"],
            )
            .select_related("tenant", "property")
            .prefetch_related("payout")
            .order_by("-updated_at")
        )

        data = []
        for b in bookings:
            payout = b.payout if hasattr(b, "payout") else None
            try:
                payout = b.payout
            except Exception:
                payout = None

            data.append({
                "booking_id": b.id,
                "property_title": b.property.title,
                "tenant_name": b.tenant.get_full_name().strip() or b.tenant.username,
                "deposit_egp": b.total_amount_cents / 100,
                "landlord_amount_egp": payout.landlord_amount_cents / 100 if payout else None,
                "booking_status": b.status,
                "payout_status": payout.status if payout else None,
                "triggered_at": payout.triggered_at if payout else None,
                "updated_at": b.updated_at,
            })

        return Response(data, status=status.HTTP_200_OK)
