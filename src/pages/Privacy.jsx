// src/pages/Privacy.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

export default function Privacy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = '12 avril 2026';

  const sections = [
    {
      id: 'collecte',
      icon: '📋',
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
      icon: '🎯',
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
      icon: '🤝',
      title: '3. Partage des données',
      text: 'CarEasy ne vend jamais vos données personnelles. Vos données peuvent être partagées uniquement dans les cas suivants :',
      simple: [
        'Avec les prestataires : votre nom et contact sont partagés uniquement lorsque vous initiez une demande de rendez-vous.',
        'Avec nos sous-traitants techniques : hébergement (Alwaysdata), base de données (Neon), notifications push (Firebase) — uniquement pour faire fonctionner le service.',
        'En cas d\'obligation légale : si requis par une autorité judiciaire compétente.',
      ],
    },
    {
      id: 'conservation',
      icon: '🗓️',
      title: '4. Conservation des données',
      simple: [
        'Compte actif : données conservées tant que votre compte est actif.',
        'Après suppression du compte : données anonymisées sous 30 jours.',
        'Logs techniques : supprimés automatiquement après 90 jours.',
        'Messages : conservés 2 ans après la dernière interaction.',
      ],
    },
    {
      id: 'droits',
      icon: '⚖️',
      title: '5. Vos droits',
      text: 'Conformément au RGPD et aux lois applicables au Bénin, vous disposez des droits suivants :',
      rights: [
        { label: 'Accès', desc: 'Obtenir une copie de vos données personnelles.' },
        { label: 'Rectification', desc: 'Corriger des données inexactes ou incomplètes.' },
        { label: 'Suppression', desc: 'Demander la suppression de votre compte et données.' },
        { label: 'Portabilité', desc: 'Recevoir vos données dans un format structuré.' },
        { label: 'Opposition', desc: 'Vous opposer au traitement pour des raisons légitimes.' },
        { label: 'Limitation', desc: 'Demander la limitation du traitement de vos données.' },
      ],
    },
    {
      id: 'cookies',
      icon: '🍪',
      title: '6. Cookies',
      simple: [
        'Cookies essentiels : nécessaires au fonctionnement (session, authentification). Pas de consentement requis.',
        'Cookies analytiques : mesure d\'audience anonyme pour améliorer l\'expérience. Désactivables.',
        'Aucun cookie publicitaire ou de tracking tiers n\'est utilisé sur CarEasy.',
      ],
    },
    {
      id: 'securite',
      icon: '🔒',
      title: '7. Sécurité',
      simple: [
        'Transmission des données chiffrée via HTTPS (TLS 1.3)',
        'Mots de passe hachés avec bcrypt (12 rounds)',
        'Tokens d\'authentification sécurisés (Laravel Sanctum)',
        'Accès aux données restreint au personnel autorisé uniquement',
        'Sauvegardes régulières et chiffrées',
      ],
    },
    {
      id: 'contact',
      icon: '✉️',
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
            <div style={s.heroIcon}>🔒</div>
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
            <div style={s.summaryGrid}>
              {[
                { icon: '🚫', label: 'Jamais vendu', desc: 'Nous ne vendons pas vos données à des tiers.' },
                { icon: '🎯', label: 'Usage limité', desc: 'Vos données servent uniquement à faire fonctionner CarEasy.' },
                { icon: '🗑️', label: 'Supprimable', desc: 'Supprimez votre compte et données à tout moment.' },
                { icon: '🔐', label: 'Sécurisé', desc: 'Chiffrement HTTPS et mots de passe hashés.' },
              ].map((item) => (
                <div key={item.label} style={s.summaryCard}>
                  <div style={s.summaryCardIcon}>{item.icon}</div>
                  <div style={s.summaryCardLabel}>{item.label}</div>
                  <div style={s.summaryCardDesc}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div style={s.main}>
          <div style={s.layout}>
            {/* Navigation latérale */}
            <nav style={s.sidebar}>
              <div style={s.sidebarSticky}>
                <div style={s.sidebarTitle}>Sommaire</div>
                {sections.map((sec) => (
                  <a key={sec.id} href={`#${sec.id}`} style={s.sidebarLink}>
                    <span style={s.sidebarLinkIcon}>{sec.icon}</span>
                    <span>{sec.title.replace(/^\d+\.\s/, '')}</span>
                  </a>
                ))}
              </div>
            </nav>

            {/* Sections */}
            <div style={s.content}>
              {sections.map((sec) => (
                <section key={sec.id} id={sec.id} style={s.section}>
                  <div style={s.sectionHeader}>
                    <span style={s.sectionIcon}>{sec.icon}</span>
                    <h2 style={s.sectionTitle}>{sec.title}</h2>
                  </div>

                  {/* Sous-sections avec listes */}
                  {sec.content && sec.content.map((sub) => (
                    <div key={sub.subtitle} style={s.subsection}>
                      <h3 style={s.subsectionTitle}>{sub.subtitle}</h3>
                      <ul style={s.list}>
                        {sub.items.map((item) => (
                          <li key={item} style={s.listItem}>
                            <span style={s.bullet}>▸</span>{item}
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
                          <span style={s.bullet}>▸</span>
                          <span dangerouslySetInnerHTML={{ __html: item.includes(':') ? `<strong>${item.split(':')[0]}</strong> :${item.split(':').slice(1).join(':')}` : item }} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Droits */}
                  {sec.rights && (
                    <div style={s.rightsGrid}>
                      {sec.rights.map((r) => (
                        <div key={r.label} style={s.rightCard}>
                          <div style={s.rightCardLabel}>{r.label}</div>
                          <div style={s.rightCardDesc}>{r.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Contact */}
                  {sec.isContact && (
                    <div style={s.contactBox}>
                      <p style={s.text}>
                        Pour exercer vos droits ou pour toute question relative à vos données personnelles, contactez notre délégué à la protection des données :
                      </p>
                      <div style={s.contactGrid}>
                        <a href="mailto:careasy26@gmail.com" style={s.contactCard}>
                          <span style={s.contactIcon}>📧</span>
                          <div>
                            <div style={s.contactCardLabel}>E-mail</div>
                            <div style={s.contactCardValue}>careasy26@gmail.com</div>
                          </div>
                        </a>
                        <div style={s.contactCard}>
                          <span style={s.contactIcon}>📍</span>
                          <div>
                            <div style={s.contactCardLabel}>Adresse</div>
                            <div style={s.contactCardValue}>Cotonou, Bénin</div>
                          </div>
                        </div>
                        <div style={s.contactCard}>
                          <span style={s.contactIcon}>⏱️</span>
                          <div>
                            <div style={s.contactCardLabel}>Délai de réponse</div>
                            <div style={s.contactCardValue}>Sous 30 jours maximum</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              ))}

              {/* Footer de page */}
              <div style={s.pageFooter}>
                <p style={s.pageFooterText}>
                  Cette politique peut être mise à jour. Vous serez informé par e-mail en cas de modification substantielle.
                </p>
                <div style={s.pageFooterLinks}>
                  <Link to="/terms" style={s.footerLink}>Conditions d'utilisation</Link>
                  <span style={s.footerDot}>·</span>
                  <Link to="/" style={s.footerLink}>Retour à l'accueil</Link>
                  <span style={s.footerDot}>·</span>
                  <a href="mailto:careasy26@gmail.com" style={s.footerLink}>Nous contacter</a>
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
  page: { backgroundColor: '#f8fafc', minHeight: '100vh' },

  // Hero
  hero: { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #dc2626 100%)', padding: '5rem 1.5rem 4rem', textAlign: 'center' },
  heroInner: { maxWidth: '700px', margin: '0 auto' },
  heroIcon: { fontSize: '3.5rem', marginBottom: '1rem' },
  heroTitle: { fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '800', color: '#fff', margin: '0 0 1rem' },
  heroSubtitle: { fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', margin: '0 0 1.5rem' },
  heroBadge: { display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '6px 16px', borderRadius: '999px', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' },

  // Résumé
  summarySection: { backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '3rem 1.5rem' },
  summaryInner: { maxWidth: '1100px', margin: '0 auto' },
  summaryTitle: { textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '2rem' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' },
  summaryCard: { textAlign: 'center', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' },
  summaryCardIcon: { fontSize: '2rem', marginBottom: '0.5rem' },
  summaryCardLabel: { fontWeight: '700', color: '#0f172a', fontSize: '1rem', marginBottom: '0.4rem' },
  summaryCardDesc: { color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5' },

  // Layout principal
  main: { maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' },
  layout: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '3rem', alignItems: 'start' },

  // Sidebar
  sidebar: { display: 'block' },
  sidebarSticky: { position: 'sticky', top: '80px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' },
  sidebarTitle: { fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' },
  sidebarLink: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', color: '#475569', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '500', marginBottom: '2px', transition: 'all 0.2s' },
  sidebarLinkIcon: { fontSize: '0.9rem', flexShrink: 0 },

  // Sections
  content: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  section: { backgroundColor: '#fff', borderRadius: '20px', padding: '2rem 2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #fee2e2' },
  sectionIcon: { fontSize: '1.5rem' },
  sectionTitle: { fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', margin: 0 },

  // Sous-sections
  subsection: { marginBottom: '1.5rem' },
  subsectionTitle: { fontSize: '1rem', fontWeight: '700', color: '#dc2626', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' },

  // Texte et listes
  text: { color: '#475569', lineHeight: '1.8', marginBottom: '1rem', fontSize: '0.95rem' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  listItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#475569', fontSize: '0.92rem', lineHeight: '1.6' },
  bullet: { color: '#dc2626', flexShrink: 0, marginTop: '3px', fontWeight: '700' },

  // Droits
  rightsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' },
  rightCard: { padding: '1rem 1.25rem', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' },
  rightCardLabel: { fontWeight: '700', color: '#dc2626', fontSize: '0.95rem', marginBottom: '0.3rem' },
  rightCardDesc: { color: '#64748b', fontSize: '0.82rem', lineHeight: '1.5' },

  // Contact
  contactBox: {},
  contactGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' },
  contactCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem 1.25rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: 'inherit' },
  contactIcon: { fontSize: '1.5rem', flexShrink: 0 },
  contactCardLabel: { fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
  contactCardValue: { fontSize: '0.9rem', color: '#0f172a', fontWeight: '600', marginTop: '2px' },

  // Footer de page
  pageFooter: { backgroundColor: '#fff', borderRadius: '20px', padding: '2rem 2.5rem', border: '1px solid #e2e8f0', textAlign: 'center' },
  pageFooterText: { color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' },
  pageFooterLinks: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  footerLink: { color: '#dc2626', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' },
  footerDot: { color: '#cbd5e1' },
};