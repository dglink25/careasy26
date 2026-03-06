// src/api/rendezVousApi.js
import api from './axios';

export const rendezVousApi = {
    // Obtenir les créneaux disponibles pour un service
    getAvailableSlots: (serviceId, date) => 
        api.get(`/services/${serviceId}/slots/${date}`),

    // Créer une demande de rendez-vous
    createRendezVous: (data) => 
        api.post('/rendez-vous', data),

    // Obtenir mes rendez-vous (client ou prestataire)
    getMesRendezVous: (params = {}) => 
        api.get('/rendez-vous', { params }),

    // Obtenir les détails d'un rendez-vous
    getRendezVousById: (id) => 
        api.get(`/rendez-vous/${id}`),

    // Obtenir les événements pour le calendrier
    getCalendarEvents: (start, end, serviceId = null) => {
        let url = `/rendez-vous/calendar?start=${start}&end=${end}`;
        if (serviceId) url += `&service_id=${serviceId}`;
        return api.get(url);
    },

    // Confirmer un rendez-vous (prestataire)
    confirmRendezVous: (id) => 
        api.post(`/rendez-vous/${id}/confirm`),

    // Annuler un rendez-vous
    cancelRendezVous: (id, reason = '') => 
        api.post(`/rendez-vous/${id}/cancel`, { reason }),

    // Marquer comme terminé (prestataire)
    completeRendezVous: (id) => 
        api.post(`/rendez-vous/${id}/complete`),

    // Reporter un rendez-vous (prestataire)
    rescheduleRendezVous: (id, data) => 
        api.put(`/rendez-vous/${id}/reschedule`, data),

    // Obtenir les statistiques des rendez-vous
    getStats: () => 
        api.get('/rendez-vous/stats')
};