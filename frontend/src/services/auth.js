import api from './api';

export const authService = {
  // POST /api/auth/register/
  async register(userData) {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  // POST /api/auth/login/
  async login(credentials) {
    const normalizedEmail = (credentials?.email || credentials?.username || '').trim().toLowerCase();
    const response = await api.post('/auth/login/', {
      email: normalizedEmail,
      password: credentials?.password || '',
    });
    return response.data;
  },

  // POST /api/auth/login/verify-otp/
  async verifyEmailOtp(payload) {
    const response = await api.post('/auth/login/verify-otp/', {
      email: (payload?.email || '').trim().toLowerCase(),
      otp_code: (payload?.otp_code || '').trim(),
    });
    return response.data;
  },

  // POST /api/auth/register/verify-otp/
  async verifyRegisterOtp(payload) {
    const response = await api.post('/auth/register/verify-otp/', {
      email: (payload?.email || '').trim().toLowerCase(),
      otp_code: (payload?.otp_code || '').trim(),
    });
    return response.data;
  },

  // POST /api/auth/logout/
  async logout(refreshToken) {
    const response = await api.post('/auth/logout/', { refresh: refreshToken });
    return response.data;
  },

  // GET /api/auth/profile/
  async getProfile(accessToken = null) {
    const config = accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined;

    const response = await api.get('/auth/profile/', config);
    return response.data;
  },

  // PUT /api/auth/profile/
  async updateProfile(data) {
    // Si FormData, axios gérera automatiquement le Content-Type multipart/form-data
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    
    const response = await api.put('/auth/profile/', data, config);
    return response.data;
  },

  // POST /api/auth/change-password/
  async changePassword(data) {
    const response = await api.post('/auth/change-password/', data);
    return response.data;
  },

  // POST /api/auth/plan/
  async updatePlan(plan) {
    const response = await api.post('/auth/plan/', { plan });
    return response.data;
  },

  // POST /api/auth/token/refresh/
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
    return response.data;
  },
};