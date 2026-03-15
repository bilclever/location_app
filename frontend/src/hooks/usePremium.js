import { useMutation, useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { premiumService } from '../services/premium';

const premiumKeys = {
  dashboard: ['premium', 'dashboard'],
  categories: ['premium', 'categories'],
  appartementTypes: ['premium', 'appartement-types'],
  biens: ['premium', 'biens'],
  locataires: ['premium', 'locataires'],
  baux: ['premium', 'baux'],
  entries: ['premium', 'entries'],
  auditLogs: ['premium', 'audit-logs'],
  payments: ['premium', 'payments'],
};

export const usePremiumDashboard = (params = {}) => useQuery(
  [...premiumKeys.dashboard, params],
  () => premiumService.getDashboard(params),
  {
    staleTime: 120000,
  }
);

export const usePremiumCategories = () => useQuery(
  premiumKeys.categories,
  () => premiumService.getCategories(),
  {
    staleTime: 120000,
  }
);

export const usePremiumAppartementTypes = () => useQuery(
  premiumKeys.appartementTypes,
  () => premiumService.getAppartementTypes(),
  {
    staleTime: 120000,
  }
);

export const usePremiumBiens = (params = {}) => useQuery(
  [...premiumKeys.biens, params],
  () => premiumService.getBiens(params),
  {
    keepPreviousData: true,
  }
);

export const usePremiumLocataires = (params = {}) => useQuery(
  [...premiumKeys.locataires, params],
  () => premiumService.getLocataires(params),
  {
    staleTime: 120000,
  }
);

export const usePremiumBaux = (params = {}) => useQuery(
  [...premiumKeys.baux, params],
  () => premiumService.getBaux(params),
  {
    staleTime: 120000,
  }
);

export const usePremiumComptaEntries = (params = {}) => useQuery(
  [...premiumKeys.entries, params],
  () => premiumService.getComptaEntries(params),
  {
    keepPreviousData: true,
  }
);

export const usePremiumAuditLogs = () => useQuery(
  premiumKeys.auditLogs,
  () => premiumService.getPaymentAuditLogs(),
  {
    staleTime: 120000,
  }
);

export const usePremiumPayments = (params = {}) => useQuery(
  [...premiumKeys.payments, params],
  () => premiumService.getPayments(params),
  {
    staleTime: 120000,
  }
);

export const useCreatePremiumCategory = () => {
  const queryClient = useQueryClient();
  return useMutation((data) => premiumService.createCategory(data), {
    onSuccess: () => {
      queryClient.invalidateQueries(premiumKeys.categories);
      toast.success('Categorie ajoutee');
    },
    onError: () => toast.error('Erreur lors de la creation de categorie'),
  });
};

export const useCreatePremiumType = () => {
  const queryClient = useQueryClient();
  return useMutation((data) => premiumService.createAppartementType(data), {
    onSuccess: () => {
      queryClient.invalidateQueries(premiumKeys.appartementTypes);
      toast.success('Type ajoute');
    },
    onError: () => toast.error('Erreur lors de la creation du type'),
  });
};

export const useCreatePremiumBien = () => {
  const queryClient = useQueryClient();
  return useMutation((data) => premiumService.createBien(data), {
    onSuccess: () => {
      queryClient.invalidateQueries(premiumKeys.biens);
      queryClient.invalidateQueries(premiumKeys.dashboard);
      toast.success('Bien enregistre');
    },
    onError: () => toast.error('Erreur lors de la creation du bien'),
  });
};

export const useCreatePremiumLocataire = () => {
  const queryClient = useQueryClient();
  return useMutation((data) => premiumService.createLocataire(data), {
    onSuccess: () => {
      queryClient.invalidateQueries(premiumKeys.locataires);
      toast.success('Locataire enregistre');
    },
    onError: () => toast.error('Erreur lors de la creation du locataire'),
  });
};

export const useCreatePremiumBail = () => {
  const queryClient = useQueryClient();
  return useMutation((data) => premiumService.createBail(data), {
    onSuccess: () => {
      queryClient.invalidateQueries(premiumKeys.baux);
      queryClient.invalidateQueries(premiumKeys.dashboard);
      toast.success('Bail numerique cree');
    },
    onError: () => toast.error('Erreur lors de la creation du bail'),
  });
};

export const useCreatePremiumComptaEntry = () => {
  const queryClient = useQueryClient();
  return useMutation((data) => premiumService.createComptaEntry(data), {
    onSuccess: () => {
      queryClient.invalidateQueries(premiumKeys.entries);
      queryClient.invalidateQueries(premiumKeys.dashboard);
      toast.success('Ecriture comptable ajoutee');
    },
    onError: (error) => {
      const message = error?.response?.data?.detail
        || error?.response?.data?.bien?.[0]
        || error?.response?.data?.montant?.[0]
        || error?.response?.data?.type_ecriture?.[0]
        || error?.response?.data?.libelle?.[0]
        || 'Erreur lors de la creation de l ecriture';
      toast.error(message);
    },
  });
};

export const usePurgePremiumLocataireData = () => {
  const queryClient = useQueryClient();
  return useMutation((locataireId) => premiumService.purgeLocataireData(locataireId), {
    onSuccess: () => {
      queryClient.invalidateQueries(premiumKeys.locataires);
      toast.success('Purge RGPD executee');
    },
    onError: () => toast.error('La purge RGPD a echoue'),
  });
};

export const useCreatePremiumPayment = () => {
  const queryClient = useQueryClient();
  return useMutation((data) => premiumService.createPayment(data), {
    onSuccess: () => {
      queryClient.invalidateQueries(premiumKeys.payments);
      queryClient.invalidateQueries(premiumKeys.entries);
      queryClient.invalidateQueries(premiumKeys.auditLogs);
      queryClient.invalidateQueries(premiumKeys.dashboard);
      toast.success('Paiement enregistre');
    },
    onError: () => toast.error('Erreur lors de la creation du paiement'),
  });
};
