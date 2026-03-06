import api from './axios';

export const messageApi = {
  /**
   * Démarrer ou récupérer une conversation avec un utilisateur
   */
  startConversation: async (receiverId) => {
    try {
      console.log('Démarrage conversation avec:', receiverId);
      const response = await api.post('/conversation/start', { receiver_id: receiverId });
      return response.data;
    } catch (error) {
      console.error('Erreur startConversation:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Démarrer une conversation pour un service
   */
  startServiceConversation: async (serviceId, initialMessage = null) => {
    try {
      console.log('Démarrage conversation service:', serviceId);
      const response = await api.post('/conversation/service', {
        service_id: serviceId,
        message: initialMessage
      });
      return response.data;
    } catch (error) {
      console.error('Erreur startServiceConversation:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Envoyer un message
   */
  sendMessage: async (conversationId, data) => {
    try {
      console.log('Envoi message à conversation:', conversationId);
      
      // Si c'est un FormData (fichier)
      if (data instanceof FormData) {
        const response = await api.post(`/conversation/${conversationId}/send`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      }
      
      // Message texte simple
      const response = await api.post(`/conversation/${conversationId}/send`, {
        type: data.type || 'text',
        content: data.content || '',
        latitude: data.latitude,
        longitude: data.longitude,
        temporary_id: data.temporary_id
      });
      return response.data;
      
    } catch (error) {
      console.error('Erreur sendMessage:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Récupérer les messages d'une conversation
   */
  getMessages: async (conversationId) => {
    try {
      console.log('Récupération messages:', conversationId);
      const response = await api.get(`/conversation/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getMessages:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Récupérer toutes les conversations
   */
  getMyConversations: async () => {
    try {
      console.log('Récupération conversations');
      const response = await api.get('/conversations');
      return response.data;
    } catch (error) {
      console.error('Erreur getMyConversations:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Marquer les messages comme lus
   */
  markAsRead: async (conversationId) => {
    try {
      const response = await api.post(`/conversation/${conversationId}/mark-read`);
      return response.data;
    } catch (error) {
      console.error('Erreur markAsRead:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Vérifier le statut en ligne d'un utilisateur
   */
  checkOnlineStatus: async (userId) => {
    try {
      const response = await api.get(`/user/${userId}/online-status`);
      return response.data;
    } catch (error) {
      console.warn('Erreur checkOnlineStatus:', error.message);
      return { is_online: false, last_seen_at: null };
    }
  },

  /**
   * Mettre à jour le statut en ligne
   */
  updateOnlineStatus: async () => {
    try {
      await api.post('/user/online-status');
    } catch (error) {
      console.warn('Erreur updateOnlineStatus:', error.message);
    }
  }
};