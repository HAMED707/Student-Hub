import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookings", "0002_add_booking_unit"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="booking",
            name="deposit_amount_cents",
        ),
        migrations.RemoveField(
            model_name="booking",
            name="remaining_amount_cents",
        ),
        migrations.AlterField(
            model_name="booking",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending_payment", "Pending Payment"),
                    ("paid", "Paid"),
                    ("finished", "Finished"),
                    ("cancelled", "Cancelled"),
                    ("expired", "Expired"),
                ],
                default="pending_payment",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="booking",
            name="qr_token",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AddField(
            model_name="booking",
            name="payout_done",
            field=models.BooleanField(default=False),
        ),
    ]
