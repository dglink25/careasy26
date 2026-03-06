// src/pages/public/PublicServiceDetails.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { publicApi } from '../../api/publicApi';
import ChatModal from '../../components/Chat/ChatModal';
import ContactModal from '../../components/ContactModal';
import theme from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { usePendingAction } from '../../hooks/usePendingAction';

import {
  FiArrowLeft, FiDollarSign, FiPhone, FiNavigation,
  FiShare2, FiHeart, FiClock, FiChevronLeft, FiChevronRight,
  FiX, FiMaximize2, FiMinimize2, FiDownload,
} from 'react-icons/fi';
import {
  MdBusiness, MdOutlineWork, MdOutlineDescription,
  MdOutlineWhatsapp, MdOutlineLocationOn,
  MdPhotoLibrary, MdZoomIn, MdZoomOut,
} from 'react-icons/md';
import { FaComments } from 'react-icons/fa';

export default function PublicServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { requireAuth, shouldOpenModal } = usePendingAction({
    redirectPath: `/service/${id}`,
  });

  // Lire le flag openContactModal UNE SEULE FOIS au montage
  // (avant le premier render, comme Home.jsx avec window.history.state)
  const pendingOpenRef = useRef(shouldOpenModal());

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Contact modal
  const [showContactModal, setShowContactModal] = useState(false);

  // Chat modal
  const [showChatModal, setShowChatModal] = useState(false);

  // Modale galerie plein écran
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    fetchService();
    const favorites = JSON.parse(localStorage.getItem('favoriteServices') || '[]');
    setIsFavorite(favorites.includes(id));
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const data = await publicApi.getService(id);
      setService(data);
      setError('');

      // ── Ouvrir le modal de contact si on revient de /login ──
      if (pendingOpenRef.current) {
        pendingOpenRef.current = false;
        setShowContactModal(true);
      }
    } catch (err) {
      setError('Service non trouvé');
      setTimeout(() => navigate('/services'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // ── Bouton principal "Contacter" ──
  const handleOpenContact = () => {
    requireAuth(() => setShowContactModal(true));
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteServices') || '[]');
    if (isFavorite) {
      localStorage.setItem('favoriteServices', JSON.stringify(favorites.filter(f => f !== id)));
    } else {
      localStorage.setItem('favoriteServices', JSON.stringify([...favorites, id]));
    }
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    if (navigator.share && service) {
      try {
        await navigator.share({ title: service.name, url: window.location.href });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Lien copié !');
      } catch {}
    }
  };

  // Navigation galerie
  const nextImage = () => service?.medias?.length > 1 && setCurrentImageIndex(p => (p + 1) % service.medias.length);
  const prevImage = () => service?.medias?.length > 1 && setCurrentImageIndex(p => p === 0 ? service.medias.length - 1 : p - 1);

  const openModal = (idx) => { setModalImageIndex(idx); setModalOpen(true); setZoomLevel(1); };
  const closeModal = () => { setModalOpen(false); setZoomLevel(1); };
  const nextModal = () => { if (service?.medias?.length > 1) { setModalImageIndex(p => (p + 1) % service.medias.length); setZoomLevel(1); } };
  const prevModal = () => { if (service?.medias?.length > 1) { setModalImageIndex(p => p === 0 ? service.medias.length - 1 : p - 1); setZoomLevel(1); } };

  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const d = touchStart - touchEnd;
    if (d > minSwipeDistance) nextModal();
    else if (d < -minSwipeDistance) prevModal();
  };

  const downloadImage = async (url, idx) => {
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = `service-${service?.name}-${idx + 1}.jpg`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
    } catch {}
  };

  if (loading) return (
    <div style={styles.container}>
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Chargement du service...</p>
      </div>
    </div>
  );

  if (error || !service) return (
    <div style={styles.container}>
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>❌</div>
        <h2 style={styles.errorTitle}>{error || 'Service non trouvé'}</h2>
        <Link to="/services" style={styles.errorButton}>← Retour aux services</Link>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.content}>

        {/* Header */}
        <div style={styles.header}>
          <Link to="/services" style={styles.backButton}>
            <FiArrowLeft style={styles.backButtonIcon} />
            <span>Retour aux services</span>
          </Link>
        </div>

        {/* Grid principal */}
        <div style={styles.mainGrid}>

          {/* ── Colonne gauche — Images ── */}
          <div style={styles.leftColumn}>
            {service.medias?.length > 0 ? (
              <>
                <div style={styles.galleryCard}>
                  <div style={styles.mainImageContainer} onClick={() => openModal(currentImageIndex)}>
                    <img src={service.medias[currentImageIndex]} alt={service.name} style={styles.mainImage} loading="lazy" />
                    <button style={styles.fullscreenButton} onClick={(e) => { e.stopPropagation(); openModal(currentImageIndex); }}>
                      <FiMaximize2 />
                    </button>
                    <div style={styles.imageCounter}>{currentImageIndex + 1} / {service.medias.length}</div>
                    {service.medias.length > 1 && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); prevImage(); }} style={{ ...styles.navButton, left: '10px' }}><FiChevronLeft /></button>
                        <button onClick={(e) => { e.stopPropagation(); nextImage(); }} style={{ ...styles.navButton, right: '10px' }}><FiChevronRight /></button>
                      </>
                    )}
                  </div>
                  {service.medias.length > 1 && (
                    <div style={styles.thumbnailsContainer}>
                      {service.medias.map((m, i) => (
                        <button key={i} onClick={() => setCurrentImageIndex(i)}
                          style={{ ...styles.thumbnail, ...(i === currentImageIndex ? styles.thumbnailActive : {}) }}>
                          <img src={m} alt={`${service.name} ${i + 1}`} style={styles.thumbnailImage} loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={styles.imageCountBadge}>
                  <MdPhotoLibrary style={styles.imageCountIcon} />
                  <span>{service.medias.length} image{service.medias.length > 1 ? 's' : ''}</span>
                </div>
              </>
            ) : (
              <div style={styles.noImageCard}>
                <div style={styles.noImageIcon}>📸</div>
                <p style={styles.noImageText}>Aucune image disponible</p>
              </div>
            )}

            {/* Carte Entreprise */}
            {service.entreprise && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}><MdBusiness style={styles.cardTitleIcon} />Entreprise</h2>
                <Link to={`/entreprises/${service.entreprise.id}`} style={styles.entrepriseLink}>
                  <div style={styles.entrepriseInfo}>
                    {service.entreprise.logo
                      ? <img src={service.entreprise.logo} alt={service.entreprise.name} style={styles.entrepriseLogo} />
                      : <div style={styles.entrepriseLogoPlaceholder}>🏢</div>
                    }
                    <div>
                      <div style={styles.entrepriseName}>{service.entreprise.name}</div>
                      <div style={styles.entrepriseDetails}>
                        <MdOutlineLocationOn style={styles.detailIcon} />
                        {service.entreprise.siege || 'Localisation non renseignée'}
                      </div>
                    </div>
                  </div>
                  <span style={styles.viewLink}>Voir →</span>
                </Link>
              </div>
            )}
          </div>

          {/* ── Colonne droite — Infos ── */}
          <div style={styles.rightColumn}>

            {/* Carte principale */}
            <div style={styles.card}>
              <div style={styles.serviceHeader}>
                <h1 style={styles.serviceName}>{service.name}</h1>
                <button onClick={toggleFavorite} style={styles.favoriteButton}>
                  <FiHeart style={{ fontSize: '1.5rem', color: isFavorite ? '#ef4444' : '#94a3b8', fill: isFavorite ? '#ef4444' : 'none', transition: 'all 0.3s' }} />
                </button>
              </div>
              {service.domaine && <div style={styles.domaineTag}>🏷️ {service.domaine.name}</div>}
              {service.descriptions && (
                <div style={styles.descriptionSection}>
                  <h3 style={styles.sectionSubtitle}><MdOutlineDescription style={styles.sectionIcon} />Description</h3>
                  <p style={styles.description}>{service.descriptions}</p>
                </div>
              )}
            </div>

            {/* Carte Prix & Horaires */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}><FiDollarSign style={styles.cardTitleIcon} />Tarification & Horaires</h2>
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}><FiDollarSign style={styles.infoIcon} />Prix</span>
                  <span style={styles.priceValue}>
                    {service.price ? `${Number(service.price).toLocaleString('fr-FR')} FCFA` : 'Prix sur demande'}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}><FiClock style={styles.infoIcon} />Horaires</span>
                  <span style={styles.infoValue}>
                    {service.is_open_24h ? '24h/24 – 7j/7'
                      : service.start_time && service.end_time ? `${service.start_time} – ${service.end_time}`
                      : 'Non renseignés'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Contact & Rendez-vous ── */}
            {service.entreprise && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}><FiPhone style={styles.cardTitleIcon} />Contact & Rendez-vous</h2>

                {/* Bouton unique Contacter */}
                <button onClick={handleOpenContact} style={styles.mainContactBtn} className="main-contact-btn">
                  <div style={styles.mainContactBtnIcon}><FaComments /></div>
                  <div style={styles.mainContactBtnText}>
                    <span style={styles.mainContactBtnLabel}>Contacter le prestataire</span>
                    <span style={styles.mainContactBtnSub}>Appel · WhatsApp · Messagerie · Itinéraire</span>
                  </div>
                  <span style={styles.mainContactBtnArrow}>›</span>
                </button>

                {/* Coordonnées : visibles seulement si connecté */}
                {user ? (
                  <div style={styles.contactInfoList}>
                    {(service.entreprise.call_phone || service.entreprise.phone) && (
                      <div style={styles.contactInfoItem}>
                        <FiPhone style={styles.contactInfoIcon} />
                        <span>{service.entreprise.call_phone || service.entreprise.phone}</span>
                      </div>
                    )}
                    {service.entreprise.email && (
                      <div style={styles.contactInfoItem}>
                        <FiShare2 style={styles.contactInfoIcon} />
                        <span>{service.entreprise.email}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.lockedContactHint}>
                    🔒 Connectez-vous pour voir les coordonnées complètes.
                  </div>
                )}
              </div>
            )}

            {/* Actions rapides */}
            <div style={styles.actionsCard}>
              <button onClick={toggleFavorite} style={styles.actionButton}>
                <FiHeart style={{ color: isFavorite ? '#ef4444' : '#94a3b8', fill: isFavorite ? '#ef4444' : 'none' }} />
                {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </button>
              <button onClick={handleShare} style={styles.actionButton}>
                <FiShare2 />Partager
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Contact ── */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        entreprise={service?.entreprise}
        serviceName={service?.name}
        onChat={() => setShowChatModal(true)}
      />

      {/* ── Chat Modal ── */}
      {user && service?.entreprise && showChatModal && (
        <ChatModal
          receiverId={service.entreprise.prestataire_id}
          receiverName={service.entreprise.name || 'Prestataire'}
          onClose={() => setShowChatModal(false)}
        />
      )}

      {/* ── Modale galerie plein écran ── */}
      {modalOpen && service?.medias && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>
                <MdPhotoLibrary style={styles.modalTitleIcon} />
                <span>Image {modalImageIndex + 1} sur {service.medias.length}</span>
              </div>
              <div style={styles.modalControls}>
                <button onClick={() => setZoomLevel(p => Math.max(p - 0.5, 1))} style={styles.modalControlButton} disabled={zoomLevel <= 1}><MdZoomOut /></button>
                <button onClick={() => setZoomLevel(p => Math.min(p + 0.5, 3))} style={styles.modalControlButton} disabled={zoomLevel >= 3}><MdZoomIn /></button>
                <button onClick={() => setZoomLevel(1)} style={styles.modalControlButton}><FiMinimize2 /></button>
                <button onClick={() => downloadImage(service.medias[modalImageIndex], modalImageIndex)} style={styles.modalControlButton}><FiDownload /></button>
                <button onClick={closeModal} style={styles.modalCloseButton}><FiX /></button>
              </div>
            </div>
            <div style={styles.modalImageContainer} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
              <img src={service.medias[modalImageIndex]} alt="Vue agrandie" style={{ ...styles.modalImage, transform: `scale(${zoomLevel})` }} />
              {service.medias.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prevModal(); }} style={{ ...styles.modalNavButton, left: '20px' }}><FiChevronLeft /></button>
                  <button onClick={(e) => { e.stopPropagation(); nextModal(); }} style={{ ...styles.modalNavButton, right: '20px' }}><FiChevronRight /></button>
                </>
              )}
            </div>
            {service.medias.length > 1 && (
              <div style={styles.modalThumbnails}>
                <button onClick={() => setShowThumbnails(!showThumbnails)} style={styles.toggleThumbnailsButton}>
                  {showThumbnails ? 'Masquer' : 'Afficher'} les miniatures
                </button>
                {showThumbnails && (
                  <div style={styles.modalThumbnailsContainer}>
                    {service.medias.map((m, i) => (
                      <button key={i} onClick={() => { setModalImageIndex(i); setZoomLevel(1); }}
                        style={{ ...styles.modalThumbnail, ...(i === modalImageIndex ? styles.modalThumbnailActive : {}) }}>
                        <img src={m} alt={`Miniature ${i + 1}`} style={styles.modalThumbnailImage} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
        @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
        .main-contact-btn { transition: all 0.25s ease; }
        .main-contact-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(239,68,68,0.25) !important; }
        @media (max-width:768px) { .main-grid { grid-template-columns:1fr !important; } }
      `}</style>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f8fafc', paddingTop: '2rem', paddingBottom: '4rem' },
  content: { maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner: { width: '50px', height: '50px', border: '4px solid #dbeafe', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { color: '#64748b', fontSize: '1.125rem' },
  errorContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center' },
  errorIcon: { fontSize: '5rem', animation: 'pulse 2s infinite' },
  errorTitle: { fontSize: '1.75rem', color: '#1e293b', margin: 0 },
  errorButton: { backgroundColor: '#3b82f6', color: '#fff', padding: '1rem 2rem', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: '600' },
  header: { marginBottom: '2rem', animation: 'fadeIn 0.5s ease-out' },
  backButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', textDecoration: 'none', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.5rem' },
  backButtonIcon: { fontSize: '1.25rem' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', animation: 'fadeIn 0.5s ease-out 0.2s both' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  galleryCard: { backgroundColor: '#fff', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0' },
  mainImageContainer: { position: 'relative', height: '400px', backgroundColor: '#f1f5f9', cursor: 'pointer', overflow: 'hidden' },
  mainImage: { width: '100%', height: '100%', objectFit: 'cover' },
  fullscreenButton: { position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navButton: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', width: '50px', height: '50px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  imageCounter: { position: 'absolute', bottom: '15px', right: '15px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.9rem', fontWeight: '600' },
  thumbnailsContainer: { display: 'flex', gap: '0.75rem', padding: '1rem', overflowX: 'auto' },
  thumbnail: { width: '80px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', border: '3px solid transparent', cursor: 'pointer', flexShrink: 0, padding: 0, backgroundColor: 'transparent' },
  thumbnailActive: { borderColor: '#3b82f6' },
  thumbnailImage: { width: '100%', height: '100%', objectFit: 'cover' },
  imageCountBadge: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '2rem', fontSize: '0.875rem', alignSelf: 'flex-start' },
  imageCountIcon: { fontSize: '1rem' },
  noImageCard: { backgroundColor: '#fff', borderRadius: '1rem', border: '2px dashed #e2e8f0', padding: '4rem 2rem', textAlign: 'center' },
  noImageIcon: { fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 },
  noImageText: { color: '#64748b', fontSize: '1.125rem' },
  card: { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' },
  cardTitleIcon: { fontSize: '1.5rem', color: '#3b82f6' },
  serviceHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  serviceName: { fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: 0, flex: 1 },
  favoriteButton: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' },
  domaineTag: { display: 'inline-block', backgroundColor: '#dbeafe', color: '#3b82f6', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.95rem', fontWeight: '600', marginBottom: '1.5rem' },
  descriptionSection: { marginTop: '1.5rem' },
  sectionSubtitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem' },
  sectionIcon: { fontSize: '1.25rem', color: '#3b82f6' },
  description: { color: '#64748b', fontSize: '1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' },
  infoList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' },
  infoLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#64748b' },
  infoIcon: { fontSize: '1rem' },
  infoValue: { color: '#1e293b', fontWeight: '600' },
  priceValue: { color: '#10b981', fontWeight: '700', fontSize: '1.25rem' },

  // ── Bouton principal contacter ──
  mainContactBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    width: '100%',
    padding: '1.1rem 1.25rem',
    borderRadius: '14px',
    border: 'none',
    background: `linear-gradient(135deg, ${theme.colors.primary}, #b91c1c)`,
    color: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
  },
  mainContactBtnIcon: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    flexShrink: 0,
  },
  mainContactBtnText: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  mainContactBtnLabel: { fontSize: '1rem', fontWeight: '700', color: '#fff' },
  mainContactBtnSub: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' },
  mainContactBtnArrow: { fontSize: '1.6rem', color: 'rgba(255,255,255,0.7)' },

  authHint: { marginTop: '0.75rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' },

  actionsCard: { display: 'flex', gap: '0.75rem' },
  actionButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flex: 1, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.875rem', borderRadius: '0.75rem', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' },

  entrepriseLink: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' },
  entrepriseInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
  entrepriseLogo: { width: '60px', height: '60px', borderRadius: '0.75rem', objectFit: 'cover' },
  entrepriseLogoPlaceholder: { width: '60px', height: '60px', borderRadius: '0.75rem', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' },
  entrepriseName: { fontWeight: 'bold', color: '#1e293b', marginBottom: '0.25rem' },
  entrepriseDetails: { display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.9rem' },
  detailIcon: { fontSize: '1rem' },
  viewLink: { color: '#3b82f6', fontWeight: '600' },

  // Modale galerie
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modalContent: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' },
  modalHeader: { position: 'absolute', top: 0, left: 0, right: 0, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', color: '#fff', zIndex: 10 },
  modalTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' },
  modalTitleIcon: { fontSize: '1.25rem' },
  modalControls: { display: 'flex', gap: '0.5rem' },
  modalControlButton: { backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalCloseButton: { backgroundColor: '#ef4444', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalImageContainer: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' },
  modalImage: { maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', objectFit: 'contain', borderRadius: '0.5rem', transition: 'transform 0.3s ease' },
  modalNavButton: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', width: '60px', height: '60px', borderRadius: '50%', fontSize: '2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalThumbnails: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem 2rem', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 10 },
  toggleThumbnailsButton: { backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', cursor: 'pointer', alignSelf: 'center' },
  modalThumbnailsContainer: { display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0', justifyContent: 'center' },
  modalThumbnail: { width: '60px', height: '60px', borderRadius: '0.5rem', overflow: 'hidden', border: '3px solid transparent', cursor: 'pointer', padding: 0, backgroundColor: 'transparent' },
  modalThumbnailActive: { borderColor: '#3b82f6' },
  modalThumbnailImage: { width: '100%', height: '100%', objectFit: 'cover' },
};