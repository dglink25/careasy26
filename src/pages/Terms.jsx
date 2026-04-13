// src/pages/Terms.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { 
  FileText, 
  Target, 
  UserPlus, 
  Wrench, 
  CheckCircle, 
  CreditCard, 
  AlertTriangle, 
  Copyright, 
  LogOut, 
  Gavel, 
  Mail,
  Home,
  Shield
} from 'lucide-react';

export default function Terms() {
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
      id: 'objet',
      icon: Target,
      title: '1. Objet',
      text: 'CarEasy est une plateforme de mise en relation entre propriétaires de véhicules et prestataires de services automobiles au Bénin. Les présentes CGU régissent l\'utilisation de la plateforme accessible sur careasy26.alwaysdata.net et sur l\'application mobile CarEasy.',
    },
    {
      id: 'inscription',
      icon: UserPlus,
      title: '2. Inscription et compte',
      items: [
        'L\'inscription est gratuite pour les utilisateurs particuliers.',
        'Vous devez avoir au moins 18 ans pour créer un compte.',
        'Vous êtes responsable de la confidentialité de vos identifiants.',
        'Un seul compte par personne est autorisé.',
        'CarEasy se réserve le droit de suspendre tout compte frauduleux.',
      ],
    },
    {
      id: 'prestataires',
      icon: Wrench,
      title: '3. Prestataires',
      items: [
        'Les prestataires doivent fournir des informations exactes sur leur entreprise et services.',
        'Les prestataires sont seuls responsables de la qualité de leurs prestations.',
        'CarEasy ne garantit pas les prestations des prestataires inscrits.',
        'Tout prestataire peut être retiré de la plateforme en cas de manquement.',
        'Les abonnements prestataires sont soumis à des conditions tarifaires spécifiques.',
      ],
    },
    {
      id: 'utilisation',
      icon: CheckCircle,
      title: '4. Utilisation acceptable',
      items: [
        'Utiliser CarEasy uniquement à des fins légales et légitimes.',
        'Ne pas publier de contenu faux, trompeur ou diffamatoire.',
        'Ne pas tenter d\'accéder aux systèmes ou données d\'autres utilisateurs.',
        'Ne pas utiliser de robots ou scripts automatisés sans autorisation.',
        'Respecter les autres utilisateurs et prestataires de la plateforme.',
      ],
    },
    {
      id: 'paiements',
      icon: CreditCard,
      title: '5. Paiements et abonnements',
      items: [
        'Les paiements sont traités par FedaPay, un prestataire de paiement sécurisé.',
        'Les abonnements prestataires sont renouvelables selon la formule choisie.',
        'Aucun remboursement n\'est accordé après activation d\'un abonnement sauf cas exceptionnel.',
        'CarEasy se réserve le droit de modifier ses tarifs avec un préavis de 30 jours.',
      ],
    },
    {
      id: 'responsabilite',
      icon: AlertTriangle,
      title: '6. Limitation de responsabilité',
      items: [
        'CarEasy agit en tant qu\'intermédiaire et n\'est pas partie aux contrats entre utilisateurs et prestataires.',
        'CarEasy ne peut être tenu responsable des dommages résultant d\'une prestation de service.',
        'En cas d\'indisponibilité du service, CarEasy s\'engage à rétablir l\'accès dans les meilleurs délais.',
        'La responsabilité de CarEasy est limitée au montant des abonnements payés dans les 12 derniers mois.',
      ],
    },
    {
      id: 'propriete',
      icon: Copyright,
      title: '7. Propriété intellectuelle',
      text: 'L\'ensemble du contenu de CarEasy (logo, design, code, textes) est protégé par le droit d\'auteur. Toute reproduction sans autorisation écrite est interdite. Les avis et contenus publiés par les utilisateurs restent leur propriété, mais ils accordent à CarEasy une licence d\'utilisation non exclusive.',
    },
    {
      id: 'resiliation',
      icon: LogOut,
      title: '8. Résiliation',
      items: [
        'Vous pouvez supprimer votre compte à tout moment depuis les paramètres.',
        'CarEasy peut résilier votre compte en cas de violation des présentes CGU.',
        'En cas de résiliation, vos données seront supprimées conformément à notre politique de confidentialité.',
      ],
    },
    {
      id: 'droit',
      icon: Gavel,
      title: '9. Droit applicable',
      text: 'Les présentes CGU sont régies par le droit béninois. En cas de litige, les parties s\'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut d\'accord, les tribunaux compétents de Cotonou (Bénin) seront saisis.',
    },
  ];

  return (
    <>
      <SEOHead
        title="Conditions d'utilisation — CarEasy"
        description="Conditions générales d'utilisation de la plateforme CarEasy."
        canonical="/terms"
      />

      <div style={s.page}>
        {/* Hero */}
        <div style={s.hero}>
          <div style={s.heroInner}>
            <div style={s.heroIcon}>
              <FileText size={64} strokeWidth={1.5} />
            </div>
            <h1 style={s.heroTitle}>Conditions d'utilisation</h1>
            <p style={s.heroSubtitle}>
              En utilisant CarEasy, vous acceptez les présentes conditions. Merci de les lire attentivement.
            </p>
            <div style={s.heroBadge}>Dernière mise à jour : {lastUpdated}</div>
          </div>
        </div>

        {/* Résumé rapide */}
        <div style={s.summarySection}>
          <div style={s.summaryInner}>
            <h2 style={s.summaryTitle}>Points clés à retenir</h2>
            <div className="summary-grid-terms" style={s.summaryGrid}>
              {[
                { icon: Shield, label: 'Plateforme sécurisée', desc: 'Vos données sont protégées et sécurisées.' },
                { icon: CheckCircle, label: 'Service fiable', desc: 'Mise en relation transparente et efficace.' },
                { icon: Gavel, label: 'Cadre légal', desc: 'Conformité avec les lois béninoises.' },
                { icon: Mail, label: 'Support réactif', desc: 'Assistance disponible pour vous aider.' },
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
          <div className="terms-layout" style={s.layout}>
            {/* Navigation latérale */}
            <nav className="terms-sidebar" style={s.sidebar}>
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
                <a href="#contact" style={s.sidebarLink}>
                  <span style={s.sidebarLinkIcon}>
                    <Mail size={18} strokeWidth={1.5} />
                  </span>
                  <span>Contact</span>
                </a>
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
                    {sec.text && <p style={s.text}>{sec.text}</p>}
                    {sec.items && (
                      <ul style={s.list}>
                        {sec.items.map((item) => (
                          <li key={item} style={s.listItem}>
                            <span style={s.bullet}>✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}

              {/* Contact */}
              <section id="contact" style={s.section}>
                <div style={s.sectionHeader}>
                  <span style={s.sectionIcon}>
                    <Mail size={28} strokeWidth={1.5} />
                  </span>
                  <h2 style={s.sectionTitle}>10. Contact</h2>
                </div>
                <p style={s.text}>Pour toute question concernant ces conditions :</p>
                <div style={s.contactBox}>
                  <a href="mailto:careasy26@gmail.com" style={s.contactBtn}>
                    <Mail size={20} strokeWidth={1.5} />
                    <span>careasy26@gmail.com</span>
                  </a>
                  <div style={s.contactInfo}>
                    <p style={s.contactText}>Notre équipe s'engage à vous répondre dans les plus brefs délais.</p>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <div style={s.pageFooter}>
                <div style={s.pageFooterLinks}>
                  <Link to="/privacy" style={s.footerLink}>
                    <Shield size={18} strokeWidth={1.5} />
                    <span>Politique de confidentialité</span>
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
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1d4ed8 100%)', 
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
    backgroundColor: '#1d4ed8',
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
    marginBottom: '28px', 
    paddingBottom: '20px', 
    borderBottom: '2px solid #dbeafe' 
  },
  sectionIcon: { 
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '52px',
    height: '52px',
    backgroundColor: '#1d4ed8',
    borderRadius: '14px',
    color: '#fff'
  },
  sectionTitle: { 
    fontSize: 'clamp(22px, 4vw, 28px)', 
    fontWeight: '700', 
    color: '#0f172a', 
    margin: 0 
  },

  // Texte et listes
  text: { 
    color: '#334155', 
    lineHeight: '1.7', 
    marginBottom: 0, 
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
    color: '#10b981', 
    flexShrink: 0, 
    marginTop: '2px',
    fontWeight: '700',
    fontSize: '18px'
  },

  // Contact
  contactBox: {
    marginTop: '20px'
  },
  contactBtn: { 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: '10px', 
    backgroundColor: '#eff6ff', 
    color: '#1d4ed8', 
    padding: '14px 28px', 
    borderRadius: '12px', 
    textDecoration: 'none', 
    fontWeight: '600', 
    fontSize: '16px', 
    border: '1px solid #bfdbfe',
    transition: 'all 0.2s',
    marginBottom: '20px'
  },
  contactInfo: {
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  contactText: {
    color: '#64748b',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: 0
  },

  // Footer de page
  pageFooter: { 
    backgroundColor: '#fff', 
    borderRadius: '24px', 
    padding: '32px', 
    border: '1px solid #e2e8f0', 
    textAlign: 'center' 
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
    .terms-layout {
      grid-template-columns: 1fr !important;
      gap: 32px !important;
    }
    
    .terms-sidebar {
      display: none !important;
    }
    
    .summary-grid-terms {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
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
    
    .pageFooter {
      padding: 28px !important;
    }
    
    .pageFooterLinks {
      gap: 12px !important;
    }
    
    .summary-grid-terms {
      gap: 20px !important;
    }
    
    .contactBtn {
      width: 100%;
      justify-content: center;
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
    
    .listItem {
      font-size: 15px !important;
    }
    
    .text {
      font-size: 15px !important;
    }
    
    .contactBtn {
      padding: 12px 20px !important;
      font-size: 15px !important;
    }
  }
  
  /* Animations au hover */
  .summary-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
  }
  
  .terms-sidebar a:hover {
    background-color: #f1f5f9;
    color: #1d4ed8;
  }
  
  .contact-btn:hover {
    background-color: #e0e7ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
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