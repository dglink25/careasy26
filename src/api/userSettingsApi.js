// src/api/userSettingsApi.js
import api from './axios';

export const userSettingsApi = {
  /**
   * Récupérer le profil utilisateur
   */
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  /**
   * Mettre à jour le profil
   */
  updateProfile: async (data) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  /**
   * Mettre à jour l'email
   */
  updateEmail: async (email, password) => {
    const response = await api.put('/user/email', { email, password });
    return response.data;
  },

  /**
   * Mettre à jour le mot de passe
   */
  updatePassword: async (currentPassword, newPassword, newPasswordConfirmation) => {
    const response = await api.put('/user/password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    });
    return response.data;
  },

  /**
   * Récupérer les paramètres
   */
  getSettings: async () => {
    const response = await api.get('/user/settings');
    return response.data;
  },

  /**
   * Mettre à jour les paramètres
   */
  updateSettings: async (settings) => {
    const response = await api.put('/user/settings', { settings });
    return response.data;
  },

  /**
   * Mettre à jour le thème
   */
  updateTheme: async (theme) => {
    const response = await api.put('/user/theme', { theme });
    return response.data;
  },

  /**
   * Récupérer les paramètres de notifications
   */
  getNotificationSettings: async () => {
    const response = await api.get('/user/notification-settings');
    return response.data;
  },

  /**
   * Mettre à jour les paramètres de notifications
   */
  updateNotificationSettings: async (notifications) => {
    const response = await api.put('/user/notification-settings', { notifications });
    return response.data;
  },

  /**
   * Mettre à jour la photo de profil
   */
  updateProfilePhoto: async (file) => {
    const formData = new FormData();
    formData.append('profile_photo', file);

    const response = await api.post('/user/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Supprimer la photo de profil
   */
  deleteProfilePhoto: async () => {
    const response = await api.delete('/user/profile-photo');
    return response.data;
  },

  /**
   * Mise à jour complète
   */
  updateAll: async (data) => {
    const formData = new FormData();
    
    // Ajouter les champs simples
    if (data.name) formData.append('name', data.name);
    if (data.email) formData.append('email', data.email);
    if (data.current_password) formData.append('current_password', data.current_password);
    if (data.new_password) formData.append('new_password', data.new_password);
    if (data.new_password_confirmation) formData.append('new_password_confirmation', data.new_password_confirmation);
    if (data.theme) formData.append('theme', data.theme);
    
    // Ajouter les paramètres
    if (data.settings) {
      formData.append('settings', JSON.stringify(data.settings));
    }
    
    // Ajouter la photo si présente
    if (data.profile_photo) {
      formData.append('profile_photo', data.profile_photo);
    }

    const response = await api.put('/user/update-all', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};