// src/pages/Terms.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

export default function Terms() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = '12 avril 2026';

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
            <div style={s.heroIcon}>📄</div>
            <h1 style={s.heroTitle}>Conditions d'utilisation</h1>
            <p style={s.heroSubtitle}>
              En utilisant CarEasy, vous acceptez les présentes conditions. Merci de les lire attentivement.
            </p>
            <div style={s.heroBadge}>Dernière mise à jour : {lastUpdated}</div>
          </div>
        </div>

        <div style={s.main}>
          <div style={s.content}>

            {[
              {
                id: 'objet', icon: '🎯', title: '1. Objet',
                text: 'CarEasy est une plateforme de mise en relation entre propriétaires de véhicules et prestataires de services automobiles au Bénin. Les présentes CGU régissent l\'utilisation de la plateforme accessible sur careasy26.alwaysdata.net et sur l\'application mobile CarEasy.',
              },
              {
                id: 'inscription', icon: '👤', title: '2. Inscription et compte',
                items: [
                  'L\'inscription est gratuite pour les utilisateurs particuliers.',
                  'Vous devez avoir au moins 18 ans pour créer un compte.',
                  'Vous êtes responsable de la confidentialité de vos identifiants.',
                  'Un seul compte par personne est autorisé.',
                  'CarEasy se réserve le droit de suspendre tout compte frauduleux.',
                ],
              },
              {
                id: 'prestataires', icon: '🔧', title: '3. Prestataires',
                items: [
                  'Les prestataires doivent fournir des informations exactes sur leur entreprise et services.',
                  'Les prestataires sont seuls responsables de la qualité de leurs prestations.',
                  'CarEasy ne garantit pas les prestations des prestataires inscrits.',
                  'Tout prestataire peut être retiré de la plateforme en cas de manquement.',
                  'Les abonnements prestataires sont soumis à des conditions tarifaires spécifiques.',
                ],
              },
              {
                id: 'utilisation', icon: '✅', title: '4. Utilisation acceptable',
                items: [
                  'Utiliser CarEasy uniquement à des fins légales et légitimes.',
                  'Ne pas publier de contenu faux, trompeur ou diffamatoire.',
                  'Ne pas tenter d\'accéder aux systèmes ou données d\'autres utilisateurs.',
                  'Ne pas utiliser de robots ou scripts automatisés sans autorisation.',
                  'Respecter les autres utilisateurs et prestataires de la plateforme.',
                ],
              },
              {
                id: 'paiements', icon: '💳', title: '5. Paiements et abonnements',
                items: [
                  'Les paiements sont traités par FedaPay, un prestataire de paiement sécurisé.',
                  'Les abonnements prestataires sont renouvelables selon la formule choisie.',
                  'Aucun remboursement n\'est accordé après activation d\'un abonnement sauf cas exceptionnel.',
                  'CarEasy se réserve le droit de modifier ses tarifs avec un préavis de 30 jours.',
                ],
              },
              {
                id: 'responsabilite', icon: '⚠️', title: '6. Limitation de responsabilité',
                items: [
                  'CarEasy agit en tant qu\'intermédiaire et n\'est pas partie aux contrats entre utilisateurs et prestataires.',
                  'CarEasy ne peut être tenu responsable des dommages résultant d\'une prestation de service.',
                  'En cas d\'indisponibilité du service, CarEasy s\'engage à rétablir l\'accès dans les meilleurs délais.',
                  'La responsabilité de CarEasy est limitée au montant des abonnements payés dans les 12 derniers mois.',
                ],
              },
              {
                id: 'propriete', icon: '©️', title: '7. Propriété intellectuelle',
                text: 'L\'ensemble du contenu de CarEasy (logo, design, code, textes) est protégé par le droit d\'auteur. Toute reproduction sans autorisation écrite est interdite. Les avis et contenus publiés par les utilisateurs restent leur propriété, mais ils accordent à CarEasy une licence d\'utilisation non exclusive.',
              },
              {
                id: 'resiliation', icon: '🚪', title: '8. Résiliation',
                items: [
                  'Vous pouvez supprimer votre compte à tout moment depuis les paramètres.',
                  'CarEasy peut résilier votre compte en cas de violation des présentes CGU.',
                  'En cas de résiliation, vos données seront supprimées conformément à notre politique de confidentialité.',
                ],
              },
              {
                id: 'droit', icon: '🏛️', title: '9. Droit applicable',
                text: 'Les présentes CGU sont régies par le droit béninois. En cas de litige, les parties s\'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut d\'accord, les tribunaux compétents de Cotonou (Bénin) seront saisis.',
              },
            ].map((sec) => (
              <section key={sec.id} id={sec.id} style={s.section}>
                <div style={s.sectionHeader}>
                  <span style={s.sectionIcon}>{sec.icon}</span>
                  <h2 style={s.sectionTitle}>{sec.title}</h2>
                </div>
                {sec.text && <p style={s.text}>{sec.text}</p>}
                {sec.items && (
                  <ul style={s.list}>
                    {sec.items.map((item) => (
                      <li key={item} style={s.listItem}>
                        <span style={s.bullet}>▸</span>{item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {/* Contact */}
            <section style={s.section}>
              <div style={s.sectionHeader}>
                <span style={s.sectionIcon}>✉️</span>
                <h2 style={s.sectionTitle}>10. Contact</h2>
              </div>
              <p style={s.text}>Pour toute question concernant ces conditions :</p>
              <a href="mailto:careasy26@gmail.com" style={s.contactBtn}>
                📧 careasy26@gmail.com
              </a>
            </section>

            {/* Footer */}
            <div style={s.pageFooter}>
              <div style={s.pageFooterLinks}>
                <Link to="/privacy" style={s.footerLink}>Politique de confidentialité</Link>
                <span style={s.footerDot}>·</span>
                <Link to="/" style={s.footerLink}>Retour à l'accueil</Link>
                <span style={s.footerDot}>·</span>
                <a href="mailto:careasy26@gmail.com" style={s.footerLink}>Nous contacter</a>
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
  hero: { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1d4ed8 100%)', padding: '5rem 1.5rem 4rem', textAlign: 'center' },
  heroInner: { maxWidth: '700px', margin: '0 auto' },
  heroIcon: { fontSize: '3.5rem', marginBottom: '1rem' },
  heroTitle: { fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '800', color: '#fff', margin: '0 0 1rem' },
  heroSubtitle: { fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', margin: '0 0 1.5rem' },
  heroBadge: { display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '6px 16px', borderRadius: '999px', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.2)' },
  main: { maxWidth: '820px', margin: '0 auto', padding: '3rem 1.5rem' },
  content: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  section: { backgroundColor: '#fff', borderRadius: '20px', padding: '2rem 2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem', paddingBottom: '0.875rem', borderBottom: '2px solid #dbeafe' },
  sectionIcon: { fontSize: '1.4rem' },
  sectionTitle: { fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', margin: 0 },
  text: { color: '#475569', lineHeight: '1.8', fontSize: '0.95rem', margin: 0 },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  listItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#475569', fontSize: '0.92rem', lineHeight: '1.6' },
  bullet: { color: '#1d4ed8', flexShrink: 0, marginTop: '3px', fontWeight: '700' },
  contactBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '0.95rem', border: '1px solid #bfdbfe', marginTop: '0.5rem' },
  pageFooter: { backgroundColor: '#fff', borderRadius: '20px', padding: '1.5rem 2rem', border: '1px solid #e2e8f0', textAlign: 'center' },
  pageFooterLinks: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  footerLink: { color: '#dc2626', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' },
  footerDot: { color: '#cbd5e1' },
};