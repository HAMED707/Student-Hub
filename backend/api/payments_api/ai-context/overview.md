## payment overview ##


# ────────────────────────Start URL─────────────────────────────────────

```
from django.urls import path
from .views import (
    InitiateDepositView,
    PayRemainingOnlineView,
    MarkRemainingOfflineView,
    MyPaymentsView,
    PaymobWebhookView,
)

urlpatterns = [
    path("deposit/",           InitiateDepositView.as_view(),     name="pay-deposit"),
    path("remaining/online/",  PayRemainingOnlineView.as_view(),  name="pay-remaining-online"),
    path("remaining/offline/", MarkRemainingOfflineView.as_view(),name="pay-remaining-offline"),
    path("my/",                MyPaymentsView.as_view(),          name="my-payments"),
    path("webhook/",           PaymobWebhookView.as_view(),       name="paymob-webhook"),
]
        
```

# ────────────────────────End URL───────────────────────────────────────



# ────────────────────────Start Serializer──────────────────────────────

```


from rest_framework import serializers
from payments.models import Payment
from bookings.models import Booking 




class PaymentSerializer(serializers.ModelSerializer):
    """Read-only — used to display payment info."""
    class Meta:
        model = Payment
        fields = [
            "id",
            "booking",
            "payment_type",
            "payment_method",
            "amount_cents",
            "status",
            "paymob_order_id",
            "transaction_id",
            "failure_reason",
            "paid_at",
            "created_at",
        ]

        read_only_fields = fields


#──────────Deposit────────────────────────────────────────────────────────────────────────────────────────────

class InitiateDepositSerializer(serializers.Serializer):
    """Validates deposit initiation request."""
    booking_id = serializers.IntegerField()
    phone      = serializers.CharField(max_length=20 , required=False, default="NA")

    def validate_booking_id(self, value):
        request = self.context.get("request")

        try:
            booking = Booking.objects.get(
                id     = value,
                tenant = request.user,
                status = "pending_payment",
            )
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found or not in pending_payment status.")
        

        if booking.is_expired:
            booking.status = "expired"
            booking.save()
            raise serializers.ValidationError("Booking has expired. Please create a new booking.")
        
        # Check duplicate pending deposit
        if booking.payments.filter(
            payment_type = Payment.PaymentType.DEPOSIT,
            status       = Payment.Status.PENDING,
        ).exists():
            raise serializers.ValidationError("A deposit payment is already in progress.")
        
        return value


#──────────Remaining────────────────────────────────────────────────────────────────────────────────────────────

class PayRemainingSerializer(serializers.Serializer):
    """Validates remaining payment initiation request."""
    booking_id = serializers.IntegerField()
    phone      = serializers.CharField(max_length=20, required=False, default="NA")

    def validate_booking_id(self, value):
        request = self.context.get("request")

        try:
            booking = Booking.objects.get(
                id     = value,
                tenant = request.user,
                status = "confirmed",
            )
        except Booking.DoesNotExist:
            raise serializers.ValidationError(
                "Booking not found or not yet confirmed."
            )

        # Prevent duplicate remaining payment
        if booking.payments.filter(
            payment_type = Payment.PaymentType.REMAINING,
            status__in   = [Payment.Status.PENDING, Payment.Status.COMPLETED],
        ).exists():
            raise serializers.ValidationError(
                "Remaining payment already exists for this booking."
            )

        return value


#──────────Offline-Pay────────────────────────────────────────────────────────────────────────────────────────────

class MarkOfflineSerializer(serializers.Serializer):
    """Validates landlord marking remaining payment as cash."""
    booking_id = serializers.IntegerField()

    def validate_booking_id(self, value):
        request = self.context.get("request")

        try:
            booking = Booking.objects.get(
                id                    = value,
                property__landlord    = request.user,
                status                = "confirmed",
            )
        except Booking.DoesNotExist:
            raise serializers.ValidationError(
                "Booking not found or you don't own this property."
            )

        if booking.payments.filter(
            payment_type = Payment.PaymentType.REMAINING,
            status__in   = [Payment.Status.PENDING, Payment.Status.COMPLETED],
        ).exists():
            raise serializers.ValidationError(
                "Remaining payment already recorded for this booking."
            )

        return value
```

