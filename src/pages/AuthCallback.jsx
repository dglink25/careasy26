import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const processAuth = async () => {
      const token = searchParams.get('token');
      const user = JSON.parse(decodeURIComponent(searchParams.get("user")));
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');
      const message = searchParams.get('message');

      console.log("Token:", token);
      console.log("User:", user);

      localStorage.setItem("token", token);

      window.location.href = "/dashboard";

      if (error) {
        console.error('Auth error:', error, message);
        navigate(`/login?error=${error}&message=${message}`);
        return;
      }

      if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          
          
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          
          if (setUser) {
            setUser(user);
          }
          
          
          navigate('/dashboard');
        } catch (err) {
          console.error('Error parsing auth data:', err);
          navigate('/login?error=invalid_auth_data');
        }
      } else {
        navigate('/login?error=missing_auth_parameters');
      }
    };

    processAuth();
  }, [searchParams, navigate, setUser]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h2>Connexion en cours...</h2>
        <p>Redirection vers votre compte</p>
        <div style={styles.spinner}></div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  content: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '20px auto',
  },
};

// Ajouter l'animation CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}