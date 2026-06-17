from django.db import migrations, models
import django.db.models.deletion

from properties.constants import UNIVERSITIES_BY_CITY


def reseed_universities_with_city_fk(apps, schema_editor):
    City = apps.get_model('properties', 'City')
    University = apps.get_model('properties', 'University')
    for city_name, names in UNIVERSITIES_BY_CITY.items():
        city = City.objects.get(name=city_name)
        University.objects.bulk_create(
            [University(name=name, city=city) for name in names],
            ignore_conflicts=True,
        )


def unseed_universities(apps, schema_editor):
    University = apps.get_model('properties', 'University')
    names = [name for names in UNIVERSITIES_BY_CITY.values() for name in names]
    University.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):
    # atomic=False: PostgreSQL raises "cannot ALTER TABLE ... because it has
    # pending trigger events" if a DELETE and ALTER TABLE run in the same
    # transaction. Each operation runs in its own transaction instead.
    atomic = False

    dependencies = [
        ('properties', '0007_add_city_and_transport'),
    ]

    operations = [
        migrations.RunPython(unseed_universities, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='university',
            name='city',
        ),
        migrations.AddField(
            model_name='university',
            name='city',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='universities', to='properties.city'),
        ),
        migrations.AlterModelOptions(
            name='university',
            options={'ordering': ['city__name', 'name']},
        ),
        migrations.RunPython(reseed_universities_with_city_fk, unseed_universities),
    ]
