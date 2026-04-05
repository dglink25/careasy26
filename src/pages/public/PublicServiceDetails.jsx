// src/pages/public/PublicServiceDetails.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { publicApi } from '../../api/publicApi';
import ChatModal from '../../components/Chat/ChatModal';
import ContactModal from '../../components/ContactModal';
import theme from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { usePendingAction } from '../../hooks/usePendingAction';
import StarRating from '../../components/Services/StarRating';
import { 
  FiArrowLeft, FiMapPin, FiClock, FiDollarSign, 
  FiPhone, FiMail, FiNavigation, FiShare2, FiHeart,
  FiCalendar, FiInfo, FiChevronLeft, FiChevronRight,
  FiX, FiMaximize2, FiMinimize2, FiDownload, FiExternalLink,
  FiCheckCircle, FiAlertCircle, FiStar, FiAward
} from 'react-icons/fi';

import {
  MdBusiness, MdOutlineWork, MdOutlineDescription,
  MdOutlineWhatsapp, MdOutlineLocationOn,
  MdPhotoLibrary, MdZoomIn, MdZoomOut, MdOutlineLocalOffer
} from 'react-icons/md';
import { FaComments } from 'react-icons/fa';
import { HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineQuestionMarkCircle } from 'react-icons/hi';

// CONSTANTES
const JS_DAY_TO_KEY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const KEY_TO_FR = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};

const MIN_SWIPE_DISTANCE = 50;
const ZOOM_STEP = 0.5;
const MAX_ZOOM = 3;
const MIN_ZOOM = 1;

// FONCTIONS UTILITAIRES
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
};

const formatPrice = (price) => {
  if (!price && price !== 0) return null;
  return `${Number(price).toLocaleString('fr-FR')} FCFA`;
};

const isPromoActive = (service) => {
  if (!service?.has_promo || !service?.price_promo) return false;
  const now = new Date();
  if (!service.promo_start_date && !service.promo_end_date) return true;
  const start = service.promo_start_date ? new Date(service.promo_start_date) : null;
  const end = service.promo_end_date ? new Date(service.promo_end_date) : null;
  if (start && end) return now >= start && now <= end;
  if (start) return now >= start;
  if (end) return now <= end;
  return false;
};

const calculateDiscount = (service) => {
  if (!service?.has_promo || !service?.price_promo || !service?.price || service.price === 0) return null;
  return Math.round(((service.price - service.price_promo) / service.price) * 100);
};

const formatPromoPeriod = (service) => {
  const fmt = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  if (service?.promo_start_date && service?.promo_end_date)
    return `du ${fmt(service.promo_start_date)} au ${fmt(service.promo_end_date)}`;
  if (service?.promo_start_date) return `à partir du ${fmt(service.promo_start_date)}`;
  if (service?.promo_end_date) return `jusqu'au ${fmt(service.promo_end_date)}`;
  return null;
};

