from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Appartement


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
