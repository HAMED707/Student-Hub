from django.contrib import admin
from payments.models import Payment, WithdrawalRequest

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ["id", "student", "landlord", "amount", "status", "is_success",
                      "paymob_transaction_id", "created_at"]
    list_filter   = ["status", "is_success"]
    search_fields = ["student__username", "landlord__username", "paymob_transaction_id"]
    readonly_fields = ["created_at", "updated_at", "paymob_order_id",
                       "paymob_transaction_id", "payment_token"]
    list_editable = ["status"]

@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display  = ["landlord", "amount", "status", "bank_name", "created_at"]
    list_filter   = ["status"]
    search_fields = ["landlord__username", "account_name", "bank_name"]
    readonly_fields = ["created_at", "updated_at"]
    list_editable = ["status"]