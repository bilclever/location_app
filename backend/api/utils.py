from django.core.mail import send_mail, EmailMessage
from django.conf import settings
from django.utils import timezone
from ssl import SSLCertVerificationError
import logging

logger = logging.getLogger(__name__)


def send_bail_generated_email(location, bail_data, pdf_bytes, filename):
    """
    Envoie le bail génere en piece jointe au locataire.

    Raises:
        ValueError: si les preconditions de configuration ou d'adresse email ne sont pas satisfaites.
        Exception: remonte les erreurs SMTP pour etre traitees par la vue.
    """
    locataire_email = (location.email_locataire or '').strip()
    if not locataire_email:
        raise ValueError("Email locataire manquant")

    if not settings.DEFAULT_FROM_EMAIL:
        raise ValueError("DEFAULT_FROM_EMAIL n'est pas configure")

    date_entree = bail_data.get('date_entree')
    date_fin = bail_data.get('date_fin')
    loyer_mensuel = bail_data.get('loyer_mensuel')
    charges = bail_data.get('charges', 0)
    depot_garantie = bail_data.get('depot_garantie')

    subject = f"Votre bail numerique - {location.appartement.titre}"
    body = (
        f"Bonjour {location.nom_locataire},\n\n"
        "Votre bail numerique a ete genere et est joint a cet email.\n\n"
        "Details du bail:\n"
        f"- Appartement: {location.appartement.titre}\n"
        f"- Adresse: {location.appartement.adresse}\n"
        f"- Date d'entree: {date_entree}\n"
        f"- Date de fin: {date_fin}\n"
        f"- Loyer mensuel: {loyer_mensuel}\n"
        f"- Charges: {charges}\n"
        f"- Depot de garantie: {depot_garantie}\n\n"
        "Cordialement,\n"
        "L'equipe Residance"
    )

    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[locataire_email],
        reply_to=[getattr(settings, 'DOCUMENT_REPLY_TO_EMAIL', settings.DEFAULT_FROM_EMAIL)],
    )
    email.attach(filename, pdf_bytes, 'application/pdf')

    try:
        email.send(fail_silently=False)
    except SSLCertVerificationError as error:
        raise ValueError(
            "Echec TLS SMTP: certificat invalide. Configure EMAIL_TLS_VALIDATE_CERTS=false en local "
            "ou renseigne EMAIL_CA_FILE avec un bundle CA valide."
        ) from error

    logger.info("Bail envoye par email a %s pour location=%s", locataire_email, location.id)


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


