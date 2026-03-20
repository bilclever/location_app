from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailAuthBackend(ModelBackend):
    """Authentification Django avec email + mot de passe."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        user_model = get_user_model()
        email = (kwargs.get('email') or username or '').strip().lower()

        if not email or not password:
            return None

        try:
            user = user_model.objects.get(email__iexact=email)
        except user_model.DoesNotExist:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None