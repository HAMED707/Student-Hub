"""
Payments API views.

Views:
    - InitiatePaymentView  → POST /api/payments/initiate/       ← student starts checkout
    - PaymobWebhookView    → POST /api/payments/webhook/        ← Paymob callback (public)
    - PaymentListView      → GET  /api/payments/transactions/   ← history
    - PaymentSummaryView   → GET  /api/payments/summary/        ← landlord dashboard stats
    - WithdrawalView       → GET/POST /api/payments/withdraw/   ← landlord withdrawals
"""

import logging
from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from payments.models import Payment, WithdrawalRequest
from payments.services import (
    authenticate, create_paymob_order, get_payment_token,
    get_iframe_url, verify_hmac,
)
from api.payments_api.serializers import (
    PaymentSerializer, InitiatePaymentSerializer,
    WithdrawalSerializer, WithdrawalCreateSerializer,
)
from api.accounts_api.permissions import IsStudent, IsLandlord
from bookings.models import Booking

logger = logging.getLogger(__name__)


class InitiatePaymentView(APIView):
    """
    POST /api/payments/initiate/
    Student triggers checkout for an approved booking.

    Steps performed server-side:
        1. Validate booking ownership and status
        2. Create a pending Payment record
        3. Call Paymob: authenticate → register order → get payment token
        4. Return iframe_url to the frontend

    Body: { "booking_id": <int> }
    """
    permission_classes = [IsStudent]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        booking_id = serializer.validated_data["booking_id"]
        booking    = Booking.objects.select_related("property__owner", "tenant").get(id=booking_id)

        # Payment amount = monthly rent × duration
        amount = booking.property.price * booking.duration_months

        # Create the Payment record first so we have a merchant_order_id
        payment = Payment.objects.create(
            student=request.user,
            landlord=booking.property.owner,
            booking=booking,
            amount=amount,
            status="pending",
        )

        try:
            auth_token       = authenticate()
            paymob_order_id  = create_paymob_order(auth_token, amount, payment.id)
            payment_token    = get_payment_token(auth_token, paymob_order_id, amount, request.user)

            payment.paymob_order_id = paymob_order_id
            payment.payment_token   = payment_token
            payment.save(update_fields=["paymob_order_id", "payment_token", "updated_at"])

        except Exception as e:
            # Clean up the pending payment so the student can retry
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            logger.error(f"Paymob initiation failed for payment {payment.id}: {e}")
            return Response(
                {"error": "Payment gateway error. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "payment_id":  payment.id,
                "iframe_url":  get_iframe_url(payment_token),
                "amount":      str(amount),
                "currency":    "EGP",
            },
            status=status.HTTP_201_CREATED,
        )


class PaymobWebhookView(APIView):
    """
    POST /api/payments/webhook/
    Paymob calls this after every transaction attempt.

    Configure in Paymob dashboard:
        Developers → Payment Integrations → Transaction processed callback

    This endpoint is PUBLIC (AllowAny) — Paymob has no auth token.
    Security is provided by HMAC verification instead.
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # Skip JWT auth — this is called by Paymob, not a user

    def post(self, request):
        # ── HMAC verification ─────────────────────────────────
        received_hmac = request.query_params.get("hmac", "")
        if not verify_hmac(request.data, received_hmac):
            logger.warning("Paymob webhook received with invalid HMAC.")
            return Response({"error": "Invalid HMAC."}, status=status.HTTP_400_BAD_REQUEST)

        obj            = request.data.get("obj", {})
        transaction_id = str(obj.get("id", ""))
        is_success     = obj.get("success", False)
        order_data     = obj.get("order", {})
        merchant_order_id = str(order_data.get("merchant_order_id", ""))

        # ── Find the matching Payment ─────────────────────────
        try:
            payment = Payment.objects.select_related("landlord__landlord_profile").get(
                id=merchant_order_id
            )
        except Payment.DoesNotExist:
            logger.error(f"Paymob webhook: no Payment found for merchant_order_id={merchant_order_id}")
            return Response(status=status.HTTP_200_OK)  # Always 200 so Paymob stops retrying

        # Idempotency: skip if already processed
        if payment.status in ("held", "released", "refunded"):
            return Response(status=status.HTTP_200_OK)

        payment.paymob_transaction_id = transaction_id
        payment.is_success            = is_success

        if is_success:
            payment.status = "held"
            # Fire payment notification via notifications app
            from notifications.services import push_notification
            push_notification(
                recipient=payment.student,
                actor=None,
                notification_type="payment",
                title="Payment Confirmed ✅",
                message=f"Your payment of {payment.amount} EGP has been received and is held securely.",
                data={"payment_id": payment.id, "booking_id": payment.booking_id},
            )
            push_notification(
                recipient=payment.landlord,
                actor=payment.student,
                notification_type="payment",
                title="Rent Payment Received 💰",
                message=f"{payment.student.username} paid {payment.amount} EGP. Funds will be released when the stay is completed.",
                data={"payment_id": payment.id, "booking_id": payment.booking_id},
            )
        else:
            payment.status = "failed"

        payment.save(update_fields=["paymob_transaction_id", "is_success", "status", "updated_at"])
        return Response(status=status.HTTP_200_OK)


class PaymentListView(APIView):
    """
    GET /api/payments/transactions/
    Student sees their own payments.
    Landlord sees payments received for their properties.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == "student":
            queryset = Payment.objects.filter(student=request.user).select_related("booking__property")
        else:
            queryset = Payment.objects.filter(landlord=request.user).select_related("booking__property", "student")

        serializer = PaymentSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PaymentSummaryView(APIView):
    """
    GET /api/payments/summary/
    Landlord dashboard stats card.
    """
    permission_classes = [IsLandlord]

    def get(self, request):
        profile = request.user.landlord_profile
        held    = Payment.objects.filter(landlord=request.user, status="held").values_list("amount", flat=True)
        held_total = sum(held)

        return Response(
            {
                "total_income":       str(profile.total_income),
                "available_balance":  str(profile.available_balance),
                "held_on_platform":   str(held_total),
                "pending_withdrawal": str(
                    sum(
                        WithdrawalRequest.objects.filter(
                            landlord=request.user, status="pending"
                        ).values_list("amount", flat=True)
                    )
                ),
            },
            status=status.HTTP_200_OK,
        )


class WithdrawalView(APIView):
    """
    GET  /api/payments/withdraw/ → landlord's withdrawal history
    POST /api/payments/withdraw/ → submit a new withdrawal request
    """
    permission_classes = [IsLandlord]

    def get(self, request):
        queryset   = WithdrawalRequest.objects.filter(landlord=request.user)
        serializer = WithdrawalSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = WithdrawalCreateSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        withdrawal = serializer.save(landlord=request.user)
        return Response(WithdrawalSerializer(withdrawal).data, status=status.HTTP_201_CREATED)