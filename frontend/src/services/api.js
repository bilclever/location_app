import axios from 'axios';
import { supabase, isSupabaseConfigured, getSupabaseAccessToken } from './supabaseClient';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isPublicAppartementRequest = (config) => {
  const method = (config?.method || 'get').toLowerCase();
  const url = config?.url || '';
  return method === 'get' && /^\/?appartements(\/|$)/.test(url);
};

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    if (config?.data instanceof FormData) {
      if (config.headers?.set) {
        config.headers.set('Content-Type', undefined);
      } else {
        if (config.headers?.['Content-Type']) {
          delete config.headers['Content-Type'];
        }
        if (config.headers?.['content-type']) {
          delete config.headers['content-type'];
        }
        if (config.headers?.common?.['Content-Type']) {
          delete config.headers.common['Content-Type'];
        }
        if (config.headers?.common?.['content-type']) {
          delete config.headers.common['content-type'];
        }
      }
    }

    if (isPublicAppartementRequest(config)) {
      if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
      return config;
    }

    const supabaseToken = getSupabaseAccessToken();
    const token = supabaseToken || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 403 && isPublicAppartementRequest(originalRequest)) {
      return Promise.reject(error);
    }

    // Ne pas réessayer sur 403 ou si déjà tenté
    if (error.response?.status === 403 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Gérer les 401 - essayer de refresh la session Supabase
    if (error.response?.status === 401) {
      originalRequest._retry = true;

      if (!isSupabaseConfigured || !supabase) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !data?.session?.access_token) {
          await supabase.auth.signOut();
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError || error);
        }

        originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh échoué, déconnecter
        await supabase.auth.signOut();
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;