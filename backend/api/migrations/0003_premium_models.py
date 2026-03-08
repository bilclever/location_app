# Generated manually for premium backend domain

import django.db.models.deletion
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_user_first_name_user_last_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='PremiumAppartementType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50)),
                ('label', models.CharField(max_length=120)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='premium_appartement_types', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['label'],
                'unique_together': {('owner', 'code')},
            },
        ),
        migrations.CreateModel(
            name='PremiumCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50)),
                ('label', models.CharField(max_length=120)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='premium_categories', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['label'],
                'unique_together': {('owner', 'code')},
            },
        ),
        migrations.CreateModel(
            name='PremiumLocataire',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=120)),
                ('prenoms', models.CharField(max_length=180)),
                ('email', models.EmailField(max_length=254)),
                ('telephone', models.CharField(blank=True, max_length=30)),
                ('date_naissance', models.DateField(blank=True, null=True)),
                ('profession', models.CharField(blank=True, max_length=120)),
                ('piece_identite_chiffree', models.TextField(blank=True)),
                ('garant_chiffre', models.TextField(blank=True)),
                ('historique_paiements', models.JSONField(blank=True, default=list)),
                ('date_depart', models.DateField(blank=True, null=True)),
                ('is_purged', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='premium_locataires', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PremiumBien',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titre', models.CharField(max_length=200)),
                ('adresse', models.CharField(max_length=300)),
                ('description', models.TextField(blank=True)),
                ('equipements', models.JSONField(blank=True, default=list)),
                ('loyer_hc', models.DecimalField(decimal_places=2, default=0, max_digits=12, validators=[MinValueValidator(0)])),
                ('charges', models.DecimalField(decimal_places=2, default=0, max_digits=12, validators=[MinValueValidator(0)])),
                ('latitude', models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ('statut', models.CharField(choices=[('LOUE', 'Loue'), ('VACANT', 'Vacant'), ('TRAVAUX', 'En travaux')], default='VACANT', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('appartement_type', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='biens', to='api.premiumappartementtype')),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='biens', to='api.premiumcategory')),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='premium_biens', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PremiumBail',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_entree', models.DateField()),
                ('date_sortie', models.DateField(blank=True, null=True)),
                ('revision_annuelle', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('depot_garantie', models.DecimalField(decimal_places=2, default=0, max_digits=12, validators=[MinValueValidator(0)])),
                ('statut', models.CharField(choices=[('ACTIF', 'Actif'), ('TERMINE', 'Termine'), ('RESILIE', 'Resilie')], default='ACTIF', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bien', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='baux', to='api.premiumbien')),
                ('locataire', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='baux', to='api.premiumlocataire')),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='premium_baux', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PremiumComptableEcriture',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type_ecriture', models.CharField(choices=[('REVENU', 'Revenu'), ('DEPENSE', 'Depense')], max_length=10)),
                ('source', models.CharField(choices=[('MANUEL', 'Manuel'), ('AUTO_LOYER', 'Automatique Loyer')], default='MANUEL', max_length=20)),
                ('libelle', models.CharField(max_length=255)),
                ('categorie', models.CharField(blank=True, max_length=120)),
                ('date_operation', models.DateField()),
                ('montant', models.DecimalField(decimal_places=2, max_digits=12, validators=[MinValueValidator(0)])),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bail', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='ecritures', to='api.premiumbail')),
                ('bien', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='ecritures', to='api.premiumbien')),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='premium_ecritures', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date_operation', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PremiumPayment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_paiement', models.DateField()),
                ('periode_debut', models.DateField()),
                ('periode_fin', models.DateField()),
                ('montant', models.DecimalField(decimal_places=2, max_digits=12, validators=[MinValueValidator(0)])),
                ('statut', models.CharField(choices=[('PAYE', 'Paye'), ('PARTIEL', 'Partiel'), ('IMPAYE', 'Impaye')], default='PAYE', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bail', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='api.premiumbail')),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='premium_payments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date_paiement', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PremiumPaymentAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('INSERT', 'Insert'), ('UPDATE', 'Update'), ('DELETE', 'Delete')], max_length=10)),
                ('old_data', models.JSONField(blank=True, null=True)),
                ('new_data', models.JSONField(blank=True, null=True)),
                ('changed_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='premium_payment_audit_actor_logs', to=settings.AUTH_USER_MODEL)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='premium_payment_audit_logs', to=settings.AUTH_USER_MODEL)),
                ('payment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to='api.premiumpayment')),
            ],
            options={
                'ordering': ['-changed_at'],
            },
        ),
    ]