def generate_bail_pdf(location, bail_data):
    """
    Génère un PDF du bail numérique
    
    Args:
        location: Objet Location
        bail_data: Dict avec date_entree, date_fin, loyer_mensuel, charges, depot_garantie, conditions_particulieres
    
    Returns:
        BytesIO: Fichier PDF en mémoire
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm, inch
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from io import BytesIO
    from datetime import datetime
    
    # Créer un buffer en mémoire pour le PDF
    pdf_buffer = BytesIO()
    
    # Créer le document PDF avec marges réduites
    doc = SimpleDocTemplate(
        pdf_buffer, 
        pagesize=A4, 
        topMargin=0.8*cm, 
        bottomMargin=0.8*cm,
        leftMargin=1.5*cm,
        rightMargin=1.5*cm
    )
    
    # Styles optimisés pour une seule page
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#f2a65a'),
        spaceAfter=0.2*cm,
        alignment=1,  # Center
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=10,
        textColor=colors.HexColor('#333333'),
        spaceAfter=0.15*cm,
        spaceBefore=0.2*cm,
        borderColor=colors.HexColor('#f2a65a'),
        borderWidth=0.5,
        borderPadding=0.1*cm,
    )
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
    )
    
    # Éléments du document
    elements = []
    
    # Titre
    elements.append(Paragraph("BAIL DE LOCATION MEUBLÉE", title_style))
    elements.append(Spacer(1, 0.3*cm))
    
    # Section: Bien concerné
    elements.append(Paragraph("BIEN CONCERNÉ", heading_style))
    appartement = location.appartement
    bien_data = [
        ['Titre', str(appartement.titre or 'N/A')],
        ['Adresse', f"{appartement.adresse or ''}, {appartement.code_postal or ''} {appartement.ville or ''}".strip().rstrip(',')],
        ['Surface', f"{appartement.surface or 'N/A'} m²"],
        ['Nombre de pièces', str(appartement.nb_pieces or 'N/A')],
    ]
    bien_table = Table(bien_data, colWidths=[2.5*cm, 13*cm])
    bien_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f6f2eb')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(bien_table)
    elements.append(Spacer(1, 0.2*cm))
    
    # Section: Locataire
    elements.append(Paragraph("LOCATAIRE", heading_style))
    locataire_data = [
        ['Nom', str(location.nom_locataire or 'N/A')],
        ['Email', str(location.email_locataire or 'N/A')],
        ['Téléphone', str(location.telephone_locataire or 'N/A')],
    ]
    locataire_table = Table(locataire_data, colWidths=[2.5*cm, 13*cm])
    locataire_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f6f2eb')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(locataire_table)
    elements.append(Spacer(1, 0.2*cm))
    
    # Section: Conditions du bail
    elements.append(Paragraph("CONDITIONS DU BAIL", heading_style))
    
    # Convertir les dates en objets datetime si nécessaire
    try:
        date_entree = bail_data.get('date_entree')
        date_fin = bail_data.get('date_fin')
        
        if isinstance(date_entree, str):
            date_entree = datetime.fromisoformat(date_entree).strftime('%d/%m/%Y')
        elif hasattr(date_entree, 'strftime'):
            date_entree = date_entree.strftime('%d/%m/%Y')
        else:
            date_entree = 'N/A'
        
        if isinstance(date_fin, str):
            date_fin = datetime.fromisoformat(date_fin).strftime('%d/%m/%Y')
        elif hasattr(date_fin, 'strftime'):
            date_fin = date_fin.strftime('%d/%m/%Y')
        else:
            date_fin = 'N/A'
        
        loyer_mensuel = float(bail_data.get('loyer_mensuel', 0))
        charges = float(bail_data.get('charges', 0))
        depot_garantie = float(bail_data.get('depot_garantie', loyer_mensuel))
        
        loyer_total = loyer_mensuel + charges
    except (ValueError, TypeError) as e:
        logger.error(f"Erreur conversion données bail: {e}")
        return None
    
    conditions_data = [
        ['Date d\'entrée', str(date_entree)],
        ['Date de fin', str(date_fin)],
        ['Loyer mensuel', f"{loyer_mensuel:.2f} €"],
        ['Charges', f"{charges:.2f} €"],
        ['Loyer total (HC)', f"{loyer_total:.2f} €"],
        ['Dépôt de garantie', f"{depot_garantie:.2f} €"],
    ]
    conditions_table = Table(conditions_data, colWidths=[4*cm, 11.5*cm])
    conditions_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f6f2eb')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, -1), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(conditions_table)
    elements.append(Spacer(1, 0.2*cm))
    
    # Section: Conditions particulières
    conditions_particulieres = bail_data.get('conditions_particulieres', '')
    if conditions_particulieres:
        elements.append(Paragraph("CONDITIONS PARTICULIÈRES", heading_style))
        elements.append(Paragraph(str(conditions_particulieres or '').strip(), normal_style))
        elements.append(Spacer(1, 0.2*cm))
    
    # Signature
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph("SIGNATURES", heading_style))
    elements.append(Spacer(1, 0.15*cm))
    
    signature_data = [
        ['PROPRIÉTAIRE', 'LOCATAIRE'],
        ['', ''],
        ['Fait le ' + datetime.now().strftime('%d/%m/%Y'), ''],
    ]
    signature_table = Table(signature_data, colWidths=[8*cm, 8*cm], rowHeights=[0.5*cm, 1*cm, 0.5*cm])
    signature_table.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(signature_table)
    
    # Générer le PDF
    try:
        doc.build(elements)
        pdf_buffer.seek(0)
        logger.info(f"PDF généré avec succès pour location {location.id}")
        return pdf_buffer
    except Exception as e:
        logger.error(f"Erreur génération PDF: {str(e)}", exc_info=True)
        return None