# ────────────────────────End Serializer────────────────────────────────




# ────────────────────────Start View────────────────────────────────────

```

import json
import hmac
import hashlib

from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.views import View
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from bookings.models import Booking
from payments.models import Payment
from payments.paymob import PaymobService
from .serializers import (
    PaymentSerializer,
    InitiateDepositSerializer,
    PayRemainingSerializer,
    MarkOfflineSerializer,
)


class InitiateDepositView(APIView):
    """
    Step 1 of payment flow.
    Student initiates deposit
    
    the overview flow of the whole payment proccess is :
        Create Intention
            ↓
        Redirect User
            ↓
        Payment Happens
            ↓
        Webhook Arrives
            ↓
        Verify HMAC
            ↓
        Update Database
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiateDepositSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        booking = Booking.objects.get(id=serializer.validated_data["booking_id"])

        billing_data = {
            "first_name":      request.user.first_name or "NA",
            "last_name":       request.user.last_name  or "NA",
            "email":           request.user.email,
            "phone_number":    serializer.validated_data["phone"],
            "apartment":       "NA",
            "floor":           "NA",
            "street":          "NA",
            "building":        "NA",
            "shipping_method": "NA",
            "postal_code":     "NA",
            "city":            "NA",
            "country":         "EG",
            "state":           "NA",
        }

        try:
                     #Create Payment Intention
            result = PaymobService.initiate_payment(
                amount_cents = booking.deposit_amount_cents,
                billing_data = billing_data,
            )

            Payment.objects.create(
                booking         = booking,
                payment_type    = Payment.PaymentType.DEPOSIT,
                payment_method  = Payment.PaymentMethod.ONLINE,
                amount_cents    = booking.deposit_amount_cents,
                paymob_order_id = str(result["order_id"]),
                status          = Payment.Status.PENDING,
            )

            return Response(result)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

#──────────────────────────────────────────────────────────────────────────────────────────────────────

class PayRemainingOnlineView(APIView):
    """Student pays remaining amount online via Paymob."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PayRemainingSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        booking = Booking.objects.get(id=serializer.validated_data["booking_id"])

        billing_data = {
            "first_name":      request.user.first_name or "NA",
            "last_name":       request.user.last_name  or "NA",
            "email":           request.user.email,
            "phone_number":    serializer.validated_data["phone"],
            "apartment":       "NA",
            "floor":           "NA",
            "street":          "NA",
            "building":        "NA",
            "shipping_method": "NA",
            "postal_code":     "NA",
            "city":            "NA",
            "country":         "EG",
            "state":           "NA",
        }

        try:
            result = PaymobService.initiate_payment(
                amount_cents = booking.remaining_amount_cents,
                billing_data = billing_data,
            )

            Payment.objects.create(
                booking         = booking,
                payment_type    = Payment.PaymentType.REMAINING,
                payment_method  = Payment.PaymentMethod.ONLINE,
                amount_cents    = booking.remaining_amount_cents,
                paymob_order_id = str(result["order_id"]),
                status          = Payment.Status.PENDING,
            )

            return Response(result)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)


#──────────────────────────────────────────────────────────────────────────────────────────────────────

class MarkRemainingOfflineView(APIView):
    """Landlord marks remaining amount as paid in cash."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MarkOfflineSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        booking = Booking.objects.get(id=serializer.validated_data["booking_id"])

        with transaction.atomic():
            Payment.objects.create(
                booking        = booking,
                payment_type   = Payment.PaymentType.REMAINING,
                payment_method = Payment.PaymentMethod.OFFLINE,
                amount_cents   = booking.remaining_amount_cents,
                status         = Payment.Status.COMPLETED,
                paid_at        = timezone.now(),
            )

            booking.status = "completed"
            booking.save()

        return Response({"message": "Cash payment recorded. Booking marked as completed."})


#──────────────────────────────────────────────────────────────────────────────────────────────────────


class MyPaymentsView(APIView):
    """Student views all their payments."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payments = Payment.objects.filter(
            booking__tenant=request.user
        ).select_related("booking")

        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)


#──────────────────────────────────────────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name="dispatch")
class PaymobWebhookView(View):
    """
    Paymob calls this after every transaction.
    Flow: verify HMAC → update Payment → update Booking.

    the idea of HMAC is to make new HMAC based on data i have and 
    make sure that it match the received hmac  
    """

    def post(self, request):
        try:
            data = json.loads(request.body)
        except Exception:
            return HttpResponse(status=400)

        received_hmac = request.GET.get("hmac", "")
        # Step 1: verify this is really from Paymob
        if not self._verify_hmac(data, received_hmac):
            return HttpResponse("Invalid HMAC", status=403)

        obj            = data.get("obj", {})
        order_id       = str(obj.get("order", {}).get("id", ""))
        success        = obj.get("success", False)
        transaction_id = str(obj.get("id", ""))

        # Step 2: find the payment record
        try:
            payment = Payment.objects.select_related("booking__property").get(
                paymob_order_id=order_id
            )
        except Payment.DoesNotExist:
            return HttpResponse(status=404)

        # Step 3: idempotency — ignore if already processed
        if payment.status == Payment.Status.COMPLETED:
            return HttpResponse(status=200)

        # Step 4: update payment + booking atomically
        with transaction.atomic():
            if success:
                payment.status         = Payment.Status.COMPLETED
                payment.transaction_id = transaction_id
                payment.raw_response   = obj
                payment.paid_at        = timezone.now()
                payment.save()

                booking = payment.booking
                if payment.payment_type == Payment.PaymentType.DEPOSIT:
                    booking.status = "deposit_paid"
                elif payment.payment_type == Payment.PaymentType.REMAINING:
                    booking.status = "completed"
                booking.save()

            else:
                payment.status         = Payment.Status.FAILED
                payment.failure_reason = obj.get("data", {}).get("message", "")
                payment.raw_response   = obj
                payment.save()

        return HttpResponse(status=200)

    def _verify_hmac(self, data ,received_hmac):
        """Verify Paymob HMAC signature."""
        obj           = data.get("obj", {})

        def fmt(value):
            """Convert Python booleans to lowercase — Paymob expects true/false not True/False"""
            if isinstance(value, bool):
                return "true" if value else "false"
            if value is None:
                return ""
            return str(value)
        fields = [
            fmt(obj.get("amount_cents",           "")),
            fmt(obj.get("created_at",             "")),
            fmt(obj.get("currency",               "")),
            fmt(obj.get("error_occured",          "")),
            fmt(obj.get("has_parent_transaction", "")),
            fmt(obj.get("id",                     "")),
            fmt(obj.get("integration_id",         "")),
            fmt(obj.get("is_3d_secure",           "")),
            fmt(obj.get("is_auth",                "")),
            fmt(obj.get("is_capture",             "")),
            fmt(obj.get("is_refunded",            "")),
            fmt(obj.get("is_standalone_payment",  "")),
            fmt(obj.get("is_voided",              "")),
            fmt(obj.get("order", {}).get("id",    "")),
            fmt(obj.get("owner",                  "")),
            fmt(obj.get("pending",                "")),
            fmt(obj.get("source_data", {}).get("pan",      "")),
            fmt(obj.get("source_data", {}).get("sub_type", "")),
            fmt(obj.get("source_data", {}).get("type",     "")),
            fmt(obj.get("success",                "")),
        ]


        expected = hmac.new(
            settings.PAYMOB_HMAC_SECRET.encode(),
            "".join(fields).encode(),
            hashlib.sha512
        ).hexdigest()

        
        return hmac.compare_digest(expected, received_hmac)
```

