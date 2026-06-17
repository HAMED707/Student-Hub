"""
KYC API views.

Views:
    - CreateVerificationView → POST /api/kyc/create/
    - KycStatusView          → GET  /api/kyc/status/
    - PersonaWebhookView     → POST /api/webhooks/persona/  (registered
      directly in api/urls.py, not nested under kyc/, per the feature spec)
"""

import json
import logging

from django.http import HttpResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.accounts_api.permissions import IsLandlord
from kyc.models import LandlordVerification
from kyc.services import (
    PersonaError,
    _generate_one_time_link,
    create_inquiry,
    fetch_inquiry_status,
    map_persona_status,
    verify_webhook_signature,
)
from api.kyc_api.serializers import LandlordVerificationSerializer

logger = logging.getLogger(__name__)

# Statuses that mean "an inquiry is already in flight" — don't let a
# landlord spawn a second one while one of these is active.
ACTIVE_STATUSES = ["CREATED", "STARTED", "PROCESSING", "PENDING_REVIEW"]


class CreateVerificationView(APIView):
    """
    POST /api/kyc/create/
    Creates a new Persona Inquiry for the requesting landlord.
    Landlords only. If an active verification already exists, returns it
    instead of creating a duplicate.
    """

    permission_classes = [IsLandlord]

    def post(self, request):
        existing = LandlordVerification.objects.filter(
            landlord=request.user, status__in=ACTIVE_STATUSES
        ).first()
        if existing:
            fresh_url = _generate_one_time_link(existing.persona_inquiry_id)
            if fresh_url:
                existing.verification_url = fresh_url
                existing.save(update_fields=["verification_url"])
            return Response(LandlordVerificationSerializer(existing).data, status=status.HTTP_200_OK)

        try:
            result = create_inquiry(request.user)
        except PersonaError as exc:
            logger.error("Persona inquiry creation failed for landlord %s: %s", request.user.id, exc)
            return Response(
                {"error": "Could not start verification. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        mapped_status = map_persona_status(result["status"])

        from django.conf import settings as dj_settings

        verification = LandlordVerification.objects.create(
            landlord=request.user,
            persona_inquiry_id=result["inquiry_id"],
            inquiry_template_id=dj_settings.PERSONA_INQUIRY_TEMPLATE_ID,
            status=mapped_status,
            verification_url=result["verification_url"],
        )

        request.user.kyc_status = mapped_status
        request.user.save(update_fields=["kyc_status"])

        return Response(LandlordVerificationSerializer(verification).data, status=status.HTTP_201_CREATED)


class KycSyncView(APIView):
    """
    POST /api/kyc/sync/
    Pulls the current inquiry status directly from Persona and updates the DB.
    Use this when a webhook was missed — e.g. ngrok was down while the landlord
    completed the Persona flow and the status is stuck as CREATED.
    """

    permission_classes = [IsLandlord]

    def post(self, request):
        verification = LandlordVerification.objects.filter(
            landlord=request.user
        ).order_by("-created_at").first()

        if not verification:
            return Response({"status": request.user.kyc_status}, status=status.HTTP_200_OK)

        try:
            persona_status = fetch_inquiry_status(verification.persona_inquiry_id)
        except PersonaError as exc:
            logger.error("Persona status fetch failed for landlord %s: %s", request.user.id, exc)
            return Response(
                {"error": "Could not fetch verification status. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        mapped_status = map_persona_status(persona_status)

        if mapped_status != verification.status:
            verification.status = mapped_status
            if mapped_status == "APPROVED":
                verification.completed_at = timezone.now()
            verification.save(update_fields=["status", "completed_at"])

            request.user.kyc_status = mapped_status
            if mapped_status == "APPROVED":
                request.user.is_verified = True
            request.user.save(update_fields=["kyc_status", "is_verified"])

        return Response({"status": mapped_status}, status=status.HTTP_200_OK)


class KycStatusView(APIView):
    """
    GET /api/kyc/status/
    Returns the requesting landlord's current KYC status.
    """

    permission_classes = [IsLandlord]

    def get(self, request):
        return Response({"status": request.user.kyc_status}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class PersonaWebhookView(View):
    """
    POST /api/webhooks/persona/
    Receives webhook events from Persona and updates verification status.

    Always validates the Persona-Signature header before trusting anything
    in the payload — verification status is NEVER accepted from the
    frontend, only from a signature-verified Persona webhook.
    """

    def post(self, request):
        signature = request.headers.get("Persona-Signature", "")
        if not verify_webhook_signature(request.body, signature):
            return HttpResponse("Invalid signature", status=403)

        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return HttpResponse(status=400)

        # NOTE: this nested-payload shape (event.attributes.payload.data) is
        # Persona's standard webhook envelope, but double-check it against a
        # real sandbox webhook delivery before relying on it in production —
        # log the raw payload below if anything looks off.
        event = payload.get("data", {})
        event_attrs = event.get("attributes", {})
        inquiry_payload = event_attrs.get("payload", {}).get("data", {})
        inquiry_id = inquiry_payload.get("id")
        persona_status = inquiry_payload.get("attributes", {}).get("status")

        if not inquiry_id or not persona_status:
            logger.warning("Persona webhook missing inquiry id/status: %s", payload)
            return HttpResponse(status=200)  # 200 so Persona doesn't retry-storm us

        try:
            verification = LandlordVerification.objects.get(persona_inquiry_id=inquiry_id)
        except LandlordVerification.DoesNotExist:
            logger.warning("Persona webhook for unknown inquiry_id=%s", inquiry_id)
            return HttpResponse(status=200)

        mapped_status = map_persona_status(persona_status)
        verification.status = mapped_status
        verification.webhook_event = payload
        verification.webhook_received_at = timezone.now()
        if mapped_status == "APPROVED":
            verification.completed_at = timezone.now()
        verification.save()

        verification.landlord.kyc_status = mapped_status
        if mapped_status == "APPROVED":
            verification.landlord.is_verified = True
        verification.landlord.save(update_fields=["kyc_status", "is_verified"])

        return HttpResponse(status=200)
