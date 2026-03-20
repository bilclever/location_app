from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils.text import slugify
from django.db.models.signals import pre_save
from decimal import Decimal
from django.utils.html import format_html
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.conf import settings
import hashlib
import uuid

class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire")
        email = self.normalize_email(email)
        if not extra_fields.get('id'):
            extra_fields['id'] = uuid.uuid4()
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)
        return self.create_user(email, username, password, **extra_fields)

    def get_by_natural_key(self, email):
        return self.get(email=email)



class User(AbstractBaseUser, PermissionsMixin):
    """
    Modèle utilisateur personnalisé pour Supabase Auth
    """
    id = models.UUIDField(primary_key=True, editable=False)  # L'ID venant de Supabase
    email = models.EmailField(unique=True, verbose_name="Email")
    username = models.CharField(max_length=150, unique=True, verbose_name="Nom d'utilisateur")
    first_name = models.CharField(max_length=30, blank=True, verbose_name="Prénom")
    last_name = models.CharField(max_length=30, blank=True, verbose_name="Nom")
    telephone = models.CharField(
        max_length=20,
        verbose_name="Téléphone",
        blank=True,
        validators=[RegexValidator(r'^[0-9+\-\s]+$', 'Format téléphone invalide')]
    )
    adresse = models.TextField(verbose_name="Adresse", blank=True)
    photo_profil = models.ImageField(
        upload_to='profils/',
        verbose_name="Photo de profil",
        null=True,
        blank=True
    )
    date_naissance = models.DateField(verbose_name="Date de naissance", null=True, blank=True)
    date_inscription = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")
    is_admin = models.BooleanField(default=False, verbose_name="Est administrateur")

    # Le Plan Premium (Notre fameuse option payante)
    PLAN_CHOICES = [('free', 'Gratuit'), ('premium', 'Premium')]
    plan = models.CharField(max_length=10, choices=PLAN_CHOICES, default='free')

    # Ajout des relations pour appartements et locations
    appartements = models.ManyToManyField(
        'Appartement',
        related_name='proprietaires_user',  # Updated related_name to avoid conflict
        blank=True
    )

    locations = models.ManyToManyField(
        'Location',
        related_name='locataires_user',  # Updated related_name to avoid conflict
        blank=True
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'  # Champ utilisé comme identifiant unique
    REQUIRED_FIELDS = ['username']  # Champs requis pour la création d'un utilisateur

    @property
    def is_anonymous(self):
        return False

    @property
    def is_staff(self):
        """
        Permet l'accès à l'admin Django technique.
        On décide que n'importe quel 'is_admin' ou 'is_superuser' a l'accès.
        """
        return self.is_admin or self.is_superuser

    @property
    def is_authenticated(self):
        return True

    # Plutôt que des Boolean, on utilise la logique métier
    @property
    def est_pro(self):
        # Un utilisateur est "Pro" s'il a des appartements associés
        return hasattr(self, 'appartements') and self.appartements.exists()

    @property
    def a_acces_compta(self):
        # Accès à la compta seulement si Plan Premium
        return self.plan == 'premium'

    # Suppression des champs inutiles est_proprietaire et est_locataire
    # Utilisation des propriétés métier pour déterminer les rôles dynamiquement
    @property
    def est_proprietaire(self):
        return self.appartements.exists()

    @property
    def est_locataire(self):
        return self.locations.exists()

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['-date_inscription']

    def __str__(self):
        return self.email

    def set_password(self, raw_password):
        from django.contrib.auth.hashers import make_password
        self.password = make_password(raw_password)

    @property
    def profil_proprietaire(self):
        # Retourne les appartements si l'utilisateur est propriétaire
        if hasattr(self, 'appartements'):
            return self.appartements.all()
        return None

    @property
    def profil_locataire(self):
        # Retourne les locations si l'utilisateur est locataire
        if hasattr(self, 'locations'):
            return self.locations.all()
        return None


class EmailLoginOTP(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='email_login_otps',
        verbose_name='Utilisateur'
    )
    email = models.EmailField(verbose_name='Email cible')
    otp_hash = models.CharField(max_length=64, verbose_name='Hash OTP')
    expires_at = models.DateTimeField(verbose_name='Expire a')
    attempt_count = models.IntegerField(default=0, verbose_name='Nombre de tentatives')
    is_used = models.BooleanField(default=False, verbose_name='Code utilise')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de creation')

    class Meta:
        verbose_name = 'OTP connexion email'
        verbose_name_plural = 'OTPs connexion email'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'is_used']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"OTP login {self.email} ({'used' if self.is_used else 'active'})"


