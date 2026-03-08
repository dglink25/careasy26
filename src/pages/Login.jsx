import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import Logo from '../components/Logo';
import theme from '../config/theme';
import { 
  FaEye, 
  FaEyeSlash, 
  FaGoogle, 
  FaTimes, 
  FaEnvelope, 
  FaPhone,
  FaUser,
  FaLock,
  FaArrowLeft
} from 'react-icons/fa';
import { MdEmail, MdPhone } from 'react-icons/md';

export default function Login({ isModal = false, onClose }) {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' ou 'phone'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal } = useModal();

  // Validation en temps réel
  const validateField = (field, value) => {
    const errors = { ...fieldErrors };
    
    switch(field) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Format d\'email invalide';
        } else {
          delete errors.email;
        }
        break;
        
      case 'phone':
        if (value && !/^[0-9+\-\s]{8,15}$/.test(value.replace(/\s/g, ''))) {
          errors.phone = 'Numéro de téléphone invalide (8-15 chiffres)';
        } else {
          delete errors.phone;
        }
        break;
        
      case 'password':
        if (value && value.length < 8) {
          errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
        } else {
          delete errors.password;
        }
        break;
    }
    
    setFieldErrors(errors);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    validateField('email', e.target.value);
    if (error) setError('');
  };

  const handlePhoneChange = (e) => {
    setPhone(e.target.value);
    validateField('phone', e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    validateField('password', e.target.value);
    if (error) setError('');
  };

  const handleMethodChange = (method) => {
    setLoginMethod(method);
    setEmail('');
    setPhone('');
    setFieldErrors({});
    setError('');
  };

  const validateForm = () => {
    const errors = {};
    
    if (loginMethod === 'email') {
      if (!email) {
        errors.email = 'L\'email est requis';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Format d\'email invalide';
      }
    } else {
      if (!phone) {
        errors.phone = 'Le téléphone est requis';
      } else if (!/^[0-9+\-\s]{8,15}$/.test(phone.replace(/\s/g, ''))) {
        errors.phone = 'Numéro de téléphone invalide';
      }
    }
    
    if (!password) {
      errors.password = 'Le mot de passe est requis';
    } else if (password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Préparer les données selon la méthode choisie
    const loginData = {
      password: password
    };
    
    if (loginMethod === 'email') {
      loginData.email = email;
    } else {
      loginData.phone = phone;
    }

    const result = await login(loginData);
    
    if (result.success) {
      if (isModal && onClose) {
        onClose();
      }
      
      const from = location.state?.from || '/dashboard';
      const openContactModal = location.state?.openContactModal;
      const selectedService = location.state?.selectedService;
      
      // Naviguer vers la page d'origine avec l'état si nécessaire
      navigate(from, { 
        state: { 
          openContactModal, 
          selectedService 
        } 
      });
    } else {
      setError(result.message || 'Identifiants incorrects');
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    // Stocker l'état avant redirection
    const from = location.state?.from || '/';
    const openContactModal = location.state?.openContactModal;
    const selectedService = location.state?.selectedService;
    
    if (openContactModal && selectedService) {
      sessionStorage.setItem('redirectAfterGoogle', JSON.stringify({
        from,
        openContactModal,
        selectedService
      }));
    }
    
    const apiUrl = import.meta.env.VITE_APP_URL || 'http://localhost:8000';
    const baseUrl = apiUrl.endsWith('/auth') ? apiUrl.replace('/auth', '') : apiUrl;
    const googleAuthUrl = `${baseUrl}/auth/google`;
    window.location.href = googleAuthUrl;
  };

  const handleRegisterClick = () => {
    if (isModal && onClose) {
      setTimeout(() => openModal('register'), 50);
    } else {
      navigate('/register', { 
        state: { 
          from: location.state?.from,
          openContactModal: location.state?.openContactModal,
          selectedService: location.state?.selectedService
        } 
      });
    }
  };

  const handleForgotPassword = () => {
    if (isModal && onClose) {
      setTimeout(() => openModal('reset-password'), 50);
    } else {
      navigate('/forgot-password', { 
        state: { 
          from: location.state?.from,
          openContactModal: location.state?.openContactModal,
          selectedService: location.state?.selectedService
        } 
      });
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

        <h2 style={styles.title}>Connexion</h2>
        <p style={styles.subtitle}>Accédez à votre compte CarEasy</p>

        {/* Sélecteur de méthode de connexion */}
        <div style={styles.methodSelector}>
          <button
            type="button"
            onClick={() => handleMethodChange('email')}
            style={{
              ...styles.methodButton,
              ...(loginMethod === 'email' ? styles.methodButtonActive : {}),
              borderTopLeftRadius: theme.borderRadius.md,
              borderBottomLeftRadius: theme.borderRadius.md,
            }}
          >
            <MdEmail style={styles.methodIcon} />
            <span>Email</span>
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange('phone')}
            style={{
              ...styles.methodButton,
              ...(loginMethod === 'phone' ? styles.methodButtonActive : {}),
              borderTopRightRadius: theme.borderRadius.md,
              borderBottomRightRadius: theme.borderRadius.md,
            }}
          >
            <MdPhone style={styles.methodIcon} />
            <span>Téléphone</span>
          </button>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Champ conditionnel selon la méthode choisie */}
          {loginMethod === 'email' ? (
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <FaEnvelope style={styles.inputIcon} />
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                required
                style={{
                  ...styles.input,
                  ...(fieldErrors.email ? styles.inputError : {})
                }}
                placeholder="votre@email.com"
              />
              {fieldErrors.email && (
                <span style={styles.fieldError}>{fieldErrors.email}</span>
              )}
            </div>
          ) : (
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <FaPhone style={styles.inputIcon} />
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                required
                style={{
                  ...styles.input,
                  ...(fieldErrors.phone ? styles.inputError : {})
                }}
                placeholder="+33 6 12 34 56 78"
              />
              {fieldErrors.phone && (
                <span style={styles.fieldError}>{fieldErrors.phone}</span>
              )}
              <small style={styles.hint}>
                Format: +33XXXXXXXXX ou 06XXXXXXXX
              </small>
            </div>
          )}

          {/* Mot de passe */}
          <div style={styles.formGroup}>
            <div style={styles.labelRow}>
              <label style={styles.label}>
                <FaLock style={styles.inputIcon} />
                Mot de passe
              </label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                style={styles.forgotButton}
              >
                Mot de passe oublié ?
              </button>
            </div>
            <div style={styles.passwordInputContainer}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                required
                style={{
                  ...styles.passwordInput,
                  ...(fieldErrors.password ? styles.inputError : {})
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.toggleButton}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {fieldErrors.password && (
              <span style={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || Object.keys(fieldErrors).length > 0}
            style={{
              ...styles.button,
              opacity: (loading || Object.keys(fieldErrors).length > 0) ? 0.6 : 1,
              cursor: (loading || Object.keys(fieldErrors).length > 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>ou</span>
        </div>

        {/* Bouton Google */}
        <button 
          onClick={handleGoogleLogin}
          style={styles.googleButton}
          type="button"
        >
          <FaGoogle style={styles.googleIcon} />
          <span>Continuer avec Google</span>
        </button>

        <div style={styles.footer}>
          <span style={styles.footerText}>Pas encore de compte ?</span>
          <button 
            onClick={handleRegisterClick}
            style={styles.linkButton}
          >
            Créer un compte
          </button>
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
    padding: '1rem',
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
    animation: 'fadeIn 0.5s ease',
    '@media (max-width: 768px)': {
      padding: '1.5rem',
    },
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
      transform: 'rotate(90deg)',
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
    '@media (max-width: 768px)': {
      fontSize: '1.5rem',
    },
  },
  subtitle: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: '1.5rem',
    fontSize: '0.95rem',
  },
  methodSelector: {
    display: 'flex',
    marginBottom: '2rem',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  methodButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '1rem',
    backgroundColor: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    color: theme.colors.text.secondary,
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: theme.colors.primaryLight,
    },
  },
  methodButtonActive: {
    backgroundColor: theme.colors.primary,
    color: 'white',
    ':hover': {
      backgroundColor: theme.colors.primaryDark,
    },
  },
  methodIcon: {
    fontSize: '1.25rem',
  },
  inputIcon: {
    marginRight: '0.5rem',
    color: theme.colors.primary,
    fontSize: '1rem',
  },
  error: {
    backgroundColor: theme.colors.primaryLight,
    color: theme.colors.error,
    padding: '1rem',
    borderRadius: theme.borderRadius.md,
    marginBottom: '1rem',
    border: `1px solid ${theme.colors.error}`,
    fontSize: '0.95rem',
    animation: 'shake 0.5s ease',
  },
  fieldError: {
    color: theme.colors.error,
    fontSize: '0.85rem',
    marginTop: '0.25rem',
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
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
  },
  forgotButton: {
    color: theme.colors.primary,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    padding: 0,
    textDecoration: 'underline',
    transition: 'color 0.3s',
    ':hover': {
      color: theme.colors.primaryDark,
    },
  },
  input: {
    padding: '1rem',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.md,
    fontSize: '1rem',
    transition: 'all 0.3s',
    outline: 'none',
    width: '100%',
    ':focus': {
      borderColor: theme.colors.primary,
      boxShadow: `0 0 0 3px ${theme.colors.primary}20`,
    },
    '@media (max-width: 768px)': {
      padding: '0.875rem',
    },
  },
  inputError: {
    borderColor: theme.colors.error,
    ':focus': {
      borderColor: theme.colors.error,
      boxShadow: `0 0 0 3px ${theme.colors.error}20`,
    },
  },
  hint: {
    color: theme.colors.text.secondary,
    fontSize: '0.8rem',
    marginTop: '0.25rem',
  },
  passwordInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    padding: '1rem',
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
  button: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.text.white,
    padding: '1rem',
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
    ':disabled': {
      backgroundColor: theme.colors.primaryLight,
      transform: 'none',
      boxShadow: 'none',
    },
  },
  googleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '1rem',
    backgroundColor: 'white',
    color: '#4285F4',
    border: `2px solid #EA4335`,
    borderRadius: theme.borderRadius.md,
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
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
    position: 'relative',
    '::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      height: '1px',
      backgroundColor: theme.colors.primaryLight,
      zIndex: 0,
    },
  },
  dividerText: {
    padding: '0 1rem',
    color: theme.colors.text.secondary,
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: theme.colors.secondary,
    zIndex: 1,
    margin: '0 auto',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
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
    transition: 'color 0.3s',
    ':hover': {
      color: theme.colors.primaryDark,
    },
  },
};

// Ajouter les animations globales
const globalStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;

// Injecter les styles globaux
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = globalStyles;
  document.head.appendChild(style);
}