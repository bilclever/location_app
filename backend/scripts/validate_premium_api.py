from uuid import uuid4
from rest_framework.test import APIClient
from django.conf import settings
from api.models import User

if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')


def safe_json(response):
    try:
        return response.json()
    except Exception:
        return {'raw': getattr(response, 'content', b'')[:200].decode('utf-8', errors='ignore')}

premium_email = 'premium.validation@example.com'
free_email = 'free.validation@example.com'

premium_user, _ = User.objects.get_or_create(
    email=premium_email,
    defaults={
        'id': uuid4(),
        'username': 'premium_validation',
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
        'username': 'free_validation',
        'plan': 'free',
        'is_admin': False,
    }
)
if free_user.plan != 'free':
    free_user.plan = 'free'
    free_user.save(update_fields=['plan'])

client = APIClient()

client.force_authenticate(user=free_user)
resp_free = client.get('/api/premium/dashboard/')
print('free_dashboard_status=', resp_free.status_code)
print('free_dashboard_payload=', safe_json(resp_free))

client.force_authenticate(user=premium_user)
resp_premium_dashboard = client.get('/api/premium/dashboard/')
print('premium_dashboard_status=', resp_premium_dashboard.status_code)
print('premium_dashboard_payload=', safe_json(resp_premium_dashboard))

resp_create_category = client.post('/api/premium/categories/', {'code': 'APPARTEMENT', 'label': 'Appartement'}, format='json')
print('create_category_status=', resp_create_category.status_code)
category_payload = safe_json(resp_create_category) if resp_create_category.status_code < 500 else {}
print('create_category_payload=', category_payload)

category_id = category_payload.get('id')
if not category_id:
    list_resp = client.get('/api/premium/categories/')
    print('list_categories_status=', list_resp.status_code)
    data = list_resp.json()
    results = data.get('results', data if isinstance(data, list) else [])
    if results:
        category_id = results[0]['id']

resp_create_type = client.post('/api/premium/appartement-types/', {'code': 'STUDIO', 'label': 'Studio'}, format='json')
print('create_type_status=', resp_create_type.status_code)
type_payload = safe_json(resp_create_type) if resp_create_type.status_code < 500 else {}
print('create_type_payload=', type_payload)

type_id = type_payload.get('id')
if not type_id:
    list_resp = client.get('/api/premium/appartement-types/')
    data = list_resp.json()
    results = data.get('results', data if isinstance(data, list) else [])
    if results:
        type_id = results[0]['id']

resp_create_bien = client.post('/api/premium/biens/', {
    'category': category_id,
    'appartement_type': type_id,
    'titre': 'Bien Test Premium',
    'adresse': '10 rue premium',
    'description': 'Validation API premium',
    'equipements': ['wifi', 'clim'],
    'loyer_hc': '120000',
    'charges': '10000',
    'statut': 'VACANT'
}, format='json')
print('create_bien_status=', resp_create_bien.status_code)
print('create_bien_payload=', safe_json(resp_create_bien))
