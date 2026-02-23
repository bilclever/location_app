import api from './api';

export const locationService = {
  // GET /api/locations/
  async getAll(params = {}) {
    const response = await api.get('/locations/', { params });
    return response.data;
  },

  // GET /api/locations/{id}/
  async getById(id) {
    const response = await api.get(`/locations/${id}/`);
    return response.data;
  },

  // POST /api/locations/
  async create(data) {
    const response = await api.post('/locations/', data);
    return response.data;
  },

  // PUT /api/locations/{id}/
  async update(id, data) {
    const response = await api.put(`/locations/${id}/`, data);
    return response.data;
  },

  // PATCH /api/locations/{id}/
  async partialUpdate(id, data) {
    const response = await api.patch(`/locations/${id}/`, data);
    return response.data;
  },

  // DELETE /api/locations/{id}/
  async delete(id) {
    const response = await api.delete(`/locations/${id}/`);
    return response.data;
  },

  // POST /api/locations/{id}/annuler/
  async annuler(id) {
    const response = await api.post(`/locations/${id}/annuler/`);
    return response.data;
  },

  // POST /api/locations/{id}/confirmer/
  async confirmer(id) {
    const response = await api.post(`/locations/${id}/confirmer/`);
    return response.data;
  },

  // GET /api/locations/a_venir/
  async getAVenir(params = {}) {
    const response = await api.get('/locations/a_venir/', { params });
    return response.data;
  },

  // GET /api/locations/actives/
  async getActives(params = {}) {
    const response = await api.get('/locations/actives/', { params });
    return response.data;
  },
};