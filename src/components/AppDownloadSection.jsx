const APK_URL =
  'https://github.com/dglink25/careasy_app_mobile/releases/latest/download/CarEasy.apk';

// Icônes
const DownloadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const QRIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="3" height="3" rx="0.5" />
    <rect x="18" y="14" width="3" height="3" rx="0.5" />
    <rect x="14" y="18" width="3" height="3" rx="0.5" />
    <rect x="18" y="18" width="3" height="3" rx="0.5" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ZapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SmartphoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function AppDownloadSection() {
  return (
    <section style={styles.section}>
      {/* Background gradient animé */}
      <div style={styles.bgGradient} />
      
      <div style={styles.container}>
        {/* Partie gauche - Contenu principal avec animations */}
        <div style={styles.leftContent} className="slide-up">
          {/* Badge animateur */}
          <div style={styles.animatedBadge} className="badge-pulse">
            <div style={styles.badgeDot} />
            <span style={styles.badgeText}>Version 2.0.0 disponible</span>
          </div>

          {/* Titre principal */}
          <h1 style={styles.title}>
            CarEasy dans votre{' '}
            <span style={styles.titleHighlight}>poche</span>
          </h1>

          {/* Description */}
          <p style={styles.description}>
            Trouvez un prestataire automobile, prenez rendez-vous et suivez vos interventions 
            depuis votre smartphone. Disponible maintenant sur Android — 100% gratuit.
          </p>

          {/* Stats avec animations */}
          <div style={styles.statsContainer}>
            {[
              { value: '100%', label: 'Gratuit', icon: <ShieldIcon />, color: '#10b981' },
              { value: '< 100 Mo', label: 'Ultra léger', icon: <ZapIcon />, color: '#f59e0b' },
              { value: 'Android', label: 'Compatible', icon: <SmartphoneIcon />, color: '#3b82f6' },
            ].map((stat, index) => (
              <div key={index} style={styles.statCard} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div style={{ ...styles.statIcon, color: stat.color }}>{stat.icon}</div>
                <div>
                  <div style={{ ...styles.statValue, color: stat.color }}>{stat.value}</div>
                  <div style={styles.statLabel}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bouton Obtenir avec animation superbe */}
          <div style={styles.btnWrapper} className="btn-wrapper">
            <button 
              style={styles.btnPrimary}
              className="glow-button"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onClick={() => window.open(APK_URL)}
            >
              <span style={styles.btnContent}>
                <span style={styles.btnIconWrapper}>
                  <DownloadIcon />
                </span>
                <span style={styles.btnTextWrapper}>
                  <span style={styles.btnSmall}>Télécharger gratuitement</span>
                  <span style={styles.btnBig}>Obtenir CarEasy.apk</span>
                </span>
                <span style={styles.btnArrow}>
                  <ArrowRightIcon />
                </span>
              </span>
            </button>
            
            {/* Effet de vague */}
            <div style={styles.rippleEffect} className="ripple" />
          </div>

        </div>

        {/* Partie droite - Mockup téléphone */}
        <div style={styles.rightContent} className="float-animation">
          <div style={styles.phoneMockup}>
            <div style={styles.phoneScreen}>
              <div style={styles.phoneWelcomeContent}>
                <img 
                  src="/logo.png" 
                  alt="CarEasy"
                  style={styles.phoneLogo}
                />
                
                <div style={styles.phoneSubtitleBadge}>
                  <span style={styles.phoneSubtitleText}>Votre Automobile, Notre Expertise</span>
                </div>
                
                <div style={styles.phoneDescription}>
                  Des professionnels à votre service pour un entretien de qualité
                </div>

                <div style={styles.phoneButtons}>
                  <div style={styles.phoneBtnPrimary}>
                    <span>Se connecter</span>
                    <span style={styles.phoneBtnArrow}>→</span>
                  </div>
                  <div style={styles.phoneBtnOutline}>
                    Créer un compte
                  </div>
                  <div style={styles.phoneBtnQR}>
                    <div style={styles.phoneQRIcon}>📱</div>
                    <div>
                      <div style={styles.phoneQRTitle}>Connexion rapide via QR code</div>
                      <div style={styles.phoneQRSubtitle}>Scannez depuis un appareil déjà connecté</div>
                    </div>
                  </div>
                </div>

                <div style={styles.phoneFooterLink}>
                  Conditions générales d'utilisation
                </div>
              </div>
            </div>
            <div style={styles.phoneNotch} />
            <div style={styles.phoneButton} />
          </div>
        </div>
      </div>

      <style>{`
        /* Animations principales */
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes badgePulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        @keyframes statCardIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 5px rgba(239, 68, 68, 0.3), 0 0 15px rgba(239, 68, 68, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.3);
          }
        }

        /* Application des animations */
        .slide-up {
          animation: slideUp 0.8s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
        }

        .float-animation {
          animation: float 4s ease-in-out infinite;
        }

        .badge-pulse {
          animation: badgePulse 2s infinite;
        }

        .stat-card {
          opacity: 0;
          animation: statCardIn 0.6s ease-out forwards;
        }

        .fade-in {
          animation: fadeIn 1s ease-out 0.5s forwards;
          opacity: 0;
        }

        /* Bouton avec glow */
        .glow-button {
          position: relative;
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          animation: glowPulse 2.5s infinite;
        }

        .glow-button:hover {
          transform: scale(1.02) !important;
          box-shadow: 0 15px 35px rgba(239, 68, 68, 0.4) !important;
        }

        .glow-button:active {
          transform: scale(0.98) !important;
        }

        /* Effet ripple */
        .btn-wrapper {
          position: relative;
        }

        .ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%);
          border-radius: 60px;
          transform: translate(-50%, -50%) scale(0.8);
          opacity: 0;
          pointer-events: none;
        }

        .btn-wrapper:hover .ripple {
          animation: ripple 1s ease-out;
        }

        /* Media queries */
        @media (max-width: 768px) {
          .app-download-container {
            flex-direction: column !important;
          }
          .float-animation {
            display: none !important;
          }
          .stat-card {
            min-width: 100px;
          }
        }

        @media (max-width: 480px) {
          .stat-card {
            min-width: 80px;
          }
          .statsContainer {
            gap: 12px !important;
          }
        }
      `}</style>
    </section>
  );
}

const styles = {
  section: {
    position: 'relative',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    padding: '80px 24px',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  bgGradient: {
    position: 'absolute',
    top: -200,
    right: -200,
    width: 600,
    height: 600,
    background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    gap: 64,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    position: 'relative',
    zIndex: 2,
  },
  leftContent: {
    flex: 1,
    minWidth: 320,
  },
  animatedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 100,
    padding: '6px 16px 6px 12px',
    marginBottom: 24,
  },
  badgeDot: {
    width: 8,
    height: 8,
    background: '#ef4444',
    borderRadius: '50%',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 600,
    color: '#ef4444',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.2,
    marginBottom: 20,
  },
  titleHighlight: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  description: {
    fontSize: '1rem',
    lineHeight: 1.6,
    color: '#475569',
    marginBottom: 32,
    maxWidth: 480,
  },
  statsContainer: {
    display: 'flex',
    gap: 24,
    marginBottom: 36,
    flexWrap: 'wrap',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
  },
  statIcon: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#64748b',
  },
  btnWrapper: {
    position: 'relative',
    marginBottom: 28,
  },
  btnPrimary: {
    width: '100%',
    maxWidth: 380,
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    border: 'none',
    borderRadius: 60,
    cursor: 'pointer',
    padding: 0,
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 24px',
    width: '100%',
  },
  btnIconWrapper: {
    width: 48,
    height: 48,
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  btnTextWrapper: {
    flex: 1,
    textAlign: 'left',
  },
  btnSmall: {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  btnBig: {
    display: 'block',
    fontSize: 18,
    fontWeight: 800,
    color: 'white',
  },
  btnArrow: {
    color: 'white',
    opacity: 0.7,
  },
  rippleEffect: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  qrHint: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 18px',
    background: 'white',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  qrHintIcon: {
    width: 36,
    height: 36,
    background: '#f1f5f9',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHintTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
  },
  qrHintText: {
    fontSize: 11,
    color: '#64748b',
  },
  rightContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    minWidth: 320,
  },
  phoneMockup: {
    width: 320,
    background: '#1e293b',
    borderRadius: 44,
    border: '4px solid #334155',
    padding: '12px 10px 20px',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  phoneNotch: {
    position: 'absolute',
    top: 18,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 120,
    height: 28,
    background: '#0f172a',
    borderRadius: 20,
    zIndex: 2,
  },
  phoneButton: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 120,
    height: 4,
    background: '#334155',
    borderRadius: 2,
  },
  phoneScreen: {
    background: '#ffffff',
    borderRadius: 36,
    overflow: 'hidden',
    height: 640,
    position: 'relative',
    paddingTop: 40,
  },
  phoneWelcomeContent: {
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
  },
  phoneLogo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
    marginBottom: 12,
  },
  phoneSubtitleBadge: {
    padding: '6px 16px',
    background: '#F7FAFC',
    borderRadius: 30,
    border: '1px solid #EDF2F7',
    marginBottom: 10,
  },
  phoneSubtitleText: {
    fontSize: 13,
    fontWeight: 500,
    color: '#4A5568',
  },
  phoneDescription: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#718096',
    textAlign: 'center',
    marginBottom: 28,
  },
  phoneButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  phoneBtnPrimary: {
    background: '#ef4444',
    borderRadius: 14,
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
    fontWeight: 600,
    fontSize: 14,
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
  },
  phoneBtnArrow: {
    fontSize: 16,
  },
  phoneBtnOutline: {
    border: '1.5px solid #E2E8F0',
    borderRadius: 14,
    padding: '14px 16px',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 600,
    color: '#2D3748',
  },
  phoneBtnQR: {
    background: 'rgba(239, 68, 68, 0.04)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    padding: '10px 12px',
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  phoneQRIcon: {
    fontSize: 20,
  },
  phoneQRTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#ef4444',
  },
  phoneQRSubtitle: {
    fontSize: 9,
    color: '#718096',
  },
  phoneFooterLink: {
    marginTop: 28,
    fontSize: 9,
    color: '#718096',
    textDecoration: 'underline',
  },
};