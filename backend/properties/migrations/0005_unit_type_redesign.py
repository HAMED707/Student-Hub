import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Restructures Property into the Apartment/Room/Bed unit_type model:
      - property_type (4 choices) -> unit_type (3 choices) + rental_mode
      - price becomes optional (only required for whole-apartment listings)
      - nearby_university (single string) -> nearby_universities (M2M to a
        new University reference table, seeded in the next migration)
      - amenities/bills_included (JSON lists) -> 5 hardcoded boolean fields

    Existing Property rows are test/seed data and are wiped + re-seeded via
    `seed_properties --reset` after this migration, so no data-preserving
    RunPython step is needed for the property table itself.
    """

    dependencies = [
        ('properties', '0004_transport_jsonfield_bills_remove_roommates'),
    ]

    operations = [
        migrations.CreateModel(
            name='University',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('city', models.CharField(choices=[
                    ('Cairo', 'Cairo'), ('Giza', 'Giza'), ('Alexandria', 'Alexandria'),
                    ('New Cairo', 'New Cairo'), ('Mansoura', 'Mansoura'), ('Tanta', 'Tanta'),
                    ('Zagazig', 'Zagazig'), ('Ismailia', 'Ismailia'), ('Assiut', 'Assiut'),
                    ('Suez', 'Suez'), ('Port Said', 'Port Said'),
                ], max_length=100)),
            ],
            options={
                'ordering': ['city', 'name'],
            },
        ),
        migrations.RemoveField(
            model_name='property',
            name='amenities',
        ),
        migrations.RemoveField(
            model_name='property',
            name='bills_included',
        ),
        migrations.RemoveField(
            model_name='property',
            name='nearby_university',
        ),
        migrations.RemoveField(
            model_name='property',
            name='property_type',
        ),
        migrations.AddField(
            model_name='property',
            name='unit_type',
            field=models.CharField(choices=[('apartment', 'Apartment'), ('room', 'Room'), ('bed', 'Bed')], default='apartment', max_length=20),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='property',
            name='rental_mode',
            field=models.CharField(blank=True, choices=[('whole_apartment', 'Whole Apartment'), ('by_unit', 'By Room/Bed')], max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='property',
            name='has_internet',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='property',
            name='has_ac',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='property',
            name='has_water',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='property',
            name='has_electricity',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='property',
            name='has_gas',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='property',
            name='nearby_universities',
            field=models.ManyToManyField(blank=True, related_name='properties', to='properties.university'),
        ),
        migrations.AlterField(
            model_name='property',
            name='price',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, validators=[django.core.validators.MinValueValidator(0)]),
        ),
    ]