# ────────────────────────End View──────────────────────────────────────





# ────────────────────────Start Signals────────────────────────────────────
```


```
# ────────────────────────End Signals──────────────────────────────────────





# ────────────────────────Start Apps────────────────────────────────────
```


```
# ────────────────────────End Apps──────────────────────────────────────






# ────────────────────────Start Model────────────────────────────────────

```
from django.db import models
from bookings.models import Booking



class Payment(models.Model):


    class Status(models.TextChoices):
        PENDING   = "pending" , "Pending"
        COMPLETED = "completed" , "Completed"
        FAILED    = "failed" , "Failed"
        REFUNDED  = "refunded" , "Refunded"

    class PaymentType(models.TextChoices):
        DEPOSIT   = "deposit" , "Deposit"
        REMAINING = "remaining" , "Remaining"

    class PaymentMethod(models.TextChoices):
        ONLINE  = "online",  "Online (Paymob)"
        OFFLINE = "offline", "Offline (Cash)"


    #────────────────────────────────────────────────────────────────────────────────────────
    booking = models.ForeignKey( Booking , on_delete=models.CASCADE ,related_name="payments" )


    #──────Transaction Info──────────────────────────────────────────────────────────────────────────────────
    payment_type    = models.CharField(max_length=20 , choices=PaymentType.choices , default=PaymentType.DEPOSIT)
    payment_method  = models.CharField(max_length=20 , choices=PaymentMethod.choices , default=PaymentMethod.ONLINE )
    amount_cents    = models.PositiveIntegerField()
    status          = models.CharField(max_length=20 ,choices=Status.choices ,default=Status.PENDING)

    #──────Paymob fields──────────────────────────────────────────────────────────────────────────────────
    paymob_order_id = models.CharField(max_length=100, blank=True, null=True)
    transaction_id  = models.CharField(max_length=100, blank=True, null=True, unique=True)
    raw_response   = models.JSONField(default=dict, blank=True)
    failure_reason = models.TextField(blank=True, null=True)
    paid_at        = models.DateTimeField(blank=True, null=True)

    #───────Audit─────────────────────────────────────────────────────────────────────────────────
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    # Add this Meta class to your Payment model
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["booking", "payment_type"],
                condition=models.Q(status="completed"),
                name="unique_completed_payment_type_per_booking"
            )
        ]
        
    def __str__(self):
        return f"{self.payment_type} | {self.booking} | {self.status}"
```

