from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_users_google_sub_verificationdocument_review_note_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='users',
            name='kyc_status',
            field=models.CharField(
                choices=[
                    ('NOT_STARTED', 'Not Started'),
                    ('CREATED', 'Created'),
                    ('STARTED', 'Started'),
                    ('PROCESSING', 'Processing'),
                    ('PENDING_REVIEW', 'Pending Review'),
                    ('APPROVED', 'Approved'),
                    ('FAILED', 'Failed'),
                    ('REJECTED', 'Rejected'),
                ],
                default='NOT_STARTED',
                max_length=20,
            ),
        ),
    ]
