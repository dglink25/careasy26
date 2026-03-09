import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Configuration axios avec intercepteurs
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

// Intercepteur pour ajouter le token à chaque requête
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs 401
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expiré ou invalide
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const planApi = {
   
    getPlans: async () => {
        try {
            const response = await axiosInstance.get('/admin/plans');
            return response.data;
        } catch (error) {
            console.error('Erreur getPlans:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    /**
     * Récupérer un plan par son ID (admin)
     */
    getPlan: async (id) => {
        try {
            const response = await axiosInstance.get(`/admin/plans/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur getPlan:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    /**
     * Créer un nouveau plan (admin)
     */
    createPlan: async (planData) => {
        try {
            const formattedData = {
                name: planData.name,
                code: planData.code.toUpperCase(),
                description: planData.description || '',
                price: parseFloat(planData.price),
                duration_days: parseInt(planData.duration_days),
                features: planData.features || [],
                limitations: planData.limitations || [],
                max_services: planData.max_services ? parseInt(planData.max_services) : null,
                max_employees: planData.max_employees ? parseInt(planData.max_employees) : null,
                has_priority_support: Boolean(planData.has_priority_support),
                has_analytics: Boolean(planData.has_analytics),
                has_api_access: Boolean(planData.has_api_access),
                is_active: Boolean(planData.is_active),
                sort_order: parseInt(planData.sort_order) || 0
            };

            const response = await axiosInstance.post('/admin/plans', formattedData);
            return response.data;
        } catch (error) {
            console.error('Erreur createPlan:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    /**
     * Mettre à jour un plan (admin)
     */
    updatePlan: async (id, planData) => {
        try {
            const formattedData = {
                name: planData.name,
                code: planData.code.toUpperCase(),
                description: planData.description || '',
                price: parseFloat(planData.price),
                duration_days: parseInt(planData.duration_days),
                features: planData.features || [],
                limitations: planData.limitations || [],
                max_services: planData.max_services ? parseInt(planData.max_services) : null,
                max_employees: planData.max_employees ? parseInt(planData.max_employees) : null,
                has_priority_support: Boolean(planData.has_priority_support),
                has_analytics: Boolean(planData.has_analytics),
                has_api_access: Boolean(planData.has_api_access),
                is_active: Boolean(planData.is_active),
                sort_order: parseInt(planData.sort_order) || 0
            };

            const response = await axiosInstance.put(`/admin/plans/${id}`, formattedData);
            return response.data;
        } catch (error) {
            console.error('Erreur updatePlan:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    /**
     * Supprimer un plan (admin)
     */
    deletePlan: async (id) => {
        try {
            const response = await axiosInstance.delete(`/admin/plans/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur deletePlan:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    updateOrder: async (orders) => {
        try {
            const response = await axiosInstance.post('/admin/plans/update-order', { orders });
            return response.data;
        } catch (error) {
            console.error('Erreur updateOrder:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    /**
     * Activer/désactiver un plan (admin)
     */
    toggleStatus: async (id) => {
        try {
            const response = await axiosInstance.patch(`/admin/plans/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            console.error('Erreur toggleStatus:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    getPublicPlans: async () => {
        try {
            const response = await axiosInstance.get('/plans');
            return response.data;
        } catch (error) {
            console.error('Erreur getPublicPlans:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    getPublicPlan: async (id) => {
        try {
            const response = await axiosInstance.get(`/plans/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur getPublicPlan:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    comparePlans: async () => {
        try {
            const response = await axiosInstance.get('/plans/compare/all');
            return response.data;
        } catch (error) {
            console.error('Erreur comparePlans:', error);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    }
};

export default planApi;