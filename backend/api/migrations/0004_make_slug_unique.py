from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_populate_slugs'),
    ]

    operations = [
        migrations.AlterField(
            model_name='appartement',
            name='slug',
            field=models.SlugField(max_length=255, unique=True, db_index=True, null=True, blank=True),
        ),
    ]
