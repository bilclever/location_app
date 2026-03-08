from uuid import uuid4
from datetime import date, timedelta

from django.conf import settings
from rest_framework.test import APIClient

from api.models import User

if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')


def safe_json(response):
    try:
        return response.json()
    except Exception:
        return {'raw': getattr(response, 'content', b'')[:300].decode('utf-8', errors='ignore')}


def get_results(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict) and isinstance(payload.get('results'), list):
        return payload['results']
    return []


premium_email = 'premium.workflow@example.com'
free_email = 'free.workflow@example.com'

premium_user, _ = User.objects.get_or_create(
    email=premium_email,
    defaults={
        'id': uuid4(),
        'username': 'premium_workflow',
        'plan': 'premium',
        'is_admin': False,
    }
)
if premium_user.plan != 'premium':
    premium_user.plan = 'premium'
    premium_user.save(update_fields=['plan'])

free_user, _ = User.objects.get_or_create(
    email=free_email,
    defaults={
        'id': uuid4(),
        'username': 'free_workflow',
        'plan': 'free',
        'is_admin': False,
    }
)
if free_user.plan != 'free':
    free_user.plan = 'free'
    free_user.save(update_fields=['plan'])

client = APIClient()

print('=== 1) Plan gating ===')
client.force_authenticate(user=free_user)
resp_free = client.get('/api/premium/dashboard/')
print('free dashboard status:', resp_free.status_code)
print('free dashboard payload:', safe_json(resp_free))

client.force_authenticate(user=premium_user)
resp_premium = client.get('/api/premium/dashboard/')
print('premium dashboard status:', resp_premium.status_code)
print('premium dashboard payload:', safe_json(resp_premium))

print('\n=== 2) Create category + type ===')
cat_code = f'CAT_{uuid4().hex[:8].upper()}'
resp_category = client.post('/api/premium/categories/', {
    'code': cat_code,
    'label': 'Appartement'
}, format='json')
print('create category status:', resp_category.status_code)
print('create category payload:', safe_json(resp_category))

if resp_category.status_code in (200, 201):
    category_id = safe_json(resp_category).get('id')
else:
    list_cat = client.get('/api/premium/categories/')
    cat_results = get_results(safe_json(list_cat))
    category_id = cat_results[0]['id'] if cat_results else None

resp_type = client.post('/api/premium/appartement-types/', {
    'code': f'TYPE_{uuid4().hex[:8].upper()}',
    'label': 'Studio'
}, format='json')
print('create type status:', resp_type.status_code)
print('create type payload:', safe_json(resp_type))

if resp_type.status_code in (200, 201):
    type_id = safe_json(resp_type).get('id')
else:
    list_type = client.get('/api/premium/appartement-types/')
    type_results = get_results(safe_json(list_type))
    type_id = type_results[0]['id'] if type_results else None

print('\n=== 3) Create bien ===')
resp_bien = client.post('/api/premium/biens/', {
    'category': category_id,
    'appartement_type': type_id,
    'titre': f'Bien Premium {uuid4().hex[:6]}',
    'adresse': '10 rue test premium',
    'description': 'Bien de validation workflow',
    'equipements': ['wifi', 'clim'],
    'loyer_hc': '150000',
    'charges': '15000',
    'statut': 'VACANT'
}, format='json')
print('create bien status:', resp_bien.status_code)
print('create bien payload:', safe_json(resp_bien))
bien_id = safe_json(resp_bien).get('id') if resp_bien.status_code in (200, 201) else None

print('\n=== 4) Create locataire ===')
resp_locataire = client.post('/api/premium/locataires/', {
    'nom': 'Doe',
    'prenoms': 'John',
    'email': f'john.{uuid4().hex[:6]}@mail.com',
    'telephone': '+2250101010101',
    'date_naissance': '1995-05-20',
    'profession': 'Ingenieur',
    'piece_identite': 'CI-ABC-12345',
    'garant': 'Jane Doe',
    'historique_paiements': []
}, format='json')
print('create locataire status:', resp_locataire.status_code)
print('create locataire payload:', safe_json(resp_locataire))
locataire_id = safe_json(resp_locataire).get('id') if resp_locataire.status_code in (200, 201) else None

print('\n=== 5) Create bail ===')
resp_bail = client.post('/api/premium/baux/', {
    'bien': bien_id,
    'locataire': locataire_id,
    'date_entree': date.today().isoformat(),
    'date_sortie': (date.today() + timedelta(days=365)).isoformat(),
    'revision_annuelle': '2.50',
    'depot_garantie': '300000',
    'statut': 'ACTIF'
}, format='json')
print('create bail status:', resp_bail.status_code)
print('create bail payload:', safe_json(resp_bail))
bail_id = safe_json(resp_bail).get('id') if resp_bail.status_code in (200, 201) else None

print('\n=== 6) Create ecriture comptable (manual depense) ===')
resp_entry = client.post('/api/premium/comptabilite/ecritures/', {
    'bien': bien_id,
    'bail': bail_id,
    'type_ecriture': 'DEPENSE',
    'libelle': 'Travaux peinture',
    'categorie': 'TRAVAUX',
    'date_operation': date.today().isoformat(),
    'montant': '25000',
    'metadata': {'invoice': 'INV-001'}
}, format='json')
print('create ecriture status:', resp_entry.status_code)
print('create ecriture payload:', safe_json(resp_entry))

print('\n=== 6b) Create payment (auto revenu + audit log) ===')
resp_payment = client.post('/api/premium/payments/', {
    'bail': bail_id,
    'date_paiement': date.today().isoformat(),
    'periode_debut': date.today().replace(day=1).isoformat(),
    'periode_fin': date.today().isoformat(),
    'montant': '150000',
    'statut': 'PAYE',
}, format='json')
print('create payment status:', resp_payment.status_code)
print('create payment payload:', safe_json(resp_payment))

print('\n=== 7) Dashboard after creation ===')
resp_dashboard = client.get('/api/premium/dashboard/')
print('dashboard status:', resp_dashboard.status_code)
print('dashboard payload:', safe_json(resp_dashboard))

print('\n=== 8) RGPD purge flow ===')
if locataire_id:
    # First attempt should fail because date_depart not set/past
    resp_purge_before = client.post('/api/premium/rgpd/purge/', {'locataire_id': locataire_id}, format='json')
    print('purge before date_depart status:', resp_purge_before.status_code)
    print('purge before date_depart payload:', safe_json(resp_purge_before))

    # Set departure date in the past then purge
    resp_set_depart = client.patch(f'/api/premium/locataires/{locataire_id}/', {
        'date_depart': (date.today() - timedelta(days=1)).isoformat()
    }, format='json')
    print('set date_depart status:', resp_set_depart.status_code)
    print('set date_depart payload:', safe_json(resp_set_depart))

    resp_purge_after = client.post('/api/premium/rgpd/purge/', {'locataire_id': locataire_id}, format='json')
    print('purge after date_depart status:', resp_purge_after.status_code)
    print('purge after date_depart payload:', safe_json(resp_purge_after))

print('\n=== 9) Audit logs endpoint ===')
resp_audit = client.get('/api/premium/payments/audit-logs/')
print('audit logs status:', resp_audit.status_code)
print('audit logs payload:', safe_json(resp_audit))
