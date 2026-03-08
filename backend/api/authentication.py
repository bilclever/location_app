import jwt
from jwt import PyJWKClient
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions

User = get_user_model()


class SupabaseAuthentication(authentication.BaseAuthentication):
    def _decode_supabase_jwt(self, token):
        jwt_algorithms = [
            algorithm.strip()
            for algorithm in getattr(settings, 'SUPABASE_JWT_ALGORITHMS', 'ES256,HS256').split(',')
            if algorithm.strip()
        ]

        if not jwt_algorithms:
            raise exceptions.AuthenticationFailed('SUPABASE_JWT_ALGORITHMS vide')

        unverified_header = jwt.get_unverified_header(token)
        token_alg = unverified_header.get('alg')

        if token_alg not in jwt_algorithms:
            raise exceptions.AuthenticationFailed(f'Algorithme JWT non autorisé: {token_alg}')

        supabase_url = getattr(settings, 'SUPABASE_URL', '').rstrip('/')
        expected_issuer = getattr(settings, 'SUPABASE_JWT_ISSUER', f'{supabase_url}/auth/v1')

        decode_kwargs = {
            'audience': 'authenticated',
            'issuer': expected_issuer,
            'algorithms': [token_alg],
        }

        if token_alg.startswith('ES') or token_alg.startswith('RS'):
            if not supabase_url:
                raise exceptions.AuthenticationFailed('SUPABASE_URL manquant dans la configuration serveur')

            jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
            signing_key = PyJWKClient(jwks_url).get_signing_key_from_jwt(token).key
            return jwt.decode(token, signing_key, **decode_kwargs)

        jwt_secret = getattr(settings, 'SUPABASE_JWT_SECRET', '')
        if not jwt_secret:
            raise exceptions.AuthenticationFailed('SUPABASE_JWT_SECRET manquant dans la configuration serveur')

        return jwt.decode(token, jwt_secret, **decode_kwargs)

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]

        try:
            payload = self._decode_supabase_jwt(token)

            # 'sub' est l'ID unique de l'utilisateur chez Supabase/Google
            user_id = payload.get('sub')
            if not user_id:
                raise exceptions.AuthenticationFailed('Token invalide : ID manquant')

            # Email depuis le payload
            email = payload.get('email') or ''
            
            # Métadonnées utilisateur (prénom, nom, etc.)
            metadata = payload.get('user_metadata', {})
            full_name = metadata.get('full_name', '')
            given_name = metadata.get('given_name', '')
            family_name = metadata.get('family_name', '')
            # Générer un username unique si absent
            base_username = metadata.get('preferred_username') or given_name or email.split('@')[0] or 'user'
            username = base_username[:150]  # Max 150 chars

            # Vérifier/créer l'utilisateur
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                # Créer l'utilisateur Supabase
                try:
                    if User.objects.filter(username=username).exists():
                        username = f"{username[:120]}_{str(user_id)[:8]}"

                    user = User.objects.create_user(
                        id=user_id,
                        email=email,
                        username=username,
                        password=None,  # Pas de password, auth via Supabase
                    )
                    # Ajouter les infos du profil si disponibles
                    model_fields = {field.name for field in user._meta.get_fields()}
                    if 'first_name' in model_fields and 'last_name' in model_fields:
                        if given_name and family_name:
                            user.first_name = given_name[:30]
                            user.last_name = family_name[:30]
                        elif full_name:
                            parts = full_name.split(' ', 1)
                            if len(parts) > 0:
                                user.first_name = parts[0][:30]
                            if len(parts) > 1:
                                user.last_name = parts[1][:30]

                    user.save()
                except Exception as create_error:
                    raise exceptions.AuthenticationFailed(f'Erreur création user: {str(create_error)}')

            return (user, None)

        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('La session a expiré, reconnectez-vous')
        except jwt.DecodeError as decode_err:
            raise exceptions.AuthenticationFailed(f'Erreur de décodage du jeton: {str(decode_err)}')
        except jwt.InvalidAudienceError:
            raise exceptions.AuthenticationFailed('Token invalide : audience incorrecte')
        except jwt.InvalidSignatureError:
            raise exceptions.AuthenticationFailed('Signature JWT invalide (vérifiez SUPABASE_JWT_SECRET)')
        except jwt.InvalidAlgorithmError:
            raise exceptions.AuthenticationFailed('Algorithme JWT non autorisé (vérifiez SUPABASE_JWT_ALGORITHMS)')
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Erreur authentification: {str(e)}')
