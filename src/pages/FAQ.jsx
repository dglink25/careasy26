// src/pages/FAQ.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaSearch, FaCar, FaBuilding, FaTools, FaComments, FaShieldAlt, FaCreditCard, FaQuestionCircle } from 'react-icons/fa';
import { FiArrowRight, FiMail, FiPhone } from 'react-icons/fi';

const faqCategories = [
  {
    id: 'general',
    icon: <FaCar />,
    label: 'Général',
    color: '#ef4444',
    bgColor: '#fee2e2',
    questions: [
      {
        q: "Qu'est-ce que CarEasy ?",
        a: "CarEasy est la plateforme automobile #1 au Bénin. Elle connecte les propriétaires de véhicules avec des prestataires certifiés (garages, carrosseries, auto-écoles, assureurs…). Vous trouvez le bon professionnel en quelques clics, comparez les services et échangez directement."
      },
      {
        q: "CarEasy est-il gratuit pour les utilisateurs ?",
        a: "Oui, l'accès à la plateforme est totalement gratuit pour les particuliers. Vous pouvez parcourir les entreprises, consulter les services, envoyer des messages et obtenir des devis sans payer quoi que ce soit."
      },
      {
        q: "CarEasy est-il disponible dans toute la ville de Cotonou ?",
        a: "CarEasy est disponible partout au Bénin. Notre réseau de prestataires couvre Cotonou, Porto-Novo, Parakou et de nombreuses autres villes. La couverture s'étend continuellement grâce aux nouveaux prestataires qui rejoignent la plateforme chaque semaine."
      },
      {
        q: "Comment CarEasy garantit-il la qualité des prestataires ?",
        a: "Chaque prestataire passe par un processus de validation strict : vérification de l'IFU (identifiant fiscal), du RCCM (registre du commerce) et du certificat d'activité. Seules les entreprises validées par notre équipe administrative apparaissent sur la plateforme."
      }
    ]
  },
  {
    id: 'inscription',
    icon: <FaBuilding />,
    label: 'Inscription & Compte',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    questions: [
      {
        q: "Comment créer un compte sur CarEasy ?",
        a: "Rendez-vous sur la page d'inscription, renseignez votre nom, adresse email et mot de passe. Vous pouvez aussi vous inscrire en un clic via votre compte Google. La création de compte est instantanée et gratuite."
      },
      {
        q: "J'ai oublié mon mot de passe, que faire ?",
        a: "Sur la page de connexion, cliquez sur « Mot de passe oublié ». Saisissez votre adresse email : vous recevrez un lien de réinitialisation valable 60 minutes. Si vous ne recevez rien, vérifiez vos spams ou contactez notre support."
      },
      {
        q: "Puis-je me connecter avec Google ?",
        a: "Oui ! CarEasy supporte l'authentification Google (OAuth 2.0). Cliquez sur le bouton « Se connecter avec Google » sur la page de connexion ou d'inscription. Vos informations sont sécurisées et nous ne stockons jamais votre mot de passe Google."
      },
      {
        q: "Comment modifier mon profil ou mon mot de passe ?",
        a: "Après connexion, cliquez sur votre avatar en haut à droite de la navbar, puis accédez aux « Paramètres ». Vous pourrez y modifier votre nom, email, mot de passe, photo de profil, préférences de notifications et thème d'affichage."
      }
    ]
  },
  {
    id: 'prestataires',
    icon: <FaTools />,
    label: 'Prestataires',
    color: '#10b981',
    bgColor: '#d1fae5',
    questions: [
      {
        q: "Comment inscrire mon entreprise sur CarEasy ?",
        a: "Créez un compte prestataire, puis accédez à « Mes Entreprises » > « Créer une entreprise ». Remplissez les 5 étapes : informations générales, documents légaux (IFU, RCCM, certificat), informations du dirigeant, localisation & médias, puis soumettez pour validation. Notre équipe examine votre dossier sous 24 à 72h."
      },
      {
        q: "Quels documents sont nécessaires pour valider mon entreprise ?",
        a: "Vous devez fournir : (1) le numéro et une copie de votre IFU (Identifiant Fiscal Unique), (2) le numéro et une copie de votre RCCM (Registre du Commerce et du Crédit Mobilier), (3) le numéro et une copie de votre certificat d'activité. Tous les fichiers doivent être au format image (JPG, PNG) et inférieurs à 5 MB."
      },
      {
        q: "Combien de temps prend la validation d'une entreprise ?",
        a: "Notre équipe traite les demandes dans un délai de 24 à 72 heures ouvrées. Vous recevrez une notification dès que votre entreprise sera validée ou si des informations complémentaires sont nécessaires. En cas de rejet, un commentaire explicatif vous sera fourni."
      },
      {
        q: "Puis-je avoir plusieurs entreprises sur mon compte ?",
        a: "Oui, un compte prestataire peut gérer plusieurs entreprises. Chaque entreprise possède son propre profil, ses services, ses médias et ses statistiques. Accédez à toutes vos entreprises depuis le tableau de bord « Mes Entreprises »."
      },
      {
        q: "Comment créer un service pour mon entreprise ?",
        a: "Dans « Mes Services », cliquez sur « Créer un service ». Sélectionnez l'entreprise concernée (elle doit être validée), choisissez le domaine d'activité, renseignez le nom, la description, le tarif, les horaires de disponibilité, et ajoutez des photos. Le service est immédiatement visible sur la plateforme."
      },
      {
        q: "Ma position GPS est-elle obligatoire ?",
        a: "Oui, la géolocalisation est requise lors de la création de votre entreprise afin d'afficher votre localisation sur la carte et permettre aux clients de vous trouver facilement. Autorisez la géolocalisation dans votre navigateur lors de l'étape « Localisation & Médias »."
      }
    ]
  },
  {
    id: 'messagerie',
    icon: <FaComments />,
    label: 'Messagerie',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    questions: [
      {
        q: "Comment contacter un prestataire ?",
        a: "Sur la fiche d'une entreprise ou d'un service, cliquez sur « Contacter ». Trois options s'offrent à vous : appel téléphonique direct, message WhatsApp, ou messagerie intégrée CarEasy (recommandée pour le suivi). La messagerie est disponible pour les utilisateurs connectés."
      },
      {
        q: "Mes conversations sont-elles privées ?",
        a: "Oui, vos conversations sur CarEasy sont privées et chiffrées. Seuls vous et votre interlocuteur pouvez lire les messages échangés. CarEasy ne lit pas le contenu de vos conversations et ne les partage jamais avec des tiers."
      },
      {
        q: "Puis-je envoyer des photos et des fichiers dans les messages ?",
        a: "Oui, la messagerie CarEasy supporte les images, vidéos, messages audio et documents. Vous pouvez partager des photos de votre véhicule pour faciliter le diagnostic, ou des documents comme votre carte grise."
      },
      {
        q: "Comment démarrer une nouvelle conversation ?",
        a: "Depuis la page « Messages », cliquez sur « Nouvelle conversation ». Une liste des prestataires disponibles s'affiche. Vous pouvez aussi initier une conversation directement depuis la fiche d'un service ou d'une entreprise en cliquant sur « Contacter » puis « Messagerie »."
      }
    ]
  },
  {
    id: 'securite',
    icon: <FaShieldAlt />,
    label: 'Sécurité & Confidentialité',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    questions: [
      {
        q: "Comment CarEasy protège-t-il mes données personnelles ?",
        a: "CarEasy applique les standards de sécurité les plus stricts : chiffrement SSL/TLS pour toutes les communications, hachage bcrypt pour les mots de passe, tokens d'authentification sécurisés (Laravel Sanctum), et aucune revente de données personnelles à des tiers."
      },
      {
        q: "CarEasy affiche-t-il des publicités ?",
        a: "Non. CarEasy est une plateforme sans publicité. Aucun annonceur ne paie pour apparaître dans vos résultats ou dans vos conversations. Nos recommandations sont basées uniquement sur la pertinence et la qualité des prestataires."
      },
      {
        q: "Comment signaler un prestataire suspect ou une arnaque ?",
        a: "Si vous suspectez un comportement frauduleux, contactez immédiatement notre équipe via l'email careasy26@gmail.com ou le +229 90 00 00 00. Nous enquêterons et prendrons les mesures nécessaires, pouvant aller jusqu'à la suspension du compte."
      }
    ]
  },
  {
    id: 'technique',
    icon: <FaCreditCard />,
    label: 'Support Technique',
    color: '#64748b',
    bgColor: '#f1f5f9',
    questions: [
      {
        q: "L'application ne fonctionne pas correctement, que faire ?",
        a: "Essayez d'abord de vider le cache de votre navigateur (Ctrl+Shift+Del) et de recharger la page. Si le problème persiste, essayez un autre navigateur (Chrome, Firefox, Edge). Pour un bug persistant, contactez-nous avec une description détaillée du problème et des captures d'écran si possible."
      },
      {
        q: "CarEasy est-il compatible avec les smartphones ?",
        a: "Oui, CarEasy est entièrement responsive et fonctionne parfaitement sur tous les smartphones (Android et iOS) via votre navigateur mobile. Une application native est en cours de développement et sera disponible prochainement."
      },
      {
        q: "Comment activer les notifications ?",
        a: "Dans vos paramètres de compte (icône utilisateur > Paramètres > Notifications), vous pouvez activer/désactiver les notifications pour les nouveaux messages, les mises à jour de statut de votre entreprise, et les alertes importantes."
      }
    ]
  }
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openQuestions, setOpenQuestions] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleQuestion = (catId, qIndex) => {
    const key = `${catId}-${qIndex}`;
    setOpenQuestions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isOpen = (catId, qIndex) => !!openQuestions[`${catId}-${qIndex}`];

  // Search mode: filter all questions
  const allQuestions = faqCategories.flatMap(cat =>
    cat.questions.map(q => ({ ...q, catId: cat.id, catLabel: cat.label, catColor: cat.color, catIcon: cat.icon }))
  );
  const filteredQuestions = searchTerm.trim().length > 1
    ? allQuestions.filter(q =>
        q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.a.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  const currentCategory = faqCategories.find(c => c.id === activeCategory);

  return (
    <div style={styles.page}>
      <SEOHead
        title="Aide & FAQ — Questions Fréquentes sur CarEasy"
        description="Centre d'aide CarEasy : inscription, création d'entreprise, messagerie, sécurité. Toutes les réponses à vos questions."
        canonical="/faq"
      />
      {/* HERO */}
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroBadge}>
            <FaQuestionCircle style={{ marginRight: 8, fontSize: '1rem' }} />
            Centre d'aide
          </div>
          <h1 style={styles.heroTitle}>Comment pouvons-nous<br /><span style={styles.heroAccent}>vous aider ?</span></h1>
          <p style={styles.heroSub}>Trouvez rapidement des réponses à toutes vos questions sur CarEasy.</p>

          {/* Search */}
          <div style={styles.searchBox}>
            <FaSearch style={styles.searchIconStyle} />
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>
            )}
          </div>

          {/* Stats */}
          <div style={styles.heroStats}>
            <div style={styles.heroStat}><span style={styles.heroStatNum}>6</span><span style={styles.heroStatLabel}>Catégories</span></div>
            <div style={styles.heroStatDiv} />
            <div style={styles.heroStat}><span style={styles.heroStatNum}>26</span><span style={styles.heroStatLabel}>Questions répondues</span></div>
            <div style={styles.heroStatDiv} />
            <div style={styles.heroStat}><span style={styles.heroStatNum}>24h</span><span style={styles.heroStatLabel}>Délai de réponse</span></div>
          </div>
        </div>

        {/* Decorative shapes */}
        <div style={styles.deco1} />
        <div style={styles.deco2} />
        <div style={styles.deco3} />
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.mainWrap}>
        {filteredQuestions !== null ? (
          /* SEARCH RESULTS */
          <div style={styles.searchResults}>
            <h2 style={styles.searchResultsTitle}>
              {filteredQuestions.length} résultat{filteredQuestions.length !== 1 ? 's' : ''} pour «&nbsp;{searchTerm}&nbsp;»
            </h2>
            {filteredQuestions.length === 0 ? (
              <div style={styles.noResults}>
                <div style={styles.noResultsEmoji}>🔍</div>
                <h3 style={styles.noResultsTitle}>Aucun résultat</h3>
                <p style={styles.noResultsText}>Essayez d'autres mots-clés ou parcourez les catégories ci-dessous.</p>
                <button onClick={() => setSearchTerm('')} style={styles.noResultsBtn}>
                  Parcourir les catégories
                </button>
              </div>
            ) : (
              <div style={styles.accordionList}>
                {filteredQuestions.map((q, i) => (
                  <div key={i} style={styles.accordionItem}>
                    <button
                      onClick={() => toggleQuestion('search', i)}
                      style={styles.accordionBtn}
                    >
                      <div style={styles.accordionLeft}>
                        <span style={{ ...styles.catTag, backgroundColor: q.catColor + '20', color: q.catColor }}>
                          {q.catIcon}&nbsp; {q.catLabel}
                        </span>
                        <span style={styles.accordionQ}>{q.q}</span>
                      </div>
                      <div style={{ ...styles.chevron, transform: isOpen('search', i) ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <FaChevronDown />
                      </div>
                    </button>
                    {isOpen('search', i) && (
                      <div style={styles.accordionAnswer}>{q.a}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={styles.layout}>
            {/* SIDEBAR */}
            <aside style={styles.sidebar}>
              <p style={styles.sidebarLabel}>Catégories</p>
              {faqCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    ...styles.sidebarBtn,
                    ...(activeCategory === cat.id ? { backgroundColor: cat.color, color: '#fff', boxShadow: `0 4px 20px ${cat.color}40` } : {})
                  }}
                >
                  <span style={{
                    ...styles.sidebarBtnIcon,
                    backgroundColor: activeCategory === cat.id ? 'rgba(255,255,255,0.2)' : cat.bgColor,
                    color: activeCategory === cat.id ? '#fff' : cat.color
                  }}>
                    {cat.icon}
                  </span>
                  <span style={styles.sidebarBtnLabel}>{cat.label}</span>
                  <span style={{
                    ...styles.sidebarBtnCount,
                    backgroundColor: activeCategory === cat.id ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: activeCategory === cat.id ? '#fff' : '#64748b'
                  }}>
                    {cat.questions.length}
                  </span>
                </button>
              ))}

              {/* Contact CTA */}
              <div style={styles.sidebarContact}>
                <div style={styles.sidebarContactTitle}>Vous n'avez pas trouvé ?</div>
                <p style={styles.sidebarContactText}>Notre équipe est disponible pour vous aider directement.</p>
                <a href="mailto:careasy26@gmail.com" style={styles.sidebarContactBtn}>
                  <FiMail style={{ marginRight: 6 }} /> Nous écrire
                </a>
                <a href="tel:+22990000000" style={styles.sidebarContactBtnSecond}>
                  <FiPhone style={{ marginRight: 6 }} /> +229 90 00 00 00
                </a>
              </div>
            </aside>

            {/* QUESTIONS PANEL */}
            <main style={styles.panel}>
              {currentCategory && (
                <>
                  <div style={styles.panelHeader}>
                    <div style={{ ...styles.panelHeaderIcon, backgroundColor: currentCategory.bgColor, color: currentCategory.color }}>
                      {currentCategory.icon}
                    </div>
                    <div>
                      <h2 style={styles.panelTitle}>{currentCategory.label}</h2>
                      <p style={styles.panelSub}>{currentCategory.questions.length} question{currentCategory.questions.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div style={styles.accordionList}>
                    {currentCategory.questions.map((item, i) => (
                      <div key={i} style={{
                        ...styles.accordionItem,
                        ...(isOpen(currentCategory.id, i) ? { borderColor: currentCategory.color, boxShadow: `0 0 0 2px ${currentCategory.color}20` } : {})
                      }}>
                        <button
                          onClick={() => toggleQuestion(currentCategory.id, i)}
                          style={styles.accordionBtn}
                        >
                          <span style={styles.accordionQ}>{item.q}</span>
                          <div style={{
                            ...styles.chevron,
                            backgroundColor: isOpen(currentCategory.id, i) ? currentCategory.color : '#f1f5f9',
                            color: isOpen(currentCategory.id, i) ? '#fff' : '#64748b',
                            transform: isOpen(currentCategory.id, i) ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}>
                            <FaChevronDown />
                          </div>
                        </button>
                        {isOpen(currentCategory.id, i) && (
                          <div style={{ ...styles.accordionAnswer, borderLeftColor: currentCategory.color }}>
                            {item.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </main>
          </div>
        )}
      </div>

      {/* BOTTOM CTA */}
      <div style={styles.bottomCta}>
        <div style={styles.bottomCtaInner}>
          <div style={styles.bottomCtaLeft}>
            <h2 style={styles.bottomCtaTitle}>Besoin d'aide supplémentaire ?</h2>
            <p style={styles.bottomCtaText}>Notre équipe CarEasy est à votre disposition, 7j/7.</p>
          </div>
          <div style={styles.bottomCtaActions}>
            <a href="mailto:careasy26@gmail.com" style={styles.bottomCtaBtn}>
              <FiMail style={{ marginRight: 8 }} /> careasy26@gmail.com
            </a>
            <Link to="/" style={styles.bottomCtaBtnSec}>
              Retour à l'accueil <FiArrowRight style={{ marginLeft: 6 }} />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        * { box-sizing: border-box; }
        input:focus { outline: none; border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.15) !important; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },

  /* HERO */
  hero: {
    position: 'relative',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
    padding: '5rem 1.5rem 7rem',
    overflow: 'hidden',
  },
  heroInner: {
    maxWidth: '680px',
    margin: '0 auto',
    textAlign: 'center',
    position: 'relative',
    zIndex: 2,
    animation: 'fadeInUp 0.8s ease-out',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5',
    padding: '0.4rem 1.2rem',
    borderRadius: '999px',
    fontSize: '0.875rem',
    fontWeight: '600',
    letterSpacing: '0.05em',
    marginBottom: '1.5rem',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
    fontWeight: '800',
    color: '#f8fafc',
    lineHeight: '1.2',
    marginBottom: '1.25rem',
    letterSpacing: '-0.02em',
  },
  heroAccent: {
    color: '#ef4444',
    display: 'inline-block',
  },
  heroSub: {
    fontSize: '1.125rem',
    color: '#94a3b8',
    marginBottom: '2.5rem',
    lineHeight: '1.7',
  },

  /* Search */
  searchBox: {
    position: 'relative',
    maxWidth: '520px',
    margin: '0 auto 2.5rem',
  },
  searchIconStyle: {
    position: 'absolute',
    left: '1.25rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    fontSize: '1rem',
    zIndex: 1,
  },
  searchInput: {
    width: '100%',
    padding: '1rem 3.5rem 1rem 3.25rem',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '2px solid rgba(255,255,255,0.15)',
    borderRadius: '0.875rem',
    fontSize: '1rem',
    color: '#f8fafc',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s',
  },
  clearBtn: {
    position: 'absolute',
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.125rem',
    cursor: 'pointer',
    padding: '0.25rem',
    zIndex: 1,
  },

  /* Hero stats */
  heroStats: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  heroStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heroStatNum: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#ef4444',
    lineHeight: '1',
  },
  heroStatLabel: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginTop: '0.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  heroStatDiv: {
    width: '1px',
    height: '40px',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  /* Decorative */
  deco1: {
    position: 'absolute',
    top: '-80px',
    right: '-80px',
    width: '320px',
    height: '320px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)',
    animation: 'float 8s ease-in-out infinite',
  },
  deco2: {
    position: 'absolute',
    bottom: '20px',
    left: '-60px',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
    animation: 'float 10s ease-in-out infinite reverse',
  },
  deco3: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'rgba(239,68,68,0.6)',
    boxShadow: '0 0 20px rgba(239,68,68,0.4)',
  },

  /* MAIN */
  mainWrap: {
    maxWidth: '1200px',
    margin: '-3rem auto 0',
    padding: '0 1.5rem 4rem',
    position: 'relative',
    zIndex: 3,
  },

  /* Layout */
  layout: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '2rem',
    alignItems: 'start',
  },

  /* Sidebar */
  sidebar: {
    position: 'sticky',
    top: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sidebarLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    paddingLeft: '0.5rem',
    marginBottom: '0.5rem',
  },
  sidebarBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#fff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.25s',
    textAlign: 'left',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#374151',
  },
  sidebarBtnIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    flexShrink: 0,
  },
  sidebarBtnLabel: {
    flex: 1,
  },
  sidebarBtnCount: {
    padding: '0.125rem 0.5rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: '700',
    flexShrink: 0,
  },
  sidebarContact: {
    marginTop: '1.5rem',
    backgroundColor: '#1e293b',
    borderRadius: '1rem',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sidebarContactTitle: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: '0.25rem',
  },
  sidebarContactText: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    lineHeight: '1.5',
  },
  sidebarContactBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '0.625rem 1rem',
    borderRadius: '0.625rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  sidebarContactBtnSecond: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#cbd5e1',
    padding: '0.625rem 1rem',
    borderRadius: '0.625rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.2s',
    border: '1px solid rgba(255,255,255,0.1)',
  },

  /* Panel */
  panel: {
    backgroundColor: '#fff',
    borderRadius: '1.25rem',
    border: '1.5px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '2rem 2rem 1.5rem',
    borderBottom: '1.5px solid #f1f5f9',
  },
  panelHeaderIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '52px',
    height: '52px',
    borderRadius: '0.875rem',
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  panelSub: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: '0.25rem 0 0',
  },

  /* Accordion */
  accordionList: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  accordionItem: {
    border: '1.5px solid #e2e8f0',
    borderRadius: '0.875rem',
    overflow: 'hidden',
    transition: 'all 0.25s',
    backgroundColor: '#fff',
  },
  accordionBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '1.25rem 1.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  accordionLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  catTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.7rem',
    fontWeight: '700',
    width: 'fit-content',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  accordionQ: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: '1.5',
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    flexShrink: 0,
    transition: 'all 0.3s',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  accordionAnswer: {
    padding: '0 1.5rem 1.5rem 1.5rem',
    fontSize: '0.95rem',
    color: '#475569',
    lineHeight: '1.75',
    borderLeft: '3px solid #ef4444',
    marginLeft: '1.5rem',
    paddingLeft: '1.25rem',
    animation: 'fadeInUp 0.2s ease-out',
  },

  /* Search results */
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: '1.25rem',
    border: '1.5px solid #e2e8f0',
    padding: '2rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  searchResultsTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '1.5rem',
  },
  noResults: {
    textAlign: 'center',
    padding: '3rem 1rem',
  },
  noResultsEmoji: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  noResultsTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.75rem',
  },
  noResultsText: {
    color: '#64748b',
    marginBottom: '1.5rem',
  },
  noResultsBtn: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
  },

  /* Bottom CTA */
  bottomCta: {
    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    padding: '4rem 1.5rem',
    marginTop: '2rem',
  },
  bottomCtaInner: {
    maxWidth: '900px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  bottomCtaLeft: {},
  bottomCtaTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '0.5rem',
  },
  bottomCtaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '1rem',
  },
  bottomCtaActions: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  bottomCtaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    color: '#ef4444',
    padding: '0.875rem 1.5rem',
    borderRadius: '0.75rem',
    fontWeight: '700',
    textDecoration: 'none',
    fontSize: '0.95rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  bottomCtaBtnSec: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    padding: '0.875rem 1.5rem',
    borderRadius: '0.75rem',
    fontWeight: '600',
    textDecoration: 'none',
    fontSize: '0.95rem',
    border: '1.5px solid rgba(255,255,255,0.3)',
  },
};