from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0003_add_available_from'),
    ]

    operations = [
        # Convert transport_type: varchar → jsonb, wrapping existing value in a list.
        # Django cannot auto-cast varchar→jsonb, so we do it with raw SQL + a state-only AlterField.
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        ALTER TABLE properties_property
                            ADD COLUMN transport_type_new jsonb NOT NULL DEFAULT '[]'::jsonb;

                        UPDATE properties_property
                        SET transport_type_new =
                            CASE
                                WHEN transport_type IS NULL OR transport_type = ''
                                    THEN '[]'::jsonb
                                ELSE to_jsonb(ARRAY[transport_type::text])
                            END;

                        ALTER TABLE properties_property DROP COLUMN transport_type;
                        ALTER TABLE properties_property
                            RENAME COLUMN transport_type_new TO transport_type;
                    """,
                    reverse_sql="""
                        ALTER TABLE properties_property
                            ADD COLUMN transport_type_old varchar(20);

                        UPDATE properties_property
                        SET transport_type_old =
                            CASE
                                WHEN jsonb_array_length(transport_type) = 0 THEN NULL
                                ELSE transport_type->>0
                            END;

                        ALTER TABLE properties_property DROP COLUMN transport_type;
                        ALTER TABLE properties_property
                            RENAME COLUMN transport_type_old TO transport_type;
                    """,
                ),
            ],
            state_operations=[
                migrations.AlterField(
                    model_name='property',
                    name='transport_type',
                    field=models.JSONField(blank=True, default=list),
                ),
            ],
        ),

        # Add bills_included
        migrations.AddField(
            model_name='property',
            name='bills_included',
            field=models.JSONField(blank=True, default=list),
        ),

        # Remove num_roommates
        migrations.RemoveField(
            model_name='property',
            name='num_roommates',
        ),
    ]
