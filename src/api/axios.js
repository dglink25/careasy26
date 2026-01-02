// careasy-frontend/src/api/axios.js - VERSION CORRIGÉE POUR MESSAGERIE ANONYME
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// ✅ Liste des endpoints qui NE nécessitent PAS d'authentification
const PUBLIC_ENDPOINTS = [
  '/conversation/start',    // 👈 Démarrer conversation anonyme
  '/conversation/',         // 👈 Envoyer/recevoir messages anonymes
  '/entreprises',
  '/services',
  '/search',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// Fonction pour vérifier si l'endpoint est public
const isPublicEndpoint = (url) => {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

// ✅ INTERCEPTEUR POUR AJOUTER LE TOKEN
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // ✅ Ajouter le token seulement s'il existe
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token ajouté:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ Aucun token - Requête anonyme autorisée pour:', config.url);
    }
    
    console.log('📡 Requête:', config.method.toUpperCase(), config.url);
    
    return config;
  },
  (error) => {
    console.error('❌ Erreur intercepteur request:', error);
    return Promise.reject(error);
  }
);

// ✅ INTERCEPTEUR POUR GÉRER LES RÉPONSES
api.interceptors.response.use(
  (response) => {
    console.log('✅ Réponse reçue:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Erreur API:', error.response?.status, error.response?.data);
    
    // ✅ Si 401 Unauthorized
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      
      // ✅ NE PAS rediriger vers login pour les endpoints publics
      if (!isPublicEndpoint(requestUrl)) {
        console.warn('⚠️ Non authentifié - Redirection vers login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        console.info('ℹ️ Requête anonyme autorisée:', requestUrl);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;