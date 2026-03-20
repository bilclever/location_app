from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_enforce_appartement_proprietaire_cascade'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailRegisterOTP',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254, verbose_name='Email cible')),
                ('username', models.CharField(max_length=150, verbose_name='Nom utilisateur propose')),
                ('password_hash', models.CharField(max_length=128, verbose_name='Mot de passe hache')),
                ('otp_hash', models.CharField(max_length=64, verbose_name='Hash OTP')),
                ('expires_at', models.DateTimeField(verbose_name='Expire a')),
                ('attempt_count', models.IntegerField(default=0, verbose_name='Nombre de tentatives')),
                ('is_used', models.BooleanField(default=False, verbose_name='Code utilise')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Date de creation')),
            ],
            options={
                'verbose_name': 'OTP inscription email',
                'verbose_name_plural': 'OTPs inscription email',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='emailregisterotp',
            index=models.Index(fields=['email', 'is_used'], name='api_emailre_email_978f59_idx'),
        ),
        migrations.AddIndex(
            model_name='emailregisterotp',
            index=models.Index(fields=['expires_at'], name='api_emailre_expires_a47d4e_idx'),
        ),
    ]
