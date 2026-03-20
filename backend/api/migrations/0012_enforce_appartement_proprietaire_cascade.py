from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_fix_location_locataire_on_delete_set_null'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE api_appartement
                DROP CONSTRAINT IF EXISTS api_apparte_proprie_9376ce_fk_api_user_id;

                ALTER TABLE api_appartement
                ADD CONSTRAINT api_apparte_proprie_9376ce_fk_api_user_id
                FOREIGN KEY (proprietaire_id)
                REFERENCES api_user(id)
                ON DELETE CASCADE
                DEFERRABLE INITIALLY DEFERRED;
            """,
            reverse_sql="""
                ALTER TABLE api_appartement
                DROP CONSTRAINT IF EXISTS api_apparte_proprie_9376ce_fk_api_user_id;

                ALTER TABLE api_appartement
                ADD CONSTRAINT api_apparte_proprie_9376ce_fk_api_user_id
                FOREIGN KEY (proprietaire_id)
                REFERENCES api_user(id)
                ON DELETE NO ACTION
                DEFERRABLE INITIALLY DEFERRED;
            """,
        ),
    ]
