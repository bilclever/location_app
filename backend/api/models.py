from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, Group, Permission
from decimal import Decimal
from django.utils.text import slugify


class User(AbstractUser):
    """
    Modèle utilisateur personnalisé
    """
    ROLE_CHOICES = [
        ('LOCATAIRE', 'Locataire'),
        ('PROPRIETAIRE', 'Propriétaire'),
        ('ADMIN', 'Administrateur'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='LOCATAIRE',
        verbose_name="Rôle"
    )
    
    # Informations personnelles supplémentaires
    telephone = models.CharField(
        max_length=20,
        verbose_name="Téléphone",
        blank=True,
        validators=[RegexValidator(r'^[0-9+\-\s]+$', 'Format téléphone invalide')]
    )
    
    adresse = models.TextField(
        verbose_name="Adresse",
        blank=True
    )
    
    photo_profil = models.ImageField(
        upload_to='profils/',
        verbose_name="Photo de profil",
        null=True,
        blank=True
    )
    
    date_naissance = models.DateField(
        verbose_name="Date de naissance",
        null=True,
        blank=True
    )
    
    # Vérification du compte
    verifie = models.BooleanField(
        default=False,
        verbose_name="Compte vérifié"
    )
    
    # Préférences
    notifications_email = models.BooleanField(
        default=True,
        verbose_name="Notifications par email"
    )
    
    # Relations avec les groupes et permissions (pour éviter les conflits)
    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name="location_user_set",
        related_query_name="location_user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="location_user_set",
        related_query_name="location_user",
    )
    
    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
    
    def __str__(self):
        return f"{self.username} - {self.get_full_name() or self.email}"
    
    @property
    def est_locataire(self):
        return self.role == 'LOCATAIRE'
    
    @property
    def est_proprietaire(self):
        return self.role == 'PROPRIETAIRE'
    
    @property
    def est_admin(self):
        return self.role == 'ADMIN' or self.is_superuser
    
    def get_profile(self):
        """Retourne le profil spécifique selon le rôle"""
        if self.est_locataire:
            try:
                return self.profil_locataire
            except Locataire.DoesNotExist:
                return None
        elif self.est_proprietaire:
            try:
                return self.profil_proprietaire
            except Proprietaire.DoesNotExist:
                return None
        return None


class Proprietaire(models.Model):
    """
    Modèle représentant un propriétaire (extension de User)
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profil_proprietaire',
        verbose_name="Utilisateur"
    )
    
    # Informations professionnelles
    siret = models.CharField(
        max_length=14,
        verbose_name="Numéro SIRET",
        blank=True
    )
    
    raison_sociale = models.CharField(
        max_length=200,
        verbose_name="Raison sociale",
        blank=True
    )
    
    # Commission (pour la plateforme)
    commission = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=10.00,
        verbose_name="Commission (%)",
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Statistiques
    note_moyenne = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        null=True,
        blank=True
    )
    
    total_appartements = models.IntegerField(default=0)
    total_reservations = models.IntegerField(default=0)
    
    date_inscription = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'inscription"
    )
    
    class Meta:
        verbose_name = "Propriétaire"
        verbose_name_plural = "Propriétaires"
    
    def __str__(self):
        return f"Propriétaire: {self.user.get_full_name() or self.user.username}"
    
    def update_stats(self):
        """Met à jour les statistiques"""
        self.total_appartements = self.appartements.count()
        self.total_reservations = sum(
            a.locations.count() for a in self.appartements.all()
        )
        self.save()


class Locataire(models.Model):
    """
    Modèle représentant un locataire (extension de User)
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profil_locataire',
        verbose_name="Utilisateur"
    )
    
    # Informations supplémentaires (compatibilité avec ton modèle existant)
    nom = models.CharField(
        max_length=100,
        verbose_name="Nom complet"
    )
    email = models.EmailField(
        verbose_name="Email",
        unique=True
    )
    telephone = models.CharField(
        max_length=20,
        verbose_name="Téléphone"
    )
    date_naissance = models.DateField(
        verbose_name="Date de naissance",
        null=True,
        blank=True
    )
    
    # Préférences de recherche
    budget_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Budget maximum"
    )
    
    ville_recherche = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Ville recherchée"
    )
    
    # Statistiques
    total_reservations = models.IntegerField(default=0)
    total_depenses = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Dépenses totales"
    )
    
    date_inscription = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'inscription"
    )
    
    class Meta:
        verbose_name = "Locataire"
        verbose_name_plural = "Locataires"
        ordering = ['nom']
    
    def __str__(self):
        return f"{self.nom} - {self.email}"
    
    def save(self, *args, **kwargs):
        """Synchronise avec l'utilisateur associé"""
        if not self.pk:  # Nouveau locataire
            # Mettre à jour l'utilisateur avec les mêmes infos
            if hasattr(self, 'user') and self.user:
                self.user.first_name = self.nom.split()[0] if self.nom else ''
                self.user.last_name = ' '.join(self.nom.split()[1:]) if len(self.nom.split()) > 1 else ''
                self.user.email = self.email
                self.user.telephone = self.telephone
                self.user.date_naissance = self.date_naissance
                self.user.save()
        
        super().save(*args, **kwargs)
    
    def update_stats(self):
        """Met à jour les statistiques"""
        self.total_reservations = self.locations.count()
        self.total_depenses = self.locations.filter(
            statut='PAYE'
        ).aggregate(total=models.Sum('montant_total'))['total'] or 0
        self.save()