class EmailRegisterOTP(models.Model):
    email = models.EmailField(verbose_name='Email cible')
    username = models.CharField(max_length=150, verbose_name='Nom utilisateur propose')
    password_hash = models.CharField(max_length=128, verbose_name='Mot de passe hache')
    otp_hash = models.CharField(max_length=64, verbose_name='Hash OTP')
    expires_at = models.DateTimeField(verbose_name='Expire a')
    attempt_count = models.IntegerField(default=0, verbose_name='Nombre de tentatives')
    is_used = models.BooleanField(default=False, verbose_name='Code utilise')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de creation')

    class Meta:
        verbose_name = 'OTP inscription email'
        verbose_name_plural = 'OTPs inscription email'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'is_used']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"OTP register {self.email} ({'used' if self.is_used else 'active'})"


class Appartement(models.Model):
    BIEN_TYPE_CHOICES = [
        ('APPARTEMENT', 'Appartement'),
        ('MAISON', 'Maison'),
        ('PARKING', 'Parking'),
        ('LOCAL_COMMERCIAL', 'Local commercial'),
        ('BUREAU', 'Bureau'),
        ('TERRAIN', 'Terrain'),
    ]

    proprietaire = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='appartements_proprietaire',  # Updated related_name to avoid conflict
        verbose_name="Propriétaire",
        null=False,
        blank=False
    )
    bien = models.ForeignKey(
        'PremiumBien',
        on_delete=models.SET_NULL,
        related_name='appartements',
        verbose_name="Bien Premium associé",
        null=True,
        blank=True,
        help_text="Lien avec le bien dans le système Premium de comptabilité"
    )
    titre = models.CharField(max_length=200, verbose_name="Titre", help_text="Titre de l'annonce")
    description = models.TextField(verbose_name="Description", help_text="Description détaillée")
    adresse = models.CharField(max_length=300, verbose_name="Adresse complète")
    ville = models.CharField(max_length=100, verbose_name="Ville", default="Paris")
    code_postal = models.CharField(max_length=10, verbose_name="Code postal", default="75000")
    type_bien = models.CharField(max_length=30, choices=BIEN_TYPE_CHOICES, default='APPARTEMENT')
    loyer_mensuel = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Loyer mensuel (CFA)",
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    caution = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Caution",
        default=0,
        validators=[MinValueValidator(0)]
    )
    surface = models.IntegerField(
        verbose_name="Surface (m²)",
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(1000)]
    )
    nb_pieces = models.IntegerField(
        verbose_name="Nombre de pièces",
        default=1,
        validators=[MinValueValidator(1)]
    )
    disponible = models.BooleanField(default=True, verbose_name="Disponible")
    photo_principale = models.ImageField(
        upload_to='appartements/',
        verbose_name="Photo principale",
        null=True,
        blank=True
    )
    slug = models.SlugField(max_length=255, unique=True, db_index=True, null=True, blank=True)
    nb_vues = models.IntegerField(default=0, verbose_name="Nombre de vues")
    nb_favoris = models.IntegerField(default=0, verbose_name="Nombre de favoris")
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    date_modification = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")

    class Meta:
        verbose_name = "Appartement"
        verbose_name_plural = "Appartements"
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['disponible']),
            models.Index(fields=['ville']),
            models.Index(fields=['proprietaire']),
        ]

    def __str__(self):
        return f"{self.titre} - {self.ville}"

    def save(self, *args, **kwargs):
        if not self.slug and self.titre:
            base = slugify(self.titre)[:200]
            slug_candidate = base
            counter = 1
            while Appartement.objects.filter(slug=slug_candidate).exclude(pk=self.pk).exists():
                slug_candidate = f"{base}-{counter}"
                counter += 1
            self.slug = slug_candidate
        super().save(*args, **kwargs)

    def incrementer_vues(self):
        """Incrémente le compteur de vues de l'appartement."""
        self.nb_vues += 1
        self.save(update_fields=['nb_vues'])


