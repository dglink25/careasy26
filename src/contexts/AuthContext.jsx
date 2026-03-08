import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      // Vérifier qu'on a soit email soit téléphone
      if (!credentials.email && !credentials.phone) {
        throw new Error('Veuillez fournir un email ou un numéro de téléphone');
      }
      
      if (credentials.email && credentials.phone) {
        throw new Error('Veuillez choisir entre email et téléphone');
      }
      
      const response = await api.post(`/login`, credentials);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      
      return { success: true, user: response.data.user };
    } 
    catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur de connexion' 
      };
    }
  };

  const register = async (userData) => {
    try {
      if (!userData.email && !userData.phone) {
        throw new Error('Veuillez fournir un email ou un numéro de téléphone');
      }
      
      if (userData.email && userData.phone) {
        throw new Error('Veuillez choisir entre email et téléphone');
      }
      
      const response = await api.post('/register', userData);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      
      return { success: true, user: response.data.user };
    } 
    catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Erreur lors de l\'inscription'
      };
    }
  };

  const updateUser = (updatedUserData) => {
    try {
      const updatedUser = {
        ...user,
        ...updatedUserData
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('Utilisateur mis à jour dans le contexte:', updatedUser);
    } 
    catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/'; 
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      loading,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};