# ────────────────────────End Model──────────────────────────────────────




# ────────────────────────Paymob──────────────────────────────────────

```
import requests
from django.conf import settings

PAYMOB_BASE_URL = "https://accept.paymob.com/api"


class PaymobService:

    @staticmethod
    def get_auth_token():
        """
        Step 1: Authenticate with Paymob.
        Returns auth_token (valid ~1 hour).
        """
        response = requests.post(
            f"{PAYMOB_BASE_URL}/auth/tokens",
            json={"api_key": settings.PAYMOB_API_KEY}
        )
        response.raise_for_status()
        return response.json()["token"]

    @staticmethod
    def create_order(auth_token, amount_cents):
        """
        Step 2: Register order in Paymob.
        Returns order_id.
        """
        response = requests.post(
            f"{PAYMOB_BASE_URL}/ecommerce/orders",
            json={
                "auth_token":      auth_token,
                "delivery_needed": False,
                "amount_cents":    amount_cents,
                "currency":        "EGP",
                "items":           [],
            }
        )
        response.raise_for_status()
        return response.json()["id"]

    @staticmethod
    def get_payment_key(auth_token, order_id, amount_cents, billing_data):
        """
        Step 3: Get short-lived payment key.
        Returns payment_key token used in iframe URL.
        """
        response = requests.post(
            f"{PAYMOB_BASE_URL}/acceptance/payment_keys",
            json={
                "auth_token":    auth_token,
                "amount_cents":  amount_cents,
                "expiration":    3600,
                "order_id":      order_id,
                "billing_data":  billing_data,
                "currency":      "EGP",
                "integration_id": settings.PAYMOB_INTEGRATION_ID,
            }
        )
        response.raise_for_status()
        return response.json()["token"]

    @classmethod
    def initiate_payment(cls, amount_cents, billing_data):
        """
        Runs all 3 steps together.
        Returns iframe_url, order_id, payment_key.
        """
        auth_token  = cls.get_auth_token()
        order_id    = cls.create_order(auth_token, amount_cents)
        payment_key = cls.get_payment_key(auth_token, order_id, amount_cents, billing_data)

        return {
            "iframe_url":  f"https://accept.paymob.com/api/acceptance/iframes/{settings.PAYMOB_IFRAME_ID}?payment_token={payment_key}",
            "order_id":    order_id,
            "payment_key": payment_key,
        }
```
# ────────────────────────End paymob──────────────────────────────────────