class Appartement(models.Model):
    """
    Modèle représentant un appartement à louer
    """
    # Relation avec le propriétaire (NOUVEAU)
    proprietaire = models.ForeignKey(
        Proprietaire,
        on_delete=models.CASCADE,
        related_name='appartements',
        verbose_name="Propriétaire",
        null=True,  # Temporairement null pour migration
        blank=True
    )
    
    # Tes champs existants
    titre = models.CharField(
        max_length=200,
        verbose_name="Titre",
        help_text="Titre de l'annonce"
    )
    description = models.TextField(
        verbose_name="Description",
        help_text="Description détaillée"
    )
    adresse = models.CharField(
        max_length=300,
        verbose_name="Adresse complète"
    )
    ville = models.CharField(
        max_length=100,
        verbose_name="Ville",
        default="Paris"
    )
    code_postal = models.CharField(
        max_length=10,
        verbose_name="Code postal",
        default="75000"
    )
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
    disponible = models.BooleanField(
        default=True,
        verbose_name="Disponible"
    )
    photo_principale = models.ImageField(
        upload_to='appartements/',
        verbose_name="Photo principale",
        null=True,
        blank=True
    )
    
    # Slug pour lookup friendly URLs
    slug = models.SlugField(max_length=255, unique=True, db_index=True, null=True, blank=True)

    # Statistiques
    nb_vues = models.IntegerField(
        default=0,
        verbose_name="Nombre de vues"
    )
    nb_favoris = models.IntegerField(
        default=0,
        verbose_name="Nombre de favoris"
    )
    
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification"
    )

    class Meta:
        verbose_name = "Appartement"
        verbose_name_plural = "Appartements"
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['disponible']),
            models.Index(fields=['ville']),
            models.Index(fields=['proprietaire']),  # NOUVEAU
        ]

    def __str__(self):
        return f"{self.titre} - {self.ville}"

    @property
    def est_disponible(self):
        """Vérifie si l'appartement est disponible"""
        return self.disponible

    def get_photos(self):
        """Retourne toutes les photos de l'appartement"""
        return self.photos.all()
    
    def incrementer_vues(self):
        """Incrémente le compteur de vues"""
        self.nb_vues += 1
        self.save(update_fields=['nb_vues'])

    def save(self, *args, **kwargs):
        """Génère un slug unique à partir du titre si nécessaire"""
        if not self.slug and self.titre:
            base = slugify(self.titre)[:200]
            slug_candidate = base
            counter = 1
            while Appartement.objects.filter(slug=slug_candidate).exclude(pk=self.pk).exists():
                slug_candidate = f"{base}-{counter}"
                counter += 1
            self.slug = slug_candidate
        super().save(*args, **kwargs)


class Photo(models.Model):
    """
    Modèle pour les photos supplémentaires des appartements
    """
    appartement = models.ForeignKey(
        Appartement,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name="Appartement"
    )
    image = models.ImageField(
        upload_to='appartements/photos/',
        verbose_name="Photo"
    )
    legende = models.CharField(
        max_length=200,
        verbose_name="Légende",
        blank=True
    )
    ordre = models.IntegerField(
        default=0,
        verbose_name="Ordre d'affichage"
    )
    date_upload = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'upload"
    )

    class Meta:
        ordering = ['ordre']
        verbose_name = "Photo"
        verbose_name_plural = "Photos"

    def __str__(self):
        return f"Photo de {self.appartement.titre}"


