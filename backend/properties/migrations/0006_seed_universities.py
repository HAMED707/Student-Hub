from django.db import migrations

from properties.constants import UNIVERSITIES_BY_CITY


def seed_universities(apps, schema_editor):
    University = apps.get_model('properties', 'University')
    rows = [
        University(name=name, city=city)
        for city, names in UNIVERSITIES_BY_CITY.items()
        for name in names
    ]
    University.objects.bulk_create(rows, ignore_conflicts=True)


def unseed_universities(apps, schema_editor):
    University = apps.get_model('properties', 'University')
    names = [name for names in UNIVERSITIES_BY_CITY.values() for name in names]
    University.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0005_unit_type_redesign'),
    ]

    operations = [
        migrations.RunPython(seed_universities, unseed_universities),
    ]
