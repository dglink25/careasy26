// careasy-frontend/src/api/serviceApi.js
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

  // Récupérer les détails d'un service
  getService: async (id) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },
  
  // Liste publique des services
  getPublicServices: async () => {
    const response = await api.get('/services');
    return response.data;
  },

  // Méthode pour récupérer un service par ID
getServiceById: async (id) => {
  const response = await api.get(`/services/${id}`);
  return response.data;
},

// Méthode pour mettre à jour un service
updateService: async (id, formData) => {
  const response = await api.post(`/services/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      _method: 'PUT' // Laravel requiert ceci pour les formulaires multipart
    }
  });
  return response.data;
},
};