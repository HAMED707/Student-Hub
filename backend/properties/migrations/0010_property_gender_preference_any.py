from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("properties", "0009_property_city_and_transport_fk"),
    ]

    operations = [
        migrations.AlterField(
            model_name="property",
            name="gender_preference",
            field=models.CharField(
                choices=[
                    ("male", "Males Only"),
                    ("female", "Females Only"),
                    ("any", "Any Gender"),
                ],
                max_length=10,
            ),
        ),
    ]
