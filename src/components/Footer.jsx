// src/components/Footer.jsx — VERSION RICHE & PROFESSIONNELLE
import { Link } from 'react-router-dom';
import Logo from './Logo';
import theme from '../config/theme';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={styles.footer}>

      {/* ── CORPS PRINCIPAL ── */}
      <div style={styles.mainBody}>
        <div style={styles.mainGrid} className="footer-grid">

          {/* COL 1 — Marque */}
          <div style={styles.brandCol}>
            <Logo size="md" showText={true} />
            <p style={styles.brandDesc}>
              CarEasy est la plateforme automobile de référence au Bénin. Nous connectons
              des milliers d'automobilistes avec des prestataires certifiés partout dans
              le pays, pour tous vos besoins de mobilité.
            </p>
            {/* Réseaux sociaux */}
            <div style={styles.socialTitle}>Suivez-nous</div>
            <div style={styles.socialRow}>
              <a href="#" aria-label="Facebook" style={styles.socialBtn} className="footer-social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" aria-label="Instagram" style={styles.socialBtn} className="footer-social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" aria-label="WhatsApp" style={{ ...styles.socialBtn, backgroundColor: '#25D366' }} className="footer-social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" style={styles.socialBtn} className="footer-social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" aria-label="TikTok" style={styles.socialBtn} className="footer-social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* COL 2 — Services */}
          <div style={styles.col}>
            <h4 style={styles.colTitle}>
              Nos Services
            </h4>
            <ul style={styles.navList}>
              <li><Link to="/services?type=1" style={styles.navLink} className="footer-nav-link">Mécanique automobile</Link></li>
              <li><Link to="/services?type=2" style={styles.navLink} className="footer-nav-link">Peinture & Carrosserie</Link></li>
              <li><Link to="/services?type=3" style={styles.navLink} className="footer-nav-link">Pneumatique & Jantes</Link></li>
              <li><Link to="/services?type=4" style={styles.navLink} className="footer-nav-link">Climatisation auto</Link></li>
              <li><Link to="/services?type=5" style={styles.navLink} className="footer-nav-link">Auto-école</Link></li>
              <li><Link to="/services?type=6" style={styles.navLink} className="footer-nav-link">Assurance automobile</Link></li>
              <li><Link to="/services?type=7" style={styles.navLink} className="footer-nav-link">Électricité auto</Link></li>
              <li><Link to="/services" style={styles.navLinkMore}>Voir tous les services →</Link></li>
            </ul>
          </div>

          {/* COL 3 — Plateforme */}
          <div style={styles.col}>
            <h4 style={styles.colTitle}>
              Plateforme
            </h4>
            <ul style={styles.navList}>
              <li><Link to="/entreprises" style={styles.navLink} className="footer-nav-link">Trouver une entreprise</Link></li>
              <li><Link to="/services" style={styles.navLink} className="footer-nav-link">Explorer les services</Link></li>
              <li><Link to="/partenaires" style={styles.navLink} className="footer-nav-link">Nos partenaires</Link></li>
              <li><Link to="/register" style={styles.navLink} className="footer-nav-link">Créer un compte</Link></li>
              <li><Link to="/login" style={styles.navLink} className="footer-nav-link">Se connecter</Link></li>
              <li><a href="#" style={styles.navLink} className="footer-nav-link">Application mobile (bientôt)</a></li>
            </ul>

            <h4 style={{ ...styles.colTitle, marginTop: '2rem' }}>
              Prestataires
            </h4>
            <ul style={styles.navList}>
              <li><Link to="/register" style={styles.navLink} className="footer-nav-link">Inscrire mon entreprise</Link></li>
              <li><Link to="/mes-entreprises" style={styles.navLink} className="footer-nav-link">Gérer mes entreprises</Link></li>
              <li><Link to="/mes-services" style={styles.navLink} className="footer-nav-link">Gérer mes services</Link></li>
              <li><Link to="/messages" style={styles.navLink} className="footer-nav-link">Mes messages</Link></li>
              <li><Link to="/dashboard" style={styles.navLink} className="footer-nav-link">Mon tableau de bord</Link></li>
            </ul>
          </div>

          {/* COL 4 — Aide & Contact */}
          <div style={styles.col}>
            <h4 style={styles.colTitle}>
              Aide & Support
            </h4>
            <ul style={styles.navList}>
              <li><Link to="/faq" style={styles.navLink} className="footer-nav-link">Centre d'aide / FAQ</Link></li>
              <li><a href="#" style={styles.navLink} className="footer-nav-link">Guide du prestataire</a></li>
              <li><a href="#" style={styles.navLink} className="footer-nav-link">Suggérer une fonctionnalité</a></li>
              <li><a href="#" style={styles.navLink} className="footer-nav-link">Politique de confidentialité</a></li>
              <li><a href="#" style={styles.navLink} className="footer-nav-link">Conditions d'utilisation</a></li>
            </ul>

            {/* Bloc contact direct */}
            <div style={styles.contactCard}>
              <div style={styles.contactCardHeader}>Contact direct</div>
              
              <a href="mailto:careasy26@gmail.com" style={styles.contactRow}>
                <div>
                  <div style={styles.contactLabel}>Email</div>
                  <div style={styles.contactValue}>careasy26@gmail.com</div>
                </div>
              </a>
              <div style={styles.contactRow}>
                <div>
                  <div style={styles.contactLabel}>Siège social</div>
                  <div style={styles.contactValue}>Cotonou, Bénin</div>
                </div>
              </div>
              <div style={styles.contactRow}>
                <div>
                  <div style={styles.contactLabel}>Horaires support</div>
                  <div style={styles.contactValue}>Lundi – Samedi : 7h00 – 20h00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BARRE DE FOND ── */}
      <div style={styles.bottomBar}>
        <div style={styles.bottomInner} className="footer-bottom-inner">
          <p style={styles.copyright}>
            © {currentYear} <strong style={styles.brandName}>CarEasy</strong> — Tous droits réservés
          </p>
          <div style={styles.bottomLinks}>
            <a href="#" style={styles.bottomLink}>Confidentialité</a>
            <span style={styles.dot}>·</span>
            <a href="#" style={styles.bottomLink}>CGU</a>
            <span style={styles.dot}>·</span>
            <a href="#" style={styles.bottomLink}>Cookies</a>
            <span style={styles.dot}>·</span>
            <Link to="/faq" style={styles.bottomLink}>Aide</Link>
            <span style={styles.dot}>·</span>
            <a href="#" style={styles.bottomLink}>Mentions légales</a>
          </div>
        </div>
      </div>

      <style>{`
        .footer-nav-link:hover { color: #ef4444 !important; padding-left: 4px !important; }
        .footer-social-btn:hover { transform: translateY(-3px) scale(1.1) !important; }
        
        /* Grille responsive */
        .footer-grid {
          grid-template-columns: 2fr 1.2fr 1.5fr 1.8fr;
        }
        @media (max-width: 1024px) {
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 2.5rem; }
        }
        @media (max-width: 600px) {
          .footer-grid { grid-template-columns: 1fr; gap: 2rem; }
          .footer-bottom-inner { flex-direction: column !important; align-items: center !important; text-align: center; gap: 0.75rem; }
        }
      `}</style>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: '#0f172a',
    color: '#cbd5e1',
    fontFamily: 'system-ui, sans-serif',
    marginTop: '4rem',
  },

  /* ── Newsletter ── */
  newsletter: {
    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    padding: '2.5rem 1.5rem',
  },
  newsletterInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  newsletterLeft: {
    flex: 1,
    minWidth: '280px',
  },
  newsletterBadge: {
    display: 'inline-block',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '0.25rem 0.875rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
  },
  newsletterTitle: {
    fontSize: '1.35rem',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 0.5rem',
    lineHeight: '1.3',
  },
  newsletterSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.9rem',
    margin: 0,
    lineHeight: '1.5',
  },
  newsletterRight: {
    flex: 1,
    minWidth: '280px',
  },
  newsletterForm: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  newsletterInput: {
    flex: 1,
    padding: '0.875rem 1.25rem',
    borderRadius: '0.625rem',
    border: '2px solid rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    backdropFilter: 'blur(8px)',
  },
  newsletterBtn: {
    padding: '0.875rem 1.75rem',
    backgroundColor: '#fff',
    color: '#ef4444',
    border: 'none',
    borderRadius: '0.625rem',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  newsletterDisclaimer: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: '0.78rem',
    margin: 0,
  },

  /* ── Main body ── */
  mainBody: {
    padding: '4rem 1.5rem 3rem',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  mainGrid: {
    display: 'grid',
    gap: '3rem',
  },

  /* Brand col */
  brandCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  brandDesc: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    lineHeight: '1.7',
    marginTop: '0.25rem',
  },
  badges: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#fca5a5',
    padding: '0.3rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.78rem',
    fontWeight: '600',
    width: 'fit-content',
  },
  socialTitle: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginTop: '0.5rem',
  },
  socialRow: {
    display: 'flex',
    gap: '0.625rem',
    flexWrap: 'wrap',
  },
  socialBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '0.625rem',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#cbd5e1',
    textDecoration: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'all 0.25s',
    flexShrink: 0,
  },

  /* Columns */
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  colTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#f8fafc',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.75rem',
  },
  colTitleDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    flexShrink: 0,
  },
  navList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  navLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    transition: 'all 0.2s',
    display: 'block',
    padding: '0.125rem 0',
  },
  navLinkMore: {
    color: '#ef4444',
    textDecoration: 'none',
    fontSize: '0.8rem',
    fontWeight: '700',
    marginTop: '0.25rem',
    display: 'block',
    transition: 'all 0.2s',
  },

  /* Contact card */
  contactCard: {
    marginTop: '1.75rem',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '1rem',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
  },
  contactCardHeader: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#ef4444',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.25rem',
  },
  contactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'opacity 0.2s',
  },
  contactIcon: {
    fontSize: '1.25rem',
    width: '34px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: '0.5rem',
    flexShrink: 0,
  },
  contactLabel: {
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  contactValue: {
    fontSize: '0.85rem',
    color: '#e2e8f0',
    fontWeight: '600',
    marginTop: '0.125rem',
  },

  /* ── Stats stripe ── */
  statsStripe: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderTop: '1px solid rgba(239,68,68,0.15)',
    borderBottom: '1px solid rgba(239,68,68,0.15)',
    padding: '1.75rem 1.5rem',
  },
  statsInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  statNum: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#ef4444',
    lineHeight: '1',
  },
  statLbl: {
    fontSize: '0.75rem',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: '600',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  /* ── Bottom bar ── */
  bottomBar: {
    padding: '1.5rem',
    backgroundColor: '#060d1c',
  },
  bottomInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  copyright: {
    color: '#475569',
    fontSize: '0.85rem',
    margin: 0,
  },
  brandName: {
    color: '#ef4444',
  },
  bottomLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    flexWrap: 'wrap',
  },
  bottomLink: {
    color: '#475569',
    textDecoration: 'none',
    fontSize: '0.8rem',
    transition: 'color 0.2s',
  },
  dot: {
    color: '#334155',
    fontSize: '0.8rem',
  },
};