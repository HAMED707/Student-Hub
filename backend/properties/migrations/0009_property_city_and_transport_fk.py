from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


def wipe_properties(apps, schema_editor):
    Property = apps.get_model('properties', 'Property')
    Property.objects.all().delete()


class Migration(migrations.Migration):
    # Same PostgreSQL deferred-trigger issue as 0008 — DELETE then ALTER TABLE
    # must run in separate transactions.
    atomic = False

    dependencies = [
        ('properties', '0008_university_city_fk'),
    ]

    operations = [
        migrations.RunPython(wipe_properties, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='property',
            name='city',
        ),
        migrations.AddField(
            model_name='property',
            name='city',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='properties', to='properties.city'),
        ),
        migrations.RemoveField(
            model_name='property',
            name='transport_type',
        ),
        migrations.AddField(
            model_name='property',
            name='transport_types',
            field=models.ManyToManyField(blank=True, related_name='properties', to='properties.transport'),
        ),
    ]
