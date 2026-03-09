// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL, // ex: http://localhost:8000/api
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

const isPublic = (url) =>
  url ? PUBLIC_ENDPOINTS.some((e) => url.includes(e)) : false;

// ── Requête : injecter le token ──────────────────────────────────────────────
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

// ── Réponse : gérer 401 ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!isPublic(url)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;