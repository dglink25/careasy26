// src/api/aiApi.js — Client pour l'API Flask CareEasy AI
// Communique avec le backend Flask sur le port 5000

const AI_BASE_URL = import.meta.env.VITE_AI_URL || 'http://localhost:5000';

/**
 * Envoie un message texte à l'IA et retourne la réponse.
 * Supporte : texte, localisation GPS, historique multi-tours, image.
 */
export const aiApi = {
  /**
   * Chat principal — texte ou image
   * @param {Object} params
   * @param {string}  params.message        - Message texte
   * @param {Array}   params.history        - Historique [{role, content}]
   * @param {number}  params.lat            - Latitude GPS (optionnel)
   * @param {number}  params.lng            - Longitude GPS (optionnel)
   * @param {string}  params.location_text  - Localité texte ex: "Cotonou"
   * @param {File}    params.imageFile      - Fichier image (optionnel)
   * @param {string}  params.vehicle_make   - Marque véhicule
   * @param {string}  params.vehicle_model  - Modèle véhicule
   * @param {string}  params.lang           - Langue (fr|en|fon)
   * @param {number}  params.conversation_id
   * @returns {Promise<{answer: string, intent: string, urgency: string, services: Array}>}
   */
  chat: async ({
    message = '',
    history = [],
    lat = 0,
    lng = 0,
    location_text = '',
    imageFile = null,
    vehicle_make = '',
    vehicle_model = '',
    lang = 'fr',
    conversation_id = null,
  } = {}) => {
    try {
      let body;
      let headers = {};

      if (imageFile) {
        // FormData si image jointe
        body = new FormData();
        body.append('message', message);
        body.append('file', imageFile);
        body.append('lang', lang);
        if (lat) body.append('lat', lat);
        if (lng) body.append('lng', lng);
        if (location_text) body.append('location_text', location_text);
        if (vehicle_make) body.append('vehicle_make', vehicle_make);
        if (vehicle_model) body.append('vehicle_model', vehicle_model);
        if (conversation_id) body.append('conversation_id', conversation_id);
        body.append('history', JSON.stringify(history));
      } else {
        // JSON pour texte seul
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          message,
          history,
          lang,
          ...(lat && { lat }),
          ...(lng && { lng }),
          ...(location_text && { location_text }),
          ...(vehicle_make && { vehicle_make }),
          ...(vehicle_model && { vehicle_model }),
          ...(conversation_id && { conversation_id }),
        });
      }

      const response = await fetch(`${AI_BASE_URL}/api/v1/chat`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        answer: data.answer_fr || data.answer || '',
        intent: data.intent || 'general',
        urgency: data.urgency || 'unknown',
        services: data.services_proches || [],
        lang: data.lang_detected || lang,
        sources: data.sources || [],
      };
    } catch (error) {
      console.error('aiApi.chat error:', error);
      throw error;
    }
  },

  checkStatus: async () => {
    try {
      const response = await fetch(`${AI_BASE_URL}/api/v1/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(4000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