class Photo(models.Model):
    appartement = models.ForeignKey(
        Appartement,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name="Appartement"
    )
    image = models.ImageField(upload_to='appartements/photos/', verbose_name="Photo")
    legende = models.CharField(max_length=200, verbose_name="Légende", blank=True)
    ordre = models.IntegerField(default=0, verbose_name="Ordre d'affichage")
    date_upload = models.DateTimeField(auto_now_add=True, verbose_name="Date d'upload")

    class Meta:
        ordering = ['ordre']
        verbose_name = "Photo"
        verbose_name_plural = "Photos"

    def __str__(self):
        return f"Photo de {self.appartement.titre}"


class Location(models.Model):
    appartement = models.ForeignKey(
        Appartement,
        on_delete=models.CASCADE,
        related_name='locations',
        verbose_name="Appartement"
    )
    locataire = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='locations_locataire',  # Updated related_name to avoid conflict
        verbose_name="Locataire"
    )
    nom_locataire = models.CharField(max_length=200, verbose_name="Nom du locataire")
    email_locataire = models.EmailField(verbose_name="Email du locataire")
    telephone_locataire = models.CharField(max_length=20, verbose_name="Téléphone du locataire")
    date_debut = models.DateField(verbose_name="Date de début")
    date_fin = models.DateField(verbose_name="Date de fin")
    statut = models.CharField(
        max_length=20,
        choices=[
            ('RESERVE', 'En attente de confirmation'),
            ('CONFIRME', 'Confirmé'),
            ('PAYE', 'Payé'),
            ('ANNULE', 'Annulé'),
            ('TERMINE', 'Terminé')
        ],
        default='RESERVE',
        verbose_name="Statut"
    )
    montant_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Montant total",
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    date_reservation = models.DateTimeField(auto_now_add=True, verbose_name="Date de réservation")
    date_confirmation = models.DateTimeField(null=True, blank=True, verbose_name="Date de confirmation")
    date_paiement = models.DateTimeField(null=True, blank=True, verbose_name="Date de paiement")
    commission = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Commission",
        validators=[MinValueValidator(0)]
    )
    notes = models.TextField(blank=True, verbose_name="Notes")
    bail_pdf = models.FileField(
        upload_to='baux_numeriques/',
        null=True,
        blank=True,
        verbose_name="Bail PDF"
    )
    date_generation_bail = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date generation bail"
    )

    class Meta:
        verbose_name = "Location"
        verbose_name_plural = "Locations"
        ordering = ['-date_reservation']

    def __str__(self):
        return f"Location de {self.nom_locataire} pour {self.appartement}"


class Favori(models.Model):
    locataire = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favoris',
        verbose_name="Locataire"
    )
    appartement = models.ForeignKey(
        Appartement,
        on_delete=models.CASCADE,
        related_name='favoris',
        verbose_name="Appartement"
    )
    date_ajout = models.DateTimeField(auto_now_add=True, verbose_name="Date d'ajout")

    class Meta:
        verbose_name = "Favori"
        verbose_name_plural = "Favoris"
        unique_together = ('locataire', 'appartement')

    def __str__(self):
        return f"Favori de {self.locataire} pour {self.appartement}"


def generate_slug(instance, **kwargs):
    if not instance.slug and instance.titre:
        instance.slug = slugify(instance.titre)

pre_save.connect(generate_slug, sender=Appartement)


class PremiumCategory(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='premium_categories')
    code = models.CharField(max_length=50)
    label = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('owner', 'code')
        ordering = ['label']

    def __str__(self):
        return self.label


class PremiumAppartementType(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='premium_appartement_types')
    code = models.CharField(max_length=50)
    label = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('owner', 'code')
        ordering = ['label']

    def __str__(self):
        return self.label


