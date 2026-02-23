from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    # Appartements
    AppartementViewSet,
    
    # Locations
    LocationViewSet,
    
    # Auth
    RegisterView, LoginView, LogoutView, ProfileView,
    ChangePasswordView,
    
    # Favoris
    FavorisView,
    
    # Dashboards
    ProprietaireDashboardView, LocataireDashboardView,
    
    # Statistiques
    StatistiquesView,
)

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'appartements', AppartementViewSet, basename='appartement')
router.register(r'locations', LocationViewSet, basename='location')

# URLs d'authentification
auth_patterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# URLs spécifiques aux rôles
role_patterns = [
    path('favoris/', FavorisView.as_view(), name='favoris'),
    path('dashboard/proprietaire/', ProprietaireDashboardView.as_view(), name='dashboard_proprietaire'),
    path('dashboard/locataire/', LocataireDashboardView.as_view(), name='dashboard_locataire'),
]

urlpatterns = [
    # API principale
    path('', include(router.urls)),
    
    # Authentification
    path('auth/', include(auth_patterns)),
    
    # Rôles spécifiques
    path('', include(role_patterns)),
    
    # Statistiques
    path('statistiques/', StatistiquesView.as_view(), name='statistiques'),
]