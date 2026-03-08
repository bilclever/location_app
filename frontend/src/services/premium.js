import api from './api';

const list = async (endpoint, params = {}) => {
  const response = await api.get(endpoint, { params });
  return response.data;
};

const create = async (endpoint, data) => {
  const response = await api.post(endpoint, data);
  return response.data;
};

const update = async (endpoint, id, data) => {
  const response = await api.put(`${endpoint}${id}/`, data);
  return response.data;
};

const remove = async (endpoint, id) => {
  const response = await api.delete(`${endpoint}${id}/`);
  return response.data;
};

export const premiumService = {
  getDashboard(params = {}) {
    return list('/premium/dashboard/', params);
  },

  getCategories(params = {}) {
    return list('/premium/categories/', params);
  },

  createCategory(data) {
    return create('/premium/categories/', data);
  },

  updateCategory(id, data) {
    return update('/premium/categories/', id, data);
  },

  deleteCategory(id) {
    return remove('/premium/categories/', id);
  },

  getAppartementTypes(params = {}) {
    return list('/premium/appartement-types/', params);
  },

  createAppartementType(data) {
    return create('/premium/appartement-types/', data);
  },

  deleteAppartementType(id) {
    return remove('/premium/appartement-types/', id);
  },

  getBiens(params = {}) {
    return list('/premium/biens/', params);
  },

  createBien(data) {
    return create('/premium/biens/', data);
  },

  updateBien(id, data) {
    return update('/premium/biens/', id, data);
  },

  deleteBien(id) {
    return remove('/premium/biens/', id);
  },

  getLocataires(params = {}) {
    return list('/premium/locataires/', params);
  },

  createLocataire(data) {
    return create('/premium/locataires/', data);
  },

  updateLocataire(id, data) {
    return update('/premium/locataires/', id, data);
  },

  getBaux(params = {}) {
    return list('/premium/baux/', params);
  },

  createBail(data) {
    return create('/premium/baux/', data);
  },

  getComptaEntries(params = {}) {
    return list('/premium/comptabilite/ecritures/', params);
  },

  createComptaEntry(data) {
    return create('/premium/comptabilite/ecritures/', data);
  },

  getPaymentAuditLogs(params = {}) {
    return list('/premium/payments/audit-logs/', params);
  },

  getPayments(params = {}) {
    return list('/premium/payments/', params);
  },

  createPayment(data) {
    return create('/premium/payments/', data);
  },

  purgeLocataireData(locataireId) {
    return create('/premium/rgpd/purge/', { locataire_id: locataireId });
  },
};
