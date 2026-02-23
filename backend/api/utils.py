from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def send_reservation_confirmation_email(location):
    """
    Envoie un email de confirmation de réservation
    """
    try:
        subject = f'Confirmation de votre réservation - {location.appartement.titre}'
        
        message = f"""
        Bonjour {location.nom_locataire},
        
        Votre réservation pour l'appartement "{location.appartement.titre}" a bien été enregistrée.
        
        Détails de la réservation :
        - Appartement : {location.appartement.titre}
        - Adresse : {location.appartement.adresse}
        - Du : {location.date_debut.strftime('%d/%m/%Y')}
        - Au : {location.date_fin.strftime('%d/%m/%Y')}
        - Montant total : {location.montant_total} €
        - Statut : {location.get_statut_display()}
        
        Vous recevrez un email de confirmation dès que le propriétaire aura validé votre réservation.
        
        À bientôt sur notre plateforme !
        L'équipe Location Appartements
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [location.email_locataire],
            fail_silently=True,
        )
        
        logger.info(f"Email de confirmation envoyé à {location.email_locataire}")
        
    except Exception as e:
        logger.error(f"Erreur envoi email: {e}")


def send_reservation_status_email(location):
    """
    Envoie un email de changement de statut
    """
    try:
        subject = f'Mise à jour de votre réservation - {location.appartement.titre}'
        
        message = f"""
        Bonjour {location.nom_locataire},
        
        Le statut de votre réservation pour "{location.appartement.titre}" a été mis à jour.
        
        Nouveau statut : {location.get_statut_display()}
        
        """
        
        if location.statut == 'CONFIRME':
            message += "Votre réservation est maintenant confirmée !"
        elif location.statut == 'PAYE':
            message += "Le paiement a bien été reçu."
        elif location.statut == 'ANNULE':
            message += "Votre réservation a été annulée."
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [location.email_locataire],
            fail_silently=True,
        )
        
    except Exception as e:
        logger.error(f"Erreur envoi email: {e}")