import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import theme from '../config/theme';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // 👈 Import des icônes

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 👇 États pour toggle password
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

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
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <Logo size="lg" showText={true} />
        </div>

        <h2 style={styles.title}>Créer un compte</h2>
        <p style={styles.subtitle}>Rejoignez CarEasy dès aujourd'hui</p>
        
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
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

          {/* 👇 Mot de passe avec toggle */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Mot de passe</label>
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
            <small style={styles.hint}>Minimum 8 caractères</small>
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

        <div style={styles.divider}>
          <span style={styles.dividerText}>OU</span>
        </div>

        <div style={styles.footer}>
          <span style={styles.footerText}>Vous avez déjà un compte ?</span>
          <Link to="/login" style={styles.link}>
            Se connecter
          </Link>
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
    maxWidth: '500px',
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
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '1.5rem 0',
  },
  dividerText: {
    padding: '0 1rem',
    color: theme.colors.text.secondary,
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.text.secondary,
  },
  link: {
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: '600',
  },
};