import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import theme from '../config/theme';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // 👈 Import des icônes

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 État pour toggle
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
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

        <h2 style={styles.title}>Connexion</h2>
        <p style={styles.subtitle}>Accédez à votre compte CarEasy</p>
        
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="votre@email.com"
            />
          </div>

          {/* 👇 Mot de passe avec toggle */}
          <div style={styles.formGroup}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Mot de passe</label>
              <Link to="/forgot-password" style={styles.forgotLink}>
                Mot de passe oublié ?
              </Link>
            </div>
            <div style={styles.passwordInputContainer}>
              <input
                type={showPassword ? "text" : "password"} // 👈 Toggle type
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Pas encore de compte ?</span>
          <Link to="/register" style={styles.link}>
            Créer un compte
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
    padding: '1rem',
  },
  card: {
    backgroundColor: theme.colors.secondary,
    padding: '2.5rem',
    borderRadius: theme.borderRadius.xl,
    boxShadow: theme.shadows.xl,
    width: '100%',
    maxWidth: '450px',
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
  link: {
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: '600',
  },
  forgotLink: {
    color: theme.colors.primary,
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
};