# Generated manually to add the `slug` field to Appartement
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='appartement',
            name='slug',
            field=models.SlugField(max_length=255, unique=False, db_index=True, null=True, blank=True),
        ),
    ]
