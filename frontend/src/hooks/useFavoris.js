import { useQuery, useMutation, useQueryClient } from 'react-query';
import { favorisService } from '../services/favoris';
import { adapters } from '../utils/adapters';
import toast from 'react-hot-toast';

export const useFavoris = () => {
  return useQuery(
    'favoris',
    async () => {
      try {
        const data = await favorisService.getAll();
        
        // Gérer différents formats de réponse
        const favorisArray = Array.isArray(data) ? data : data.results || [];
        
        if (favorisArray.length === 0) {
          return [];
        }
        
        // Les favoris contiennent un objet appartement, pas directement les champs
        return favorisArray.map(favori => {
          if (favori.appartement) {
            return adapters.appartementList(favori.appartement);
          }
          return adapters.appartementList(favori);
        });
      } catch (error) {
        console.error('Erreur lors du chargement des favoris:', error);
        throw error;
      }
    },
    {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      onError: (error) => {
        console.error('Erreur favoris:', error?.response?.data || error?.message);
      },
    }
  );
};

export const useToggleFavori = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ appartementId, action }) => 
      favorisService.toggle({ appartement_id: appartementId, action }),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('favoris');
        queryClient.invalidateQueries('appartements');
        toast.success(data.message);
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur de mise à jour';
        toast.error(message);
      },
    }
  );
};

export const useAddFavori = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (appartementId) => favorisService.add(appartementId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('favoris');
        queryClient.invalidateQueries('appartements');
        toast.success('Ajouté aux favoris');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur';
        toast.error(message);
      },
    }
  );
};

export const useRemoveFavori = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (appartementId) => favorisService.remove(appartementId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('favoris');
        queryClient.invalidateQueries('appartements');
        toast.success('Retiré des favoris');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur';
        toast.error(message);
      },
    }
  );
};