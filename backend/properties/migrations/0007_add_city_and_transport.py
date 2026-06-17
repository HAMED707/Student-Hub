from django.db import migrations, models

from properties.constants import CITIES, TRANSPORT_OPTIONS


def seed_cities_and_transports(apps, schema_editor):
    City = apps.get_model('properties', 'City')
    Transport = apps.get_model('properties', 'Transport')
    City.objects.bulk_create([City(name=name) for name in CITIES], ignore_conflicts=True)
    Transport.objects.bulk_create([Transport(name=name) for name in TRANSPORT_OPTIONS], ignore_conflicts=True)


def unseed_cities_and_transports(apps, schema_editor):
    City = apps.get_model('properties', 'City')
    Transport = apps.get_model('properties', 'Transport')
    City.objects.filter(name__in=CITIES).delete()
    Transport.objects.filter(name__in=TRANSPORT_OPTIONS).delete()


class Migration(migrations.Migration):
    """
    Hardcodes cities and transport modes into the database as real reference
    tables (City, Transport), mirroring the University table — previously
    these only existed as Python constants used for ad-hoc validation.
    """

    dependencies = [
        ('properties', '0006_seed_universities'),
    ]

    operations = [
        migrations.CreateModel(
            name='City',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Transport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.RunPython(seed_cities_and_transports, unseed_cities_and_transports),
    ]