class PremiumBien(models.Model):
    STATUT_CHOICES = [
        ('LOUE', 'Loue'),
        ('VACANT', 'Vacant'),
        ('TRAVAUX', 'En travaux'),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='premium_biens')
    category = models.ForeignKey(PremiumCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='biens')
    appartement_type = models.ForeignKey(PremiumAppartementType, on_delete=models.SET_NULL, null=True, blank=True, related_name='biens')
    titre = models.CharField(max_length=200)
    adresse = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    equipements = models.JSONField(default=list, blank=True)
    loyer_hc = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    charges = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='VACANT')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.titre


class PremiumLocataire(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='premium_locataires')
    nom = models.CharField(max_length=120)
    prenoms = models.CharField(max_length=180)
    email = models.EmailField()
    telephone = models.CharField(max_length=30, blank=True)
    date_naissance = models.DateField(null=True, blank=True)
    profession = models.CharField(max_length=120, blank=True)
    piece_identite_chiffree = models.TextField(blank=True)
    garant_chiffre = models.TextField(blank=True)
    historique_paiements = models.JSONField(default=list, blank=True)
    date_depart = models.DateField(null=True, blank=True)
    is_purged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nom} {self.prenoms}"

    @staticmethod
    def _hash_sensitive(raw_value):
        if not raw_value:
            return ''
        salted = f"{settings.SECRET_KEY}:{raw_value}".encode('utf-8')
        return hashlib.sha256(salted).hexdigest()

    def set_piece_identite(self, raw_value):
        self.piece_identite_chiffree = self._hash_sensitive(raw_value)

    def set_garant(self, raw_value):
        self.garant_chiffre = self._hash_sensitive(raw_value)

    def purge_sensitive_data(self):
        self.email = f"purged+{self.id}@deleted.local"
        self.telephone = ''
        self.date_naissance = None
        self.profession = ''
        self.piece_identite_chiffree = ''
        self.garant_chiffre = ''
        self.historique_paiements = []
        self.is_purged = True
        self.save(update_fields=[
            'email', 'telephone', 'date_naissance', 'profession',
            'piece_identite_chiffree', 'garant_chiffre', 'historique_paiements',
            'is_purged', 'updated_at'
        ])


class PremiumBail(models.Model):
    STATUT_CHOICES = [
        ('ACTIF', 'Actif'),
        ('TERMINE', 'Termine'),
        ('RESILIE', 'Resilie'),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='premium_baux')
    bien = models.ForeignKey(PremiumBien, on_delete=models.CASCADE, related_name='baux')
    locataire = models.ForeignKey(PremiumLocataire, on_delete=models.CASCADE, related_name='baux')
    date_entree = models.DateField()
    date_sortie = models.DateField(null=True, blank=True)
    revision_annuelle = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    depot_garantie = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='ACTIF')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class PremiumComptableEcriture(models.Model):
    TYPE_CHOICES = [('REVENU', 'Revenu'), ('DEPENSE', 'Depense')]
    SOURCE_CHOICES = [('MANUEL', 'Manuel'), ('AUTO_LOYER', 'Automatique Loyer')]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='premium_ecritures')
    bien = models.ForeignKey(PremiumBien, on_delete=models.SET_NULL, null=True, blank=True, related_name='ecritures')
    bail = models.ForeignKey(PremiumBail, on_delete=models.SET_NULL, null=True, blank=True, related_name='ecritures')
    type_ecriture = models.CharField(max_length=10, choices=TYPE_CHOICES)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='MANUEL')
    libelle = models.CharField(max_length=255)
    categorie = models.CharField(max_length=120, blank=True)
    date_operation = models.DateField()
    montant = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_operation', '-created_at']
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_operation', '-created_at']


