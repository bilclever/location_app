from decimal import Decimal

from django.db.models import Count, Sum, Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    PremiumCategory,
    PremiumAppartementType,
    PremiumBien,
    PremiumLocataire,
    PremiumBail,
    PremiumComptableEcriture,
    PremiumPayment,
    PremiumPaymentAuditLog,
)
from .permissions import IsPremiumUser
from .premium_serializers import (
    PremiumCategorySerializer,
    PremiumAppartementTypeSerializer,
    PremiumBienSerializer,
    PremiumLocataireSerializer,
    PremiumBailSerializer,
    PremiumComptableEcritureSerializer,
    PremiumPaymentSerializer,
    PremiumPaymentAuditLogSerializer,
)


class PremiumOwnedModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def get_queryset(self):
        return self.queryset.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class PremiumCategoryViewSet(PremiumOwnedModelViewSet):
    queryset = PremiumCategory.objects.all()
    serializer_class = PremiumCategorySerializer


class PremiumAppartementTypeViewSet(PremiumOwnedModelViewSet):
    queryset = PremiumAppartementType.objects.all()
    serializer_class = PremiumAppartementTypeSerializer


class PremiumBienViewSet(PremiumOwnedModelViewSet):
    queryset = PremiumBien.objects.select_related('category', 'appartement_type').all()
    serializer_class = PremiumBienSerializer


class PremiumLocataireViewSet(PremiumOwnedModelViewSet):
    queryset = PremiumLocataire.objects.all()
    serializer_class = PremiumLocataireSerializer


class PremiumBailViewSet(PremiumOwnedModelViewSet):
    queryset = PremiumBail.objects.select_related('bien', 'locataire').all()
    serializer_class = PremiumBailSerializer


class PremiumComptaEntryViewSet(PremiumOwnedModelViewSet):
    queryset = PremiumComptableEcriture.objects.select_related('bien', 'bail').all()
    serializer_class = PremiumComptableEcritureSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        bien_id = self.request.query_params.get('bien_id')
        period = self.request.query_params.get('periode')

        if bien_id:
            queryset = queryset.filter(bien_id=bien_id)

        if period:
            queryset = queryset.filter(date_operation__startswith=period)

        return queryset


class PremiumPaymentViewSet(PremiumOwnedModelViewSet):
    queryset = PremiumPayment.objects.select_related('bail').all()
    serializer_class = PremiumPaymentSerializer


class PremiumPaymentAuditLogListView(APIView):
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def get(self, request):
        logs = PremiumPaymentAuditLog.objects.filter(owner=request.user)[:200]
        serializer = PremiumPaymentAuditLogSerializer(logs, many=True)
        return Response(serializer.data)


class PremiumDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def get(self, request):
        user = request.user
        biens = PremiumBien.objects.filter(owner=user)
        baux = PremiumBail.objects.filter(owner=user)
        ecritures = PremiumComptableEcriture.objects.filter(owner=user)

        revenus = ecritures.filter(type_ecriture='REVENU').aggregate(total=Sum('montant'))['total'] or Decimal('0')
        depenses = ecritures.filter(type_ecriture='DEPENSE').aggregate(total=Sum('montant'))['total'] or Decimal('0')

        payload = {
            'patrimoine': {
                'total_biens': biens.count(),
                'loues': biens.filter(statut='LOUE').count(),
                'vacants': biens.filter(statut='VACANT').count(),
                'travaux': biens.filter(statut='TRAVAUX').count(),
            },
            'comptabilite': {
                'revenus': float(revenus),
                'depenses': float(depenses),
                'benefice_net': float(revenus - depenses),
            },
            'baux': {
                'total': baux.count(),
                'actifs': baux.filter(statut='ACTIF').count(),
                'termines': baux.filter(statut='TERMINE').count(),
            },
        }

        return Response(payload)


class PremiumRgpdPurgeView(APIView):
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def post(self, request):
        locataire_id = request.data.get('locataire_id')
        if not locataire_id:
            return Response({'error': 'locataire_id est requis'}, status=status.HTTP_400_BAD_REQUEST)

        locataire = PremiumLocataire.objects.filter(id=locataire_id, owner=request.user).first()
        if not locataire:
            return Response({'error': 'Locataire introuvable'}, status=status.HTTP_404_NOT_FOUND)

        if not locataire.date_depart or locataire.date_depart > timezone.now().date():
            return Response(
                {'error': 'La purge est autorisee uniquement apres la date de depart'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        locataire.purge_sensitive_data()
        return Response({'message': 'Purge RGPD executee'})
