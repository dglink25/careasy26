import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const INACTIVITY_TIME = 60 * 60 * 1000; // 60 minutes

export function useAutoLogout() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    let timer;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(logout, INACTIVITY_TIME);
    };

    const logout = () => {
      // Supprime les infos locales
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (setUser) setUser(null);

      // Redirection vers login
      navigate('/login');

      // Optionnel : déconnexion Google
      window.location.href = 'https://accounts.google.com/Logout';
    };

    // Écoute des interactions utilisateur
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

    // Démarre le timer
    resetTimer();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [navigate, setUser]);
}