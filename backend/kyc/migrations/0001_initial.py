import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="LandlordVerification",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "persona_inquiry_id",
                    models.CharField(blank=True, db_index=True, max_length=100, null=True),
                ),
                (
                    "inquiry_template_id",
                    models.CharField(blank=True, max_length=100, null=True),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("NOT_STARTED", "Not Started"),
                            ("CREATED", "Created"),
                            ("STARTED", "Started"),
                            ("PROCESSING", "Processing"),
                            ("PENDING_REVIEW", "Pending Review"),
                            ("APPROVED", "Approved"),
                            ("FAILED", "Failed"),
                            ("REJECTED", "Rejected"),
                        ],
                        default="NOT_STARTED",
                        max_length=20,
                    ),
                ),
                ("verification_url", models.URLField(blank=True, null=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("webhook_event", models.JSONField(blank=True, default=dict)),
                ("webhook_received_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "landlord",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="kyc_verifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
