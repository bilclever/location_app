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

export const useAppartement = (slug) => {
  return useQuery(
    ['appartement', slug],
    async () => {
      if (!slug) {
        throw new Error('Slug appartement manquant');
      }
      
      try {
        const data = await appartementService.getBySlug(slug);
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
      enabled: !!slug,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }
  );
};

export const useAppartementLocations = (slug, params = {}) => {
  return useQuery(
    ['appartement', slug, 'locations', params],
    async () => {
      const data = await appartementService.getLocations(slug, params);
      return {
        ...adapters.paginatedResponse(data),
        results: data.results.map(adapters.locationList),
      };
    },
    {
      enabled: !!slug,
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
    ({ slug, data }) => appartementService.update(slug, data),
    {
      onSuccess: (_, { slug }) => {
        queryClient.invalidateQueries('appartements');
        queryClient.invalidateQueries(['appartement', slug]);
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
    (slug) => appartementService.delete(slug),
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
    ({ slug, dateDebut, dateFin }) => 
      appartementService.checkDisponibilite(slug, dateDebut, dateFin)
  );
};

export const useUploadPhoto = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ slug, formData }) => appartementService.uploadPhoto(slug, formData),
    {
      onSuccess: (_, { slug }) => {
        queryClient.invalidateQueries(['appartement', slug]);
        toast.success('Photo ajoutée avec succès');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur upload';
        toast.error(message);
      },
    }
  );
};