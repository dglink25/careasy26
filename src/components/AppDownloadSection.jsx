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
      <div style={styles.bgGradient} />
      <div style={styles.bgGradient2} />
      <div style={styles.bgGradient3} />
      
      <div style={styles.container}>
        <div style={styles.leftContent} className="slide-up">
          <div style={styles.animatedBadge} className="badge-pulse">
            <div style={styles.badgeDot} />
            <span style={styles.badgeText}>Version 2.0.0 disponible</span>
          </div>

          <h1 style={styles.title}>
            CarEasy dans votre{' '}
            <span style={styles.titleHighlight}>poche</span>
          </h1>

          <p style={styles.description}>
            Trouvez un prestataire automobile, prenez rendez-vous et suivez vos interventions 
            depuis votre smartphone. Disponible maintenant sur Android — 100% gratuit.
          </p>

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
        </div>

        <div style={styles.rightContent} className="float-animation">
          <div style={styles.phoneMockup}>
            <div style={styles.phoneScreen}>
              <div style={styles.phoneWelcomeContent}>
                <img 
                  src="/logo.png" 
                  alt="CarEasy"
                  style={styles.phoneLogo}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.textContent = '🚗';
                      fallback.style.fontSize = '60px';
                      fallback.style.marginBottom = '12px';
                      parent.insertBefore(fallback, e.target);
                    }
                  }}
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

      <div style={styles.downloadWrapper} className="download-slide-up">
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
        <div style={styles.rippleEffect} className="ripple" />
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

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

        @keyframes slideUpDownload {
          from {
            opacity: 0;
            transform: translateY(60px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(1deg);
          }
          75% {
            transform: translateY(5px) rotate(-1deg);
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
            box-shadow: 0 0 25px rgba(239, 68, 68, 0.6), 0 0 35px rgba(239, 68, 68, 0.3);
          }
        }

        @keyframes gradientShift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(50px, -50px) scale(1.2);
          }
          66% {
            transform: translate(-30px, 30px) scale(0.9);
          }
        }

        .slide-up {
          animation: slideUp 0.8s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
        }

        .download-slide-up {
          animation: slideUpDownload 0.8s cubic-bezier(0.2, 0.9, 0.4, 1.1) 0.3s forwards;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .float-animation {
          animation: float 5s ease-in-out infinite;
        }

        .badge-pulse {
          animation: badgePulse 2s infinite;
        }

        .stat-card {
          opacity: 0;
          animation: statCardIn 0.6s ease-out forwards;
        }

        .glow-button {
          position: relative;
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          animation: glowPulse 2.5s infinite;
          overflow: hidden;
        }

        .glow-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .glow-button:hover::before {
          left: 100%;
        }

        .glow-button:hover {
          transform: scale(1.02) !important;
          box-shadow: 0 15px 35px rgba(239, 68, 68, 0.4) !important;
        }

        .glow-button:active {
          transform: scale(0.98) !important;
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

        /* RESPONSIVE - LE TELEPHONE EST TOUJOURS VISIBLE */
        @media (max-width: 968px) {
          .container {
            flex-direction: column !important;
            text-align: center !important;
            gap: 48px !important;
          }
          
          .left-content {
            text-align: center !important;
            align-items: center !important;
          }
          
          .animated-badge {
            justify-content: center !important;
          }
          
          .stats-container {
            justify-content: center !important;
          }
          
          .float-animation {
            animation: none;
          }
          
          .download-slide-up {
            display: flex;
            justify-content: center;
            width: 100%;
          }
          
          .right-content {
            display: flex !important;
            justify-content: center !important;
            width: 100% !important;
          }
        }

        @media (max-width: 768px) {
          .stat-card {
            min-width: auto;
          }
        }

        @media (max-width: 480px) {
          .glow-button {
            width: 100%;
          }
        }

        /* Classes pour les media queries */
        @media (max-width: 968px) {
          .container {
            flex-direction: column;
            text-align: center;
          }
          .left-content {
            text-align: center;
          }
          .stats-container {
            justify-content: center;
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
    padding: 'clamp(40px, 6vw, 80px) clamp(16px, 5vw, 24px)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  bgGradient: {
    position: 'absolute',
    top: '-20%',
    right: '-10%',
    width: 'clamp(300px, 40vw, 600px)',
    height: 'clamp(300px, 40vw, 600px)',
    background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    animation: 'gradientShift 15s ease-in-out infinite',
  },
  bgGradient2: {
    position: 'absolute',
    bottom: '-20%',
    left: '-10%',
    width: 'clamp(250px, 35vw, 500px)',
    height: 'clamp(250px, 35vw, 500px)',
    background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    animation: 'gradientShift 20s ease-in-out infinite reverse',
  },
  bgGradient3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'clamp(400px, 60vw, 800px)',
    height: 'clamp(400px, 60vw, 800px)',
    background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  container: {
    maxWidth: 1280,
    margin: '0 auto 48px auto',
    display: 'flex',
    gap: 'clamp(32px, 6vw, 64px)',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    width: '100%',
  },
  leftContent: {
    flex: 1,
    minWidth: 280,
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
    fontSize: 'clamp(11px, 3vw, 13px)',
    fontWeight: 600,
    color: '#ef4444',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 'clamp(28px, 6vw, 52px)',
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
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    lineHeight: 1.6,
    color: '#475569',
    marginBottom: 32,
    maxWidth: 540,
  },
  statsContainer: {
    display: 'flex',
    gap: 'clamp(12px, 3vw, 24px)',
    marginBottom: 0,
    flexWrap: 'wrap',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)',
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
    flex: '0 0 auto',
    transition: 'all 0.3s ease',
    cursor: 'default',
  },
  statIcon: {
    width: 'clamp(28px, 5vw, 32px)',
    height: 'clamp(28px, 5vw, 32px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 'clamp(16px, 4vw, 20px)',
    fontWeight: 800,
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: 'clamp(10px, 2.5vw, 11px)',
    fontWeight: 500,
    color: '#64748b',
  },
  downloadWrapper: {
    position: 'relative',
    marginTop: 'clamp(32px, 5vw, 48px)',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 2,
  },
  btnPrimary: {
    width: '100%',
    maxWidth: 'clamp(300px, 80vw, 400px)',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    border: 'none',
    borderRadius: 60,
    cursor: 'pointer',
    padding: 0,
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(8px, 2vw, 12px)',
    padding: 'clamp(12px, 2.5vw, 16px) clamp(16px, 3vw, 24px)',
    width: '100%',
  },
  btnIconWrapper: {
    width: 'clamp(40px, 8vw, 48px)',
    height: 'clamp(40px, 8vw, 48px)',
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
  },
  btnTextWrapper: {
    flex: 1,
    textAlign: 'left',
  },
  btnSmall: {
    display: 'block',
    fontSize: 'clamp(9px, 2.5vw, 11px)',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  btnBig: {
    display: 'block',
    fontSize: 'clamp(13px, 3.5vw, 18px)',
    fontWeight: 800,
    color: 'white',
  },
  btnArrow: {
    color: 'white',
    opacity: 0.7,
    flexShrink: 0,
  },
  rippleEffect: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  rightContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    minWidth: 280,
  },
  phoneMockup: {
    width: 'clamp(280px, 65vw, 340px)',
    background: '#1e293b',
    borderRadius: 'clamp(36px, 8vw, 44px)',
    border: '4px solid #334155',
    padding: 'clamp(10px, 2vw, 12px) clamp(8px, 1.5vw, 10px) clamp(16px, 3vw, 20px)',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    animation: 'float 5s ease-in-out infinite',
  },
  phoneNotch: {
    position: 'absolute',
    top: 'clamp(14px, 3vw, 18px)',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'clamp(100px, 25vw, 120px)',
    height: 'clamp(24px, 5vw, 28px)',
    background: '#0f172a',
    borderRadius: 20,
    zIndex: 2,
  },
  phoneButton: {
    position: 'absolute',
    bottom: 'clamp(6px, 1.5vw, 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'clamp(100px, 25vw, 120px)',
    height: 4,
    background: '#334155',
    borderRadius: 2,
  },
  phoneScreen: {
    background: '#ffffff',
    borderRadius: 'clamp(30px, 6vw, 36px)',
    overflow: 'hidden',
    height: 'clamp(560px, 130vw, 680px)',
    position: 'relative',
    paddingTop: 'clamp(36px, 7vw, 40px)',
  },
  phoneWelcomeContent: {
    padding: 'clamp(16px, 4vw, 20px) clamp(12px, 3vw, 16px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
  },
  phoneLogo: {
    width: 'clamp(60px, 15vw, 80px)',
    height: 'clamp(60px, 15vw, 80px)',
    objectFit: 'contain',
    marginBottom: 'clamp(8px, 2vw, 12px)',
  },
  phoneSubtitleBadge: {
    padding: 'clamp(4px, 1.5vw, 6px) clamp(12px, 3vw, 16px)',
    background: '#F7FAFC',
    borderRadius: 30,
    border: '1px solid #EDF2F7',
    marginBottom: 'clamp(8px, 2vw, 10px)',
  },
  phoneSubtitleText: {
    fontSize: 'clamp(11px, 2.5vw, 13px)',
    fontWeight: 500,
    color: '#4A5568',
  },
  phoneDescription: {
    fontSize: 'clamp(10px, 2vw, 11px)',
    fontStyle: 'italic',
    color: '#718096',
    textAlign: 'center',
    marginBottom: 'clamp(20px, 5vw, 28px)',
  },
  phoneButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(8px, 2vw, 10px)',
    width: '100%',
  },
  phoneBtnPrimary: {
    background: '#ef4444',
    borderRadius: 'clamp(12px, 2.5vw, 14px)',
    padding: 'clamp(12px, 2.5vw, 14px) clamp(12px, 3vw, 16px)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
    fontWeight: 600,
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
    transition: 'all 0.3s ease',
    cursor: 'default',
  },
  phoneBtnArrow: {
    fontSize: 'clamp(14px, 3vw, 16px)',
  },
  phoneBtnOutline: {
    border: '1.5px solid #E2E8F0',
    borderRadius: 'clamp(12px, 2.5vw, 14px)',
    padding: 'clamp(12px, 2.5vw, 14px) clamp(12px, 3vw, 16px)',
    textAlign: 'center',
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    fontWeight: 600,
    color: '#2D3748',
    transition: 'all 0.3s ease',
    cursor: 'default',
  },
  phoneBtnQR: {
    background: 'rgba(239, 68, 68, 0.04)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 'clamp(12px, 2.5vw, 14px)',
    padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 12px)',
    display: 'flex',
    gap: 'clamp(8px, 2vw, 10px)',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    cursor: 'default',
  },
  phoneQRIcon: {
    fontSize: 'clamp(18px, 4vw, 20px)',
  },
  phoneQRTitle: {
    fontSize: 'clamp(10px, 2vw, 11px)',
    fontWeight: 600,
    color: '#ef4444',
  },
  phoneQRSubtitle: {
    fontSize: 'clamp(8px, 1.8vw, 9px)',
    color: '#718096',
  },
  phoneFooterLink: {
    marginTop: 'clamp(20px, 5vw, 28px)',
    fontSize: 'clamp(8px, 1.8vw, 9px)',
    color: '#718096',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
};