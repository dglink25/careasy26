import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const paiementApi = {
    /**
     * Initier un paiement pour un plan
     * @param {number} planId
     * @param {number|null} entrepriseId — obligatoire pour lier l'abonnement à une entreprise
     */
    initierPaiement: async (planId, entrepriseId = null) => {
        try {
            const response = await axiosInstance.post(`/paiements/initier/${planId}`, {
                entreprise_id: entrepriseId
            });
            return response.data;
        } catch (error) {
            console.error('Erreur initierPaiement:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    /**
     * Vérifier le statut d'un paiement
     */
    verifierPaiement: async (reference) => {
        try {
            const response = await axiosInstance.get(`/paiements/verifier/${reference}`);
            return response.data;
        } catch (error) {
            console.error('Erreur verifierPaiement:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    /**
     * Récupérer tous les abonnements de l'utilisateur
     */
    getAbonnements: async () => {
        try {
            const response = await axiosInstance.get('/abonnements');
            return response.data;
        } catch (error) {
            console.error('Erreur getAbonnements:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    /**
     * Récupérer l'abonnement actif (payant OU essai)
     */
    getAbonnementActif: async () => {
        try {
            const response = await axiosInstance.get('/abonnements/actif');
            return response.data;
        } catch (error) {
            console.error('Erreur getAbonnementActif:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    /**
     * Récupérer un abonnement par son ID
     */
    getAbonnement: async (id) => {
        try {
            const response = await axiosInstance.get(`/abonnements/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur getAbonnement:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    /**
     * Annuler un abonnement actif
     * @param {number} id — ID de l'abonnement
     * @param {object} payload — { reason: string }
     */
    annulerAbonnement: async (id, payload = {}) => {
        try {
            const response = await axiosInstance.post(`/abonnements/${id}/annuler`, payload);
            return response.data;
        } catch (error) {
            console.error('Erreur annulerAbonnement:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },
};

export default paiementApi;