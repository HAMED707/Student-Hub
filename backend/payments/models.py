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


    def __str__(self):
        return f"{self.payment_type} | {self.booking} | {self.status}"