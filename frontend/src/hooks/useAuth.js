import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authService } from '../services/auth';
import { adapters } from '../utils/adapters';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery(
    'user',
    async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      
      try {
        const data = await authService.getProfile();
        return adapters.userProfile(data);
      } catch (error) {
        // Si 401, essayer de refresh le token
        if (error.response?.status === 401) {
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const refreshData = await authService.refreshToken(refreshToken);
              localStorage.setItem('access_token', refreshData.access);
              // Réessayer le profil avec le nouveau token
              const retryData = await authService.getProfile();
              return adapters.userProfile(retryData);
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            return null;
          }
        }
        
        // Si 403, c'est une erreur d'authentification, déconnecter silencieusement
        if (error.response?.status === 403) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          return null;
        }
        
        throw error;
      }
    },
    {
      staleTime: 10 * 60 * 1000, // Plus long (10 min au lieu de 5)
      retry: false, // Ne pas réessayer automatiquement
      enabled: !!localStorage.getItem('access_token'), // Seulement si token existe
    }
  );

  const loginMutation = useMutation(
    (credentials) => authService.login(credentials),
    {
      onSuccess: (data) => {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        queryClient.setQueryData('user', adapters.userProfile(data.user));
        toast.success('Connexion réussie');
        navigate('/');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur de connexion';
        toast.error(message);
      },
    }
  );

  const registerMutation = useMutation(
    (userData) => authService.register(userData),
    {
      onSuccess: (data) => {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        queryClient.setQueryData('user', adapters.userProfile(data.user));
        toast.success('Inscription réussie');
        navigate('/');
      },
      onError: (error) => {
        let message = "Erreur d'inscription";
        if (error.response?.data) {
          // Si c'est un objet avec des clés, c'est une erreur de validation
          if (typeof error.response.data === 'object' && !Array.isArray(error.response.data)) {
            // Prendre le premier message d'erreur disponible
            const firstError = Object.values(error.response.data)[0];
            message = Array.isArray(firstError) ? firstError[0] : firstError;
          } else {
            message = error.response.data.error || error.response.data;
          }
        }
        toast.error(message);
        throw error;
      },
    }
  );

  const logoutMutation = useMutation(
    () => {
      const refreshToken = localStorage.getItem('refresh_token');
      return authService.logout(refreshToken);
    },
    {
      onSuccess: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        queryClient.setQueryData('user', null);
        queryClient.clear();
        toast.success('Déconnexion réussie');
        navigate('/login');
      },
      onError: (error) => {
        // Ne pas afficher d'erreur sur 403 - juste déconnecter localement
        if (error.response?.status === 403) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          queryClient.setQueryData('user', null);
          queryClient.clear();
          navigate('/login');
        } else {
          const message = error.response?.data?.error || 'Erreur de déconnexion';
          toast.error(message);
        }
      },
      retry: false, // Ne pas réessayer
    }
  );

  const updateProfileMutation = useMutation(
    (data) => authService.updateProfile(data),
    {
      onSuccess: (data) => {
        queryClient.setQueryData('user', adapters.userProfile(data));
        toast.success('Profil mis à jour');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur de mise à jour';
        toast.error(message);
      },
    }
  );

  const changePasswordMutation = useMutation(
    (data) => authService.changePassword(data),
    {
      onSuccess: () => {
        toast.success('Mot de passe changé avec succès');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur de changement';
        toast.error(message);
      },
    }
  );

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isLocataire: user?.role === 'LOCATAIRE',
    isProprietaire: user?.role === 'PROPRIETAIRE',
    isAdmin: user?.role === 'ADMIN',
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutate,
    changePasswordAsync: changePasswordMutation.mutateAsync,
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading,
    isUpdatingProfile: updateProfileMutation.isLoading,
    isChangingPassword: changePasswordMutation.isLoading,
  };
};