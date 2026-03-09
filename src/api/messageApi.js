// src/api/messageApi.js
// API complète messagerie – compatible WebSocket temps réel
import api from './axios';

export const messageApi = {
  /** Démarrer ou récupérer une conversation directe */
  startConversation: async (receiverId) => {
    const { data } = await api.post('/conversation/start', { receiver_id: receiverId });
    return data;
  },

  /** Démarrer une conversation depuis une fiche service */
  startServiceConversation: async (serviceId, message = null) => {
    const { data } = await api.post('/conversation/service', {
      service_id: serviceId,
      message,
    });
    return data;
  },

  /** Récupérer les messages d'une conversation (marque aussi comme lus) */
  getMessages: async (conversationId) => {
    const { data } = await api.get(`/conversation/${conversationId}`);
    return data;
  },

  /** Envoyer un message (texte ou FormData pour fichiers) */
  sendMessage: async (conversationId, payload) => {
    const isFormData = payload instanceof FormData;
    const { data } = await api.post(
      `/conversation/${conversationId}/send`,
      payload,
      isFormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {}
    );
    return data;
  },

  /** Toutes les conversations de l'utilisateur connecté */
  getMyConversations: async () => {
    const { data } = await api.get('/conversations');
    return data;
  },

  /** Marquer les messages d'une conversation comme lus */
  markAsRead: async (conversationId) => {
    const { data } = await api.post(`/conversation/${conversationId}/mark-read`);
    return data;
  },

  /** Envoyer l'indicateur de frappe */
  sendTyping: async (conversationId, isTyping) => {
    try {
      await api.post(`/conversation/${conversationId}/typing`, { is_typing: isTyping });
    } catch {
      // Silencieux – non bloquant
    }
  },

  /** Vérifier le statut en ligne d'un utilisateur */
  checkOnlineStatus: async (userId) => {
    const { data } = await api.get(`/user/${userId}/online-status`);
    return data;
  },

  /** Mettre à jour son propre statut en ligne */
  updateOnlineStatus: async () => {
    try {
      await api.post('/user/update-online-status');
    } catch {
      // Silencieux
    }
  },
};