const getOpenStatus = (service) => {
  if (service?.is_always_open || service?.is_open_24h) {
    return {
      isOpen: true,
      label: 'Ouvert 24h/24',
      sublabel: '7j/7',
      color: '#059669',
      bg: '#d1fae5',
      icon: 'always',
      todayHours: '00:00 – 24:00',
    };
  }

  const now = new Date();
  const currentDayKey = JS_DAY_TO_KEY[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (service?.schedule && typeof service.schedule === 'object' && Object.keys(service.schedule).length > 0) {
    const today = service.schedule[currentDayKey];

    if (!today || !today.is_open) {
      const currentIdx = DAYS_ORDER.indexOf(currentDayKey);
      let nextLabel = null;
      for (let i = 1; i <= 7; i++) {
        const nextKey = DAYS_ORDER[(currentIdx + i) % 7];
        const nextDay = service.schedule[nextKey];
        if (nextDay?.is_open && nextDay.start) {
          const label = i === 1 ? 'Demain' : KEY_TO_FR[nextKey];
          nextLabel = `${label} à ${nextDay.start}`;
          break;
        }
      }
      return {
        isOpen: false,
        label: 'Fermé aujourd\'hui',
        sublabel: nextLabel ? `Ouvre ${nextLabel}` : 'Fermé cette semaine',
        color: '#dc2626',
        bg: '#fee2e2',
        icon: 'closed',
        todayHours: 'Fermé',
      };
    }

    const start = parseTimeToMinutes(today.start);
    const end = parseTimeToMinutes(today.end);

    if (start === null || end === null) {
      return {
        isOpen: null,
        label: 'Horaires incomplets',
        sublabel: '',
        color: '#64748b',
        bg: '#e2e8f0',
        icon: 'unknown',
        todayHours: 'Non défini',
      };
    }

    const isOpen = end < start
      ? currentMinutes >= start || currentMinutes <= end
      : currentMinutes >= start && currentMinutes <= end;

    let sublabel;
    if (isOpen) {
      const minutesLeft = end < start
        ? (end + 1440 - currentMinutes) % 1440
        : end - currentMinutes;
      sublabel = minutesLeft <= 60
        ? `Ferme dans ${minutesLeft} min`
        : `Ferme à ${today.end}`;
    } else {
      sublabel = currentMinutes < start
        ? `Ouvre à ${today.start}`
        : `Ouvre demain à ${today.start}`;
    }

    return {
      isOpen,
      label: isOpen ? 'Ouvert maintenant' : 'Actuellement fermé',
      sublabel,
      color: isOpen ? '#059669' : '#dc2626',
      bg: isOpen ? '#d1fae5' : '#fee2e2',
      icon: isOpen ? 'open' : 'closed',
      todayHours: `${today.start} – ${today.end}`,
    };
  }
  
  if (service?.start_time && service?.end_time) {
    const start = parseTimeToMinutes(service.start_time);
    const end = parseTimeToMinutes(service.end_time);
    const isOpen = end < start
      ? currentMinutes >= start || currentMinutes <= end
      : currentMinutes >= start && currentMinutes <= end;

    return {
      isOpen,
      label: isOpen ? 'Ouvert maintenant' : 'Actuellement fermé',
      sublabel: isOpen ? `Ferme à ${service.end_time}` : `Ouvre à ${service.start_time}`,
      color: isOpen ? '#059669' : '#dc2626',
      bg: isOpen ? '#d1fae5' : '#fee2e2',
      icon: isOpen ? 'open' : 'closed',
      todayHours: `${service.start_time} – ${service.end_time}`,
    };
  }

  return {
    isOpen: null,
    label: 'Horaires non renseignés',
    sublabel: '',
    color: '#94a3b8',
    bg: '#f1f5f9',
    icon: 'unknown',
    todayHours: null,
  };
};

// COMPOSANTS
const StatusIcon = ({ type, size = '1rem', color }) => {
  const s = { fontSize: size, color, flexShrink: 0 };
  if (type === 'always') return <HiOutlineClock style={s} />;
  if (type === 'open') return <HiOutlineCheckCircle style={s} />;
  if (type === 'closed') return <HiOutlineXCircle style={s} />;
  return <HiOutlineQuestionMarkCircle style={s} />;
};

const StatusBadge = ({ status }) => {
  if (!status) return null;
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: status.bg,
      color: status.color,
      border: `2px solid ${status.color}40`,
      borderRadius: '999px',
      padding: '8px 16px',
      fontSize: '0.95rem',
      fontWeight: '600',
      marginBottom: '1rem',
    }}>
      <StatusIcon type={status.icon} color={status.color} size="1.2rem" />
      <div>
        <div>{status.label}</div>
        {status.sublabel && (
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{status.sublabel}</div>
        )}
      </div>
    </div>
  );
};

// Hook personnalisé pour la navigation d'images
const useImageNavigation = (totalImages) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % totalImages);
  }, [totalImages]);

  const prev = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? totalImages - 1 : prev - 1));
  }, [totalImages]);

  const goTo = useCallback((index) => {
    setCurrentIndex(Math.min(Math.max(index, 0), totalImages - 1));
  }, [totalImages]);

  return { currentIndex, next, prev, goTo };
};

const useSwipe = (onSwipeLeft, onSwipeRight, threshold = MIN_SWIPE_DISTANCE) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;
    
    if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
    if (isRightSwipe && onSwipeRight) onSwipeRight();
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};

const LoadingSpinner = () => (
  <div style={styles.loadingContainer}>
    <div style={styles.spinner}></div>
    <p style={styles.loadingText}>Chargement du service...</p>
    <p style={styles.loadingSubtext}>Veuillez patienter</p>
  </div>
);

const ErrorDisplay = ({ error, onRetry }) => (
  <div style={styles.errorContainer}>
    <div style={styles.errorIcon}>❌</div>
    <h2 style={styles.errorTitle}>{error || 'Service non trouvé'}</h2>
    <p style={styles.errorMessage}>
      Le service que vous recherchez n'existe pas ou a été supprimé.
    </p>
    <div style={styles.errorActions}>
      <Link to="/services" style={styles.errorButton}>
        ← Retour aux services
      </Link>
      {onRetry && (
        <button onClick={onRetry} style={styles.retryButton}>
          Réessayer
        </button>
      )}
    </div>
  </div>
);

