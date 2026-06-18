from django.contrib import admin
from .models import Payment, Payout


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ["id", "booking", "amount_display", "status", "paid_at", "created_at"]
    list_filter   = ["status"]
    search_fields = ["booking__tenant__username", "stripe_checkout_session_id", "stripe_payment_intent_id"]
    readonly_fields = ["stripe_checkout_session_id", "stripe_payment_intent_id", "raw_webhook_event", "paid_at", "created_at", "updated_at"]

    @admin.display(description="Amount (AED)")
    def amount_display(self, obj):
        return f"{obj.amount_cents / 100:.2f} AED"


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display  = ["id", "booking", "landlord_display", "commission_display", "status", "triggered_at"]
    list_filter   = ["status"]
    search_fields = ["booking__property__landlord__username", "stripe_transfer_id"]
    readonly_fields = ["stripe_transfer_id", "triggered_at", "created_at", "updated_at"]

    @admin.display(description="Landlord amount (AED)")
    def landlord_display(self, obj):
        return f"{obj.landlord_amount_cents / 100:.2f} AED"

    @admin.display(description="Commission (AED)")
    def commission_display(self, obj):
        return f"{obj.commission_amount_cents / 100:.2f} AED"
