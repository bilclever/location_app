from rest_framework import serializers

from .models import (
    PremiumCategory,
    PremiumAppartementType,
    PremiumBien,
    PremiumLocataire,
    PremiumBail,
    PremiumComptableEcriture,
    PremiumPayment,
    PremiumPaymentAuditLog,
)


class PremiumCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PremiumCategory
        fields = ['id', 'code', 'label', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PremiumAppartementTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PremiumAppartementType
        fields = ['id', 'code', 'label', 'created_at']
        read_only_fields = ['id', 'created_at']


class PremiumBienSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source='category.label', read_only=True)
    appartement_type_label = serializers.CharField(source='appartement_type.label', read_only=True)

    class Meta:
        model = PremiumBien
        fields = [
            'id', 'category', 'category_label', 'appartement_type', 'appartement_type_label',
            'titre', 'adresse', 'description', 'equipements', 'loyer_hc', 'charges',
            'latitude', 'longitude', 'statut', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'category_label', 'appartement_type_label']

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        appartement_type = attrs.get('appartement_type') or getattr(self.instance, 'appartement_type', None)
        if not appartement_type:
            raise serializers.ValidationError({'appartement_type': 'Le type de bien est obligatoire avant publication.'})

        if user and getattr(appartement_type, 'owner_id', None) != user.id:
            raise serializers.ValidationError({'appartement_type': 'Type de bien invalide pour cet utilisateur.'})

        category = attrs.get('category')
        if category is not None and user and getattr(category, 'owner_id', None) != user.id:
            raise serializers.ValidationError({'category': 'Categorie invalide pour cet utilisateur.'})

        return attrs


class PremiumLocataireSerializer(serializers.ModelSerializer):
    piece_identite = serializers.CharField(write_only=True, required=False, allow_blank=True)
    garant = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = PremiumLocataire
        fields = [
            'id', 'nom', 'prenoms', 'email', 'telephone', 'date_naissance', 'profession',
            'piece_identite', 'garant', 'historique_paiements', 'date_depart', 'is_purged',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_purged', 'created_at', 'updated_at']

    def create(self, validated_data):
        piece_identite = validated_data.pop('piece_identite', '')
        garant = validated_data.pop('garant', '')
        instance = super().create(validated_data)
        if piece_identite:
            instance.set_piece_identite(piece_identite)
        if garant:
            instance.set_garant(garant)
        if piece_identite or garant:
            instance.save(update_fields=['piece_identite_chiffree', 'garant_chiffre', 'updated_at'])
        return instance

    def update(self, instance, validated_data):
        piece_identite = validated_data.pop('piece_identite', None)
        garant = validated_data.pop('garant', None)
        instance = super().update(instance, validated_data)
        should_save_sensitive = False

        if piece_identite is not None:
            instance.set_piece_identite(piece_identite)
            should_save_sensitive = True

        if garant is not None:
            instance.set_garant(garant)
            should_save_sensitive = True

        if should_save_sensitive:
            instance.save(update_fields=['piece_identite_chiffree', 'garant_chiffre', 'updated_at'])

        return instance


class PremiumBailSerializer(serializers.ModelSerializer):
    bien_titre = serializers.CharField(source='bien.titre', read_only=True)
    locataire_nom = serializers.SerializerMethodField()

    class Meta:
        model = PremiumBail
        fields = [
            'id', 'bien', 'bien_titre', 'locataire', 'locataire_nom',
            'date_entree', 'date_sortie', 'revision_annuelle', 'depot_garantie',
            'statut', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'bien_titre', 'locataire_nom']

    def get_locataire_nom(self, obj):
        return f"{obj.locataire.nom} {obj.locataire.prenoms}".strip()

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        bien = attrs.get('bien')
        locataire = attrs.get('locataire')

        if bien is not None and user and getattr(bien, 'owner_id', None) != user.id:
            raise serializers.ValidationError({'bien': 'Bien invalide pour cet utilisateur.'})

        if locataire is not None and user and getattr(locataire, 'owner_id', None) != user.id:
            raise serializers.ValidationError({'locataire': 'Locataire invalide pour cet utilisateur.'})

        return attrs


class PremiumComptableEcritureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PremiumComptableEcriture
        fields = [
            'id', 'bien', 'bail', 'type_ecriture', 'source', 'libelle',
            'categorie', 'date_operation', 'montant', 'metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'source']

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        bien = attrs.get('bien')
        bail = attrs.get('bail')

        if bien is not None and user and getattr(bien, 'owner_id', None) != user.id:
            raise serializers.ValidationError({'bien': 'Bien invalide pour cet utilisateur.'})

        if bail is not None and user and getattr(bail, 'owner_id', None) != user.id:
            raise serializers.ValidationError({'bail': 'Bail invalide pour cet utilisateur.'})

        if bien is not None and bail is not None and getattr(bail, 'bien_id', None) != bien.id:
            raise serializers.ValidationError({'bail': 'Le bail selectionne ne correspond pas au bien.'})

        return attrs


class PremiumPaymentAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = PremiumPaymentAuditLog
        fields = ['id', 'payment', 'action', 'old_data', 'new_data', 'changed_at']


class PremiumPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PremiumPayment
        fields = [
            'id', 'bail', 'date_paiement', 'periode_debut', 'periode_fin',
            'montant', 'statut', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        bail = attrs.get('bail')

        if bail is not None and user and getattr(bail, 'owner_id', None) != user.id:
            raise serializers.ValidationError({'bail': 'Bail invalide pour cet utilisateur.'})

        return attrs


class PremiumDashboardSerializer(serializers.Serializer):
    patrimoine = serializers.DictField()
    comptabilite = serializers.DictField()
    baux = serializers.DictField()
