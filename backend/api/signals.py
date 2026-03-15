from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Appartement, PremiumBien, PremiumCategory, PremiumAppartementType


@receiver(post_save, sender=Appartement)
def create_premium_bien_for_appartement(sender, instance, created, **kwargs):
    """
    Crée automatiquement un PremiumBien quand un Appartement est créé
    Un appartement EST un bien, donc on crée le bien correspondant
    """
    if created and instance.proprietaire:
        # Vérifier si un bien n'existe pas déjà
        if not instance.bien:
            # Récupérer ou créer la catégorie par défaut basée sur type_bien
            category = None
            appartement_type = None
            
            # Mapper le type_bien vers category/appartement_type
            type_mapping = {
                'APPARTEMENT': 'APPARTEMENT',
                'MAISON': 'MAISON',
                'PARKING': 'PARKING',
                'LOCAL_COMMERCIAL': 'COMMERCIAL',
                'BUREAU': 'BUREAU',
                'TERRAIN': 'TERRAIN',
            }
            
            category_code = type_mapping.get(instance.type_bien, 'APPARTEMENT')
            
            # Essayer de récupérer la catégorie existante
            try:
                category = PremiumCategory.objects.get(code=category_code)
            except PremiumCategory.DoesNotExist:
                # Créer la catégorie si elle n'existe pas
                category = PremiumCategory.objects.create(
                    code=category_code,
                    label=instance.get_type_bien_display()
                )
            
            # Pour les appartements/maisons, essayer de récupérer le type
            if instance.type_bien in ['APPARTEMENT', 'MAISON']:
                type_code = f'T{instance.nb_pieces}' if instance.nb_pieces else 'STUDIO'
                try:
                    appartement_type = PremiumAppartementType.objects.get(code=type_code)
                except PremiumAppartementType.DoesNotExist:
                    # Créer le type si nécessaire
                    type_label = f'{instance.nb_pieces} pièces' if instance.nb_pieces > 1 else 'Studio'
                    appartement_type = PremiumAppartementType.objects.create(
                        code=type_code,
                        label=type_label
                    )
            
            # Créer le PremiumBien
            bien = PremiumBien.objects.create(
                owner=instance.proprietaire,
                category=category,
                appartement_type=appartement_type,
                titre=instance.titre,
                adresse=instance.adresse,
                description=instance.description,
                loyer_hc=instance.loyer_mensuel,
                charges=0,  # Peut être ajouté plus tard
                statut='VACANT' if instance.disponible else 'LOUE',
            )
            
            # Lier le bien à l'appartement
            instance.bien = bien
            # Utiliser update pour éviter de déclencher à nouveau le signal
            Appartement.objects.filter(pk=instance.pk).update(bien=bien)


@receiver(post_save, sender=Appartement)
def update_location_stats(sender, instance, created, **kwargs):
    """
    Met à jour les statistiques lors de la création/modification d'une location
    """
    pass


@receiver(post_delete, sender=Appartement)
def update_favori_count(sender, instance, **kwargs):
    """
    Met à jour le compteur de favoris lors de la suppression
    """
    pass
