from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_location_bail_pdf'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailLoginOTP',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254, verbose_name='Email cible')),
                ('otp_hash', models.CharField(max_length=64, verbose_name='Hash OTP')),
                ('expires_at', models.DateTimeField(verbose_name='Expire a')),
                ('attempt_count', models.IntegerField(default=0, verbose_name='Nombre de tentatives')),
                ('is_used', models.BooleanField(default=False, verbose_name='Code utilise')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Date de creation')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='email_login_otps', to='api.user', verbose_name='Utilisateur')),
            ],
            options={
                'verbose_name': 'OTP connexion email',
                'verbose_name_plural': 'OTPs connexion email',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='emailloginotp',
            index=models.Index(fields=['email', 'is_used'], name='api_emaillo_email_6f5a9e_idx'),
        ),
        migrations.AddIndex(
            model_name='emailloginotp',
            index=models.Index(fields=['expires_at'], name='api_emaillo_expires_88011d_idx'),
        ),
    ]
