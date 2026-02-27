from rest_framework import viewsets, status, generics, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Sum, Count
from django.shortcuts import get_object_or_404
from .models import (
    Appartement, Photo, Location, Favori,
    User, Proprietaire, Locataire
)
from .serializers import (
    # Utilisateurs
    UserRegistrationSerializer, UserLoginSerializer,
    UserProfileSerializer, UserUpdateSerializer,
    ChangePasswordSerializer, LogoutSerializer, ProprietaireSerializer,
    LocataireSerializer,
    
    # Appartements
    AppartementListSerializer, AppartementDetailSerializer,
    AppartementCreateUpdateSerializer, PhotoSerializer,
    
    # Locations
    LocationListSerializer, LocationDetailSerializer,
    LocationCreateSerializer, LocationUpdateSerializer,
    
    # Favoris
    FavoriSerializer, FavoriCreateSerializer,
    
    # Divers
    DisponibiliteSerializer
)
from .permissions import (
    IsAdminOrReadOnly, IsOwnerOrAdmin, CanManageAppartement,
    IsProprietaire, IsLocataire
)
from .pagination import StandardResultsSetPagination
from .utils import send_reservation_confirmation_email
import logging

logger = logging.getLogger(__name__)


# ========== VUES AUTHENTIFICATION ==========

