// src/api/messageApi.js - VERSION COMPLÈTE ET CORRIGÉE
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
   * Envoyer un message avec support multiple formats
   */
  sendMessage: async (conversationId, messageData) => {
    console.log('API sendMessage - conversationId:', conversationId);
    
    try {
      // Si messageData est déjà un FormData (fichier)
      if (messageData instanceof FormData) {
        console.log('Envoi avec FormData (fichier)');
        const response = await api.post(
          `/conversation/${conversationId}/send`,
          messageData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log('Message avec fichier envoyé avec succès');
        return response.data;
      }
      
      // Si messageData est un objet (texte ou localisation)
      if (typeof messageData === 'object') {
        console.log('Envoi avec JSON:', messageData);
        
        // Gérer les fichiers en base64 si présents
        if (messageData.file_data) {
          console.log('Fichier base64 détecté');
          // Le fichier est déjà en base64 dans messageData.file_data
        }
        
        const response = await api.post(
          `/conversation/${conversationId}/send`,
          messageData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        console.log('Message envoyé avec succès');
        return response.data;
      }
      
      // Si messageData est une chaîne (texte simple)
      console.log('Envoi texte simple:', messageData);
      const response = await api.post(
        `/conversation/${conversationId}/send`,
        { content: messageData, type: 'text' },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Message texte envoyé avec succès');
      return response.data;
      
    } catch (error) {
      console.error('Erreur envoi message:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: `/conversation/${conversationId}/send`,
      });
      throw error;
    }
  },

  /**
   * Envoyer un message avec fichier (méthode simplifiée)
   */
  sendMessageWithFile: async (conversationId, content, file, fileType = null) => {
    console.log('API sendMessageWithFile - conversationId:', conversationId);
    
    try {
      // Déterminer automatiquement le type de fichier
      let actualFileType = fileType;
      if (!actualFileType && file.type) {
        if (file.type.startsWith('image/')) {
          actualFileType = 'image';
        } else if (file.type.startsWith('video/')) {
          actualFileType = 'video';
        } else if (file.type.startsWith('audio/')) {
          actualFileType = 'vocal';
        } else {
          actualFileType = 'document';
        }
      }
      
      console.log('Type de fichier détecté:', actualFileType);
      console.log('Fichier:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Option 1: Envoyer en FormData (recommandé)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', actualFileType);
      if (content) {
        formData.append('content', content);
      }

      const response = await api.post(
        `/conversation/${conversationId}/send`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Message avec fichier envoyé avec succès');
      return response.data;
      
    } catch (error) {
      console.error('Erreur envoi message avec fichier:', error);
      throw error;
    }
  },

  /**
   * Envoyer un message audio
   */
  sendAudioMessage: async (conversationId, audioBlob, content = null) => {
    console.log('API sendAudioMessage - conversationId:', conversationId);
    
    try {
      // Créer un fichier à partir du blob audio
      const audioFile = new File([audioBlob], `audio_message_${Date.now()}.webm`, {
        type: 'audio/webm'
      });

      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('type', 'vocal');
      if (content) {
        formData.append('content', content);
      }

      const response = await api.post(
        `/conversation/${conversationId}/send`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Message audio envoyé avec succès');
      return response.data;
      
    } catch (error) {
      console.error('Erreur envoi message audio:', error);
      throw error;
    }
  },

  /**
   * Récupérer les messages d'une conversation
   */
  getMessages: async (conversationId) => {
    console.log('API getMessages - conversationId:', conversationId);
    
    try {
      const response = await api.get(`/conversation/${conversationId}`);
      console.log('Messages reçus:', response.data.messages?.length || 0);
      
      // Formater les messages pour s'assurer qu'ils ont file_url
      if (response.data.messages) {
        response.data.messages = response.data.messages.map(msg => ({
          ...msg,
          file_url: msg.file_url || msg.file_path,
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur récupération messages:', error);
      throw error;
    }
  },

  /**
   * Récupérer toutes les conversations
   */
  getMyConversations: async () => {
    console.log('API getMyConversations');
    
    try {
      const response = await api.get('/conversations');
      console.log('Conversations reçues:', response.data.length);
      
      // Formater les conversations pour s'assurer que le dernier message a file_url
      const formattedConversations = response.data.map(conv => {
        if (conv.messages && conv.messages.length > 0) {
          const lastMessage = conv.messages[0];
          conv.messages[0] = {
            ...lastMessage,
            file_url: lastMessage.file_url || lastMessage.file_path,
          };
        }
        return conv;
      });
      
      return formattedConversations;
    } catch (error) {
      console.error('Erreur récupération conversations:', error);
      throw error;
    }
  },

  /**
   * Marquer les messages comme lus
   */
  markAsRead: async (conversationId) => {
    console.log('API markAsRead - conversationId:', conversationId);
    
    try {
      const response = await api.post(`/conversation/${conversationId}/mark-read`);
      console.log('Messages marqués comme lus');
      
      return response.data;
    } catch (error) {
      console.error('Erreur marquage messages lus:', error);
      throw error;
    }
  },
  
  /**
   * Vérifier le statut en ligne d'un utilisateur
   */
  checkOnlineStatus: async (userId) => {
    console.log('API checkOnlineStatus - userId:', userId);
    
    try {
      const response = await api.get(`/user/${userId}/online-status`);
      console.log('Statut en ligne:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Erreur vérification statut en ligne:', error);
      // Retourner un statut par défaut plutôt que de lancer une erreur
      return {
        user_id: userId,
        is_online: false,
        last_seen_at: null
      };
    }
  },

  /**
   * Mettre à jour le statut en ligne
   */
  updateOnlineStatus: async () => {
    console.log('API updateOnlineStatus');
    
    try {
      const response = await api.post('/user/online-status');
      console.log('Statut en ligne mis à jour');
      
      return response.data;
    } catch (error) {
      console.error('Erreur mise à jour statut en ligne:', error);
      throw error;
    }
  },
};

