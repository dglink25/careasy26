// careasy-frontend/src/api/adminApi.js
import api from './axios';

export const adminApi = {
  // ═══════════════════════════════════════════════════════════
  // ENTREPRISES
  // ═══════════════════════════════════════════════════════════
  
  // Récupérer toutes les entreprises (avec filtrage optionnel)
  getEntreprises: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/admin/entreprises', { params });
    return response.data;
  },

  // Récupérer les détails d'une entreprise
  getEntreprise: async (id) => {
    const response = await api.get(`/admin/entreprises/${id}`);
    return response.data;
  },

  // Approuver une entreprise
  approveEntreprise: async (id, admin_note = null) => {
    const response = await api.post(`/admin/entreprises/${id}/approve`, {
      admin_note
    });
    return response.data;
  },

  // Rejeter une entreprise
  rejectEntreprise: async (id, admin_note) => {
    const response = await api.post(`/admin/entreprises/${id}/reject`, {
      admin_note
    });
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════
  // ABONNEMENTS
  // ═══════════════════════════════════════════════════════════
  
  // Récupérer tous les abonnements
  getAbonnements: async (filters = {}) => {
    const response = await api.get('/admin/abonnements', { params: filters });
    return response.data;
  },

  // Récupérer les détails d'un abonnement
  getAbonnement: async (id) => {
    const response = await api.get(`/admin/abonnements/${id}`);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════
  // SIGNALEMENTS
  // ═══════════════════════════════════════════════════════════
  
  // Récupérer tous les signalements
  getSignalements: async (filters = {}) => {
    const response = await api.get('/admin/signalements', { params: filters });
    return response.data;
  },

  // Marquer un signalement comme résolu
  resolveSignalement: async (id) => {
    const response = await api.patch(`/admin/signalements/${id}/resolve`);
    return response.data;
  },

  // Ignorer un signalement
  dismissSignalement: async (id) => {
    const response = await api.patch(`/admin/signalements/${id}/dismiss`);
    return response.data;
  },
};