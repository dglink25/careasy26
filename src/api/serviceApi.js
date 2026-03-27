// src/api/serviceApi.js
import api from './axios';

export const serviceApi = {
  // Récupérer les services du prestataire connecté
  getMesServices: async () => {
    const response = await api.get('/services/mine');
    return response.data;
  },

  // Créer un service
  createService: async (formData) => {
    const response = await api.post('/services', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Récupérer les détails d'un service (authentifié)
  // La route publique GET /services/{id} a un bug backend (filtre is_always_open=true)
  // On utilise donc la liste des services du prestataire et on filtre par ID
  getServiceById: async (id) => {
    const response = await api.get('/services/mine');
    const services = response.data;
    const service = services.find(s => String(s.id) === String(id));
    if (!service) {
      throw new Error('Service non trouvé');
    }
    return service;
  },

  // Liste publique des services
  getPublicServices: async () => {
    const response = await api.get('/services');
    return response.data;
  },

  // Récupérer un service public par ID (pages publiques)
  getService: async (id) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  updateService: async (id, formData) => {
    const response = await api.post(`/services/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: {
        _method: 'PUT'
      }
    });
    return response.data;
  },

  deleteService: async (id) => {
    try {
      const response = await api.delete(`/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur deleteService:', error);
      throw error;
    }
  },
};