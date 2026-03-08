import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authService } from '../services/auth';
import { adapters } from '../utils/adapters';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const syncedTokenRef = useRef(null);

  const buildUserFromSession = useCallback((session) => {
    const supabaseUser = session?.user;
    if (!supabaseUser) {
      return null;
    }

    const metadata = supabaseUser.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || null;
    const firstName = metadata.given_name || (fullName ? fullName.split(' ')[0] : null);
    const lastName = metadata.family_name || null;
    const fallbackUsername = supabaseUser.email ? supabaseUser.email.split('@')[0] : null;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username: metadata.preferred_username || fallbackUsername,
      firstName,
      lastName,
      fullName,
      role: null,
      telephone: null,
      adresse: null,
      photoProfil: metadata.avatar_url || null,
      plan: metadata.plan || 'free',
      favoris: [],
    };
  }, []);

  const mergeProfileWithFallbackAvatar = useCallback((profileData, session = null, existingUser = null) => {
    const adaptedUser = adapters.userProfile(profileData);
    if (adaptedUser?.photoProfil) {
      return adaptedUser;
    }

    const sessionFallbackUser = buildUserFromSession(session);
    return {
      ...adaptedUser,
      photoProfil: sessionFallbackUser?.photoProfil || existingUser?.photoProfil || null,
    };
  }, [buildUserFromSession]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return undefined;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.access_token) {
        syncedTokenRef.current = null;
        queryClient.setQueryData('user', null);
        return;
      }

      if (syncedTokenRef.current === session.access_token) {
        return;
      }

      syncedTokenRef.current = session.access_token;

      const fallbackUser = buildUserFromSession(session);
      if (fallbackUser) {
        queryClient.setQueryData('user', fallbackUser);
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        try {
          const profileData = await authService.getProfile(session.access_token);
          const existingUser = queryClient.getQueryData('user');
          queryClient.setQueryData('user', mergeProfileWithFallbackAvatar(profileData, session, existingUser));
        } catch (profileError) {
          // Conserver le fallback local sans relancer une boucle de requêtes
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, buildUserFromSession, mergeProfileWithFallbackAvatar]);

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Google Auth non configuré: ajoutez REACT_APP_SUPABASE_ANON_KEY dans .env puis redémarrez le serveur');
    }

    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw error;
    }
  };

  const completeOAuthLogin = async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Configuration Supabase incomplète');
    }

    let session = null;
    let sessionError = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const {
        data,
        error,
      } = await supabase.auth.getSession();

      session = data?.session || null;
      sessionError = error || null;

      if (session?.access_token) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    if (sessionError || !session?.access_token) {
      throw sessionError || new Error('Session Supabase introuvable');
    }

    try {
      const profileData = await authService.getProfile(session.access_token);
      const existingUser = queryClient.getQueryData('user');
      const adaptedUser = mergeProfileWithFallbackAvatar(profileData, session, existingUser);
      queryClient.setQueryData('user', adaptedUser);
      return adaptedUser;
    } catch (profileError) {
      const fallbackUser = buildUserFromSession(session);
      if (!fallbackUser) {
        throw profileError;
      }

      queryClient.setQueryData('user', fallbackUser);
      return fallbackUser;
    }
  };

  const { data: user, isLoading } = useQuery(
    'user',
    async () => {
      if (!isSupabaseConfigured || !supabase) {
        const token = localStorage.getItem('access_token');
        if (!token) return null;

        try {
          const data = await authService.getProfile();
          const existingUser = queryClient.getQueryData('user');
          return mergeProfileWithFallbackAvatar(data, null, existingUser);
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          return null;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return null;
      }
      
      try {
        const data = await authService.getProfile();
        const existingUser = queryClient.getQueryData('user');
        return mergeProfileWithFallbackAvatar(data, session, existingUser);
      } catch (error) {
        // Si 401, essayer de refresh la session Supabase
        if (error.response?.status === 401) {
          try {
            const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();

            if (!refreshError && refreshedData?.session?.access_token) {
              const retryData = await authService.getProfile();
              const existingUser = queryClient.getQueryData('user');
              return mergeProfileWithFallbackAvatar(retryData, refreshedData.session, existingUser);
            }
          } catch (refreshError) {
            await supabase.auth.signOut();
            return null;
          }
        }
        
        // Si 403 sur /auth/profile, conserver la session Supabase et utiliser un fallback local
        if (error.response?.status === 403) {
          const fallbackUser = buildUserFromSession(session);
          if (fallbackUser) {
            return fallbackUser;
          }
        }
        
        const fallbackUser = buildUserFromSession(session);
        if (fallbackUser) {
          return fallbackUser;
        }

        throw error;
      }
    },
    {
      staleTime: 10 * 60 * 1000, // Plus long (10 min au lieu de 5)
      retry: false, // Ne pas réessayer automatiquement
      enabled: true,
      refetchOnMount: false,
      refetchOnReconnect: false,
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
      if (!isSupabaseConfigured || !supabase) {
        return Promise.resolve();
      }

      return supabase.auth.signOut();
    },
    {
      onSuccess: async () => {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            await authService.logout(refreshToken);
          }
        } catch (error) {
          // Logout backend optionnel en mode Supabase-first
        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        queryClient.setQueryData('user', null);
        queryClient.clear();
        toast.success('Déconnexion réussie');
        navigate('/');
      },
      onError: (error) => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        queryClient.setQueryData('user', null);
        queryClient.clear();
        const message = error?.message || 'Erreur de déconnexion';
        toast.error(message);
        navigate('/');
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

  const updatePlanMutation = useMutation(
    (plan) => authService.updatePlan(plan),
    {
      onSuccess: (data) => {
        const updatedUser = adapters.userProfile(data.user);
        queryClient.setQueryData('user', updatedUser);
        toast.success(data.message || 'Plan mis a jour');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Erreur de mise a jour du plan';
        toast.error(message);
      },
    }
  );

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginWithGoogle,
    completeOAuthLogin,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutate,
    changePasswordAsync: changePasswordMutation.mutateAsync,
    updatePlan: updatePlanMutation.mutate,
    updatePlanAsync: updatePlanMutation.mutateAsync,
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading,
    isUpdatingProfile: updateProfileMutation.isLoading,
    isChangingPassword: changePasswordMutation.isLoading,
    isUpdatingPlan: updatePlanMutation.isLoading,
  };
};