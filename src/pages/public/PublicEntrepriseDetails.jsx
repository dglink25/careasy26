// src/pages/public/PublicEntrepriseDetails.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { publicApi } from '../../api/publicApi';
import ChatModal from '../../components/Chat/ChatModal';
import ContactModal from '../../components/ContactModal';
import ItineraryModal from '../../components/ItineraryModal';
import theme from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { usePendingAction } from '../../hooks/usePendingAction';

import {
  FiArrowLeft, FiMapPin, FiTool, FiClock, FiPhone,
  FiMail, FiNavigation, FiStar, FiShare2, FiAlertCircle,
  FiHeart, FiCheck, FiCalendar, FiDollarSign, FiInfo,
  FiShield, FiRefreshCw, FiChevronRight,
} from 'react-icons/fi';
import {
  MdBusiness, MdVerified, MdOutlineLocationOn, MdOutlineWork,
  MdOutlineDirectionsCar, MdOutlineDescription, MdOutlinePhone,
  MdOutlineEmail, MdOutlineWhatsapp, MdOutlineAccessTime,
  MdOutlineShare, MdOutlinePerson,
} from 'react-icons/md';
import { FaComments } from 'react-icons/fa';

export default function PublicEntrepriseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { requireAuth, shouldOpenModal } = usePendingAction({
    redirectPath: `/entreprises/${id}`,
  });

  // Lire le flag openContactModal UNE SEULE FOIS au montage
  const pendingOpenRef = useRef(shouldOpenModal());

  const [entreprise, setEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeService, setActiveService] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Modales
  const [showContactModal, setShowContactModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [itineraryModal, setItineraryModal] = useState({ isOpen: false });

  useEffect(() => {
    fetchEntreprise();
    const favorites = JSON.parse(localStorage.getItem('favoriteEntreprises') || '[]');
    setIsFavorite(favorites.includes(id));
  }, [id]);

  const fetchEntreprise = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await publicApi.getEntreprise(id);
      setEntreprise(data);

      // ── Ouvrir le modal de contact si on revient de /login ──
      if (pendingOpenRef.current) {
        pendingOpenRef.current = false;
        setShowContactModal(true);
      }
    } catch (err) {
      setError('Entreprise non trouvée');
      setTimeout(() => navigate('/entreprises'), 3000);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, navigate]);

  // PublicEntrepriseDetails.jsx - Modifiez la fonction handleOpenContact :

  const handleOpenContact = () => {
    if (!user) {
      // Sauvegarder l'intention d'ouvrir le modal après connexion
      sessionStorage.setItem('pendingContactModal', 'true');
      sessionStorage.setItem('pendingEntrepriseId', id);
      navigate('/login', { state: { from: `/entreprises/${id}` } });
      return;
    }
    setShowContactModal(true);
  };

  // Ajoutez cet effet pour ouvrir le modal après retour de connexion :
  useEffect(() => {
    if (user && sessionStorage.getItem('pendingContactModal') === 'true') {
      sessionStorage.removeItem('pendingContactModal');
      sessionStorage.removeItem('pendingEntrepriseId');
      setShowContactModal(true);
    }
  }, [user]);

  const handleRefresh = () => { setRefreshing(true); fetchEntreprise(); };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteEntreprises') || '[]');
    if (isFavorite) {
      localStorage.setItem('favoriteEntreprises', JSON.stringify(favorites.filter(f => f !== id)));
    } else {
      localStorage.setItem('favoriteEntreprises', JSON.stringify([...favorites, id]));
    }
    setIsFavorite(!isFavorite);
  };

  const handleShare = () => {
    if (navigator.share && entreprise) {
      navigator.share({ title: entreprise.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié !');
    }
  };

  const formatPrice = (price) => price ? `${parseFloat(price).toLocaleString('fr-FR')} FCFA` : 'Prix sur demande';

  if (loading) return (
    <div style={styles.container}>
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Chargement des détails...</p>
      </div>
    </div>
  );

  if (error || !entreprise) return (
    <div style={styles.container}>
      <div style={styles.errorContainer}>
        <FiAlertCircle style={styles.errorIcon} />
        <h2 style={styles.errorTitle}>{error || 'Entreprise introuvable'}</h2>
        <div style={styles.errorActions}>
          <button onClick={() => navigate('/entreprises')} style={styles.errorButton}>
            <FiArrowLeft /> Retour aux entreprises
          </button>
          <button onClick={fetchEntreprise} style={styles.errorRetryButton}>
            <FiRefreshCw /> Réessayer
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.content}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <button onClick={() => navigate('/entreprises')} style={styles.backButton}>
              <FiArrowLeft style={styles.backButtonIcon} />
              Retour aux entreprises
            </button>
            <div style={styles.headerActions}>
              <button onClick={handleRefresh} style={styles.headerActionButton} disabled={refreshing}>
                <FiRefreshCw style={refreshing ? styles.refreshingIcon : styles.headerActionIcon} />
                {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
              </button>
              <button onClick={handleShare} style={styles.headerActionButton}>
                <MdOutlineShare style={styles.headerActionIcon} />
                Partager
              </button>
            </div>
          </div>

          {/* Hero */}
          <div style={styles.heroSection}>
            {entreprise.logo && !imageError ? (
              <div style={styles.heroImage}>
                <img src={entreprise.logo} alt={entreprise.name} style={styles.heroImg} onError={() => setImageError(true)} />
                <div style={styles.heroOverlay}>
                  <div style={styles.heroContent}>
                    <h1 style={styles.heroTitle}>{entreprise.name}</h1>
                    {entreprise.siege && (
                      <div style={styles.heroLocation}>
                        <MdOutlineLocationOn style={styles.heroLocationIcon} />
                        {entreprise.siege}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.heroPlaceholder}>
                <MdBusiness style={styles.heroPlaceholderIcon} />
                <h1 style={{ ...styles.heroTitle, color: '#1e293b' }}>{entreprise.name}</h1>
              </div>
            )}
          </div>

          {/* ── Bouton unique Contacter (zone visible et accessible) ── */}
          <div style={styles.contactBannerWrap}>
            <button onClick={handleOpenContact} style={styles.contactBanner} className="contact-banner-btn">
              <div style={styles.contactBannerIcon}><FaComments /></div>
              <div style={styles.contactBannerText}>
                <span style={styles.contactBannerLabel}>Contacter {entreprise.name}</span>
                <span style={styles.contactBannerSub}>Appel · WhatsApp · Messagerie · Itinéraire</span>
              </div>
              <span style={styles.contactBannerArrow}>›</span>
            </button>
            {!user && <p style={styles.authHint}>🔒 Connexion requise pour contacter le prestataire.</p>}
          </div>
        </div>

        {/* ── Contenu principal ── */}
        <div style={styles.mainContent}>
          <div style={styles.contentGrid}>

            {/* Colonne gauche */}
            <div style={styles.leftColumn}>

              {/* À propos */}
              {entreprise.description && (
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <MdOutlineDescription style={styles.cardHeaderIcon} />
                    <h2 style={styles.cardTitle}>À propos de nous</h2>
                  </div>
                  <div style={styles.cardBody}>
                    <p style={styles.description}>{entreprise.description}</p>
                  </div>
                </div>
              )}

              {/* Domaines */}
              {entreprise.domaines?.length > 0 && (
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <FiTool style={styles.cardHeaderIcon} />
                    <h2 style={styles.cardTitle}>Domaines d'expertise</h2>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.expertiseGrid}>
                      {entreprise.domaines.map((d) => (
                        <div key={d.id} style={styles.expertiseItem}>
                          <FiCheck style={styles.expertiseIcon} />
                          <span style={styles.expertiseName}>{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Services */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <MdOutlineWork style={styles.cardHeaderIcon} />
                  <h2 style={styles.cardTitle}>Nos Services</h2>
                  {entreprise.services && (
                    <span style={styles.servicesCount}>{entreprise.services.length} service{entreprise.services.length > 1 ? 's' : ''}</span>
                  )}
                </div>
                <div style={styles.cardBody}>
                  {entreprise.services?.length > 0 ? (
                    <div style={styles.servicesList}>
                      {entreprise.services.map((service) => (
                        <div
                          key={service.id}
                          style={{ ...styles.serviceCard, ...(activeService?.id === service.id ? styles.serviceCardActive : {}) }}
                          onClick={() => setActiveService(activeService?.id === service.id ? null : service)}
                        >
                          <div style={styles.serviceHeader}>
                            <div style={styles.serviceImageContainer}>
                              {service.medias?.length > 0
                                ? <img src={service.medias[0]} alt={service.name} style={styles.serviceImage} />
                                : <div style={styles.serviceImagePlaceholder}><MdOutlineWork style={{ fontSize: '1.5rem', color: '#94a3b8' }} /></div>
                              }
                            </div>
                            <div style={styles.serviceInfo}>
                              <h3 style={styles.serviceName}>{service.name}</h3>
                              <div style={styles.servicePrice}>
                                <FiDollarSign style={styles.servicePriceIcon} />
                                {formatPrice(service.price)}
                              </div>
                            </div>
                            <button style={styles.serviceToggle}>
                              <FiChevronRight style={{ transform: activeService?.id === service.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
                            </button>
                          </div>
                          {activeService?.id === service.id && (
                            <div style={styles.serviceDetails}>
                              {service.descriptions && <p style={styles.serviceDescription}>{service.descriptions}</p>}
                              <div style={styles.serviceActions}>
                                <button onClick={(e) => { e.stopPropagation(); handleOpenContact(); }} style={styles.serviceActionButton}>
                                  <FaComments style={styles.serviceActionIcon} />
                                  Contacter
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.noServices}>
                      <FiInfo style={styles.noServicesIcon} />
                      <p style={styles.noServicesText}>Aucun service disponible pour le moment</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne droite */}
            <div style={styles.rightColumn}>

              {/* Carte Contact */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <FiPhone style={styles.cardHeaderIcon} />
                  <h2 style={styles.cardTitle}>Contact & Rendez-vous</h2>
                </div>
                <div style={styles.cardBody}>
                  {/* Bouton unique */}
                  <button onClick={handleOpenContact} style={styles.mainContactBtn} className="main-contact-btn">
                    <div style={styles.mainContactBtnIcon}><FaComments /></div>
                    <div style={styles.mainContactBtnText}>
                      <span style={styles.mainContactBtnLabel}>Joindre le prestataire</span>
                      <span style={styles.mainContactBtnSub}>Appel · WhatsApp · Messagerie · Itinéraire</span>
                    </div>
                    <span style={styles.mainContactBtnArrow}>›</span>
                  </button>
                  {!user && <p style={styles.authHint}>Connexion requise.</p>}
                </div>
              </div>

              {/* Infos générales — coordonnées masquées si non connecté */}
              {(entreprise.siege || entreprise.call_phone || entreprise.phone || entreprise.email) && (
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <FiInfo style={styles.cardHeaderIcon} />
                    <h2 style={styles.cardTitle}>Informations</h2>
                  </div>
                  <div style={styles.cardBody}>
                    {user ? (
                      /* ── Connecté : afficher toutes les infos ── */
                      <div style={styles.infoList}>
                        {entreprise.siege && (
                          <div style={styles.infoItem}>
                            <span style={styles.infoItemLabel}><MdOutlineLocationOn style={styles.infoItemIcon} />Adresse</span>
                            <span style={styles.infoItemValue}>{entreprise.siege}</span>
                          </div>
                        )}
                        {(entreprise.call_phone || entreprise.phone) && (
                          <div style={styles.infoItem}>
                            <span style={styles.infoItemLabel}><MdOutlinePhone style={styles.infoItemIcon} />Téléphone</span>
                            <span style={styles.infoItemValue}>{entreprise.call_phone || entreprise.phone}</span>
                          </div>
                        )}
                        {entreprise.email && (
                          <div style={styles.infoItem}>
                            <span style={styles.infoItemLabel}><MdOutlineEmail style={styles.infoItemIcon} />Email</span>
                            <span style={styles.infoItemValue}>{entreprise.email}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ── Non connecté : bloc de verrouillage ── */
                      <div style={styles.lockedInfo}>
          
                        <p style={styles.lockedTitle}>Coordonnées protégées</p>
                        <p style={styles.lockedText}>
                          Connectez-vous pour accéder au téléphone, à l'email et à l'adresse complète.
                        </p>
                        <button onClick={handleOpenContact} style={styles.lockedButton}>
                          Se connecter pour voir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={styles.ctaSection}>
          <div style={styles.ctaContent}>
            <div style={styles.ctaIcon}><MdOutlineDirectionsCar /></div>
            <div style={styles.ctaText}>
              <h3 style={styles.ctaTitle}>Prêt à démarrer ?</h3>
              <p style={styles.ctaDescription}>Contactez {entreprise.name} dès maintenant.</p>
            </div>
            <button onClick={handleOpenContact} style={styles.ctaPrimaryButton}>
              <FaComments style={styles.ctaButtonIcon} />
              Contacter
            </button>
          </div>
        </div>
      </div>

      {/* ── Modales ── */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        entreprise={entreprise}
        onChat={() => setShowChatModal(true)}
      />

      {user && showChatModal && (
        <ChatModal
          receiverId={entreprise.prestataire_id}
          receiverName={entreprise.name || 'Prestataire'}
          onClose={() => setShowChatModal(false)}
        />
      )}

      <ItineraryModal
        isOpen={itineraryModal.isOpen}
        onClose={() => setItineraryModal({ isOpen: false })}
        destination={entreprise}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .contact-banner-btn, .main-contact-btn { transition: all 0.25s ease; }
        .contact-banner-btn:hover, .main-contact-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(239,68,68,0.3) !important;
        }
        .service-card { transition: all 0.2s ease; cursor: pointer; animation: fadeIn 0.3s ease-out; }
        .service-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f8fafc' },
  content: { maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner: { width: '50px', height: '50px', border: `4px solid ${theme.colors.primaryLight}`, borderTop: `4px solid ${theme.colors.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { color: theme.colors.text.secondary, fontSize: '1.125rem' },
  errorContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center' },
  errorIcon: { fontSize: '5rem', color: '#ef4444' },
  errorTitle: { fontSize: '2rem', fontWeight: '700', color: '#1e293b' },
  errorActions: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  errorButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '0.875rem 1.75rem', borderRadius: theme.borderRadius.lg, fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' },
  errorRetryButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '0.875rem 1.75rem', borderRadius: theme.borderRadius.lg, fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' },

  header: { marginBottom: '2rem' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0', flexWrap: 'wrap', gap: '1rem' },
  backButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', padding: '0.5rem 0' },
  backButtonIcon: { fontSize: '1.25rem' },
  headerActions: { display: 'flex', gap: '0.75rem' },
  headerActionButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '0.625rem 1rem', borderRadius: theme.borderRadius.md, fontSize: '0.875rem', color: '#475569', cursor: 'pointer' },
  headerActionIcon: { fontSize: '1rem' },
  refreshingIcon: { fontSize: '1rem', animation: 'spin 1s linear infinite' },

  heroSection: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', marginBottom: '1.5rem' },
  heroImage: { position: 'relative', height: '350px', backgroundColor: '#1e293b' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' },
  heroContent: { color: '#fff' },
  heroTitle: { fontSize: '2.2rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem 0' },
  heroLocation: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', opacity: 0.9, color: '#fff' },
  heroLocationIcon: { fontSize: '1.3rem' },
  heroPlaceholder: { height: '180px', backgroundColor: '#dbeafe', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' },
  heroPlaceholderIcon: { fontSize: '4rem', color: '#3b82f6' },

  // Bannière contacter
  contactBannerWrap: { marginBottom: '2rem' },
  contactBanner: {
    display: 'flex', alignItems: 'center', gap: '1rem', width: '100%',
    padding: '1.1rem 1.5rem', borderRadius: '16px', border: 'none',
    background: `linear-gradient(135deg, ${theme.colors.primary}, #b91c1c)`,
    color: '#fff', cursor: 'pointer', textAlign: 'left',
    boxShadow: '0 4px 20px rgba(239,68,68,0.3)',
  },
  contactBannerIcon: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 },
  contactBannerText: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  contactBannerLabel: { fontSize: '1.05rem', fontWeight: '700', color: '#fff' },
  contactBannerSub: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.82)' },
  contactBannerArrow: { fontSize: '1.8rem', color: 'rgba(255,255,255,0.7)' },
  authHint: { marginTop: '0.6rem', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' },

  mainContent: { marginBottom: '3rem' },
  contentGrid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },

  card: { backgroundColor: '#fff', borderRadius: theme.borderRadius.lg, border: '1px solid #e2e8f0', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
  cardHeaderIcon: { fontSize: '1.5rem', color: theme.colors.primary },
  cardTitle: { fontSize: '1.2rem', fontWeight: '600', color: '#1e293b', margin: 0 },
  servicesCount: { marginLeft: 'auto', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.65rem', borderRadius: theme.borderRadius.md, fontSize: '0.8rem', fontWeight: '500' },
  cardBody: { padding: '1.5rem' },
  description: { color: '#475569', lineHeight: '1.7', fontSize: '1rem', margin: 0 },

  expertiseGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem' },
  expertiseItem: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f0f9ff', padding: '0.5rem 0.875rem', borderRadius: theme.borderRadius.md, fontSize: '0.875rem', color: '#0369a1' },
  expertiseIcon: { fontSize: '1rem', color: '#0ea5e9' },
  expertiseName: { fontWeight: '500' },

  servicesList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  serviceCard: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  serviceCardActive: { borderColor: theme.colors.primary, boxShadow: '0 4px 12px rgba(59,130,246,0.1)' },
  serviceHeader: { display: 'flex', alignItems: 'center', padding: '1rem', gap: '1rem' },
  serviceImageContainer: { position: 'relative', width: '60px', height: '60px', borderRadius: theme.borderRadius.md, overflow: 'hidden', backgroundColor: '#f1f5f9', flexShrink: 0 },
  serviceImage: { width: '100%', height: '100%', objectFit: 'cover' },
  serviceImagePlaceholder: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: '0 0 0.25rem 0' },
  servicePrice: { display: 'flex', alignItems: 'center', gap: '0.375rem', color: theme.colors.primary, fontWeight: '600', fontSize: '0.875rem' },
  servicePriceIcon: { fontSize: '0.875rem' },
  serviceToggle: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' },
  serviceDetails: { padding: '0 1rem 1rem', borderTop: '1px solid #f1f5f9' },
  serviceDescription: { color: '#64748b', fontSize: '0.875rem', lineHeight: '1.5', margin: '0.75rem 0 1rem' },
  serviceActions: { display: 'flex', gap: '0.75rem' },
  serviceActionButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: theme.colors.primary, color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: theme.borderRadius.md, fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' },
  serviceActionIcon: { fontSize: '1rem' },
  noServices: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', color: '#94a3b8' },
  noServicesIcon: { fontSize: '3rem', marginBottom: '1rem' },
  noServicesText: { textAlign: 'center', fontSize: '0.875rem' },

  // Bouton principal contacter (dans la carte)
  mainContactBtn: {
    display: 'flex', alignItems: 'center', gap: '1rem', width: '100%',
    padding: '1rem 1.15rem', borderRadius: '14px', border: 'none',
    background: `linear-gradient(135deg, ${theme.colors.primary}, #b91c1c)`,
    color: '#fff', cursor: 'pointer', textAlign: 'left',
    boxShadow: '0 4px 16px rgba(239,68,68,0.25)',
  },
  mainContactBtnIcon: { width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 },
  mainContactBtnText: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  mainContactBtnLabel: { fontSize: '0.95rem', fontWeight: '700', color: '#fff' },
  mainContactBtnSub: { fontSize: '0.73rem', color: 'rgba(255,255,255,0.8)' },
  mainContactBtnArrow: { fontSize: '1.5rem', color: 'rgba(255,255,255,0.7)' },

  infoList: { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.875rem', borderBottom: '1px solid #e2e8f0' },
  infoItemLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b', fontWeight: '600' },
  infoItemIcon: { fontSize: '1rem', color: '#94a3b8' },
  infoItemValue: { fontSize: '0.875rem', fontWeight: '500', color: '#1e293b', textAlign: 'right', maxWidth: '200px', wordBreak: 'break-word' },

  ctaSection: { backgroundColor: '#1e293b', borderRadius: theme.borderRadius.lg, padding: '2.5rem', marginBottom: '3rem' },
  ctaContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', color: '#fff', flexWrap: 'wrap' },
  ctaIcon: { fontSize: '3.5rem', color: '#0ea5e9', flexShrink: 0 },
  ctaText: { flex: 1 },
  ctaTitle: { fontSize: '1.4rem', fontWeight: '700', margin: '0 0 0.4rem 0', color: '#fff' },
  ctaDescription: { fontSize: '0.95rem', opacity: 0.85, margin: 0, color: '#fff' },
  ctaPrimaryButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: theme.colors.primary, color: '#fff', border: 'none', padding: '0.9rem 1.75rem', borderRadius: theme.borderRadius.lg, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', flexShrink: 0 },
  ctaButtonIcon: { fontSize: '1.1rem' },

  // Bloc infos verrouillées (non connecté)
  lockedInfo: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 1rem', textAlign: 'center' },
  lockedIcon: { fontSize: '2.5rem' },
  lockedTitle: { fontSize: '1rem', fontWeight: '700', color: '#1e293b', margin: 0 },
  lockedText: { fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: '1.5', maxWidth: '260px' },
  lockedButton: { marginTop: '0.25rem', backgroundColor: theme.colors.primary, color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' },
};