from rest_framework import serializers
from .models import (
    User, Appartement, Photo, Location, Favori, DossierLocataire, EmailLoginOTP, EmailRegisterOTP
)
from decimal import Decimal
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from datetime import timedelta
import hashlib
import random
from uuid import uuid4
from drf_spectacular.utils import extend_schema_field
from rest_framework.fields import CharField
from .utils import send_login_otp_email, send_register_otp_email



# Serializer for User model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'telephone', 'adresse', 'photo_profil', 'date_naissance', 'date_inscription', 'is_admin', 'plan']


class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ['id', 'image', 'legende']


class AppartementListSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la liste des appartements (version simplifiée)
    """
    photo_principale_url = serializers.SerializerMethodField()

    class Meta:
        model = Appartement
        fields = [
            'id', 'slug', 'titre', 'ville', 'type_bien', 'loyer_mensuel', 'surface',
            'nb_pieces', 'disponible', 'photo_principale_url',
            'nb_vues', 'nb_favoris'
        ]
    
    @extend_schema_field(CharField(allow_null=True))
    def get_photo_principale_url(self, obj):
        if obj.photo_principale:
            return obj.photo_principale.url
        return None


class AppartementDetailSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le détail d'un appartement
    """
    photos = PhotoSerializer(many=True, read_only=True)
    photo_principale_url = serializers.SerializerMethodField()
    proprietaire_telephone = serializers.CharField(source='proprietaire.telephone', read_only=True, allow_blank=True, allow_null=True)
    caution_mois = serializers.SerializerMethodField()

    @extend_schema_field(CharField(allow_null=True))
    def get_photo_principale_url(self, obj):
        """Retourne l'URL de la photo principale ou None si absente"""
        if getattr(obj, 'photo_principale', None):
            try:
                return obj.photo_principale.url
            except Exception:
                return None
        return None

    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_caution_mois(self, obj):
        if not obj.caution or obj.caution <= 0:
            return 0

        if not obj.loyer_mensuel or obj.loyer_mensuel <= 0:
            try:
                return int(obj.caution)
            except Exception:
                return 0

        try:
            ratio = obj.caution / obj.loyer_mensuel
            caution_mois = int(ratio.quantize(Decimal('1')))

            if caution_mois > 0:
                return caution_mois

            # Compatibilité legacy: certaines anciennes annonces ont stocké
            # le nombre de mois directement dans caution (ex: 3) au lieu d'un montant CFA.
            if obj.caution == obj.caution.to_integral_value() and obj.caution <= Decimal('24'):
                return int(obj.caution)

            return 0
        except Exception:
            return 0

    class Meta:
        model = Appartement
        fields = [
            'id', 'slug', 'titre', 'description', 'adresse', 'ville', 'code_postal',
            'type_bien', 'loyer_mensuel', 'caution', 'surface', 'nb_pieces',
            'disponible', 'photo_principale', 'photo_principale_url',
            'photos', 'proprietaire', 'proprietaire_telephone', 'caution_mois', 'nb_vues', 'nb_favoris',
            'date_creation', 'date_modification', 'bien'
        ]
        read_only_fields = ['id', 'proprietaire', 'date_creation', 'date_modification', 'nb_vues', 'nb_favoris']


class AppartementCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour créer/modifier un appartement
    """
    caution_mois = serializers.IntegerField(required=False, min_value=0, default=0, write_only=True)

    class Meta:
        model = Appartement
        fields = [
            'titre', 'description', 'adresse', 'ville', 'code_postal',
            'type_bien', 'loyer_mensuel', 'caution', 'caution_mois', 'surface', 'nb_pieces',
            'disponible', 'photo_principale', 'proprietaire'
        ]
        read_only_fields = ['proprietaire', 'caution']
        extra_kwargs = {
            'surface': {'required': False, 'allow_null': True},
            'type_bien': {'required': True, 'allow_blank': False},
        }
    
    def validate_loyer_mensuel(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le loyer doit être positif")
        return value
    
    def validate_surface(self, value):
        if value and value > 1000:
            raise serializers.ValidationError("Surface trop grande (max 1000m²)")
        return value

    def validate_type_bien(self, value):
        if not value:
            raise serializers.ValidationError("Le type de bien est obligatoire avant publication.")
        return value

    def create(self, validated_data):
        caution_mois = validated_data.pop('caution_mois', 0)
        loyer_mensuel = validated_data.get('loyer_mensuel') or Decimal('0')
        validated_data['caution'] = loyer_mensuel * Decimal(caution_mois)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        caution_mois = validated_data.pop('caution_mois', None)
        if caution_mois is not None:
            loyer_mensuel = validated_data.get('loyer_mensuel', instance.loyer_mensuel) or Decimal('0')
            validated_data['caution'] = loyer_mensuel * Decimal(caution_mois)
        return super().update(instance, validated_data)


# ========== SÉRIALISEURS LOCATIONS ==========

class LocationListSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la liste des locations
    """
    appartement_titre = serializers.CharField(source='appartement.titre', read_only=True)
    appartement_ville = serializers.CharField(source='appartement.ville', read_only=True)
    appartement_slug = serializers.SlugField(source='appartement.slug', read_only=True)
    appartement_proprietaire_id = serializers.UUIDField(source='appartement.proprietaire_id', read_only=True, allow_null=True)
    locataire_nom = serializers.CharField(source='locataire.username', read_only=True, allow_null=True)
    bail_pdf_url = serializers.SerializerMethodField()

    @extend_schema_field(CharField(allow_null=True))
    def get_bail_pdf_url(self, obj):
        if not getattr(obj, 'bail_pdf', None):
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.bail_pdf.url)
        return obj.bail_pdf.url
    
    class Meta:
        model = Location
        fields = [
            'id', 'appartement_id', 'appartement_titre', 'appartement_ville',
            'appartement_slug', 'appartement_proprietaire_id',
            'locataire_id', 'locataire_nom', 'nom_locataire',
            'email_locataire', 'telephone_locataire',
            'date_debut', 'date_fin', 'statut', 'montant_total',
            'date_reservation', 'bail_pdf_url'
        ]


class LocationDetailSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le détail d'une location
    """
    appartement = AppartementListSerializer(read_only=True)
    locataire = UserSerializer(read_only=True)
    duree_sejour = serializers.SerializerMethodField()
    bail_pdf_url = serializers.SerializerMethodField()
    
    @extend_schema_field(serializers.IntegerField())
    def get_duree_sejour(self, obj):
        """Calcul de la durée du séjour en jours"""
        return (obj.date_fin - obj.date_debut).days

    @extend_schema_field(CharField(allow_null=True))
    def get_bail_pdf_url(self, obj):
        if not getattr(obj, 'bail_pdf', None):
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.bail_pdf.url)
        return obj.bail_pdf.url
    
    class Meta:
        model = Location
        fields = [
            'id', 'appartement', 'locataire', 'nom_locataire',
            'email_locataire', 'telephone_locataire',
            'date_debut', 'date_fin', 'statut', 'date_reservation',
            'date_confirmation', 'date_paiement', 'montant_total',
            'commission', 'notes', 'duree_sejour', 'bail_pdf_url', 'date_generation_bail'
        ]


class LocationCreateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour créer une location
    """
    # Acceptation via slug pour l'appartement
    appartement = serializers.SlugRelatedField(queryset=Appartement.objects.all(), slug_field='slug')

    class Meta:
        model = Location
        fields = [
            'appartement', 'nom_locataire', 'email_locataire',
            'telephone_locataire', 'date_debut', 'date_fin', 'notes'
        ]
    
    def validate(self, data):
        # Vérifier que les dates sont cohérentes
        if data['date_debut'] > data['date_fin']:
            raise serializers.ValidationError(
                "La date de fin doit être postérieure à la date de début"
            )
        
        # Vérifier que la date de début n'est pas dans le passé
        if data['date_debut'] < timezone.now().date():
            raise serializers.ValidationError(
                "La date de début ne peut pas être dans le passé"
            )
        
        # Vérifier la disponibilité de l'appartement (ne considère que les réservations confirmées/payées)
        appartement = data['appartement']
        locations_conflictuelles = Location.objects.filter(
            appartement=appartement,
            date_debut__lte=data['date_fin'],
            date_fin__gte=data['date_debut'],
            statut__in=['CONFIRME', 'PAYE']
        )
        
        if locations_conflictuelles.exists():
            raise serializers.ValidationError(
                "L'appartement n'est pas disponible pour ces dates"
            )
        
        return data
    
    def create(self, validated_data):
        # Associer automatiquement le locataire si l'email correspond
        email = validated_data.get('email_locataire')
        try:
            locataire = User.objects.get(email=email)
            validated_data['locataire'] = locataire
        except User.DoesNotExist:
            pass

        # Calculer automatiquement montant_total selon la règle métier :
        # total = loyer_mensuel * max(mois_reservation, mois_caution)
        appartement = validated_data['appartement']
        date_debut = validated_data['date_debut']
        date_fin = validated_data['date_fin']

        # Mois réservés (arrondi au mois supérieur)
        duree_jours = (date_fin - date_debut).days
        if duree_jours < 1:
            duree_jours = 1
        mois_reservation = max(1, (duree_jours + 29) // 30)

        loyer_mensuel = appartement.loyer_mensuel or Decimal('0')

        # Déterminer le nombre de mois de caution depuis la valeur stockée
        caution_mois = 0
        caution_value = appartement.caution or Decimal('0')
        if caution_value > 0 and loyer_mensuel > 0:
            try:
                caution_calc = int((caution_value / loyer_mensuel).quantize(Decimal('1')))
                if caution_calc > 0:
                    caution_mois = caution_calc
                elif caution_value == caution_value.to_integral_value() and caution_value <= Decimal('24'):
                    # Compatibilité legacy: la caution pouvait être stockée directement en mois (ex: 3)
                    caution_mois = int(caution_value)
            except Exception:
                caution_mois = 0

        mois_factures = max(mois_reservation, caution_mois)
        montant_total = loyer_mensuel * Decimal(mois_factures)
        validated_data['montant_total'] = montant_total

        location = super().create(validated_data)

        # Ne plus marquer l'appartement indisponible automatiquement à la création
        # Le propriétaire doit confirmer (statut 'CONFIRME' ou 'PAYE') pour rendre l'appartement indisponible.
        # appartement = validated_data['appartement']
        # appartement.disponible = False
        # appartement.save()

        return location


class LocationUpdateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour mettre à jour une location
    """
    class Meta:
        model = Location
        fields = ['statut', 'notes']
    
    def update(self, instance, validated_data):
        ancien_statut = instance.statut
        location = super().update(instance, validated_data)
        
        # Gérer la disponibilité de l'appartement
        if ancien_statut != location.statut:
            # Si la location passe à CONFIRME ou PAYE -> rendre l'appartement indisponible
            if location.statut in ['CONFIRME', 'PAYE']:
                try:
                    location.appartement.disponible = False
                    location.appartement.save()
                except Exception:
                    pass

            # Si la location est annulée ou terminée -> vérifier s'il y a d'autres locations actives
            if location.statut in ['ANNULE', 'TERMINE']:
                autres_locations = Location.objects.filter(
                    appartement=location.appartement,
                    statut__in=['RESERVE', 'CONFIRME', 'PAYE']
                ).exclude(pk=location.pk)
                
                if not autres_locations.exists():
                    location.appartement.disponible = True
                    location.appartement.save()
        
        return location


# ========== SÉRIALISEURS FAVORIS ==========

class FavoriSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les favoris
    """
    appartement = AppartementListSerializer(read_only=True)
    
    class Meta:
        model = Favori
        fields = ['id', 'locataire', 'appartement', 'date_ajout']
        read_only_fields = ['id', 'date_ajout']


class FavoriCreateSerializer(serializers.Serializer):
    """
    Sérialiseur pour ajouter/retirer un favori
    """
    appartement_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['add', 'remove'])


# ========== SÉRIALISEURS DIVERS ==========

class DisponibiliteSerializer(serializers.Serializer):
    """
    Sérialiseur pour vérifier la disponibilité
    """
    date_debut = serializers.DateField()
    date_fin = serializers.DateField()
    disponible = serializers.BooleanField()
    message = serializers.CharField(required=False)


class StatistiquesSerializer(serializers.Serializer):
    """
    Sérialiseur pour les statistiques
    """
    appartements = serializers.DictField()
    locations = serializers.DictField()
    utilisateurs = serializers.DictField()
    revenus = serializers.DictField()


