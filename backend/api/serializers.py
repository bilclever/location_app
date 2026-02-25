from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import (
    User, Proprietaire, Locataire, Appartement, 
    Photo, Location, Favori
)
from decimal import Decimal
import re
from django.utils import timezone



class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour l'inscription
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label="Confirmation mot de passe"
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'telephone', 'role',
            'date_naissance', 'adresse'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Les mots de passe ne correspondent pas"
            })
        
        # Validation email
        if not re.match(r"[^@]+@[^@]+\.[^@]+", attrs['email']):
            raise serializers.ValidationError({
                "email": "Format d'email invalide"
            })
        
        return attrs
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur existe déjà")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé")
        return value
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        
        # Créer le profil correspondant au rôle
        if validated_data.get('role') == 'PROPRIETAIRE':
            Proprietaire.objects.create(user=user)
        elif validated_data.get('role') == 'LOCATAIRE':
            Locataire.objects.create(
                user=user,
                nom=f"{validated_data.get('first_name', '')} {validated_data.get('last_name', '')}".strip(),
                email=validated_data.get('email'),
                telephone=validated_data.get('telephone', ''),
                date_naissance=validated_data.get('date_naissance')
            )
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Sérialiseur pour la connexion
    """
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        username = attrs.get('username')
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not (username or email):
            raise serializers.ValidationError(
                "Vous devez fournir un nom d'utilisateur ou un email"
            )
        
        if not password:
            raise serializers.ValidationError(
                "Vous devez fournir un mot de passe"
            )
        
        # Authentification par username ou email
        if username:
            user = authenticate(username=username, password=password)
        else:
            try:
                user_obj = User.objects.get(email=email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        
        if not user:
            raise serializers.ValidationError(
                "Identifiants incorrects"
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                "Ce compte est désactivé"
            )
        
        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le profil utilisateur
    """
    full_name = serializers.SerializerMethodField()
    profil = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'telephone', 'role', 'adresse', 'photo_profil',
            'date_naissance', 'verifie', 'notifications_email',
            'date_joined', 'last_login', 'profil'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'verifie']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_profil(self, obj):
        """Retourne les données spécifiques au rôle"""
        if obj.est_locataire:
            try:
                return LocataireSerializer(obj.profil_locataire).data
            except:
                return None
        elif obj.est_proprietaire:
            try:
                return ProprietaireSerializer(obj.profil_proprietaire).data
            except:
                return None
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour mettre à jour le profil
    """
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'telephone',
            'adresse', 'photo_profil', 'notifications_email'
        ]
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Mettre à jour le profil associé
        if instance.est_locataire:
            try:
                locataire = instance.profil_locataire
                locataire.nom = f"{instance.first_name} {instance.last_name}".strip()
                locataire.telephone = instance.telephone
                locataire.save()
            except:
                pass
        
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """
    Sérialiseur pour changer le mot de passe
    """
    old_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                "new_password": "Les mots de passe ne correspondent pas"
            })
        return attrs


class LogoutSerializer(serializers.Serializer):
    """
    Sérialiseur pour la déconnexion
    """
    refresh = serializers.CharField(required=False, allow_blank=True)


class ProprietaireSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le profil propriétaire
    """
    user = UserProfileSerializer(read_only=True)
    appartements_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Proprietaire
        fields = [
            'id', 'user', 'siret', 'raison_sociale',
            'commission', 'note_moyenne', 'appartements_count',
            'total_appartements', 'total_reservations', 'date_inscription'
        ]
    
    def get_appartements_count(self, obj):
        return obj.appartements.count()


class LocataireSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le profil locataire
    """
    user = UserProfileSerializer(read_only=True)
    locations_count = serializers.SerializerMethodField()
    favoris_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Locataire
        fields = [
            'id', 'user', 'nom', 'email', 'telephone',
            'date_naissance', 'budget_max', 'ville_recherche',
            'locations_count', 'favoris_count', 'total_reservations',
            'total_depenses', 'date_inscription'
        ]
    
    def get_locations_count(self, obj):
        return obj.locations.count()
    
    def get_favoris_count(self, obj):
        return obj.favoris.count()


# ========== SÉRIALISEURS APPARTEMENTS ==========

class PhotoSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les photos
    """
    class Meta:
        model = Photo
        fields = ['id', 'image', 'legende', 'ordre', 'date_upload']
        read_only_fields = ['id', 'date_upload']


class AppartementListSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la liste des appartements (version simplifiée)
    """
    photo_principale_url = serializers.SerializerMethodField()
    proprietaire_nom = serializers.CharField(source='proprietaire.user.get_full_name', read_only=True)
    
    class Meta:
        model = Appartement
        fields = [
            'id', 'titre', 'ville', 'loyer_mensuel', 'surface',
            'nb_pieces', 'disponible', 'photo_principale_url',
            'proprietaire_nom', 'nb_vues', 'nb_favoris'
        ]
    
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
    proprietaire = ProprietaireSerializer(read_only=True)

    def get_photo_principale_url(self, obj):
        """Retourne l'URL de la photo principale ou None si absente"""
        if getattr(obj, 'photo_principale', None):
            try:
                return obj.photo_principale.url
            except Exception:
                return None
        return None

    class Meta:
        model = Appartement
        fields = [
            'id', 'titre', 'description', 'adresse', 'ville', 'code_postal',
            'loyer_mensuel', 'caution', 'surface', 'nb_pieces',
            'disponible', 'photo_principale', 'photo_principale_url',
            'photos', 'proprietaire', 'nb_vues', 'nb_favoris',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification', 'nb_vues', 'nb_favoris']


class AppartementCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour créer/modifier un appartement
    """
    class Meta:
        model = Appartement
        fields = [
            'titre', 'description', 'adresse', 'ville', 'code_postal',
            'loyer_mensuel', 'caution', 'surface', 'nb_pieces',
            'disponible', 'photo_principale', 'proprietaire'
        ]
    
    def validate_loyer_mensuel(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le loyer doit être positif")
        return value
    
    def validate_surface(self, value):
        if value and value > 1000:
            raise serializers.ValidationError("Surface trop grande (max 1000m²)")
        return value


# ========== SÉRIALISEURS LOCATIONS ==========

class LocationListSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la liste des locations
    """
    appartement_titre = serializers.CharField(source='appartement.titre', read_only=True)
    appartement_ville = serializers.CharField(source='appartement.ville', read_only=True)
    locataire_nom = serializers.CharField(source='locataire.nom', read_only=True)
    
    class Meta:
        model = Location
        fields = [
            'id', 'appartement_id', 'appartement_titre', 'appartement_ville',
            'locataire_id', 'locataire_nom', 'nom_locataire',
            'date_debut', 'date_fin', 'statut', 'montant_total',
            'date_reservation', 'est_active'
        ]


class LocationDetailSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le détail d'une location
    """
    appartement = AppartementListSerializer(read_only=True)
    locataire = LocataireSerializer(read_only=True)
    duree_sejour = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Location
        fields = [
            'id', 'appartement', 'locataire', 'nom_locataire',
            'email_locataire', 'telephone_locataire',
            'date_debut', 'date_fin', 'statut', 'date_reservation',
            'date_confirmation', 'date_paiement', 'montant_total',
            'commission', 'notes', 'duree_sejour', 'est_active'
        ]


class LocationCreateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour créer une location
    """
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
        
        # Vérifier la disponibilité de l'appartement
        appartement = data['appartement']
        locations_conflictuelles = Location.objects.filter(
            appartement=appartement,
            date_debut__lte=data['date_fin'],
            date_fin__gte=data['date_debut'],
            statut__in=['RESERVE', 'CONFIRME', 'PAYE']
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
            locataire = Locataire.objects.get(email=email)
            validated_data['locataire'] = locataire
        except Locataire.DoesNotExist:
            pass

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