import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Logo from '../components/Logo';
import theme from '../config/theme';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // 👈 Import des icônes

export default function ResetPassword() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const emailParam = searchParams.get('email');

  const [formData, setFormData] = useState({
    email: emailParam || '',
    password: '',
    password_confirmation: '',
    token: token || ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  
  // 👇 NOUVEAUX ÉTATS pour afficher/masquer les mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  useEffect(() => {
    if (token) {
      setFormData(prev => ({ ...prev, token }));
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) {
      setPasswordStrength('');
    } else if (password.length < 8) {
      setPasswordStrength('faible');
    } else if (password.length < 12) {
      setPasswordStrength('moyen');
    } else {
      setPasswordStrength('fort');
    }
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

    if (!formData.token) {
      setError('Token de réinitialisation manquant. Veuillez utiliser le lien reçu par email.');
      return;
    }

    if (!formData.email) {
      setError('Adresse email manquante');
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Envoi de la requête de réinitialisation');

      await api.post('/reset-password', formData);
      
      alert('✅ Mot de passe réinitialisé avec succès !');
      navigate('/login');
      
    } catch (err) {
      console.error('❌ Erreur réinitialisation:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.password?.[0] ||
        'Une erreur est survenue lors de la réinitialisation'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'faible': return '#ef4444';
      case 'moyen': return '#f59e0b';
      case 'fort': return '#10b981';
      default: return theme.colors.text.secondary;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <Logo size="lg" showText={true} />
        </div>

        <h2 style={styles.title}>Nouveau mot de passe</h2>
        <p style={styles.subtitle}>
          Créez un nouveau mot de passe sécurisé pour protéger votre compte CarEasy
        </p>

        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
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

          {/* 👇 Nouveau mot de passe avec toggle */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Nouveau mot de passe</label>
            <div style={styles.passwordInputContainer}>
              <input
                type={showPassword ? "text" : "password"} // 👈 Toggle type
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
            
            {/* Indicateur de force */}
            {passwordStrength && (
              <>
                <div style={styles.strengthIndicator}>
                  <div 
                    style={{
                      ...styles.strengthBar,
                      width: passwordStrength === 'faible' ? '33%' : passwordStrength === 'moyen' ? '66%' : '100%',
                      backgroundColor: getStrengthColor(),
                    }}
                  />
                </div>
                <small style={{...styles.strengthText, color: getStrengthColor()}}>
                  Force : {passwordStrength}
                </small>
              </>
            )}
            
            <small style={styles.hint}>
              Minimum 8 caractères. Utilisez majuscules, chiffres et symboles.
            </small>
          </div>

          {/* 👇 Confirmation mot de passe avec toggle */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirmer le mot de passe</label>
            <div style={styles.passwordInputContainer}>
              <input
                type={showPasswordConfirmation ? "text" : "password"} // 👈 Toggle type
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
            disabled={loading || !formData.token}
            style={{
              ...styles.button, 
              opacity: (loading || !formData.token) ? 0.6 : 1,
              cursor: (loading || !formData.token) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Réinitialisation...' : 'Réinitialiser mon mot de passe'}
          </button>
        </form>

        <div style={styles.divider} />

        <div style={styles.footer}>
          <Link to="/login" style={styles.backLink}>
            ← Retour à la connexion
          </Link>
        </div>

        <div style={styles.securityBox}>
          <div style={styles.securityIcon}>🔒</div>
          <div>
            <p style={styles.securityTitle}>Sécurité renforcée</p>
            <p style={styles.securityText}>
              Votre mot de passe est crypté et stocké de manière sécurisée.
            </p>
          </div>
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
  card: {
    backgroundColor: theme.colors.secondary,
    padding: '2.5rem',
    borderRadius: theme.borderRadius.xl,
    boxShadow: theme.shadows.xl,
    width: '100%',
    maxWidth: '550px',
    border: `2px solid ${theme.colors.primaryLight}`,
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '2rem',
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
    lineHeight: '1.5',
  },
  debugInfo: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    padding: '0.75rem',
    borderRadius: theme.borderRadius.md,
    marginBottom: '1rem',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
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
  },
  
  // 👇 NOUVEAUX STYLES pour le toggle password
  passwordInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    padding: '0.875rem',
    paddingRight: '3rem', // 👈 Espace pour le bouton
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.md,
    fontSize: '1rem',
    transition: 'all 0.3s',
    outline: 'none',
    flex: 1,
    width: '100%',
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
  },
  eyeIcon: {
    fontSize: '1.25rem',
  },
  
  strengthIndicator: {
    height: '4px',
    backgroundColor: '#E5E7EB',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '0.5rem',
  },
  strengthBar: {
    height: '100%',
    transition: 'all 0.3s',
    borderRadius: '2px',
  },
  strengthText: {
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  hint: {
    color: theme.colors.text.secondary,
    fontSize: '0.8rem',
    lineHeight: '1.4',
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
  },
  divider: {
    height: '1px',
    backgroundColor: theme.colors.primaryLight,
    margin: '1.5rem 0',
  },
  footer: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  backLink: {
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  securityBox: {
    backgroundColor: '#DBEAFE',
    padding: '1rem',
    borderRadius: theme.borderRadius.md,
    border: '1px solid #3B82F6',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  securityIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  securityTitle: {
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: '0.25rem',
    fontSize: '0.95rem',
  },
  securityText: {
    color: '#1E40AF',
    fontSize: '0.85rem',
    lineHeight: '1.5',
  },
};