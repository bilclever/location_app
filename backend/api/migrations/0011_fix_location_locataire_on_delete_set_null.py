from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_enforce_appartement_owner_cascade'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE api_location
                DROP CONSTRAINT IF EXISTS api_location_locataire_id_61ca4439_fk_api_user_id;

                ALTER TABLE api_location
                ADD CONSTRAINT api_location_locataire_id_61ca4439_fk_api_user_id
                FOREIGN KEY (locataire_id)
                REFERENCES api_user(id)
                ON DELETE SET NULL
                DEFERRABLE INITIALLY DEFERRED;
            """,
            reverse_sql="""
                ALTER TABLE api_location
                DROP CONSTRAINT IF EXISTS api_location_locataire_id_61ca4439_fk_api_user_id;

                ALTER TABLE api_location
                ADD CONSTRAINT api_location_locataire_id_61ca4439_fk_api_user_id
                FOREIGN KEY (locataire_id)
                REFERENCES api_user(id)
                ON DELETE NO ACTION
                DEFERRABLE INITIALLY DEFERRED;
            """,
        ),
    ]
