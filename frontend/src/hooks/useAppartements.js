import { useQuery, useMutation, useQueryClient } from 'react-query';
import { appartementService } from '../services/appartements';
import { adapters } from '../utils/adapters';
import toast from 'react-hot-toast';

export const useAppartements = (params = {}) => {
  return useQuery(
    ['appartements', params],
    async () => {
      const data = await appartementService.getAll(params);
      return {
        ...adapters.paginatedResponse(data),
        results: data.results.map(adapters.appartementList),
      };
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useAppartement = (id) => {
  return useQuery(
    ['appartement', id],
    async () => {
      if (!id) {
        throw new Error('ID appartement manquant');
      }
      
      try {
        const data = await appartementService.getById(id);
        if (!data) {
          throw new Error('Appartement non trouvé');
        }
        return adapters.appartementDetail(data);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'appartement:', error);
        throw error;
      }
    },
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }
  );
};

export const useAppartementLocations = (id, params = {}) => {
  return useQuery(
    ['appartement', id, 'locations', params],
    async () => {
      const data = await appartementService.getLocations(id, params);
      return {
        ...adapters.paginatedResponse(data),
        results: data.results.map(adapters.locationList),
      };
    },
    {
      enabled: !!id,
    }
  );
};

export const useCreateAppartement = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (data) => appartementService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('appartements');
        toast.success('Appartement créé avec succès');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur de création';
        toast.error(message);
      },
    }
  );
};

export const useUpdateAppartement = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }) => appartementService.update(id, data),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries('appartements');
        queryClient.invalidateQueries(['appartement', id]);
        toast.success('Appartement mis à jour');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur de mise à jour';
        toast.error(message);
      },
    }
  );
};

export const useDeleteAppartement = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (id) => appartementService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('appartements');
        toast.success('Appartement supprimé');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur de suppression';
        toast.error(message);
      },
    }
  );
};

export const useCheckDisponibilite = () => {
  return useMutation(
    ({ id, dateDebut, dateFin }) => 
      appartementService.checkDisponibilite(id, dateDebut, dateFin)
  );
};

export const useUploadPhoto = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, formData }) => appartementService.uploadPhoto(id, formData),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries(['appartement', id]);
        toast.success('Photo ajoutée avec succès');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur upload';
        toast.error(message);
      },
    }
  );
};