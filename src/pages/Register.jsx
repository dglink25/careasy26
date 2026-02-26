import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext'; // AJOUTER
import Logo from '../components/Logo';
import theme from '../config/theme';
import { FaEye, FaEyeSlash, FaGoogle, FaTimes } from 'react-icons/fa'; // AJOUTER FaGoogle, FaTimes

export default function Register({ isModal = false, onClose }) { // AJOUTER props modal
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const { openModal } = useModal(); // AJOUTER

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.password_confirmation
    );
    
    if (result.success) {
      if (isModal && onClose) {
        onClose();
      }
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_APP_URL || 'http://localhost:8000';
    const baseUrl = apiUrl.endsWith('/auth') ? apiUrl.replace('/auth', '') : apiUrl;
    const googleAuthUrl = `${baseUrl}/auth/google`;
    console.log('Redirecting to Google auth:', googleAuthUrl);
    window.location.href = googleAuthUrl;
  };

  // Modifier la fonction handleLoginClick
  const handleLoginClick = () => {
    if (isModal && onClose) {
      const { openModal } = useModal();
      setTimeout(() => openModal('login'), 50);
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{
      ...styles.container,
      ...(isModal ? styles.modalContainer : {}),
    }}>
      <div style={{
        ...styles.card,
        ...(isModal ? styles.modalCard : {}),
      }}>
        {/* Bouton fermer pour modal */}
        {isModal && (
          <button 
            onClick={onClose}
            style={styles.closeButton}
            aria-label="Fermer"
          >
            <FaTimes style={styles.closeIcon} />
          </button>
        )}

        <div style={styles.logoContainer}>
          <Logo size={isModal ? "md" : "lg"} showText={true} />
        </div>

        <h2 style={styles.title}>Créer un compte</h2>
        <p style={styles.subtitle}>Rejoignez CarEasy dès aujourd'hui</p>
        
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Nom */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Nom complet</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Ex: Jean Dupont"
            />
          </div>

          {/* Email */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Adresse email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="votre@email.com"
            />
          </div>

          {/* Mot de passe avec toggle */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Mot de passe</label>
            <div style={styles.passwordInputContainer}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                style={styles.passwordInput}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.toggleButton}
                tabIndex="-1"
              >
                {showPassword ? (
                  <FaEyeSlash style={styles.eyeIcon} />
                ) : (
                  <FaEye style={styles.eyeIcon} />
                )}
              </button>
            </div>
            <small style={styles.hint}>Minimum 8 caractères</small>
          </div>

          {/* Confirmation mot de passe avec toggle */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirmer le mot de passe</label>
            <div style={styles.passwordInputContainer}>
              <input
                type={showPasswordConfirmation ? "text" : "password"}
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                minLength="8"
                style={styles.passwordInput}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                style={styles.toggleButton}
                tabIndex="-1"
              >
                {showPasswordConfirmation ? (
                  <FaEyeSlash style={styles.eyeIcon} />
                ) : (
                  <FaEye style={styles.eyeIcon} />
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...styles.button, 
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Inscription en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <br />
        <div style={styles.subtitle}>
         <span style={styles.dividerText}>OU</span>
        </div>

         {/* Bouton Google - AJOUTÉ */}
        <button 
          onClick={handleGoogleLogin}
          style={styles.googleButton}
          type="button"
        >
          <FaGoogle style={styles.googleIcon} />
          <span>Continuer avec Google</span>
        </button>

        <div style={styles.footer}>
          <span style={styles.footerText}>Vous avez déjà un compte ?</span>
          {isModal ? (
            <button 
              onClick={handleLoginClick}
              style={styles.linkButton}
            >
              Se connecter
            </button>
          ) : (
            <Link to="/login" style={styles.link}>
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: '2rem 1rem',
  },
  modalContainer: {
    minHeight: 'auto',
    backgroundColor: 'transparent',
    padding: 0,
  },
  card: {
    backgroundColor: theme.colors.secondary,
    padding: '2.5rem',
    borderRadius: theme.borderRadius.xl,
    boxShadow: theme.shadows.xl,
    width: '100%',
    maxWidth: '500px',
    border: `2px solid ${theme.colors.primaryLight}`,
    position: 'relative',
  },
  modalCard: {
    maxWidth: '420px',
    padding: '2rem',
  },
  closeButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colors.text.secondary,
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: theme.colors.primaryLight,
      color: theme.colors.primary,
    },
  },
  closeIcon: {
    fontSize: '1.25rem',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: '1.5rem',
    fontSize: '0.95rem',
  },
  googleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.875rem',
    backgroundColor: 'white',
    color: '#4285F4',
    border: `2px solid #EA4335`,
    borderRadius: theme.borderRadius.md,
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '1.5rem',
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: '#F8F9FA',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
  },
  googleIcon: {
    fontSize: '1.25rem',
    color: '#EA4335',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '1.5rem 0',
    '::before': {
      content: '""',
      flex: 1,
      height: '1px',
      backgroundColor: theme.colors.primaryLight,
    },
    '::after': {
      content: '""',
      flex: 1,
      height: '1px',
      backgroundColor: theme.colors.primaryLight,
    },
  },
  dividerText: {
    padding: '0 1rem',
    color: theme.colors.text.secondary,
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: theme.colors.secondary,
    zIndex: 1,
  },
  error: {
    backgroundColor: theme.colors.primaryLight,
    color: theme.colors.error,
    padding: '0.875rem',
    borderRadius: theme.borderRadius.md,
    marginBottom: '1rem',
    border: `1px solid ${theme.colors.error}`,
    fontSize: '0.95rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontSize: '0.95rem',
  },
  input: {
    padding: '0.875rem',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.md,
    fontSize: '1rem',
    transition: 'all 0.3s',
    outline: 'none',
    ':focus': {
      borderColor: theme.colors.primary,
      boxShadow: `0 0 0 3px ${theme.colors.primary}20`,
    },
  },
  passwordInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    padding: '0.875rem',
    paddingRight: '3rem',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.md,
    fontSize: '1rem',
    transition: 'all 0.3s',
    outline: 'none',
    flex: 1,
    width: '100%',
    ':focus': {
      borderColor: theme.colors.primary,
      boxShadow: `0 0 0 3px ${theme.colors.primary}20`,
    },
  },
  toggleButton: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colors.text.secondary,
    transition: 'color 0.3s',
    ':hover': {
      color: theme.colors.primary,
    },
  },
  eyeIcon: {
    fontSize: '1.25rem',
  },
  hint: {
    color: theme.colors.text.secondary,
    fontSize: '0.8rem',
    marginTop: '-0.25rem',
  },
  button: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.text.white,
    padding: '0.875rem',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'all 0.3s',
    boxShadow: theme.shadows.md,
    ':hover': {
      backgroundColor: theme.colors.primaryDark,
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows.lg,
    },
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.text.secondary,
  },
  linkButton: {
    color: theme.colors.primary,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
    padding: 0,
    textDecoration: 'underline',
  },
  link: {
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: '600',
  },
};