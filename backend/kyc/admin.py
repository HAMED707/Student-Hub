"""
KYC app admin.
Registers LandlordVerification for manual inspection in /admin — useful for
debugging webhook payloads during sandbox testing.
"""

from django.contrib import admin
from kyc.models import LandlordVerification


@admin.register(LandlordVerification)
class LandlordVerificationAdmin(admin.ModelAdmin):
    list_display = ["landlord", "status", "persona_inquiry_id", "completed_at", "created_at"]
    list_filter = ["status"]
    search_fields = ["landlord__username", "persona_inquiry_id"]
    readonly_fields = ["webhook_event", "webhook_received_at", "created_at", "updated_at"]
