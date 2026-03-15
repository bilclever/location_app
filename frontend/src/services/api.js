import axios from 'axios';
import { supabase, isSupabaseConfigured, getSupabaseAccessToken } from './supabaseClient';

const resolveApiUrl = () => {
  const configuredUrl = process.env.REACT_APP_API_URL;

  if (process.env.NODE_ENV !== 'development') {
    return configuredUrl;
  }

  if (!configuredUrl) {
    return '/api';
  }

  try {
    const parsedUrl = new URL(configuredUrl);
    if (['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) {
      return '/api';
    }
  } catch (_error) {
    // Keep configuredUrl if it is already relative or cannot be parsed.
  }

  return configuredUrl;
};

const API_URL = resolveApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const normalizePath = (rawUrl = '') => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  try {
    if (/^https?:\/\//i.test(rawUrl)) {
      return new URL(rawUrl).pathname || '';
    }
  } catch (_error) {
    // Ignore parsing errors and keep fallback logic below.
  }

  return rawUrl.split('?')[0] || '';
};

const isPublicAppartementRequest = (config) => {
  const method = (config?.method || 'get').toLowerCase();
  const path = normalizePath(config?.url || '');

  if (method !== 'get') {
    return false;
  }

  return /(^|\/)appartements(\/|$)/.test(path);
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

    if ((error.response?.status === 401 || error.response?.status === 403) && isPublicAppartementRequest(originalRequest)) {
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