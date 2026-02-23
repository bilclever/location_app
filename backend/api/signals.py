from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import User, Locataire, Proprietaire, Appartement, Location, Favori


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Crée automatiquement le profil approprié lors de la création d'un utilisateur
    """
    if created:
        if instance.role == 'LOCATAIRE' and not hasattr(instance, 'profil_locataire'):
            Locataire.objects.create(
                user=instance,
                nom=f"{instance.first_name} {instance.last_name}".strip() or instance.username,
                email=instance.email,
                telephone=instance.telephone or ''
            )
        elif instance.role == 'PROPRIETAIRE' and not hasattr(instance, 'profil_proprietaire'):
            Proprietaire.objects.create(user=instance)


@receiver(post_save, sender=Location)
def update_location_stats(sender, instance, created, **kwargs):
    """
    Met à jour les statistiques lors de la création/modification d'une location
    """
    if created and instance.locataire:
        instance.locataire.total_reservations = instance.locataire.locations.count()
        instance.locataire.save()


@receiver(post_delete, sender=Favori)
def update_favori_count(sender, instance, **kwargs):
    """
    Met à jour le compteur de favoris lors de la suppression
    """
    instance.appartement.nb_favoris = instance.appartement.favoris.count()
    instance.appartement.save(update_fields=['nb_favoris'])