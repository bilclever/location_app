import api from './api';

export const authService = {
  // POST /api/auth/register/
  async register(userData) {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  // POST /api/auth/login/
  async login(credentials) {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  // POST /api/auth/logout/
  async logout(refreshToken) {
    const response = await api.post('/auth/logout/', { refresh: refreshToken });
    return response.data;
  },

  // GET /api/auth/profile/
  async getProfile() {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  // PUT /api/auth/profile/
  async updateProfile(data) {
    const response = await api.put('/auth/profile/', data);
    return response.data;
  },

  // POST /api/auth/change-password/
  async changePassword(data) {
    const response = await api.post('/auth/change-password/', data);
    return response.data;
  },

  // POST /api/auth/token/refresh/
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
    return response.data;
  },
};