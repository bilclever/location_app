from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils.text import slugify
from django.db.models.signals import pre_save
from decimal import Decimal
from django.utils.html import format_html
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
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


class Appartement(models.Model):
    proprietaire = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='appartements_proprietaire',  # Updated related_name to avoid conflict
        verbose_name="Propriétaire",
        null=True,
        blank=True
    )
    titre = models.CharField(max_length=200, verbose_name="Titre", help_text="Titre de l'annonce")
    description = models.TextField(verbose_name="Description", help_text="Description détaillée")
    adresse = models.CharField(max_length=300, verbose_name="Adresse complète")
    ville = models.CharField(max_length=100, verbose_name="Ville", default="Paris")
    code_postal = models.CharField(max_length=10, verbose_name="Code postal", default="75000")
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