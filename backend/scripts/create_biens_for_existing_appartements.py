"""
Script pour creer automatiquement des PremiumBien pour tous les appartements existants
qui n'ont pas encore de bien associe.

Usage:
    python manage.py shell < scripts/create_biens_for_existing_appartements.py
    
Ou dans le shell Django:
    exec(open('scripts/create_biens_for_existing_appartements.py').read())
"""

from api.models import Appartement, PremiumBien, PremiumCategory, PremiumAppartementType

def create_biens_for_appartements():
    """Cree les PremiumBien pour tous les appartements sans bien associe"""
    
    # Recuperer tous les appartements sans bien
    appartements_sans_bien = Appartement.objects.filter(bien__isnull=True, proprietaire__isnull=False)
    
    count_created = 0
    count_skipped = 0
    
    print(f"Traitement de {appartements_sans_bien.count()} appartements...")
    
    for appt in appartements_sans_bien:
        try:
            # Mapper le type_bien vers category
            type_mapping = {
                'APPARTEMENT': 'APPARTEMENT',
                'MAISON': 'MAISON',
                'PARKING': 'PARKING',
                'LOCAL_COMMERCIAL': 'COMMERCIAL',
                'BUREAU': 'BUREAU',
                'TERRAIN': 'TERRAIN',
            }
            
            category_code = type_mapping.get(appt.type_bien, 'APPARTEMENT')
            
            # Recuperer ou creer la categorie
            category, _ = PremiumCategory.objects.get_or_create(
                code=category_code,
                defaults={'label': appt.get_type_bien_display()}
            )
            
            # Pour les appartements/maisons, gerer le type
            appartement_type = None
            if appt.type_bien in ['APPARTEMENT', 'MAISON'] and appt.nb_pieces:
                type_code = f'T{appt.nb_pieces}' if appt.nb_pieces > 1 else 'STUDIO'
                type_label = f'{appt.nb_pieces} pieces' if appt.nb_pieces > 1 else 'Studio'
                
                appartement_type, _ = PremiumAppartementType.objects.get_or_create(
                    code=type_code,
                    defaults={'label': type_label}
                )
            
            # Creer le PremiumBien
            bien = PremiumBien.objects.create(
                owner=appt.proprietaire,
                category=category,
                appartement_type=appartement_type,
                titre=appt.titre,
                adresse=appt.adresse,
                description=appt.description or '',
                loyer_hc=appt.loyer_mensuel,
                charges=0,
                statut='VACANT' if appt.disponible else 'LOUE',
            )
            
            # Lier le bien a l'appartement
            appt.bien = bien
            appt.save(update_fields=['bien'])
            
            count_created += 1
            print(f"OK Bien cree pour: {appt.titre} (ID: {appt.id})")
            
        except Exception as e:
            count_skipped += 1
            print(f"ERREUR pour appartement {appt.id}: {str(e)}")
            continue
    
    print(f"\n{'='*60}")
    print(f"Resume:")
    print(f"  - Biens crees: {count_created}")
    print(f"  - Erreurs: {count_skipped}")
    print(f"{'='*60}")

if __name__ == '__main__':
    create_biens_for_appartements()
