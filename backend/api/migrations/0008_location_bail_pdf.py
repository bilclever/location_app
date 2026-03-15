from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_appartement_bien_link'),
    ]

    operations = [
        migrations.AddField(
            model_name='location',
            name='bail_pdf',
            field=models.FileField(blank=True, null=True, upload_to='baux_numeriques/', verbose_name='Bail PDF'),
        ),
        migrations.AddField(
            model_name='location',
            name='date_generation_bail',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Date generation bail'),
        ),
    ]
