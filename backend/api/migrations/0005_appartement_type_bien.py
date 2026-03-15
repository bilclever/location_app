from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_alter_location_statut'),
    ]

    operations = [
        migrations.AddField(
            model_name='appartement',
            name='type_bien',
            field=models.CharField(
                choices=[
                    ('APPARTEMENT', 'Appartement'),
                    ('MAISON', 'Maison'),
                    ('PARKING', 'Parking'),
                    ('LOCAL_COMMERCIAL', 'Local commercial'),
                    ('BUREAU', 'Bureau'),
                    ('TERRAIN', 'Terrain'),
                ],
                default='APPARTEMENT',
                max_length=30,
            ),
        ),
    ]
