from django.contrib import admin
from .models import Payment, Payout


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["id", "booking", "amount_cents", "status", "paid_at"]
    list_filter = ["status"]
    search_fields = ["booking__tenant__username", "stripe_checkout_session_id", "stripe_payment_intent_id"]
    readonly_fields = ["raw_webhook_event", "created_at", "updated_at"]


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ["id", "booking", "landlord_amount_cents", "commission_amount_cents", "status", "triggered_at"]
    list_filter = ["status"]
    search_fields = ["booking__property__landlord__username", "stripe_transfer_id"]
    readonly_fields = ["created_at", "updated_at"]
