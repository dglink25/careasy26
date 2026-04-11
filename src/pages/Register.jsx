import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import Logo from '../components/Logo';
import theme from '../config/theme';
import SEOHead from '../components/SEOHead';
import { 
  FaEye, 
  FaEyeSlash, 
  FaGoogle, 
  FaTimes, 
  FaEnvelope, 
  FaPhone,
  FaUser,
  FaLock,
  FaCheckCircle
} from 'react-icons/fa';
import { MdEmail, MdPhone } from 'react-icons/md';

export default function Register({ isModal = false, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationMethod, setRegistrationMethod] = useState('email'); // 'email' ou 'phone'
  
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal } = useModal();

  // Validation en temps réel
  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    switch(name) {
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
        
      case 'password_confirmation':
        if (value && value !== formData.password) {
          errors.password_confirmation = 'Les mots de passe ne correspondent pas';
        } else {
          delete errors.password_confirmation;
        }
        break;
    }
    
    setFieldErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validation en temps réel
    validateField(name, value);
    
    // Effacer l'erreur générale quand l'utilisateur corrige
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleMethodChange = (method) => {
    setRegistrationMethod(method);
    // Réinitialiser les champs non utilisés
    setFormData({
      ...formData,
      email: '',
      phone: ''
    });
    setFieldErrors({});
    setError('');
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name || formData.name.length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    
    if (registrationMethod === 'email') {
      if (!formData.email) {
        errors.email = 'L\'email est requis';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Format d\'email invalide';
      }
    } else {
      if (!formData.phone) {
        errors.phone = 'Le téléphone est requis';
      } else if (!/^[0-9+\-\s]{8,15}$/.test(formData.phone.replace(/\s/g, ''))) {
        errors.phone = 'Numéro de téléphone invalide';
      }
    }
    
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = 'Les mots de passe ne correspondent pas';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation finale
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    // Préparer les données selon la méthode choisie
    const registerData = {
      name: formData.name,
      password: formData.password,
      password_confirmation: formData.password_confirmation
    };
    
    if (registrationMethod === 'email') {
      registerData.email = formData.email;
    } else {
      registerData.phone = formData.phone;
    }
    
    const result = await register(registerData);
    
    if (result.success) {
      setSuccess('Inscription réussie ! Redirection en cours...');
      
      setTimeout(() => {
        if (isModal && onClose) {
          onClose();
        }
        
        const from = location.state?.from || '/dashboard';
        const openContactModal = location.state?.openContactModal;
        const selectedService = location.state?.selectedService;
        
        navigate(from, { 
          state: { 
            openContactModal, 
            selectedService 
          } 
        });
      }, 150);
    } 
    else {
      setError(result.message || 'Une erreur est survenue lors de l\'inscription');
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = () => {
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

  const handleLoginClick = () => {
    if (isModal && onClose) {
      setTimeout(() => openModal('login'), 50);
    } else {
      navigate('/login', { 
        state: { 
          from: location.state?.from,
          openContactModal: location.state?.openContactModal,
          selectedService: location.state?.selectedService
        } 
      });
    }
  };

  // Vérifier la force du mot de passe
  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div style={{
      ...styles.container,
      ...(isModal ? styles.modalContainer : {}),
    }}>
      <SEOHead title="Inscription" noindex={true} />
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
        
        {/* Message de succès */}
        {success && (
          <div style={styles.success}>
            <FaCheckCircle style={styles.successIcon} />
            <span>{success}</span>
          </div>
        )}
        
        {/* Message d'erreur */}
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Sélecteur de méthode d'inscription */}
        <div style={styles.methodSelector}>
          <button
            type="button"
            onClick={() => handleMethodChange('email')}
            style={{
              ...styles.methodButton,
              ...(registrationMethod === 'email' ? styles.methodButtonActive : {}),
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
              ...(registrationMethod === 'phone' ? styles.methodButtonActive : {}),
              borderTopRightRadius: theme.borderRadius.md,
              borderBottomRightRadius: theme.borderRadius.md,
            }}
          >
            <MdPhone style={styles.methodIcon} />
            <span>Téléphone</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Nom complet */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <FaUser style={styles.inputIcon} />
              Nom complet
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                ...styles.input,
                ...(fieldErrors.name ? styles.inputError : {})
              }}
              placeholder="Ex: Jean Dupont"
            />
            {fieldErrors.name && (
              <span style={styles.fieldError}>{fieldErrors.name}</span>
            )}
          </div>

          {/* Champ conditionnel selon la méthode choisie */}
          {registrationMethod === 'email' ? (
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <FaEnvelope style={styles.inputIcon} />
                Adresse email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                style={{
                  ...styles.input,
                  ...(fieldErrors.phone ? styles.inputError : {})
                }}
                placeholder="+229 01 99 95 50 78"
              />
              {fieldErrors.phone && (
                <span style={styles.fieldError}>{fieldErrors.phone}</span>
              )}
            </div>
          )}

          {/* Mot de passe avec indicateur de force */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <FaLock style={styles.inputIcon} />
              Mot de passe
            </label>
            <div style={styles.passwordInputContainer}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
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
            
            {/* Indicateur de force du mot de passe */}
            {formData.password && (
              <div style={styles.passwordStrength}>
                <div style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      style={{
                        ...styles.strengthBar,
                        backgroundColor: level <= passwordStrength 
                          ? passwordStrength === 1 ? theme.colors.error
                            : passwordStrength === 2 ? '#ffa500'
                            : passwordStrength === 3 ? theme.colors.primary
                            : theme.colors.success
                          : theme.colors.primaryLight,
                        width: level <= passwordStrength ? '25%' : '25%',
                      }}
                    />
                  ))}
                </div>
                <span style={styles.strengthText}>
                  {passwordStrength === 0 && 'Très faible'}
                  {passwordStrength === 1 && 'Faible'}
                  {passwordStrength === 2 && 'Moyen'}
                  {passwordStrength === 3 && 'Fort'}
                  {passwordStrength === 4 && 'Très fort'}
                </span>
              </div>
            )}
            
            {fieldErrors.password && (
              <span style={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          {/* Confirmation mot de passe */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <FaLock style={styles.inputIcon} />
              Confirmer le mot de passe
            </label>
            <div style={styles.passwordInputContainer}>
              <input
                type={showPasswordConfirmation ? "text" : "password"}
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                style={{
                  ...styles.passwordInput,
                  ...(fieldErrors.password_confirmation ? styles.inputError : {})
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                style={styles.toggleButton}
                tabIndex="-1"
              >
                {showPasswordConfirmation ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {fieldErrors.password_confirmation && (
              <span style={styles.fieldError}>{fieldErrors.password_confirmation}</span>
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
            {loading ? 'Inscription en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>OU</span>
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
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '1rem',
    borderRadius: theme.borderRadius.md,
    marginBottom: '1rem',
    border: '1px solid #c3e6cb',
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  successIcon: {
    fontSize: '1.25rem',
    color: '#28a745',
  },
  error: {
    backgroundColor: theme.colors.primaryLight,
    color: theme.colors.error,
    padding: '1rem',
    borderRadius: theme.borderRadius.md,
    marginBottom: '1rem',
    border: `1px solid ${theme.colors.error}`,
    fontSize: '0.95rem',
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
  label: {
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
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
  passwordStrength: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  strengthBars: {
    display: 'flex',
    gap: '0.25rem',
    flex: 1,
  },
  strengthBar: {
    height: '4px',
    borderRadius: '2px',
    transition: 'all 0.3s',
  },
  strengthText: {
    fontSize: '0.85rem',
    color: theme.colors.text.secondary,
    minWidth: '70px',
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
    ':hover': {
      color: theme.colors.primaryDark,
    },
  },
  link: {
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: '600',
    ':hover': {
      textDecoration: 'underline',
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
`;

// Injecter les styles globaux
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = globalStyles;
  document.head.appendChild(style);
}