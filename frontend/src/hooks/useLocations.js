import { useQuery, useMutation, useQueryClient } from 'react-query';
import { locationService } from '../services/locations';
import { adapters } from '../utils/adapters';
import toast from 'react-hot-toast';

export const useLocations = (params = {}) => {
  return useQuery(
    ['locations', params],
    async () => {
      const data = await locationService.getAll(params);
      return {
        ...adapters.paginatedResponse(data),
        results: data.results.map(adapters.locationList),
      };
    },
    {
      keepPreviousData: true,
    }
  );
};

export const useLocation = (id) => {
  return useQuery(
    ['location', id],
    async () => {
      const data = await locationService.getById(id);
      return adapters.locationDetail(data);
    },
    {
      enabled: !!id,
    }
  );
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (data) => locationService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('locations');
        queryClient.invalidateQueries('appartements');
        toast.success('Réservation effectuée avec succès');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur de réservation';
        toast.error(message);
      },
    }
  );
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }) => locationService.partialUpdate(id, data),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries('locations');
        queryClient.invalidateQueries(['location', id]);
        toast.success('Location mise à jour');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur de mise à jour';
        toast.error(message);
      },
    }
  );
};

export const useAnnulerLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (id) => locationService.annuler(id),
    {
      onSuccess: (_, id) => {
        queryClient.invalidateQueries('locations');
        queryClient.invalidateQueries(['location', id]);
        toast.success('Location annulée');
      },
      onError: (error) => {
        const message = error.response?.data?.error || "Erreur d'annulation";
        toast.error(message);
      },
    }
  );
};

export const useConfirmerLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (id) => locationService.confirmer(id),
    {
      onSuccess: (_, id) => {
        queryClient.invalidateQueries('locations');
        queryClient.invalidateQueries(['location', id]);
        toast.success('Location confirmée');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur de confirmation';
        toast.error(message);
      },
    }
  );
};

export const useLocationsAVenir = (params = {}) => {
  return useQuery(
    ['locations', 'a_venir', params],
    async () => {
      const data = await locationService.getAVenir(params);
      return {
        ...adapters.paginatedResponse(data),
        results: data.results.map(adapters.locationList),
      };
    }
  );
};

export const useLocationsActives = (params = {}) => {
  return useQuery(
    ['locations', 'actives', params],
    async () => {
      const data = await locationService.getActives(params);
      return {
        ...adapters.paginatedResponse(data),
        results: data.results.map(adapters.locationList),
      };
    }
  );
};

export const useCreateDossierLocataire = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, formData }) => locationService.createDossierLocataire(id, formData),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries('locations');
        queryClient.invalidateQueries(['location', id]);
        toast.success('Dossier locataire créé avec succès');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur lors de la création du dossier';
        toast.error(message);
      },
    }
  );
};

export const useGenerateBail = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ id, data }) => {
      try {
        const response = await locationService.generateBail(id, data);
        
        // Vérifier que response.data est bien un Blob et non vide
        if (!response.data || response.data.size === 0) {
          throw new Error('PDF reçu vide ou invalide');
        }
        
        // Vérifier que c'est bien un PDF (commence par %PDF ou est un blob)
        const isValidBlob = response.data instanceof Blob;
        if (!isValidBlob) {
          throw new Error('Réponse invalide - pas un fichier binaire');
        }
        
        // Créer le lien de téléchargement
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `bail_${id}_${data.locataire_nom || 'bail'}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return response;
      } catch (error) {
        console.error('Erreur dans useGenerateBail:', error);
        throw error;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('locations');
        toast.success('✓ Bail généré et téléchargé avec succès!');
      },
      onError: (error) => {
        console.error('Erreur bail:', error);
        const message = error.response?.data?.error || error.message || 'Erreur lors de la génération du bail';
        toast.error(message);
      },
    }
  );
};