class RegisterView(generics.GenericAPIView):
    """
    Inscription d'un nouvel utilisateur
    """
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserProfileSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Inscription réussie'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(generics.GenericAPIView):
    """
    Connexion utilisateur
    """
    permission_classes = [AllowAny]
    serializer_class = UserLoginSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserProfileSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Connexion réussie'
            })
        
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(generics.GenericAPIView):
    """
    Déconnexion
    """
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer
    
    def post(self, request):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=False)
            refresh_token = serializer.validated_data.get('refresh')
            if refresh_token:
                from rest_framework_simplejwt.tokens import RefreshToken
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({'message': 'Déconnexion réussie'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.GenericAPIView):
    """
    Gestion du profil utilisateur
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserUpdateSerializer
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserProfileSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(generics.GenericAPIView):
    """
    Changer le mot de passe
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({
                    'old_password': ['Ancien mot de passe incorrect']
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({'message': 'Mot de passe changé avec succès'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========== VUES APPARTEMENTS ==========

class AppartementViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les appartements
    """
    queryset = Appartement.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['disponible', 'ville', 'nb_pieces', 'proprietaire']
    search_fields = ['titre', 'description', 'adresse', 'ville']
    ordering_fields = ['loyer_mensuel', 'surface', 'date_creation', 'nb_vues']
    ordering = ['-date_creation']
    pagination_class = StandardResultsSetPagination
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return AppartementListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return AppartementCreateUpdateSerializer
        return AppartementDetailSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Incrémente le compteur de vues à la consultation"""
        instance = self.get_object()
        instance.incrementer_vues()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def locations(self, request, pk=None):
        """Locations d'un appartement"""
        appartement = self.get_object()
        locations = appartement.locations.filter(
            Q(statut__in=['RESERVE', 'CONFIRME', 'PAYE'])
        ).order_by('date_debut')
        
        page = self.paginate_queryset(locations)
        if page is not None:
            serializer = LocationListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = LocationListSerializer(locations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def check_disponibilite(self, request, pk=None):
        """Vérifier la disponibilité pour des dates"""
        appartement = self.get_object()
        date_debut = request.data.get('date_debut')
        date_fin = request.data.get('date_fin')
        
        if not date_debut or not date_fin:
            return Response(
                {'error': 'Les dates début et fin sont requises'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        locations_conflictuelles = Location.objects.filter(
            appartement=appartement,
            date_debut__lte=date_fin,
            date_fin__gte=date_debut,
            statut__in=['RESERVE', 'CONFIRME', 'PAYE']
        )
        
        disponible = not locations_conflictuelles.exists()
        
        serializer = DisponibiliteSerializer(data={
            'date_debut': date_debut,
            'date_fin': date_fin,
            'disponible': disponible,
            'message': 'Disponible' if disponible else 'Non disponible pour ces dates'
        })
        serializer.is_valid()
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_photo(self, request, pk=None):
        """Uploader une photo supplémentaire"""
        appartement = self.get_object()
        
        # Vérifier que l'utilisateur est le propriétaire
        if request.user.est_proprietaire:
            if appartement.proprietaire != request.user.profil_proprietaire:
                return Response(
                    {'error': 'Vous n\'êtes pas le propriétaire de cet appartement'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        photo_file = request.FILES.get('photo')
        legende = request.data.get('legende', '')
        
        if not photo_file:
            return Response(
                {'error': 'Fichier photo requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        photo = Photo.objects.create(
            appartement=appartement,
            image=photo_file,
            legende=legende
        )
        
        serializer = PhotoSerializer(photo)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ========== VUES LOCATIONS ==========

class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les locations
    """
    queryset = Location.objects.all()
    permission_classes = [IsOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'appartement', 'locataire']
    search_fields = ['nom_locataire', 'email_locataire']
    ordering_fields = ['date_debut', 'date_fin', 'date_reservation', 'montant_total']
    ordering = ['-date_reservation']
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LocationListSerializer
        elif self.action == 'create':
            return LocationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return LocationUpdateSerializer
        return LocationDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        if user.is_staff:
            return queryset
        
        if user.est_proprietaire:
            # Propriétaire voit les locations de ses appartements
            try:
                proprietaire = user.profil_proprietaire
                return queryset.filter(
                    appartement__in=proprietaire.appartements.all()
                )
            except:
                return queryset.none()
        
        if user.est_locataire:
            # Locataire voit ses propres locations
            try:
                locataire = user.profil_locataire
                return queryset.filter(locataire=locataire)
            except:
                return queryset.filter(email_locataire=user.email)
        
        return queryset.none()
    
    def perform_create(self, serializer):
        location = serializer.save()
        
        # Envoyer un email de confirmation
        send_reservation_confirmation_email(location)
    
    @action(detail=False, methods=['get'])
    def actives(self, request):
        """Locations actives"""
        aujourd_hui = timezone.now().date()
        locations = self.get_queryset().filter(
            date_debut__lte=aujourd_hui,
            date_fin__gte=aujourd_hui,
            statut__in=['RESERVE', 'CONFIRME', 'PAYE']
        )
        
        page = self.paginate_queryset(locations)
        if page is not None:
            serializer = LocationListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = LocationListSerializer(locations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def a_venir(self, request):
        """Locations à venir"""
        aujourd_hui = timezone.now().date()
        locations = self.get_queryset().filter(
            date_debut__gt=aujourd_hui,
            statut__in=['RESERVE', 'CONFIRME']
        )
        
        page = self.paginate_queryset(locations)
        if page is not None:
            serializer = LocationListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = LocationListSerializer(locations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        """Annuler une location"""
        location = self.get_object()
        
        if location.statut in ['ANNULE', 'TERMINE']:
            return Response(
                {'error': 'Cette location est déjà terminée ou annulée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        location.statut = 'ANNULE'
        location.save()
        
        serializer = LocationDetailSerializer(location)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def confirmer(self, request, pk=None):
        """Confirmer une location (admin ou propriétaire de l'appartement)"""
        location = self.get_object()

        # Autoriser si admin
        if request.user.is_staff:
            allowed = True
        else:
            # Autoriser si l'utilisateur est propriétaire et est le propriétaire de l'appartement
            allowed = False
            try:
                if request.user.est_proprietaire and request.user.profil_proprietaire == location.appartement.proprietaire:
                    allowed = True
            except Exception:
                allowed = False

        if not allowed:
            return Response({'error': 'Vous n\'êtes pas autorisé à confirmer cette réservation'}, status=status.HTTP_403_FORBIDDEN)

        if location.statut in ['ANNULE', 'TERMINE']:
            return Response({'error': 'Impossible de confirmer une location annulée ou terminée'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier les conflits avec d'autres locations confirmées/payées
        conflits = Location.objects.filter(
            appartement=location.appartement,
            date_debut__lte=location.date_fin,
            date_fin__gte=location.date_debut,
            statut__in=['CONFIRME', 'PAYE']
        ).exclude(pk=location.pk)

        if conflits.exists():
            return Response({'error': 'Impossible de confirmer : des réservations confirmées existent déjà pour ces dates'}, status=status.HTTP_400_BAD_REQUEST)

        location.statut = 'CONFIRME'
        location.date_confirmation = timezone.now().date()
        location.save()

        # Marquer l'appartement comme indisponible
        try:
            appartement = location.appartement
            appartement.disponible = False
            appartement.save()
        except Exception:
            pass

        serializer = LocationDetailSerializer(location)
        return Response(serializer.data)


# ========== VUES FAVORIS ==========

class FavorisView(generics.GenericAPIView):
    """
    Gestion des favoris pour les locataires
    """
    permission_classes = [IsAuthenticated, IsLocataire]
    serializer_class = FavoriCreateSerializer
    
    def get(self, request):
        """Liste des favoris"""
        try:
            locataire = request.user.profil_locataire
            favoris = locataire.favoris.select_related('appartement').all()
            # Sérialiser les appartements liés aux objets Favori (évite d'essayer de sérialiser des Favori avec AppartementListSerializer)
            appartements = [f.appartement for f in favoris if getattr(f, 'appartement', None) is not None]

            page = self.paginate_queryset(appartements)
            if page is not None:
                serializer = AppartementListSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = AppartementListSerializer(appartements, many=True)
            return Response(serializer.data)
        except Locataire.DoesNotExist:
            return Response([])
    
    def post(self, request):
        """Ajouter/retirer un favori"""
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            try:
                locataire = request.user.profil_locataire
                appartement = get_object_or_404(
                    Appartement, 
                    id=serializer.validated_data['appartement_id']
                )
                
                action = serializer.validated_data['action']
                
                if action == 'add':
                    favori, created = Favori.objects.get_or_create(
                        locataire=locataire,
                        appartement=appartement
                    )
                    message = 'Appartement ajouté aux favoris'
                else:
                    Favori.objects.filter(
                        locataire=locataire,
                        appartement=appartement
                    ).delete()
                    message = 'Appartement retiré des favoris'
                
                return Response({
                    'message': message,
                    'favoris_count': locataire.favoris.count()
                })
                
            except Locataire.DoesNotExist:
                return Response({
                    'error': 'Profil locataire non trouvé'
                }, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========== VUES DASHBOARD ==========

class ProprietaireDashboardView(APIView):
    """
    Dashboard pour les propriétaires
    """
    permission_classes = [IsAuthenticated, IsProprietaire]
    
    def get(self, request):
        try:
            proprietaire = request.user.profil_proprietaire
            appartements = proprietaire.appartements.all()

            # Statistiques générales
            total_appartements = appartements.count()
            appartements_disponibles = appartements.filter(disponible=True).count()

            # Locations
            locations = Location.objects.filter(appartement__in=appartements)
            locations_en_cours = locations.filter(
                statut__in=['RESERVE', 'CONFIRME'],
                date_fin__gte=timezone.now().date()
            ).count()

            # Revenus
            revenus_total = locations.filter(
                statut='PAYE'
            ).aggregate(total=Sum('montant_total'))['total'] or 0

            revenus_mois = locations.filter(
                statut='PAYE',
                date_paiement__month=timezone.now().month,
                date_paiement__year=timezone.now().year
            ).aggregate(total=Sum('montant_total'))['total'] or 0

            # Locations par statut
            locations_par_statut = locations.values('statut').annotate(
                count=Count('id')
            )

            # Appartements les plus réservés
            top_appartements = appartements.annotate(
                nb_locations=Count('locations')
            ).order_by('-nb_locations')[:5]

            top_appartements_data = [
                {
                    'id': a.id,
                    'titre': a.titre,
                    'nb_locations': a.nb_locations,
                    'revenus': locations.filter(
                        appartement=a, statut='PAYE'
                    ).aggregate(total=Sum('montant_total'))['total'] or 0
                }
                for a in top_appartements
            ]

            stats = {
                'appartements': {
                    'total': total_appartements,
                    'disponibles': appartements_disponibles,
                    'occupes': total_appartements - appartements_disponibles,
                },
                'locations': {
                    'total': locations.count(),
                    'en_cours': locations_en_cours,
                    'terminees': locations.filter(statut='TERMINE').count(),
                    'annulees': locations.filter(statut='ANNULE').count(),
                    'par_statut': locations_par_statut,
                },
                'revenus': {
                    'total': float(revenus_total),
                    'mois_en_cours': float(revenus_mois),
                    'commission': float(revenus_total * (proprietaire.commission / 100)),
                },
                'top_appartements': top_appartements_data,
            }

            return Response(stats)
            
        except Proprietaire.DoesNotExist:
            return Response({
                'error': 'Profil propriétaire non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)


class LocataireDashboardView(APIView):
    """
    Dashboard pour les locataires
    """
    permission_classes = [IsAuthenticated, IsLocataire]
    
    def get(self, request):
        try:
            locataire = request.user.profil_locataire
            locations = locataire.locations.all()
            
            # Statistiques
            total_locations = locations.count()
            locations_a_venir = locations.filter(
                date_debut__gt=timezone.now().date(),
                statut__in=['RESERVE', 'CONFIRME']
            ).count()

            locations_passees = locations.filter(
                date_fin__lt=timezone.now().date()
            ).count()

            # Dépenses
            depenses_total = locations.filter(
                statut='PAYE'
            ).aggregate(total=Sum('montant_total'))['total'] or 0

            # Prochaine location
            prochaine_location = locations.filter(
                date_debut__gt=timezone.now().date()
            ).order_by('date_debut').first()

            # Favoris
            favoris_count = locataire.favoris.count()

            stats = {
                'locations': {
                    'total': total_locations,
                    'a_venir': locations_a_venir,
                    'passees': locations_passees,
                },
                'depenses': {
                    'total': float(depenses_total),
                },
                'prochaine_location': LocationListSerializer(prochaine_location).data if prochaine_location else None,
                'favoris': favoris_count,
            }

            return Response(stats)
            
        except Locataire.DoesNotExist:
            return Response({
                'error': 'Profil locataire non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)


# ========== VUES STATISTIQUES ==========

class StatistiquesView(APIView):
    """
    Statistiques globales (admin uniquement)
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        aujourd_hui = timezone.now().date()
        
        # Appartements
        total_appartements = Appartement.objects.count()
        appartements_disponibles = Appartement.objects.filter(disponible=True).count()
        
        # Utilisateurs
        total_users = User.objects.count()
        total_locataires = User.objects.filter(role='LOCATAIRE').count()
        total_proprietaires = User.objects.filter(role='PROPRIETAIRE').count()
        
        # Locations
        locations = Location.objects.all()
        locations_actives = locations.filter(
            date_debut__lte=aujourd_hui,
            date_fin__gte=aujourd_hui,
            statut__in=['RESERVE', 'CONFIRME', 'PAYE']
        ).count()
        
        locations_a_venir = locations.filter(
            date_debut__gt=aujourd_hui,
            statut__in=['RESERVE', 'CONFIRME']
        ).count()
        
        # Revenus
        revenus_total = locations.filter(
            statut='PAYE'
        ).aggregate(total=Sum('montant_total'))['total'] or 0
        
        revenus_mois = locations.filter(
            statut='PAYE',
            date_paiement__month=aujourd_hui.month,
            date_paiement__year=aujourd_hui.year
        ).aggregate(total=Sum('montant_total'))['total'] or 0
        
        # Top villes
        top_villes = Appartement.objects.values('ville').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        stats = {
            'appartements': {
                'total': total_appartements,
                'disponibles': appartements_disponibles,
                'occupes': total_appartements - appartements_disponibles,
                'top_villes': top_villes,
            },
            'utilisateurs': {
                'total': total_users,
                'locataires': total_locataires,
                'proprietaires': total_proprietaires,
            },
            'locations': {
                'total': locations.count(),
                'actives': locations_actives,
                'a_venir': locations_a_venir,
                'terminees': locations.filter(statut='TERMINE').count(),
                'annulees': locations.filter(statut='ANNULE').count(),
            },
            'revenus': {
                'total': float(revenus_total),
                'mois_en_cours': float(revenus_mois),
            }
        }
        
        return Response(stats)
