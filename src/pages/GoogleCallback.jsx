// src/pages/GoogleCallback.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import theme from '../config/theme';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Récupérer les paramètres de l'URL
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const userStr = params.get('user');
        
        if (token && userStr) {
          // Décoder l'utilisateur
          const user = JSON.parse(decodeURIComponent(userStr));
          
          // Stocker dans localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Mettre à jour le contexte
          updateUser(user);
          
          // Vérifier s'il y a une redirection après Google
          const redirectData = sessionStorage.getItem('redirectAfterGoogle');
          
          if (redirectData) {
            const { from, openContactModal, selectedService } = JSON.parse(redirectData);
            sessionStorage.removeItem('redirectAfterGoogle');
            
            console.log('🔵 Redirection Google vers:', from, { openContactModal, selectedService });
            
            // IMPORTANT: from peut être '/' ou une autre page
            // Si from est '/' (page d'accueil), on redirige vers '/'
            // Sinon on redirige vers la page spécifiée
            navigate(from || '/', { 
              state: { 
                openContactModal, 
                selectedService 
              } 
            });
          } else {
            // Pas de redirection spécifique, aller au dashboard
            console.log('🟢 Pas de redirectData, vers dashboard');
            navigate('/dashboard');
          }
        } else {
          console.log('🔴 Erreur: token ou user manquant');
          navigate('/login?error=google_auth_failed');
        }
      } catch (error) {
        console.error('❌ Erreur lors du callback Google:', error);
        navigate('/login?error=google_auth_error');
      }
    };

    handleGoogleCallback();
  }, [location, navigate, updateUser]);

  return (
    <div style={styles.container}>
      <div style={styles.spinner} />
      <p style={styles.text}>Authentification en cours...</p>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #dc2626',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  text: {
    color: theme.colors.text.secondary,
    fontSize: '1.1rem',
  },
};