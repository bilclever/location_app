from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def delete_orphan_appartements(apps, schema_editor):
    Appartement = apps.get_model('api', 'Appartement')
    Appartement.objects.filter(proprietaire__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_email_login_otp'),
    ]

    operations = [
        migrations.RunPython(delete_orphan_appartements, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='appartement',
            name='proprietaire',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='appartements_proprietaire', to=settings.AUTH_USER_MODEL, verbose_name='Propriétaire'),
        ),
    ]
