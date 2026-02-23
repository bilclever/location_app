import api from './api';

export const favorisService = {
  // GET /api/favoris/
  async getAll() {
    const response = await api.get('/favoris/');
    return response.data;
  },

  // POST /api/favoris/
  async toggle(data) {
    const response = await api.post('/favoris/', data);
    return response.data;
  },

  async add(appartementId) {
    return this.toggle({
      appartement_id: appartementId,
      action: 'add'
    });
  },

  async remove(appartementId) {
    return this.toggle({
      appartement_id: appartementId,
      action: 'remove'
    });
  },
};