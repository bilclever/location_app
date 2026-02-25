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
        
        // L'API retourne un objet paginé avec results contenant les appartements
        const favorisArray = data?.results && Array.isArray(data.results) ? data.results : [];
        
        if (favorisArray.length === 0) {
          return [];
        }
        
        // Adapter les appartements
        return favorisArray.map(appartement => adapters.appartementList(appartement));
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
      onMutate: async ({ appartementId, action }) => {
        // Annuler les requêtes en cours
        await queryClient.cancelQueries('favoris');
        
        // Sauvegarder les données précédentes
        const previousFavoris = queryClient.getQueryData('favoris');
        
        // Mettre à jour l'optimistic update
        if (previousFavoris) {
          let updatedFavoris = Array.isArray(previousFavoris) ? [...previousFavoris] : previousFavoris;
          
          if (action === 'remove') {
            // Retirer l'appartement de la liste
            if (Array.isArray(updatedFavoris)) {
              updatedFavoris = updatedFavoris.filter(fav => fav.id !== appartementId);
            }
          }
          
          queryClient.setQueryData('favoris', updatedFavoris);
        }
        
        return { previousFavoris };
      },
      onSuccess: (data, variables) => {
        // Invalider et forcer un refetch
        queryClient.invalidateQueries('favoris');
        queryClient.invalidateQueries('appartements');
        queryClient.invalidateQueries('user');
        
        // Utiliser l'action envoyée, pas celle de la réponse
        const successMessage = variables.action === 'add' ? 'Ajouté aux favoris' : 'Retiré des favoris';
        toast.success(data.message || successMessage);
      },
      onError: (error, variables, context) => {
        // Restaurer les données précédentes en cas d'erreur
        if (context?.previousFavoris) {
          queryClient.setQueryData('favoris', context.previousFavoris);
        }
        
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