class PremiumPayment(models.Model):
    STATUT_CHOICES = [('PAYE', 'Paye'), ('PARTIEL', 'Partiel'), ('IMPAYE', 'Impaye')]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='premium_payments')
    bail = models.ForeignKey(PremiumBail, on_delete=models.CASCADE, related_name='payments')
    date_paiement = models.DateField()
    periode_debut = models.DateField()
    periode_fin = models.DateField()
    montant = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='PAYE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_paiement', '-created_at']

    def save(self, *args, **kwargs):
        is_create = self.pk is None
        old_data = None

        if not is_create:
            previous = PremiumPayment.objects.filter(pk=self.pk).first()
            if previous is not None:
                old_data = {
                    'date_paiement': previous.date_paiement.isoformat() if previous.date_paiement else None,
                    'periode_debut': previous.periode_debut.isoformat() if previous.periode_debut else None,
                    'periode_fin': previous.periode_fin.isoformat() if previous.periode_fin else None,
                    'montant': str(previous.montant),
                    'statut': previous.statut,
                }

        super().save(*args, **kwargs)

        new_data = {
            'date_paiement': self.date_paiement.isoformat() if self.date_paiement else None,
            'periode_debut': self.periode_debut.isoformat() if self.periode_debut else None,
            'periode_fin': self.periode_fin.isoformat() if self.periode_fin else None,
            'montant': str(self.montant),
            'statut': self.statut,
        }

        PremiumPaymentAuditLog.objects.create(
            payment=self,
            owner=self.owner,
            actor=self.owner,
            action='INSERT' if is_create else 'UPDATE',
            old_data=old_data,
            new_data=new_data,
        )

        if is_create:
            PremiumComptableEcriture.objects.create(
                owner=self.owner,
                bien=self.bail.bien,
                bail=self.bail,
                type_ecriture='REVENU',
                source='AUTO_LOYER',
                libelle='Loyer percu',
                categorie='LOYER',
                date_operation=self.date_paiement,
                montant=self.montant,
                metadata={'payment_id': self.id},
            )

    def delete(self, *args, **kwargs):
        old_data = {
            'date_paiement': self.date_paiement.isoformat() if self.date_paiement else None,
            'periode_debut': self.periode_debut.isoformat() if self.periode_debut else None,
            'periode_fin': self.periode_fin.isoformat() if self.periode_fin else None,
            'montant': str(self.montant),
            'statut': self.statut,
        }

        payment_id = self.id
        owner = self.owner

        super().delete(*args, **kwargs)

        PremiumPaymentAuditLog.objects.create(
            payment=None,
            owner=owner,
            actor=owner,
            action='DELETE',
            old_data={**old_data, 'payment_id': payment_id},
            new_data=None,
        )


class PremiumPaymentAuditLog(models.Model):
    ACTION_CHOICES = [('INSERT', 'Insert'), ('UPDATE', 'Update'), ('DELETE', 'Delete')]

    payment = models.ForeignKey(PremiumPayment, on_delete=models.SET_NULL, related_name='audit_logs', null=True, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='premium_payment_audit_logs')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='premium_payment_audit_actor_logs')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']


class DossierLocataire(models.Model):
    """
    Modèle pour stocker les dossiers des locataires avec pièces justificatives
    """
    location = models.OneToOneField(
        Location,
        on_delete=models.CASCADE,
        related_name='dossier',
        verbose_name="Location"
    )
    nom = models.CharField(max_length=100, verbose_name="Nom")
    prenom = models.CharField(max_length=100, verbose_name="Prénom")
    email = models.EmailField(verbose_name="Email")
    telephone = models.CharField(max_length=20, verbose_name="Téléphone")
    profession = models.CharField(max_length=100, blank=True, verbose_name="Profession")
    date_naissance = models.DateField(null=True, blank=True, verbose_name="Date de naissance")
    piece_identite = models.FileField(
        upload_to='dossiers_locataires/',
        verbose_name="Pièce d'identité"
    )
    garant_nom = models.CharField(max_length=200, blank=True, verbose_name="Nom du garant")
    garant_email = models.EmailField(blank=True, verbose_name="Email du garant")
    garant_telephone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone du garant")
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    class Meta:
        verbose_name = "Dossier Locataire"
        verbose_name_plural = "Dossiers Locataires"
        ordering = ['-date_creation']

    def __str__(self):
        return f"Dossier {self.prenom} {self.nom} - Location #{self.location.id}"