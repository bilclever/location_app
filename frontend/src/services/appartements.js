import api from './api';

export const appartementService = {
  // GET /api/appartements/
  async getAll(params = {}) {
    const response = await api.get('/appartements/', { params });
    return response.data;
  },

  // GET /api/appartements/{slug}/
  async getBySlug(slug) {
    const response = await api.get(`/appartements/${slug}/`);
    return response.data;
  },

  // POST /api/appartements/
  async create(data) {
    const response = await api.post('/appartements/', data);
    return response.data;
  },

  // PUT /api/appartements/{slug}/
  async update(slug, data) {
    const response = await api.put(`/appartements/${slug}/`, data);
    return response.data;
  },

  // PATCH /api/appartements/{slug}/
  async partialUpdate(slug, data) {
    const response = await api.patch(`/appartements/${slug}/`, data);
    return response.data;
  },

  // DELETE /api/appartements/{slug}/
  async delete(slug) {
    const response = await api.delete(`/appartements/${slug}/`);
    return response.data;
  },

  // POST /api/appartements/{slug}/check_disponibilite/
  async checkDisponibilite(slug, dateDebut, dateFin) {
    const response = await api.post(`/appartements/${slug}/check_disponibilite/`, {
      date_debut: dateDebut,
      date_fin: dateFin,
    });
    return response.data;
  },

  // GET /api/appartements/{slug}/locations/
  async getLocations(slug, params = {}) {
    const response = await api.get(`/appartements/${slug}/locations/`, { params });
    return response.data;
  },

  // POST /api/appartements/{slug}/upload_photo/
  async uploadPhoto(slug, formData) {
    const response = await api.post(`/appartements/${slug}/upload_photo/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};