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

const paiementApi = {
    /**
     * Initier un paiement pour un plan
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
     * Récupérer les abonnements de l'utilisateur
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
     * Récupérer l'abonnement actif
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


    getAbonnement: async (id) => {
        try {
            const response = await axiosInstance.get(`/abonnements/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur getAbonnement:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    }
};

export default paiementApi;