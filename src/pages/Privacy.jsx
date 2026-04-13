// src/pages/Privacy.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { 
  Shield, 
  Database, 
  Target, 
  Handshake, 
  Calendar, 
  Scale, 
  Cookie, 
  Lock, 
  Mail, 
  FileText,
  Eye,
  Edit,
  Trash2,
  Download,
  XCircle,
  Clock,
  MapPin,
  ChevronRight,
  Home
} from 'lucide-react';

export default function Privacy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Ajout du style responsive au chargement
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = responsiveStyles;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const lastUpdated = '12 avril 2026';

  const sections = [
    {
      id: 'collecte',
      icon: Database,
      title: '1. Données collectées',
      content: [
        {
          subtitle: 'Lors de l\'inscription',
          items: [
            'Nom et prénom',
            'Adresse e-mail',
            'Numéro de téléphone (optionnel)',
            'Photo de profil (optionnel)',
          ],
        },
        {
          subtitle: 'Via Google Sign-In',
          items: [
            'Nom affiché sur votre compte Google',
            'Adresse e-mail Google',
            'Photo de profil Google (si disponible)',
          ],
        },
        {
          subtitle: 'Données d\'utilisation',
          items: [
            'Historique des rendez-vous',
            'Messages échangés avec les prestataires',
            'Services consultés et favoris',
            'Adresse IP et type d\'appareil (logs techniques)',
          ],
        },
      ],
    },
    {
      id: 'utilisation',
      icon: Target,
      title: '2. Utilisation des données',
      simple: [
        'Créer et gérer votre compte utilisateur',
        'Faciliter la mise en relation avec les prestataires automobiles',
        'Envoyer des confirmations et rappels de rendez-vous',
        'Améliorer nos services et l\'expérience utilisateur',
        'Envoyer des notifications importantes liées à votre compte',
        'Assurer la sécurité et prévenir les fraudes',
      ],
    },
    {
      id: 'partage',
      icon: Handshake,
      title: '3. Partage des données',
      text: 'CarEasy ne vend jamais vos données personnelles. Vos données peuvent être partagées uniquement dans les cas suivants :',
      simple: [
        '<strong>Avec les prestataires</strong> : votre nom et contact sont partagés uniquement lorsque vous initiez une demande de rendez-vous.',
        '<strong>Avec nos sous-traitants techniques</strong> : hébergement (Alwaysdata), base de données (Neon), notifications push (Firebase) — uniquement pour faire fonctionner le service.',
        '<strong>En cas d\'obligation légale</strong> : si requis par une autorité judiciaire compétente.',
      ],
    },
    {
      id: 'conservation',
      icon: Calendar,
      title: '4. Conservation des données',
      simple: [
        '<strong>Compte actif</strong> : données conservées tant que votre compte est actif.',
        '<strong>Après suppression du compte</strong> : données anonymisées sous 30 jours.',
        '<strong>Logs techniques</strong> : supprimés automatiquement après 90 jours.',
        '<strong>Messages</strong> : conservés 2 ans après la dernière interaction.',
      ],
    },
    {
      id: 'droits',
      icon: Scale,
      title: '5. Vos droits',
      text: 'Conformément au RGPD et aux lois applicables au Bénin, vous disposez des droits suivants :',
      rights: [
        { icon: Eye, label: 'Accès', desc: 'Obtenir une copie de vos données personnelles.' },
        { icon: Edit, label: 'Rectification', desc: 'Corriger des données inexactes ou incomplètes.' },
        { icon: Trash2, label: 'Suppression', desc: 'Demander la suppression de votre compte et données.' },
        { icon: Download, label: 'Portabilité', desc: 'Recevoir vos données dans un format structuré.' },
        { icon: XCircle, label: 'Opposition', desc: 'Vous opposer au traitement pour des raisons légitimes.' },
        { icon: Clock, label: 'Limitation', desc: 'Demander la limitation du traitement de vos données.' },
      ],
    },
    {
      id: 'cookies',
      icon: Cookie,
      title: '6. Cookies',
      simple: [
        '<strong>Cookies essentiels</strong> : nécessaires au fonctionnement (session, authentification). Pas de consentement requis.',
        '<strong>Cookies analytiques</strong> : mesure d\'audience anonyme pour améliorer l\'expérience. Désactivables.',
        '<strong>Aucun cookie publicitaire</strong> ou de tracking tiers n\'est utilisé sur CarEasy.',
      ],
    },
    {
      id: 'securite',
      icon: Lock,
      title: '7. Sécurité',
      simple: [
        '✓ Transmission des données chiffrée via HTTPS (TLS 1.3)',
        '✓ Mots de passe hachés avec bcrypt (12 rounds)',
        '✓ Tokens d\'authentification sécurisés (Laravel Sanctum)',
        '✓ Accès aux données restreint au personnel autorisé uniquement',
        '✓ Sauvegardes régulières et chiffrées',
      ],
    },
    {
      id: 'contact',
      icon: Mail,
      title: '8. Contact & réclamations',
      isContact: true,
    },
  ];

  return (
    <>
      <SEOHead
        title="Politique de confidentialité — CarEasy"
        description="Découvrez comment CarEasy collecte, utilise et protège vos données personnelles."
        canonical="/privacy"
      />

      <div style={s.page}>
        {/* Hero */}
        <div style={s.hero}>
          <div style={s.heroInner}>
            <div style={s.heroIcon}>
              <Shield size={64} strokeWidth={1.5} />
            </div>
            <h1 style={s.heroTitle}>Politique de confidentialité</h1>
            <p style={s.heroSubtitle}>
              CarEasy s'engage à protéger vos données personnelles avec transparence et responsabilité.
            </p>
            <div style={s.heroBadge}>Dernière mise à jour : {lastUpdated}</div>
          </div>
        </div>

        {/* Résumé rapide */}
        <div style={s.summarySection}>
          <div style={s.summaryInner}>
            <h2 style={s.summaryTitle}>En résumé</h2>
            <div className="summary-grid" style={s.summaryGrid}>
              {[
                { icon: Shield, label: 'Jamais vendu', desc: 'Nous ne vendons pas vos données à des tiers.' },
                { icon: Target, label: 'Usage limité', desc: 'Vos données servent uniquement à faire fonctionner CarEasy.' },
                { icon: Trash2, label: 'Supprimable', desc: 'Supprimez votre compte et données à tout moment.' },
                { icon: Lock, label: 'Sécurisé', desc: 'Chiffrement HTTPS et mots de passe hashés.' },
              ].map((item) => (
                <div key={item.label} style={s.summaryCard}>
                  <div style={s.summaryCardIcon}>
                    <item.icon size={36} strokeWidth={1.5} />
                  </div>
                  <div style={s.summaryCardLabel}>{item.label}</div>
                  <div style={s.summaryCardDesc}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div style={s.main}>
          <div className="privacy-layout" style={s.layout}>
            {/* Navigation latérale */}
            <nav className="privacy-sidebar" style={s.sidebar}>
              <div style={s.sidebarSticky}>
                <div style={s.sidebarTitle}>Sommaire</div>
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <a key={sec.id} href={`#${sec.id}`} style={s.sidebarLink}>
                      <span style={s.sidebarLinkIcon}>
                        <Icon size={18} strokeWidth={1.5} />
                      </span>
                      <span>{sec.title.replace(/^\d+\.\s/, '')}</span>
                    </a>
                  );
                })}
              </div>
            </nav>

            {/* Sections */}
            <div style={s.content}>
              {sections.map((sec) => {
                const Icon = sec.icon;
                return (
                  <section key={sec.id} id={sec.id} style={s.section}>
                    <div style={s.sectionHeader}>
                      <span style={s.sectionIcon}>
                        <Icon size={28} strokeWidth={1.5} />
                      </span>
                      <h2 style={s.sectionTitle}>{sec.title}</h2>
                    </div>

                    {/* Sous-sections avec listes */}
                    {sec.content && sec.content.map((sub) => (
                      <div key={sub.subtitle} style={s.subsection}>
                        <h3 style={s.subsectionTitle}>{sub.subtitle}</h3>
                        <ul style={s.list}>
                          {sub.items.map((item) => (
                            <li key={item} style={s.listItem}>
                              <span style={s.bullet}>
                                <ChevronRight size={16} strokeWidth={2} />
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* Texte intro */}
                    {sec.text && <p style={s.text}>{sec.text}</p>}

                    {/* Liste simple */}
                    {sec.simple && (
                      <ul style={s.list}>
                        {sec.simple.map((item) => (
                          <li key={item} style={s.listItem}>
                            <span style={s.bullet}>
                              {item.startsWith('✓') ? (
                                <span style={{ color: '#10b981', marginRight: '8px' }}>✓</span>
                              ) : (
                                <ChevronRight size={16} strokeWidth={2} />
                              )}
                            </span>
                            <span dangerouslySetInnerHTML={{ __html: item }} />
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Droits */}
                    {sec.rights && (
                      <div className="rights-grid" style={s.rightsGrid}>
                        {sec.rights.map((r) => {
                          const RightIcon = r.icon;
                          return (
                            <div key={r.label} style={s.rightCard}>
                              <div style={s.rightCardIcon}>
                                <RightIcon size={22} strokeWidth={1.5} />
                              </div>
                              <div>
                                <div style={s.rightCardLabel}>{r.label}</div>
                                <div style={s.rightCardDesc}>{r.desc}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Contact */}
                    {sec.isContact && (
                      <div style={s.contactBox}>
                        <p style={s.text}>
                          Pour exercer vos droits ou pour toute question relative à vos données personnelles, contactez notre délégué à la protection des données :
                        </p>
                        <div className="contact-grid" style={s.contactGrid}>
                          <a href="mailto:careasy26@gmail.com" style={s.contactCard}>
                            <span style={s.contactIcon}>
                              <Mail size={26} strokeWidth={1.5} />
                            </span>
                            <div>
                              <div style={s.contactCardLabel}>E-mail</div>
                              <div style={s.contactCardValue}>careasy26@gmail.com</div>
                            </div>
                          </a>
                          <div style={s.contactCard}>
                            <span style={s.contactIcon}>
                              <MapPin size={26} strokeWidth={1.5} />
                            </span>
                            <div>
                              <div style={s.contactCardLabel}>Adresse</div>
                              <div style={s.contactCardValue}>Cotonou, Bénin</div>
                            </div>
                          </div>
                          <div style={s.contactCard}>
                            <span style={s.contactIcon}>
                              <Clock size={26} strokeWidth={1.5} />
                            </span>
                            <div>
                              <div style={s.contactCardLabel}>Délai de réponse</div>
                              <div style={s.contactCardValue}>Sous 30 jours maximum</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}

              {/* Footer de page */}
              <div style={s.pageFooter}>
                <p style={s.pageFooterText}>
                  Cette politique peut être mise à jour. Vous serez informé par e-mail en cas de modification substantielle.
                </p>
                <div style={s.pageFooterLinks}>
                  <Link to="/terms" style={s.footerLink}>
                    <FileText size={18} strokeWidth={1.5} />
                    <span>Conditions d'utilisation</span>
                  </Link>
                  <span style={s.footerDot}>·</span>
                  <Link to="/" style={s.footerLink}>
                    <Home size={18} strokeWidth={1.5} />
                    <span>Retour à l'accueil</span>
                  </Link>
                  <span style={s.footerDot}>·</span>
                  <a href="mailto:careasy26@gmail.com" style={s.footerLink}>
                    <Mail size={18} strokeWidth={1.5} />
                    <span>Nous contacter</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const s = {
  page: { 
    backgroundColor: '#f8fafc', 
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },

  // Hero
  hero: { 
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #dc2626 100%)', 
    padding: '80px 20px 70px', 
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  heroInner: { maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 2 },
  heroIcon: { 
    marginBottom: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100px',
    height: '100px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '50%',
    color: '#fff'
  },
  heroTitle: { 
    fontSize: 'clamp(32px, 6vw, 52px)', 
    fontWeight: '800', 
    color: '#fff', 
    margin: '0 0 20px',
    letterSpacing: '-0.02em',
    lineHeight: '1.2'
  },
  heroSubtitle: { 
    fontSize: 'clamp(16px, 4vw, 20px)', 
    color: 'rgba(255,255,255,0.9)', 
    lineHeight: '1.6', 
    margin: '0 0 24px',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  heroBadge: { 
    display: 'inline-block', 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    color: 'rgba(255,255,255,0.95)', 
    padding: '8px 20px', 
    borderRadius: '999px', 
    fontSize: '14px', 
    fontWeight: '500',
    border: '1px solid rgba(255,255,255,0.2)', 
    backdropFilter: 'blur(8px)' 
  },

  // Résumé
  summarySection: { 
    backgroundColor: '#fff', 
    borderBottom: '1px solid #e2e8f0', 
    padding: '60px 20px' 
  },
  summaryInner: { 
    maxWidth: '1200px', 
    margin: '0 auto' 
  },
  summaryTitle: { 
    textAlign: 'center', 
    fontSize: 'clamp(24px, 5vw, 32px)', 
    fontWeight: '700', 
    color: '#0f172a', 
    marginBottom: '40px' 
  },
  summaryGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
    gap: '24px' 
  },
  summaryCard: { 
    textAlign: 'center', 
    padding: '28px 20px', 
    borderRadius: '20px', 
    border: '1px solid #e2e8f0', 
    backgroundColor: '#f8fafc',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },
  summaryCardIcon: { 
    marginBottom: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '70px',
    height: '70px',
    backgroundColor: '#dc2626',
    borderRadius: '16px',
    color: '#fff'
  },
  summaryCardLabel: { 
    fontWeight: '700', 
    color: '#0f172a', 
    fontSize: '18px', 
    marginBottom: '8px' 
  },
  summaryCardDesc: { 
    color: '#64748b', 
    fontSize: '15px', 
    lineHeight: '1.5' 
  },

  // Layout principal
  main: { 
    maxWidth: '1200px', 
    margin: '0 auto', 
    padding: '60px 20px' 
  },
  layout: { 
    display: 'grid', 
    gridTemplateColumns: '260px 1fr', 
    gap: '48px', 
    alignItems: 'start' 
  },

  // Sidebar
  sidebar: { 
    display: 'block' 
  },
  sidebarSticky: { 
    position: 'sticky', 
    top: '100px', 
    backgroundColor: '#fff', 
    borderRadius: '20px', 
    border: '1px solid #e2e8f0', 
    padding: '24px', 
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)' 
  },
  sidebarTitle: { 
    fontSize: '12px', 
    fontWeight: '800', 
    color: '#94a3b8', 
    textTransform: 'uppercase', 
    letterSpacing: '0.1em', 
    marginBottom: '16px' 
  },
  sidebarLink: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    padding: '10px 12px', 
    borderRadius: '10px', 
    color: '#475569', 
    textDecoration: 'none', 
    fontSize: '15px', 
    fontWeight: '500', 
    marginBottom: '4px', 
    transition: 'all 0.2s'
  },
  sidebarLinkIcon: { 
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0 
  },

  // Sections
  content: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '32px' 
  },
  section: { 
    backgroundColor: '#fff', 
    borderRadius: '24px', 
    padding: '40px', 
    border: '1px solid #e2e8f0', 
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)' 
  },
  sectionHeader: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    marginBottom: '32px', 
    paddingBottom: '20px', 
    borderBottom: '2px solid #fee2e2' 
  },
  sectionIcon: { 
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '52px',
    height: '52px',
    backgroundColor: '#dc2626',
    borderRadius: '14px',
    color: '#fff'
  },
  sectionTitle: { 
    fontSize: 'clamp(22px, 4vw, 28px)', 
    fontWeight: '700', 
    color: '#0f172a', 
    margin: 0 
  },

  // Sous-sections
  subsection: { 
    marginBottom: '28px' 
  },
  subsectionTitle: { 
    fontSize: '18px', 
    fontWeight: '700', 
    color: '#dc2626', 
    marginBottom: '16px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px' 
  },

  // Texte et listes
  text: { 
    color: '#334155', 
    lineHeight: '1.7', 
    marginBottom: '24px', 
    fontSize: '16px' 
  },
  list: { 
    listStyle: 'none', 
    padding: 0, 
    margin: 0, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '14px' 
  },
  listItem: { 
    display: 'flex', 
    alignItems: 'flex-start', 
    gap: '12px', 
    color: '#334155', 
    fontSize: '16px', 
    lineHeight: '1.6' 
  },
  bullet: { 
    color: '#dc2626', 
    flexShrink: 0, 
    marginTop: '2px',
    display: 'inline-flex',
    minWidth: '20px'
  },

  // Droits
  rightsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
    gap: '20px' 
  },
  rightCard: { 
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '20px', 
    borderRadius: '16px', 
    backgroundColor: '#fef2f2', 
    border: '1px solid #fecaca' 
  },
  rightCardIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#dc2626'
  },
  rightCardLabel: { 
    fontWeight: '700', 
    color: '#dc2626', 
    fontSize: '17px', 
    marginBottom: '6px' 
  },
  rightCardDesc: { 
    color: '#475569', 
    fontSize: '14px', 
    lineHeight: '1.5' 
  },

  // Contact
  contactBox: {},
  contactGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
    gap: '20px', 
    marginTop: '24px' 
  },
  contactCard: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    padding: '20px', 
    borderRadius: '16px', 
    backgroundColor: '#f8fafc', 
    border: '1px solid #e2e8f0', 
    textDecoration: 'none', 
    color: 'inherit',
    transition: 'all 0.2s'
  },
  contactIcon: { 
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#dc2626'
  },
  contactCardLabel: { 
    fontSize: '12px', 
    color: '#94a3b8', 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em',
    marginBottom: '4px'
  },
  contactCardValue: { 
    fontSize: '16px', 
    color: '#0f172a', 
    fontWeight: '600', 
    marginTop: '2px' 
  },

  // Footer de page
  pageFooter: { 
    backgroundColor: '#fff', 
    borderRadius: '24px', 
    padding: '32px', 
    border: '1px solid #e2e8f0', 
    textAlign: 'center' 
  },
  pageFooterText: { 
    color: '#64748b', 
    fontSize: '15px', 
    marginBottom: '20px',
    lineHeight: '1.6'
  },
  pageFooterLinks: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: '16px', 
    flexWrap: 'wrap' 
  },
  footerLink: { 
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#dc2626', 
    textDecoration: 'none', 
    fontSize: '15px', 
    fontWeight: '600',
    transition: 'opacity 0.2s'
  },
  footerDot: { 
    color: '#cbd5e1',
    fontSize: '18px'
  },
};

// Styles responsifs
const responsiveStyles = `
  @media (max-width: 968px) {
    .privacy-layout {
      grid-template-columns: 1fr !important;
      gap: 32px !important;
    }
    
    .privacy-sidebar {
      display: none !important;
    }
    
    .summary-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
    }
    
    .rights-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
    }
    
    .contact-grid {
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important;
    }
  }
  
  @media (max-width: 768px) {
    .section {
      padding: 28px !important;
    }
    
    .sectionHeader {
      flex-direction: column;
      text-align: center;
      gap: 12px !important;
    }
    
    .rightCard {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .contactCard {
      flex-direction: column;
      text-align: center;
    }
    
    .pageFooter {
      padding: 28px !important;
    }
    
    .pageFooterLinks {
      gap: 12px !important;
    }
    
    .summary-grid {
      gap: 20px !important;
    }
  }
  
  @media (max-width: 640px) {
    .hero {
      padding: 50px 16px 40px !important;
    }
    
    .heroIcon {
      width: 80px !important;
      height: 80px !important;
    }
    
    .main {
      padding: 40px 16px !important;
    }
    
    .section {
      padding: 24px !important;
    }
    
    .sectionIcon {
      width: 44px !important;
      height: 44px !important;
    }
    
    .summaryCard {
      padding: 20px !important;
    }
    
    .summaryCardIcon {
      width: 56px !important;
      height: 56px !important;
    }
    
    .rightCard {
      padding: 16px !important;
    }
    
    .contactCard {
      padding: 16px !important;
    }
    
    .listItem {
      font-size: 15px !important;
    }
    
    .text {
      font-size: 15px !important;
    }
  }
  
  /* Animations au hover */
  .summary-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
  }
  
  .privacy-sidebar a:hover {
    background-color: #f1f5f9;
    color: #dc2626;
  }
  
  .contact-card:hover {
    border-color: #dc2626;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  
  .footer-link:hover {
    opacity: 0.8;
  }
  
  /* Smooth scroll */
  html {
    scroll-behavior: smooth;
  }
  
  /* Amélioration de la lisibilité */
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;