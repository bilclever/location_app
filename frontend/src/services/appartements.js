import api from './api';

export const appartementService = {
  // GET /api/appartements/
  async getAll(params = {}) {
    const response = await api.get('/appartements/', { params });
    return response.data;
  },

  // GET /api/appartements/{id}/
  async getById(id) {
    const response = await api.get(`/appartements/${id}/`);
    return response.data;
  },

  // POST /api/appartements/
  async create(data) {
    const response = await api.post('/appartements/', data);
    return response.data;
  },

  // PUT /api/appartements/{id}/
  async update(id, data) {
    const response = await api.put(`/appartements/${id}/`, data);
    return response.data;
  },

  // PATCH /api/appartements/{id}/
  async partialUpdate(id, data) {
    const response = await api.patch(`/appartements/${id}/`, data);
    return response.data;
  },

  // DELETE /api/appartements/{id}/
  async delete(id) {
    const response = await api.delete(`/appartements/${id}/`);
    return response.data;
  },

  // POST /api/appartements/{id}/check_disponibilite/
  async checkDisponibilite(id, dateDebut, dateFin) {
    const response = await api.post(`/appartements/${id}/check_disponibilite/`, {
      date_debut: dateDebut,
      date_fin: dateFin,
    });
    return response.data;
  },

  // GET /api/appartements/{id}/locations/
  async getLocations(id, params = {}) {
    const response = await api.get(`/appartements/${id}/locations/`, { params });
    return response.data;
  },

  // POST /api/appartements/{id}/upload_photo/
  async uploadPhoto(id, formData) {
    const response = await api.post(`/appartements/${id}/upload_photo/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};