const FullscreenModal = ({ isOpen, onClose, medias, initialIndex, serviceName }) => {
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const { currentIndex, next, prev, goTo } = useImageNavigation(medias?.length || 0);
  
  const swipeHandlers = useSwipe(next, prev);

  useEffect(() => {
    if (initialIndex !== undefined) {
      goTo(initialIndex);
    }
  }, [initialIndex, goTo]);

  useEffect(() => {
    setZoomLevel(MIN_ZOOM);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch(e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowLeft': prev(); break;
        case 'ArrowRight': next(); break;
        case '+': zoomIn(); break;
        case '-': zoomOut(); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, next, prev, onClose]);

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  const resetZoom = () => {
    setZoomLevel(MIN_ZOOM);
  };

  const downloadImage = async () => {
    try {
      const url = medias[currentIndex];
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `service-${serviceName}-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>
            <MdPhotoLibrary style={styles.modalTitleIcon} />
            <span>
              Image {currentIndex + 1} sur {medias.length}
            </span>
          </div>
          <div style={styles.modalControls}>
            <button 
              onClick={zoomOut}
              style={styles.modalControlButton}
              disabled={zoomLevel <= MIN_ZOOM}
              title="Zoom arrière"
            >
              <MdZoomOut />
            </button>
            <button 
              onClick={zoomIn}
              style={styles.modalControlButton}
              disabled={zoomLevel >= MAX_ZOOM}
              title="Zoom avant"
            >
              <MdZoomIn />
            </button>
            <button 
              onClick={resetZoom}
              style={styles.modalControlButton}
              title="Réinitialiser"
            >
              <FiMinimize2 />
            </button>
            <button 
              onClick={downloadImage}
              style={styles.modalControlButton}
              title="Télécharger"
            >
              <FiDownload />
            </button>
            <button 
              onClick={onClose}
              style={styles.modalCloseButton}
              title="Fermer"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div 
          style={styles.modalImageContainer}
          {...swipeHandlers}
        >
          <img 
            src={medias[currentIndex]}
            alt={`${serviceName} - Vue agrandie`}
            style={{
              ...styles.modalImage,
              transform: `scale(${zoomLevel})`,
              cursor: zoomLevel > 1 ? 'grab' : 'default'
            }}
          />
          
          {medias.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); prev(); }}
                style={{...styles.modalNavButton, left: '20px'}}
                title="Image précédente"
              >
                <FiChevronLeft />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); next(); }}
                style={{...styles.modalNavButton, right: '20px'}}
                title="Image suivante"
              >
                <FiChevronRight />
              </button>
            </>
          )}
        </div>

        {medias.length > 1 && (
          <div style={styles.modalThumbnails}>
            <button 
              onClick={() => setShowThumbnails(!showThumbnails)}
              style={styles.toggleThumbnailsButton}
            >
              {showThumbnails ? 'Masquer' : 'Afficher'} les miniatures
            </button>
            
            {showThumbnails && (
              <div style={styles.modalThumbnailsContainer}>
                {medias.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => goTo(index)}
                    style={{
                      ...styles.modalThumbnail,
                      ...(index === currentIndex ? styles.modalThumbnailActive : {})
                    }}
                    title={`Voir l'image ${index + 1}`}
                  >
                    <img 
                      src={media}
                      alt={`Miniature ${index + 1}`}
                      style={styles.modalThumbnailImage}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoCard = ({ title, icon, children, style: customStyle }) => (
  <div style={{...styles.card, ...customStyle}}>
    <h2 style={styles.cardTitle}>
      {icon}
      {title}
    </h2>
    {children}
  </div>
);

export default function PublicServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { requireAuth, shouldOpenModal } = usePendingAction({
    redirectPath: `/service/${id}`,
  });

  const pendingOpenRef = useRef(shouldOpenModal());

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const isProvider = user?.isProvider || user?.role === 'prestataire' || user?.is_prestataire === true;

  const hasActivePromo = useMemo(() => {
    if (!service) return false;
    return isPromoActive(service);
  }, [service]);

  const discountPercentage = useMemo(() => {
    if (!service) return null;
    return calculateDiscount(service);
  }, [service]);

  const promoPeriod = useMemo(() => {
    if (!service) return null;
    return formatPromoPeriod(service);
  }, [service]);

  const openStatus = useMemo(() => {
    if (!service) return null;
    return getOpenStatus(service);
  }, [service]);

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

  const nextImage = () => {
    if (service?.medias?.length > 1) {
      setCurrentImageIndex(p => (p + 1) % service.medias.length);
    }
  };
  
  const prevImage = () => {
    if (service?.medias?.length > 1) {
      setCurrentImageIndex(p => p === 0 ? service.medias.length - 1 : p - 1);
    }
  };

  const openModal = (idx) => { 
    setModalImageIndex(idx); 
    setModalOpen(true); 
  };

  const handleRendezVous = () => {
    if (!user) {
      navigate('/login', { state: { from: `/rendez-vous/demande/${id}` } });
    } else {
      navigate(`/rendez-vous/demande/${id}`);
    }
  };

  if (loading) return (
    <div style={styles.container}>
      <LoadingSpinner />
    </div>
  );

  if (error || !service) return (
    <div style={styles.container}>
      <ErrorDisplay error={error} onRetry={fetchService} />
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

          {/* Colonne gauche — Images */}
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
              <InfoCard title="Entreprise" icon={<MdBusiness style={styles.cardTitleIcon} />}>
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
              </InfoCard>
            )}
          </div>

          {/* Colonne droite — Infos */}
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
                    <StarRating
                      rating={service.average_rating}
                      total={service.total_reviews}
                    />
              {service.descriptions && (
                <div style={styles.descriptionSection}>
                  <h3 style={styles.sectionSubtitle}><MdOutlineDescription style={styles.sectionIcon} />Description</h3>
                  <p style={styles.description}>{service.descriptions}</p>
                </div>
              )}
            </div>

            {/* Carte Prix & Horaires */}
            <InfoCard title="Tarification & Horaires" icon={<FiDollarSign style={styles.cardTitleIcon} />}>
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
            </InfoCard>

            {/* Disponibilité */}
            <InfoCard title="Disponibilité" icon={<FiClock style={styles.cardTitleIcon} />}>
              <div style={styles.infoList}>
                {openStatus && (
                  <div style={{
                    ...styles.infoItem,
                    backgroundColor: openStatus.bg,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    marginBottom: '1rem',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: openStatus.color }}>
                      <StatusIcon type={openStatus.icon} color={openStatus.color} size="1.2rem" />
                      {openStatus.label}
                    </span>
                    {openStatus.sublabel && (
                      <span style={{ color: openStatus.color, fontSize: '0.9rem' }}>{openStatus.sublabel}</span>
                    )}
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Contact & Rendez-vous */}
            {service.entreprise && (
              <InfoCard title="Contact & Rendez-vous" icon={<FiPhone style={styles.cardTitleIcon} />}>
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
                    
                  </div>
                ) : (
                  <div style={styles.lockedContactHint}>
                     Connectez-vous pour voir les coordonnées complètes.
                  </div>
                )}
              </InfoCard>
            )}

            {!isProvider && (
              <div style={styles.rendezVousSection}>
                <button
                  onClick={handleRendezVous}
                  style={styles.rendezVousButton}
                  className="rendez-vous-button"
                >
                  <FiCalendar size={20} />
                  <span>Prendre rendez-vous</span>
                </button>
              </div>
            )}

            {/* Info box */}
            <div style={styles.infoBox}>
              <FiInfo style={styles.infoBoxIcon} />
              <div>
                <h4 style={styles.infoBoxTitle}>Besoin d'aide ?</h4>
                <p style={styles.infoBoxText}>
                  Contactez directement le prestataire pour plus d'informations ou pour prendre rendez-vous.
                </p>
              </div>
            </div>

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

      {/* Modal Contact */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        entreprise={service?.entreprise}
        serviceName={service?.name}
        onChat={() => setShowChatModal(true)}
      />

      {/* Chat Modal */}
      {user && service?.entreprise && showChatModal && (
        <ChatModal
          receiverId={service.entreprise.prestataire_id}
          receiverName={service.entreprise.name || 'Prestataire'}
          onClose={() => setShowChatModal(false)}
        />
      )}

      {/* Modale galerie plein écran */}
      <FullscreenModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        medias={service?.medias}
        initialIndex={modalImageIndex}
        serviceName={service?.name}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
        @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
        
        .main-contact-btn { transition: all 0.25s ease; }
        .main-contact-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(239,68,68,0.25) !important; }
        
        /* Styles responsives */
        @media (max-width: 1024px) {
          .main-grid {
            grid-template-columns: 1fr 360px !important;
            gap: 1.5rem !important;
          }
        }
        
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          
          .service-name {
            font-size: 1.5rem !important;
          }
          
          .main-image-container {
            height: 300px !important;
          }
          
          .modal-controls {
            gap: 0.25rem !important;
          }
          
          .modal-control-button,
          .modal-close-button {
            width: 32px !important;
            height: 32px !important;
            font-size: 1rem !important;
          }
          
          .modal-nav-button {
            width: 40px !important;
            height: 40px !important;
            font-size: 1.5rem !important;
          }
          
          .modal-thumbnail {
            width: 50px !important;
            height: 50px !important;
          }
          
          .actions-card {
            flex-direction: column !important;
          }
          
          .info-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.5rem !important;
          }
        }
        
        @media (max-width: 640px) {
          .container {
            padding-top: 1rem !important;
            padding-bottom: 2rem !important;
          }
          
          .content {
            padding: 0 0.75rem !important;
          }
          
          .main-image-container {
            height: 250px !important;
          }
          
          .nav-button {
            width: 36px !important;
            height: 36px !important;
            font-size: 1.2rem !important;
          }
          
          .fullscreen-button {
            width: 32px !important;
            height: 32px !important;
            font-size: 1rem !important;
          }
          
          .image-counter {
            font-size: 0.75rem !important;
            padding: 0.25rem 0.75rem !important;
          }
          
          .thumbnail {
            width: 60px !important;
            height: 60px !important;
          }
          
          .card {
            padding: 1rem !important;
          }
          
          .card-title {
            font-size: 1.125rem !important;
          }
          
          .service-header {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          
          .service-name {
            font-size: 1.25rem !important;
          }
          
          .domaine-tag {
            font-size: 0.85rem !important;
            padding: 0.375rem 0.75rem !important;
          }
          
          .description {
            font-size: 0.9rem !important;
          }
          
          .main-contact-btn {
            padding: 0.875rem 1rem !important;
          }
          
          .main-contact-btn-icon {
            width: 40px !important;
            height: 40px !important;
            font-size: 1.25rem !important;
          }
          
          .main-contact-btn-label {
            font-size: 0.9rem !important;
          }
          
          .main-contact-btn-sub {
            font-size: 0.7rem !important;
          }
          
          .main-contact-btn-arrow {
            font-size: 1.4rem !important;
          }
          
          .rendez-vous-button {
            padding: 0.875rem !important;
            font-size: 0.9rem !important;
          }
          
          .info-box {
            padding: 1rem !important;
          }
          
          .info-box-title {
            font-size: 0.9rem !important;
          }
          
          .info-box-text {
            font-size: 0.8rem !important;
          }
          
          .action-button {
            padding: 0.75rem !important;
            font-size: 0.85rem !important;
          }
          
          .entreprise-link {
            padding: 0.75rem !important;
          }
          
          .entreprise-logo,
          .entreprise-logo-placeholder {
            width: 50px !important;
            height: 50px !important;
            font-size: 1.5rem !important;
          }
          
          .entreprise-name {
            font-size: 0.95rem !important;
          }
          
          .entreprise-details {
            font-size: 0.8rem !important;
          }
          
          .modal-header {
            padding: 0.75rem 1rem !important;
          }
          
          .modal-title {
            font-size: 0.875rem !important;
          }
          
          .modal-image-container {
            padding: 1rem !important;
          }
          
          .modal-thumbnails {
            padding: 0.75rem 1rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .main-image-container {
            height: 200px !important;
          }
          
          .nav-button {
            width: 30px !important;
            height: 30px !important;
            font-size: 1rem !important;
          }
          
          .thumbnail {
            width: 50px !important;
            height: 50px !important;
          }
          
          .price-value {
            font-size: 1rem !important;
          }
          
          .locked-contact-hint {
            font-size: 0.8rem !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { 
    minHeight: '100vh', 
    backgroundColor: '#f8fafc', 
    paddingTop: '2rem', 
    paddingBottom: '4rem',
    '@media (max-width: 640px)': {
      paddingTop: '1rem',
      paddingBottom: '2rem'
    }
  },
  content: { 
    maxWidth: '1200px', 
    margin: '0 auto', 
    padding: '0 1rem',
    '@media (max-width: 640px)': {
      padding: '0 0.75rem'
    }
  },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner: { width: '50px', height: '50px', border: '4px solid #dbeafe', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { color: '#64748b', fontSize: '1.125rem', margin: 0 },
  loadingSubtext: { color: '#94a3b8', fontSize: '0.875rem', margin: 0 },
  errorContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center' },
  errorIcon: { fontSize: '5rem', animation: 'pulse 2s infinite' },
  errorTitle: { fontSize: '1.75rem', color: '#1e293b', margin: 0 },
  errorMessage: { color: '#64748b', margin: 0 },
  errorActions: { display: 'flex', gap: '1rem', marginTop: '1rem', '@media (max-width: 480px)': { flexDirection: 'column' } },
  errorButton: { backgroundColor: '#3b82f6', color: '#fff', padding: '1rem 2rem', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: '600', border: 'none', cursor: 'pointer' },
  retryButton: { backgroundColor: '#fff', color: '#3b82f6', padding: '1rem 2rem', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: '600', border: '1px solid #3b82f6', cursor: 'pointer' },
  header: { marginBottom: '2rem', animation: 'fadeIn 0.5s ease-out' },
  backButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', textDecoration: 'none', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.5rem' },
  backButtonIcon: { fontSize: '1.25rem' },
  mainGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 400px', 
    gap: '2rem', 
    animation: 'fadeIn 0.5s ease-out 0.2s both',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr 360px',
      gap: '1.5rem'
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '1.5rem'
    }
  },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  galleryCard: { backgroundColor: '#fff', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0' },
  mainImageContainer: { 
    position: 'relative', 
    height: '400px', 
    backgroundColor: '#f1f5f9', 
    cursor: 'pointer', 
    overflow: 'hidden',
    '@media (max-width: 768px)': {
      height: '300px'
    },
    '@media (max-width: 640px)': {
      height: '250px'
    },
    '@media (max-width: 480px)': {
      height: '200px'
    }
  },
  mainImage: { width: '100%', height: '100%', objectFit: 'cover' },
  fullscreenButton: { 
    position: 'absolute', 
    top: '15px', 
    right: '15px', 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    color: '#fff', 
    border: 'none', 
    width: '40px', 
    height: '40px', 
    borderRadius: '50%', 
    fontSize: '1.2rem', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    '@media (max-width: 640px)': {
      width: '32px',
      height: '32px',
      fontSize: '1rem'
    }
  },
  navButton: { 
    position: 'absolute', 
    top: '50%', 
    transform: 'translateY(-50%)', 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    color: '#fff', 
    border: 'none', 
    width: '50px', 
    height: '50px', 
    borderRadius: '50%', 
    fontSize: '1.5rem', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    '@media (max-width: 640px)': {
      width: '36px',
      height: '36px',
      fontSize: '1.2rem'
    },
    '@media (max-width: 480px)': {
      width: '30px',
      height: '30px',
      fontSize: '1rem'
    }
  },
  imageCounter: { 
    position: 'absolute', 
    bottom: '15px', 
    right: '15px', 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    color: '#fff', 
    padding: '0.5rem 1rem', 
    borderRadius: '2rem', 
    fontSize: '0.9rem', 
    fontWeight: '600',
    '@media (max-width: 640px)': {
      fontSize: '0.75rem',
      padding: '0.25rem 0.75rem'
    }
  },
  thumbnailsContainer: { display: 'flex', gap: '0.75rem', padding: '1rem', overflowX: 'auto' },
  thumbnail: { 
    width: '80px', 
    height: '80px', 
    borderRadius: '0.5rem', 
    overflow: 'hidden', 
    border: '3px solid transparent', 
    cursor: 'pointer', 
    flexShrink: 0, 
    padding: 0, 
    backgroundColor: 'transparent',
    '@media (max-width: 640px)': {
      width: '60px',
      height: '60px'
    },
    '@media (max-width: 480px)': {
      width: '50px',
      height: '50px'
    }
  },
  thumbnailActive: { borderColor: '#3b82f6' },
  thumbnailImage: { width: '100%', height: '100%', objectFit: 'cover' },
  imageCountBadge: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '2rem', fontSize: '0.875rem', alignSelf: 'flex-start' },
  imageCountIcon: { fontSize: '1rem' },
  noImageCard: { backgroundColor: '#fff', borderRadius: '1rem', border: '2px dashed #e2e8f0', padding: '4rem 2rem', textAlign: 'center' },
  noImageIcon: { fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 },
  noImageText: { color: '#64748b', fontSize: '1.125rem', margin: 0 },
  card: { 
    backgroundColor: '#fff', 
    padding: '1.5rem', 
    borderRadius: '1rem', 
    border: '1px solid #e2e8f0',
    '@media (max-width: 640px)': {
      padding: '1rem'
    }
  },
  cardTitle: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem', 
    fontSize: '1.25rem', 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: '1rem', 
    borderBottom: '2px solid #f1f5f9', 
    paddingBottom: '0.75rem',
    '@media (max-width: 640px)': {
      fontSize: '1.125rem'
    }
  },
  cardTitleIcon: { fontSize: '1.5rem', color: '#3b82f6' },
  serviceHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: '1rem',
    '@media (max-width: 640px)': {
      flexDirection: 'column',
      gap: '0.75rem'
    }
  },
  serviceName: { 
    fontSize: '2rem', 
    fontWeight: 'bold', 
    color: '#1e293b', 
    margin: 0, 
    flex: 1,
    '@media (max-width: 768px)': {
      fontSize: '1.5rem'
    },
    '@media (max-width: 640px)': {
      fontSize: '1.25rem'
    }
  },
  favoriteButton: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' },
  domaineTag: { 
    display: 'inline-block', 
    backgroundColor: '#dbeafe', 
    color: '#3b82f6', 
    padding: '0.5rem 1rem', 
    borderRadius: '2rem', 
    fontSize: '0.95rem', 
    fontWeight: '600', 
    marginBottom: '1.5rem',
    '@media (max-width: 640px)': {
      fontSize: '0.85rem',
      padding: '0.375rem 0.75rem'
    }
  },
  descriptionSection: { marginTop: '1.5rem' },
  sectionSubtitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem' },
  sectionIcon: { fontSize: '1.25rem', color: '#3b82f6' },
  description: { 
    color: '#64748b', 
    fontSize: '1rem', 
    lineHeight: '1.8', 
    whiteSpace: 'pre-wrap', 
    margin: 0,
    '@media (max-width: 640px)': {
      fontSize: '0.9rem'
    }
  },
  infoList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  infoItem: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingBottom: '1rem', 
    borderBottom: '1px solid #e2e8f0',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '0.5rem'
    }
  },
  infoLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#64748b' },
  infoIcon: { fontSize: '1rem' },
  infoValue: { color: '#1e293b', fontWeight: '600' },
  priceValue: { 
    color: '#10b981', 
    fontWeight: '700', 
    fontSize: '1.25rem',
    '@media (max-width: 480px)': {
      fontSize: '1rem'
    }
  },
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
    marginBottom: '1rem',
    '@media (max-width: 640px)': {
      padding: '0.875rem 1rem'
    }
  },
  mainContactBtnIcon: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    '@media (max-width: 640px)': {
      width: '40px',
      height: '40px',
      fontSize: '1.25rem'
    }
  },
  mainContactBtnText: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  mainContactBtnLabel: { 
    fontSize: '1rem', 
    fontWeight: '700', 
    color: '#fff',
    '@media (max-width: 640px)': {
      fontSize: '0.9rem'
    }
  },
  mainContactBtnSub: { 
    fontSize: '0.75rem', 
    color: 'rgba(255,255,255,0.8)',
    '@media (max-width: 640px)': {
      fontSize: '0.7rem'
    }
  },
  mainContactBtnArrow: { 
    fontSize: '1.6rem', 
    color: 'rgba(255,255,255,0.7)',
    '@media (max-width: 640px)': {
      fontSize: '1.4rem'
    }
  },
  contactInfoList: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' },
  contactInfoItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1e293b' },
  contactInfoIcon: { color: '#3b82f6', fontSize: '1rem' },
  lockedContactHint: { 
    padding: '1rem', 
    backgroundColor: '#f1f5f9', 
    borderRadius: '0.75rem', 
    color: '#64748b', 
    fontSize: '0.9rem', 
    textAlign: 'center', 
    marginTop: '0.5rem',
    '@media (max-width: 480px)': {
      fontSize: '0.8rem'
    }
  },
  rendezVousSection: { marginTop: '1rem' },
  rendezVousButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '1rem',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '@media (max-width: 640px)': {
      padding: '0.875rem',
      fontSize: '0.9rem'
    }
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: '1.25rem',
    borderRadius: '0.75rem',
    border: '1px solid #bfdbfe',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    '@media (max-width: 640px)': {
      padding: '1rem'
    }
  },
  infoBoxIcon: { fontSize: '1.5rem', color: '#3b82f6', flexShrink: 0 },
  infoBoxTitle: { 
    margin: '0 0 0.25rem 0', 
    fontSize: '1rem', 
    fontWeight: '600', 
    color: '#1e293b',
    '@media (max-width: 640px)': {
      fontSize: '0.9rem'
    }
  },
  infoBoxText: { 
    margin: 0, 
    fontSize: '0.875rem', 
    color: '#475569',
    '@media (max-width: 640px)': {
      fontSize: '0.8rem'
    }
  },
  actionsCard: { 
    display: 'flex', 
    gap: '0.75rem',
    '@media (max-width: 768px)': {
      flexDirection: 'column'
    }
  },
  actionButton: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '0.5rem', 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    border: '1px solid #e2e8f0', 
    padding: '0.875rem', 
    borderRadius: '0.75rem', 
    color: '#475569', 
    fontWeight: '600', 
    cursor: 'pointer', 
    fontSize: '0.95rem',
    '@media (max-width: 640px)': {
      padding: '0.75rem',
      fontSize: '0.85rem'
    }
  },
  entrepriseLink: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    textDecoration: 'none', 
    padding: '1rem', 
    backgroundColor: '#f8fafc', 
    borderRadius: '0.75rem', 
    border: '1px solid #e2e8f0',
    '@media (max-width: 640px)': {
      padding: '0.75rem'
    }
  },
  entrepriseInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
  entrepriseLogo: { 
    width: '60px', 
    height: '60px', 
    borderRadius: '0.75rem', 
    objectFit: 'cover',
    '@media (max-width: 640px)': {
      width: '50px',
      height: '50px'
    }
  },
  entrepriseLogoPlaceholder: { 
    width: '60px', 
    height: '60px', 
    borderRadius: '0.75rem', 
    backgroundColor: '#dbeafe', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '2rem',
    '@media (max-width: 640px)': {
      width: '50px',
      height: '50px',
      fontSize: '1.5rem'
    }
  },
  entrepriseName: { 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: '0.25rem',
    '@media (max-width: 640px)': {
      fontSize: '0.95rem'
    }
  },
  entrepriseDetails: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.375rem', 
    color: '#64748b', 
    fontSize: '0.9rem',
    '@media (max-width: 640px)': {
      fontSize: '0.8rem'
    }
  },
  detailIcon: { fontSize: '1rem' },
  viewLink: { color: '#3b82f6', fontWeight: '600' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modalContent: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' },
  modalHeader: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    padding: '1rem 2rem', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', 
    color: '#fff', 
    zIndex: 10,
    '@media (max-width: 640px)': {
      padding: '0.75rem 1rem'
    }
  },
  modalTitle: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem', 
    fontSize: '1rem',
    '@media (max-width: 640px)': {
      fontSize: '0.875rem'
    }
  },
  modalTitleIcon: { fontSize: '1.25rem' },
  modalControls: { 
    display: 'flex', 
    gap: '0.5rem',
    '@media (max-width: 768px)': {
      gap: '0.25rem'
    }
  },
  modalControlButton: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    color: '#fff', 
    border: 'none', 
    width: '40px', 
    height: '40px', 
    borderRadius: '50%', 
    fontSize: '1.2rem', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      width: '32px',
      height: '32px',
      fontSize: '1rem'
    }
  },
  modalCloseButton: { 
    backgroundColor: '#ef4444', 
    color: '#fff', 
    border: 'none', 
    width: '40px', 
    height: '40px', 
    borderRadius: '50%', 
    fontSize: '1.2rem', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      width: '32px',
      height: '32px',
      fontSize: '1rem'
    }
  },
  modalImageContainer: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' },
  modalImage: { maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', objectFit: 'contain', borderRadius: '0.5rem', transition: 'transform 0.3s ease' },
  modalNavButton: { 
    position: 'absolute', 
    top: '50%', 
    transform: 'translateY(-50%)', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    color: '#fff', 
    border: 'none', 
    width: '60px', 
    height: '60px', 
    borderRadius: '50%', 
    fontSize: '2rem', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      width: '40px',
      height: '40px',
      fontSize: '1.5rem'
    }
  },
  modalThumbnails: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: '1rem 2rem', 
    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '0.5rem', 
    zIndex: 10,
    '@media (max-width: 640px)': {
      padding: '0.75rem 1rem'
    }
  },
  toggleThumbnailsButton: { backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', cursor: 'pointer', alignSelf: 'center' },
  modalThumbnailsContainer: { display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0', justifyContent: 'center' },
  modalThumbnail: { 
    width: '60px', 
    height: '60px', 
    borderRadius: '0.5rem', 
    overflow: 'hidden', 
    border: '3px solid transparent', 
    cursor: 'pointer', 
    padding: 0, 
    backgroundColor: 'transparent',
    '@media (max-width: 768px)': {
      width: '50px',
      height: '50px'
    }
  },
  modalThumbnailActive: { borderColor: '#3b82f6' },
  modalThumbnailImage: { width: '100%', height: '100%', objectFit: 'cover' },
};