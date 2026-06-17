from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_users_kyc_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='landlordprofile',
            name='stripe_account_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='landlordprofile',
            name='stripe_onboarding_complete',
            field=models.BooleanField(default=False),
        ),
    ]
