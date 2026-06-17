"""
Payments API views.

Views:
    - CreateCheckoutSessionView → POST /api/payments/create-checkout-session/
    - StripeWebhookView         → POST /api/webhooks/stripe/  (registered
      directly in api/urls.py, mirroring how the Persona webhook is mounted)
    - CheckinScanView           → POST /api/payments/checkin/
    - ConnectOnboardingView     → POST /api/payments/connect/onboard/
    - ConnectStatusView         → GET  /api/payments/connect/status/
"""

import logging

from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.accounts_api.permissions import IsLandlord, IsStudent
from bookings.models import Booking
from payments.models import Payment, Payout
from payments.services import (
    StripeError,
    calculate_commission,
    construct_webhook_event,
    create_checkout_session,
    create_onboarding_link,
    create_transfer,
    ensure_connect_account,
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

        if event["type"] != "checkout.session.completed":
            return HttpResponse(status=200)  # acknowledged, not acted on

        session = event["data"]["object"]

        try:
            payment = Payment.objects.select_related("booking").get(
                stripe_checkout_session_id=session["id"]
            )
        except Payment.DoesNotExist:
            logger.warning("Stripe webhook for unknown checkout session %s", session.get("id"))
            return HttpResponse(status=200)

        if payment.status == Payment.Status.PAID:
            return HttpResponse(status=200)  # idempotency — already processed

        payment.status = Payment.Status.PAID
        payment.stripe_payment_intent_id = session.get("payment_intent")
        payment.raw_webhook_event = event
        payment.paid_at = timezone.now()
        payment.save()

        booking = payment.booking
        booking.status = "paid"
        booking.save(update_fields=["status"])

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
            if not landlord_profile.stripe_account_id:
                return Response(
                    {"error": "You haven't completed payout onboarding yet. Visit your payout settings first."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            commission_cents, landlord_cents = calculate_commission(booking.total_amount_cents)

            payout, _ = Payout.objects.get_or_create(
                booking=booking,
                defaults={
                    "commission_amount_cents": commission_cents,
                    "landlord_amount_cents": landlord_cents,
                },
            )

            try:
                transfer_id = create_transfer(
                    landlord_profile.stripe_account_id, landlord_cents, booking.id
                )
            except StripeError as exc:
                payout.status = Payout.Status.FAILED
                payout.failure_reason = str(exc)
                payout.save()
                logger.error("Payout failed for booking %s: %s", booking.id, exc)
                return Response({"error": "Payout failed. Please try again or contact support."}, status=status.HTTP_502_BAD_GATEWAY)

            payout.stripe_transfer_id = transfer_id
            payout.status = Payout.Status.DONE
            payout.triggered_at = timezone.now()
            payout.save()

            booking.payout_done = True
            booking.status = "finished"
            booking.save(update_fields=["payout_done", "status"])

        return Response(
            {
                "booking_id": booking.id,
                "landlord_amount_egp": landlord_cents / 100,
                "commission_amount_egp": commission_cents / 100,
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

        onboarding_complete = account_status["payouts_enabled"] and account_status["details_submitted"]
        if onboarding_complete != profile.stripe_onboarding_complete:
            profile.stripe_onboarding_complete = onboarding_complete
            profile.save(update_fields=["stripe_onboarding_complete"])

        return Response(
            {
                "stripe_account_id": profile.stripe_account_id,
                "onboarding_complete": onboarding_complete,
                **account_status,
            },
            status=status.HTTP_200_OK,
        )
