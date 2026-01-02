// src/api/messageApi.js - VERSION BASE64
import api from './axios';

export const messageApi = {
  /**
   * Démarrer ou récupérer une conversation
   */
  startConversation: async (receiverId = null) => {
    console.log('🔵 API startConversation - receiverId:', receiverId);
    
    const payload = receiverId ? { receiver_id: receiverId } : {};
    const response = await api.post('/conversation/start', payload);
    
    return response.data;
  },

  /**
   * ✅ Envoyer un message avec fichier en base64
   */
  sendMessage: async (conversationId, content, location = null, file = null, type = 'text') => {
    console.log('🔵 API sendMessage - conversationId:', conversationId);
    console.log('🔵 Type:', type, '- File:', file ? 'OUI' : 'NON');
    
    try {
      let payload = {
        type: type,
        content: content || null,
      };

      // Si localisation fournie
      if (location) {
        payload.latitude = location.latitude;
        payload.longitude = location.longitude;
      }

      // ✅ Si fichier fourni, le convertir en base64
      if (file) {
        console.log('📤 Conversion du fichier en base64...');
        
        // Convertir le fichier en base64
        const fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        payload.file_data = fileData; // Data URL complète (data:image/jpeg;base64,...)
        payload.file_name = file.name;
        
        console.log('✅ Fichier converti:', {
          name: file.name,
          size: (fileData.length / 1024).toFixed(2) + ' KB',
          type: file.type
        });
      }

      // Envoyer en JSON (pas de FormData)
      const response = await api.post(
        `/conversation/${conversationId}/send`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Message envoyé avec succès');
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur envoi message:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Récupérer les messages d'une conversation
   */
  getMessages: async (conversationId) => {
    console.log('🔵 API getMessages - conversationId:', conversationId);
    
    const response = await api.get(`/conversation/${conversationId}`);
    console.log('📥 Messages reçus:', response.data.messages?.length || 0);
    
    return response.data;
  },

  /**
   * Récupérer toutes les conversations
   */
  getMyConversations: async () => {
    console.log('🔵 API getMyConversations');
    
    const response = await api.get('/conversations');
    console.log('📥 Conversations reçues:', response.data.length);
    
    return response.data;
  },

  /**
   * Marquer les messages comme lus
   */
  markAsRead: async (conversationId) => {
    console.log('🔵 API markAsRead - conversationId:', conversationId);
    
    const response = await api.post(`/conversation/${conversationId}/mark-read`);
    console.log('✅ Messages marqués comme lus');
    
    return response.data;
  }
};