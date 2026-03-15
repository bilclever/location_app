import ssl

from django.conf import settings
from django.core.mail.backends.smtp import EmailBackend as DjangoSMTPEmailBackend


class ConfigurableTLSEmailBackend(DjangoSMTPEmailBackend):
    """
    SMTP backend avec verification TLS configurable pour faciliter le debug local.
    En production, garder EMAIL_TLS_VALIDATE_CERTS=true.
    """

    @property
    def ssl_context(self):
        context = ssl.create_default_context()

        ca_file = getattr(settings, 'EMAIL_CA_FILE', '')
        if ca_file:
            context.load_verify_locations(cafile=ca_file)
        else:
            try:
                import certifi
                context.load_verify_locations(cafile=certifi.where())
            except Exception:
                # Fallback sur le store systeme si certifi est absent.
                pass

        validate_certs = getattr(settings, 'EMAIL_TLS_VALIDATE_CERTS', True)
        if not validate_certs:
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE

        return context