from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("properties", "0002_alter_property_gender_preference"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_name = 'properties_property'
                              AND column_name = 'owner_id'
                        )
                        AND NOT EXISTS (
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_name = 'properties_property'
                              AND column_name = 'landlord_id'
                        ) THEN
                            ALTER TABLE properties_property
                            RENAME COLUMN owner_id TO landlord_id;
                        END IF;
                    END
                    $$;
                    """,
                    reverse_sql="""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_name = 'properties_property'
                              AND column_name = 'landlord_id'
                        )
                        AND NOT EXISTS (
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_name = 'properties_property'
                              AND column_name = 'owner_id'
                        ) THEN
                            ALTER TABLE properties_property
                            RENAME COLUMN landlord_id TO owner_id;
                        END IF;
                    END
                    $$;
                    """,
                )
            ],
            state_operations=[],
        )
    ]