class LocataireSerializer(serializers.ModelSerializer):
    class Meta:
        model = User  # Supposons que le modèle User représente un locataire
        fields = ['id', 'email', 'username', 'telephone', 'adresse', 'photo_profil']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour l'inscription des utilisateurs
    """
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'telephone', 'adresse', 'photo_profil']

    def validate_email(self, value):
        return value.strip().lower()

    def _generate_unique_username(self, email):
        base_username = email.split('@')[0][:100] or 'user'
        candidate = base_username

        while User.objects.filter(username__iexact=candidate).exists():
            suffix = uuid4().hex[:6]
            candidate = f"{base_username[:140]}_{suffix}"[:150]

        return candidate

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data.pop('email')
        username = (validated_data.pop('username', '') or '').strip()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({'email': "Un compte existe deja avec cet email."})

        if not username:
            username = self._generate_unique_username(email)
        elif User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError({'username': "Ce nom d'utilisateur est deja utilise."})

        EmailRegisterOTP.objects.filter(email__iexact=email, is_used=False).update(is_used=True)

        otp_code = f"{random.randint(0, 999999):06d}"
        otp_hash = hashlib.sha256(
            f"register:{email}:{otp_code}:{settings.SECRET_KEY}".encode('utf-8')
        ).hexdigest()

        EmailRegisterOTP.objects.create(
            email=email,
            username=username,
            password_hash=make_password(password),
            otp_hash=otp_hash,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        try:
            send_register_otp_email(email, otp_code)
        except Exception:
            raise serializers.ValidationError({
                'detail': "Impossible d'envoyer le code OTP d'inscription pour le moment."
            })

        return {
            'email': email,
            'requires_otp': True,
            'message': "Un code OTP d'inscription a ete envoye a votre adresse email.",
        }


class VerifyRegisterOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(min_length=6, max_length=6)

    def validate(self, data):
        normalized_email = data['email'].strip().lower()
        otp_code = data['otp_code'].strip()

        otp_entry = EmailRegisterOTP.objects.filter(
            email=normalized_email,
            is_used=False,
        ).order_by('-created_at').first()

        if not otp_entry:
            raise serializers.ValidationError({'detail': "Aucun OTP d'inscription actif trouve. Veuillez recommencer."})

        if otp_entry.expires_at <= timezone.now():
            otp_entry.is_used = True
            otp_entry.save(update_fields=['is_used'])
            raise serializers.ValidationError({'detail': "Le code OTP d'inscription a expire. Veuillez demander un nouveau code."})

        if otp_entry.attempt_count >= 5:
            otp_entry.is_used = True
            otp_entry.save(update_fields=['is_used'])
            raise serializers.ValidationError({'detail': 'Trop de tentatives. Veuillez recommencer votre inscription.'})

        expected_hash = hashlib.sha256(
            f"register:{normalized_email}:{otp_code}:{settings.SECRET_KEY}".encode('utf-8')
        ).hexdigest()

        if expected_hash != otp_entry.otp_hash:
            otp_entry.attempt_count += 1
            if otp_entry.attempt_count >= 5:
                otp_entry.is_used = True
                otp_entry.save(update_fields=['attempt_count', 'is_used'])
            else:
                otp_entry.save(update_fields=['attempt_count'])
            raise serializers.ValidationError({'otp_code': 'Code OTP invalide.'})

        if User.objects.filter(email__iexact=normalized_email).exists():
            otp_entry.is_used = True
            otp_entry.save(update_fields=['is_used'])
            raise serializers.ValidationError({'email': 'Ce compte existe deja.'})

        username = otp_entry.username
        if User.objects.filter(username__iexact=username).exists():
            username = f"{username[:140]}_{uuid4().hex[:6]}"[:150]

        user = User.objects.create_user(
            email=normalized_email,
            username=username,
            password=None,
        )
        user.password = otp_entry.password_hash
        user.save(update_fields=['password'])

        otp_entry.is_used = True
        otp_entry.attempt_count += 1
        otp_entry.save(update_fields=['is_used', 'attempt_count'])

        return {'user': user}


class UserLoginSerializer(serializers.Serializer):
    """
    Sérialiseur pour demander un OTP de connexion par email
    """
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False, write_only=True)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        request = self.context.get('request')
        raw_email = (data.get('email') or data.get('username') or '').strip()
        if not raw_email:
            raise serializers.ValidationError({'email': "L'email est requis pour se connecter."})

        normalized_email = raw_email.lower()
        user = authenticate(request=request, email=normalized_email, password=data['password'])
        if not user or not user.is_active:
            raise serializers.ValidationError("Identifiants invalides ou utilisateur inactif.")

        # Invalider les anciens OTP non utilises pour cet utilisateur.
        EmailLoginOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        otp_code = f"{random.randint(0, 999999):06d}"
        otp_hash = hashlib.sha256(
            f"{normalized_email}:{otp_code}:{settings.SECRET_KEY}".encode('utf-8')
        ).hexdigest()

        EmailLoginOTP.objects.create(
            user=user,
            email=normalized_email,
            otp_hash=otp_hash,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        try:
            send_login_otp_email(normalized_email, otp_code)
        except Exception:
            raise serializers.ValidationError({
                'detail': "Impossible d'envoyer le code OTP pour le moment."
            })

        return {
            'email': normalized_email,
            'requires_otp': True,
            'message': 'Un code OTP a ete envoye a votre adresse email.',
        }


class VerifyLoginOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(min_length=6, max_length=6)

    def validate(self, data):
        normalized_email = data['email'].strip().lower()
        otp_code = data['otp_code'].strip()

        otp_entry = EmailLoginOTP.objects.filter(
            email=normalized_email,
            is_used=False,
        ).order_by('-created_at').first()

        if not otp_entry:
            raise serializers.ValidationError({'detail': 'Aucun code OTP actif trouve. Veuillez recommencer la connexion.'})

        if otp_entry.expires_at <= timezone.now():
            otp_entry.is_used = True
            otp_entry.save(update_fields=['is_used'])
            raise serializers.ValidationError({'detail': 'Le code OTP a expire. Veuillez demander un nouveau code.'})

        if otp_entry.attempt_count >= 5:
            otp_entry.is_used = True
            otp_entry.save(update_fields=['is_used'])
            raise serializers.ValidationError({'detail': 'Trop de tentatives. Veuillez demander un nouveau code.'})

        expected_hash = hashlib.sha256(
            f"{normalized_email}:{otp_code}:{settings.SECRET_KEY}".encode('utf-8')
        ).hexdigest()

        if expected_hash != otp_entry.otp_hash:
            otp_entry.attempt_count += 1
            if otp_entry.attempt_count >= 5:
                otp_entry.is_used = True
                otp_entry.save(update_fields=['attempt_count', 'is_used'])
            else:
                otp_entry.save(update_fields=['attempt_count'])
            raise serializers.ValidationError({'otp_code': 'Code OTP invalide.'})

        otp_entry.is_used = True
        otp_entry.attempt_count += 1
        otp_entry.save(update_fields=['is_used', 'attempt_count'])

        return {'user': otp_entry.user}


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour afficher les informations du profil utilisateur
    """
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'telephone', 'adresse', 'photo_profil', 'date_naissance', 'plan']


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour mettre à jour les informations de l'utilisateur
    """
    class Meta:
        model = User
        fields = ['username', 'telephone', 'adresse', 'photo_profil']


class ChangePasswordSerializer(serializers.Serializer):
    """
    Sérialiseur pour changer le mot de passe
    """
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)


class LogoutSerializer(serializers.Serializer):
    """
    Sérialiseur pour la déconnexion
    """
    refresh_token = serializers.CharField()


class UpdatePlanSerializer(serializers.Serializer):
    """
    Sérialiseur pour la mise à jour du plan utilisateur
    """
    plan = serializers.ChoiceField(choices=['free', 'premium'])


class DossierLocataireSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les dossiers des locataires
    """
    piece_identite_url = serializers.SerializerMethodField()

    class Meta:
        model = DossierLocataire
        fields = [
            'id', 'location', 'nom', 'prenom', 'email', 'telephone',
            'profession', 'date_naissance', 'piece_identite', 'piece_identite_url',
            'garant_nom', 'garant_email', 'garant_telephone', 'date_creation'
        ]
        read_only_fields = ['id', 'date_creation']

    def get_piece_identite_url(self, obj):
        """Retourner l'URL de la pièce d'identité"""
        if obj.piece_identite:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.piece_identite.url)
            return obj.piece_identite.url
        return None