class Location(models.Model):
    """
    Modèle représentant une location/réservation
    """
    STATUT_CHOICES = [
        ('RESERVE', 'Réservé'),
        ('CONFIRME', 'Confirmé'),
        ('PAYE', 'Payé'),
        ('ANNULE', 'Annulé'),
        ('TERMINE', 'Terminé'),
    ]

    appartement = models.ForeignKey(
        Appartement,
        on_delete=models.CASCADE,
        related_name='locations',
        verbose_name="Appartement"
    )
    
    # Relation avec le locataire (modifié)
    locataire = models.ForeignKey(
        Locataire,
        on_delete=models.CASCADE,
        related_name='locations',
        verbose_name="Locataire",
        null=True,
        blank=True
    )
    
    # Informations du locataire (pour historique, même si le compte est supprimé)
    nom_locataire = models.CharField(
        max_length=100,
        verbose_name="Nom du locataire"
    )
    email_locataire = models.EmailField(
        verbose_name="Email du locataire"
    )
    telephone_locataire = models.CharField(
        max_length=20,
        verbose_name="Téléphone"
    )
    
    # Dates
    date_debut = models.DateField(
        verbose_name="Date de début"
    )
    date_fin = models.DateField(
        verbose_name="Date de fin"
    )
    
    # Statut et suivi
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='RESERVE',
        verbose_name="Statut"
    )
    date_reservation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de réservation"
    )
    date_confirmation = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de confirmation"
    )
    date_paiement = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de paiement"
    )
    
    # Montants
    montant_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Montant total",
        editable=False,
        null=True,
        blank=True
    )
    commission = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Commission",
        editable=False,
        null=True,
        blank=True
    )
    
    # Notes
    notes = models.TextField(
        verbose_name="Notes",
        blank=True
    )

    class Meta:
        verbose_name = "Location"
        verbose_name_plural = "Locations"
        ordering = ['-date_reservation']
        indexes = [
            models.Index(fields=['statut']),
            models.Index(fields=['date_debut', 'date_fin']),
            models.Index(fields=['locataire']),  # NOUVEAU
        ]

    def __str__(self):
        return f"{self.nom_locataire} - {self.appartement.titre}"

    def save(self, *args, **kwargs):
        """Calcule les montants avant sauvegarde"""
        if self.date_debut and self.date_fin and self.appartement:
            nb_jours = (self.date_fin - self.date_debut).days
            if nb_jours > 0:
                loyer_journalier = self.appartement.loyer_mensuel / Decimal('30')
                self.montant_total = loyer_journalier * nb_jours
                
                # Calculer la commission (si propriétaire existe)
                if self.appartement.proprietaire:
                    self.commission = self.montant_total * (self.appartement.proprietaire.commission / 100)
        
        # Mettre à jour les dates selon le statut
        if self.statut == 'CONFIRME' and not self.date_confirmation:
            self.date_confirmation = timezone.now()
        elif self.statut == 'PAYE' and not self.date_paiement:
            self.date_paiement = timezone.now()
        
        super().save(*args, **kwargs)
        
        # Mettre à jour les stats du locataire si associé
        if self.locataire:
            self.locataire.update_stats()
        
        # Mettre à jour les stats du propriétaire
        if self.appartement.proprietaire:
            self.appartement.proprietaire.update_stats()

    @property
    def duree_sejour(self):
        """Retourne la durée du séjour en jours"""
        return (self.date_fin - self.date_debut).days

    @property
    def est_active(self):
        """Vérifie si la location est active"""
        aujourd_hui = timezone.now().date()
        return self.date_debut <= aujourd_hui <= self.date_fin and self.statut not in ['ANNULE', 'TERMINE']


class Favori(models.Model):
    """
    Modèle pour les favoris des locataires
    """
    locataire = models.ForeignKey(
        Locataire,
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
    date_ajout = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'ajout"
    )
    
    class Meta:
        verbose_name = "Favori"
        verbose_name_plural = "Favoris"
        unique_together = ['locataire', 'appartement']  # Empêche les doublons
        ordering = ['-date_ajout']
    
    def __str__(self):
        return f"{self.locataire.nom} - {self.appartement.titre}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Mettre à jour le compteur de favoris de l'appartement
        self.appartement.nb_favoris = self.appartement.favoris.count()
        self.appartement.save(update_fields=['nb_favoris'])
    
    def delete(self, *args, **kwargs):
        appartement = self.appartement
        super().delete(*args, **kwargs)
        # Mettre à jour le compteur de favoris de l'appartement
        appartement.nb_favoris = appartement.favoris.count()
        appartement.save(update_fields=['nb_favoris'])