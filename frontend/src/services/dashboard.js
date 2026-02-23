import api from './api';

export const dashboardService = {
  // GET /api/dashboard/proprietaire/
  async getProprietaireStats() {
    const response = await api.get('/dashboard/proprietaire/');
    return response.data;
  },

  // GET /api/dashboard/locataire/
  async getLocataireStats() {
    const response = await api.get('/dashboard/locataire/');
    return response.data;
  },

  // GET /api/statistiques/
  async getAdminStats() {
    const response = await api.get('/statistiques/');
    return response.data;
  },
};