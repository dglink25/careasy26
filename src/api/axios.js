// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
  withCredentials: true,
});

// Endpoints accessibles sans token
const PUBLIC_ENDPOINTS = [
  '/entreprises',
  '/entreprises/form/data',
  '/services',
  '/search',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/ai/',
];

// Endpoints où un 401 ne doit PAS déclencher une déconnexion
// (opérations "fire & forget" non critiques)
const SILENT_401_ENDPOINTS = [
  '/notifications',
  '/push/',
  '/broadcasting/',
];

const isPublic = (url) =>
  url ? PUBLIC_ENDPOINTS.some((e) => url.includes(e)) : false;

const isSilent401 = (url) =>
  url ? SILENT_401_ENDPOINTS.some((e) => url.includes(e)) : false;

// ── Requête : injecter le token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Réponse : gérer 401 ──────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';

      // Ignorer les 401 sur les routes notifications (fire & forget)
      // → ne pas interrompre la navigation en cours
      if (isSilent401(url)) {
        return Promise.reject(error);
      }

      if (!isPublic(url)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // ✅ Utiliser window.__careasyNavigate si disponible (SPA, pas de rechargement)
        // Sinon fallback sur window.location (hors contexte React)
        if (typeof window.__careasyNavigate === 'function') {
          window.__careasyNavigate('/login');
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;