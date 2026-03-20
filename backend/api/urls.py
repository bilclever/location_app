from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    # Appartements
    AppartementViewSet,
    
    # Locations
    LocationViewSet,
    
    # Auth
    RegisterView, VerifyRegisterOTPView, LoginView, VerifyLoginOTPView, LogoutView, ProfileView,
    ChangePasswordView, UpdatePlanView,
    
    # Favoris
    FavorisView,
    
    # Dashboards
    ProprietaireDashboardView, LocataireDashboardView,
    
    # Statistiques
    StatistiquesView,

    # Users
    UserViewSet,
)
from .premium_views import (
    PremiumCategoryViewSet,
    PremiumAppartementTypeViewSet,
    PremiumBienViewSet,
    PremiumLocataireViewSet,
    PremiumBailViewSet,
    PremiumComptaEntryViewSet,
    PremiumPaymentViewSet,
    PremiumDashboardView,
    PremiumPaymentAuditLogListView,
    PremiumRgpdPurgeView,
)

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'appartements', AppartementViewSet, basename='appartement')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'users', UserViewSet, basename='user')
router.register(r'premium/categories', PremiumCategoryViewSet, basename='premium-category')
router.register(r'premium/appartement-types', PremiumAppartementTypeViewSet, basename='premium-appartement-type')
router.register(r'premium/biens', PremiumBienViewSet, basename='premium-bien')
router.register(r'premium/locataires', PremiumLocataireViewSet, basename='premium-locataire')
router.register(r'premium/baux', PremiumBailViewSet, basename='premium-bail')
router.register(r'premium/comptabilite/ecritures', PremiumComptaEntryViewSet, basename='premium-compta-entry')
router.register(r'premium/payments', PremiumPaymentViewSet, basename='premium-payment')

# URLs d'authentification
auth_patterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('register/verify-otp/', VerifyRegisterOTPView.as_view(), name='auth_register_verify_otp'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('login/verify-otp/', VerifyLoginOTPView.as_view(), name='auth_login_verify_otp'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('plan/', UpdatePlanView.as_view(), name='auth_plan_update'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# URLs spécifiques aux rôles
role_patterns = [
    path('favoris/', FavorisView.as_view(), name='favoris'),
    path('dashboard/proprietaire/', ProprietaireDashboardView.as_view(), name='dashboard_proprietaire'),
    path('dashboard/locataire/', LocataireDashboardView.as_view(), name='dashboard_locataire'),
]

urlpatterns = [
    # Premium (custom endpoints before router to avoid route conflicts)
    path('premium/dashboard/', PremiumDashboardView.as_view(), name='premium_dashboard'),
    path('premium/payments/audit-logs/', PremiumPaymentAuditLogListView.as_view(), name='premium_payment_audit_logs'),
    path('premium/rgpd/purge/', PremiumRgpdPurgeView.as_view(), name='premium_rgpd_purge'),

    # API principale
    path('', include(router.urls)),
    
    # Authentification
    path('auth/', include(auth_patterns)),
    
    # Rôles spécifiques
    path('', include(role_patterns)),
    
    # Statistiques
    path('statistiques/', StatistiquesView.as_view(), name='statistiques'),
]