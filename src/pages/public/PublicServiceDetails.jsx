import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../../api/publicApi';
import ChatButton from '../../components/Chat/ChatButton';
import theme from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext'; 
import { 
  FiArrowLeft, FiMapPin, FiClock, FiDollarSign, 
  FiPhone, FiMail, FiNavigation, FiShare2, FiHeart,
  FiCalendar, FiInfo, FiChevronLeft, FiChevronRight,
  FiX, FiMaximize2, FiMinimize2, FiDownload, FiExternalLink,
  FiCheckCircle, FiAlertCircle, FiStar, FiAward
} from 'react-icons/fi';
import {
  MdBusiness, MdOutlineWork, MdOutlineDescription,
  MdOutlineAccessTime, MdOutlineWhatsapp, MdOutlineLocationOn,
  MdPhotoLibrary, MdZoomIn, MdZoomOut, MdRotateRight,
  MdVerified, MdOutlineDiscount, MdOutlineLocalOffer,
  MdOutlineSchedule, MdOutlineContactSupport
} from 'react-icons/md';
import { 
  FaRegClock, FaRegCalendarAlt, FaDoorOpen, FaDoorClosed,
  FaQuestionCircle, FaCheckCircle, FaTimesCircle 
} from 'react-icons/fa';
import { HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineQuestionMarkCircle } from 'react-icons/hi';

// CONSTANTES (en dehors du composant)
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

// FONCTIONS UTILITAIRES (en dehors du composant)
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

    // Aujourd'hui ouvert — vérifier l'heure
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

    // Gestion horaires traversant minuit
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

// COMPOSANTS (en dehors du composant principal)

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

const ImageGallery = ({ medias, serviceName, hasPromo, discount, onImageClick }) => {
  const { currentIndex, next, prev, goTo } = useImageNavigation(medias?.length || 0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [autoPlayInterval, setAutoPlayInterval] = useState(null);

  useEffect(() => {
    if (medias?.length >= 2 && autoPlay) {
      const interval = setInterval(() => {
        next();
      }, 4000); 
      
      setAutoPlayInterval(interval);
      
      return () => clearInterval(interval);
    } else {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        setAutoPlayInterval(null);
      }
    }
  }, [medias?.length, autoPlay, next]);

  const handleUserInteraction = () => {
    if (autoPlay) {
      setAutoPlay(false);
    }
  };

  useEffect(() => {
    if (!autoPlay && medias?.length >= 2) {
      const timeout = setTimeout(() => {
        setAutoPlay(true);
      }, 10000);
      
      return () => clearTimeout(timeout);
    }
  }, [autoPlay, medias?.length]);

  // Gestionnaires d'événements pour les interactions utilisateur
  const handlePrevClick = (e) => {
    e.stopPropagation();
    prev();
    handleUserInteraction();
  };

  const handleNextClick = (e) => {
    e.stopPropagation();
    next();
    handleUserInteraction();
  };

  const handleThumbnailClick = (index) => {
    goTo(index);
    handleUserInteraction();
  };

  const handleImageClick = (index) => {
    onImageClick(index);
    handleUserInteraction();
  };

  if (!medias?.length) {
    return (
      <div style={styles.noImageCard}>
        <div style={styles.noImageIcon}>📸</div>
        <p style={styles.noImageText}>Aucune image disponible</p>
        <p style={styles.noImageSubtext}>Le prestataire n'a pas encore ajouté d'images</p>
      </div>
    );
  }

  return (
    <div style={styles.galleryCard}>
      <div style={styles.mainImageContainer}>
        <img 
          src={medias[currentIndex]}
          alt={`${serviceName} - Image ${currentIndex + 1}`}
          style={styles.mainImage}
          loading="lazy"
          onClick={() => handleImageClick(currentIndex)}
        />
        
        <button 
          style={styles.fullscreenButton}
          onClick={() => handleImageClick(currentIndex)}
          title="Voir en plein écran"
        >
          <FiMaximize2 />
        </button>
        
        {hasPromo && (
          <div style={styles.promoBadge}>
            <MdOutlineLocalOffer />
            <span>-{discount}%</span>
          </div>
        )}
        
        {/* Compteur d'images */}
        <div style={styles.imageCounter}>
          {currentIndex + 1} / {medias.length}
        </div>
        
        {medias.length > 1 && (
          <>
            <button 
              onClick={handlePrevClick}
              style={{...styles.navButton, left: '10px'}}
              title="Image précédente"
            >
              <FiChevronLeft />
            </button>
            <button 
              onClick={handleNextClick}
              style={{...styles.navButton, right: '10px'}}
              title="Image suivante"
            >
              <FiChevronRight />
            </button>
          </>
        )}
      </div>
      
      {/* Miniatures avec indicateur de progression */}
      {medias.length > 1 && (
        <div style={styles.thumbnailsContainer}>
          {medias.map((media, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              style={{
                ...styles.thumbnail,
                ...(index === currentIndex ? styles.thumbnailActive : {})
              }}
              title={`Voir l'image ${index + 1}`}
            >
              <img 
                src={media}
                alt={`Miniature ${index + 1}`}
                style={styles.thumbnailImage}
                loading="lazy"
              />
              {/* Barre de progression pour l'image active */}
              {index === currentIndex && medias.length >= 2 && autoPlay && (
                <div style={styles.thumbnailProgress}>
                  <div style={styles.thumbnailProgressBar}></div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Barre de progression principale (pour les images) */}
      {medias.length >= 2 && autoPlay && (
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressBarFill,
              animation: 'progress 4s linear infinite'
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

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

const InfoCard = ({ title, icon, children, className }) => (
  <div style={{...styles.card, ...className}}>
    <h2 style={styles.cardTitle}>
      {icon}
      {title}
    </h2>
    {children}
  </div>
);

const ContactButtons = ({ entreprise, serviceName, onContact }) => {
  if (!entreprise) return null;

  const buttons = [
    {
      id: 'phone',
      icon: <FiPhone />,
      title: 'Appeler',
      subtitle: entreprise.call_phone || 'Non disponible',
      onClick: () => onContact('phone'),
      disabled: !entreprise.call_phone,
      style: {}
    },
    {
      id: 'chat',
      component: (
        <ChatButton
          key="chat"
          receiverId={entreprise.prestataire_id}
          receiverName={entreprise.name}
          buttonText="Message"
          variant="secondary"
          fullWidth
          style={styles.contactButton}
        />
      )
    },
    {
      id: 'whatsapp',
      icon: <MdOutlineWhatsapp />,
      title: 'WhatsApp',
      subtitle: 'Message direct',
      onClick: () => onContact('whatsapp'),
      disabled: !entreprise.whatsapp_phone,
      style: styles.whatsappButton
    },
    {
      id: 'maps',
      icon: <FiNavigation />,
      title: 'Itinéraire',
      subtitle: 'Google Maps',
      onClick: () => onContact('maps'),
      disabled: !entreprise.siege,
      style: {}
    }
  ];

  return (
    <InfoCard title="Contact & Rendez-vous" icon={<FiPhone style={styles.cardTitleIcon} />}>
      <div style={styles.contactButtons}>
        {buttons.map(btn => (
          btn.component || (
            <button
              key={btn.id}
              onClick={btn.onClick}
              disabled={btn.disabled}
              style={{...styles.contactButton, ...btn.style}}
            >
              <span style={styles.contactButtonIcon}>{btn.icon}</span>
              <div>
                <div style={styles.contactButtonTitle}>{btn.title}</div>
                <div style={styles.contactButtonSubtitle}>{btn.subtitle}</div>
              </div>
            </button>
          )
        ))}
      </div>
    </InfoCard>
  );
};

// COMPOSANT PRINCIPAL
export default function PublicServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ Appel du hook ici, dans le corps du composant
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [openStatus, setOpenStatus] = useState(null);

  // Vérifier si l'utilisateur est prestataire
  const isProvider = user?.isProvider || user?.role === 'prestataire' || user?.is_prestataire === true;

  // MÉMOÏSATION DES DONNÉES
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

  const descriptionPreview = useMemo(() => {
    if (!service?.descriptions) return '';
    const words = service.descriptions.split(' ');
    if (words.length > 50 && !showFullDescription) {
      return words.slice(0, 50).join(' ') + '...';
    }
    return service.descriptions;
  }, [service?.descriptions, showFullDescription]);

  useEffect(() => {
    fetchService();
    
    const favorites = JSON.parse(localStorage.getItem('favoriteServices') || '[]');
    setIsFavorite(favorites.includes(id));
    
    const interval = setInterval(() => {
      if (service) {
        setOpenStatus(getOpenStatus(service));
      }
    }, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    if (service) {
      setOpenStatus(getOpenStatus(service));
    }
  }, [service]);

  // FONCTIONS
  const fetchService = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await publicApi.getService(id);
      setService(data);
    } catch (err) {
      console.error('Erreur chargement service:', err);
      setError('Service non trouvé');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteServices') || '[]');
    
    if (isFavorite) {
      const newFavorites = favorites.filter(favId => favId !== id);
      localStorage.setItem('favoriteServices', JSON.stringify(newFavorites));
    } else {
      favorites.push(id);
      localStorage.setItem('favoriteServices', JSON.stringify(favorites));
    }
    
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    const shareData = {
      title: service.name,
      text: `Découvrez ce service sur notre plateforme : ${service.name}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Erreur partage:', err);
          fallbackShare();
        }
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        alert('Lien copié dans le presse-papiers !');
      })
      .catch(err => {
        console.error('Erreur copie:', err);
        prompt('Copiez ce lien :', window.location.href);
      });
  };

  const handleContact = (method) => {
    if (!service?.entreprise) return;

    const { phone, email, siege, prestataire_id } = service.entreprise;

    switch(method) {
      case 'phone':
        if (phone) window.location.href = `tel:${phone}`;
        break;
      case 'email':
        if (email) window.location.href = `mailto:${email}?subject=Question%20sur%20le%20service%20:${service.name}`;
        break;
      case 'whatsapp':
        if (phone) {
          const message = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre service : ${service.name}`);
          window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
        }
        break;
      case 'maps':
        if (siege) {
          const address = encodeURIComponent(siege);
          window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
        }
        break;
      default:
        break;
    }
  };

  const openFullscreen = (index) => {
    setModalImageIndex(index);
    setModalOpen(true);
  };

  const handleRendezVous = () => {
    if (!user) {
      // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
      navigate('/login', { state: { from: `/rendez-vous/demande/${id}` } });
    } else {
      navigate(`/rendez-vous/demande/${id}`);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div style={styles.container}>
        <ErrorDisplay error={error} onRetry={fetchService} />
      </div>
    );
  }

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

        {/* Main Grid */}
        <div style={styles.mainGrid}>
          {/* Colonne gauche */}
          <div style={styles.leftColumn}>
            <ImageGallery
              medias={service.medias}
              serviceName={service.name}
              hasPromo={hasActivePromo}
              discount={discountPercentage}
              onImageClick={openFullscreen}
            />

            {service.entreprise && (
              <InfoCard title="Entreprise" icon={<MdBusiness style={styles.cardTitleIcon} />}>
                <Link 
                  to={`/entreprises/${service.entreprise.id}`}
                  style={styles.entrepriseLink}
                >
                  <div style={styles.entrepriseInfo}>
                    {service.entreprise.logo ? (
                      <img 
                        src={service.entreprise.logo}
                        alt={service.entreprise.name}
                        style={styles.entrepriseLogo}
                        loading="lazy"
                      />
                    ) : (
                      <div style={styles.entrepriseLogoPlaceholder}>
                        <MdBusiness style={styles.entrepriseLogoPlaceholderIcon} />
                      </div>
                    )}
                    <div style={styles.entrepriseDetails}>
                      <div style={styles.entrepriseName}>
                        {service.entreprise.name}
                        {service.entreprise.is_verified && (
                          <MdVerified style={styles.verifiedIcon} title="Entreprise vérifiée" />
                        )}
                      </div>
                      <div style={styles.entrepriseLocation}>
                        <MdOutlineLocationOn style={styles.locationIcon} />
                        {service.entreprise.siege || 'Localisation non renseignée'}
                      </div>
                      {service.entreprise.rating && (
                        <div style={styles.entrepriseRating}>
                          <FiStar style={styles.starIcon} />
                          <span>{service.entreprise.rating.toFixed(1)}</span>
                          <span style={styles.ratingCount}>({service.entreprise.rating_count} avis)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={styles.viewLink}>Voir le profil →</span>
                </Link>
              </InfoCard>
            )}
          </div>

          {/* Colonne droite */}
          <div style={styles.rightColumn}>
            {/* Carte principale */}
            <InfoCard title="Détails du service" icon={<MdOutlineWork style={styles.cardTitleIcon} />}>
              <div style={styles.serviceHeader}>
                <h1 style={styles.serviceName}>{service.name}</h1>
                <div style={styles.serviceActions}>
                  <button 
                    onClick={toggleFavorite}
                    style={styles.actionIconButton}
                    title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <FiHeart style={{
                      color: isFavorite ? '#ef4444' : '#94a3b8',
                      fill: isFavorite ? '#ef4444' : 'none',
                    }} />
                  </button>
                  <button 
                    onClick={handleShare}
                    style={styles.actionIconButton}
                    title="Partager"
                  >
                    <FiShare2 />
                  </button>
                </div>
              </div>
              
              {service.domaine && (
                <div style={styles.domaineTag}>
                  {service.domaine.name}
                </div>
              )}

              {/* Badge de statut d'ouverture */}
              {openStatus && <StatusBadge status={openStatus} />}

              {service.descriptions && (
                <div style={styles.descriptionSection}>
                  <h3 style={styles.sectionSubtitle}>
                    <MdOutlineDescription style={styles.sectionIcon} />
                    Description
                  </h3>
                  <p style={styles.description}>{descriptionPreview}</p>
                  {service.descriptions.split(' ').length > 50 && (
                    <button 
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      style={styles.readMoreButton}
                    >
                      {showFullDescription ? 'Voir moins' : 'Voir plus'}
                    </button>
                  )}
                </div>
              )}
            </InfoCard>

            {/* Carte Tarification */}
            <InfoCard title="Tarification" icon={<FiDollarSign style={styles.cardTitleIcon} />}>
              <div style={styles.infoList}>
                {service.is_price_on_request ? (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>
                      <FiInfo style={styles.infoIcon} />
                      Prix
                    </span>
                    <div style={styles.priceOnRequest}>
                      <FiInfo />
                      <span>Sur devis</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        <FiDollarSign style={styles.infoIcon} />
                        Prix
                      </span>
                      {hasActivePromo ? (
                        <div style={styles.pricePromoContainer}>
                          <span style={styles.promoPrice}>
                            {formatPrice(service.price_promo)}
                          </span>
                          <span style={styles.originalPrice}>
                            {formatPrice(service.price)}
                          </span>
                          <span style={styles.discountBadge}>
                            -{discountPercentage}%
                          </span>
                        </div>
                      ) : (
                        <span style={styles.priceValue}>
                          {formatPrice(service.price)}
                        </span>
                      )}
                    </div>

                    {hasActivePromo && promoPeriod && (
                      <div style={styles.promoPeriod}>
                        <MdOutlineLocalOffer style={styles.promoIcon} />
                        <span>Promotion valable {promoPeriod}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </InfoCard>

            <InfoCard title="Disponibilité" icon={<FiClock style={styles.cardTitleIcon} />}>
              <div style={styles.infoList}>
                {/* Statut actuel */}
                {openStatus && (
                  <div style={{
                    ...styles.infoItem,
                    backgroundColor: openStatus.bg,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    marginBottom: '1rem',
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

                {/* Horaires du jour */}
                {openStatus?.todayHours && openStatus.todayHours !== 'Fermé' && openStatus.todayHours !== 'Non défini' && (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>
                      <FiCalendar style={styles.infoIcon} />
                      Aujourd'hui
                    </span>
                    <span style={{ ...styles.infoValue, color: openStatus.color }}>
                      {openStatus.todayHours}
                    </span>
                  </div>
                )}

                {/* Détail par jour */}
                {service.schedule && Object.keys(service.schedule).length > 0 && (
                  <div style={styles.scheduleDetails}>
                    <h4 style={styles.scheduleTitle}>
                      <MdOutlineSchedule style={styles.scheduleIcon} />
                      Horaires de la semaine
                    </h4>
                    {DAYS_ORDER.map(key => {
                      const day = service.schedule[key];
                      const isToday = key === JS_DAY_TO_KEY[new Date().getDay()];
                      
                      return (
                        <div key={key} style={{
                          ...styles.scheduleItem,
                          backgroundColor: isToday ? '#f1f5f9' : 'transparent',
                          fontWeight: isToday ? '600' : '400',
                        }}>
                          <span style={styles.scheduleDay}>
                            {KEY_TO_FR[key]}
                            {isToday && ' (Aujourd\'hui)'}
                          </span>
                          {day?.is_open && day.start && day.end ? (
                            <span style={styles.scheduleTime}>
                              {day.start} - {day.end}
                            </span>
                          ) : (
                            <span style={styles.scheduleClosed}>Fermé</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Carte Contact */}
            <ContactButtons 
              entreprise={service.entreprise} 
              serviceName={service.name}
              onContact={handleContact}
            />

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
          </div>
        </div>
      </div>

      {/* Modale plein écran */}
      <FullscreenModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        medias={service.medias}
        initialIndex={modalImageIndex}
        serviceName={service.name}
      />

      {/* Styles CSS-in-JS avec animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        @keyframes progress {
          0% {
            transform: scaleX(0);
          }
          100% {
            transform: scaleX(1);
          }
        }
        
        @keyframes pulseDot {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// STYLES
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    paddingTop: '2rem',
    paddingBottom: '4rem',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
  },
  
  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
    animation: 'fadeIn 0.5s ease-out',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #dbeafe',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '1.125rem',
    fontWeight: '500',
  },
  loadingSubtext: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },

  // Error
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1.5rem',
    textAlign: 'center',
    animation: 'scaleIn 0.5s ease-out',
  },
  errorIcon: {
    fontSize: '5rem',
    animation: 'pulse 2s infinite',
  },
  errorTitle: {
    fontSize: '1.75rem',
    color: '#1e293b',
    margin: 0,
  },
  errorMessage: {
    color: '#64748b',
    fontSize: '1rem',
    maxWidth: '400px',
  },
  errorActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  errorButton: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    padding: '1rem 2rem',
    borderRadius: '0.75rem',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#2563eb',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px -4px rgba(59,130,246,0.3)',
    },
  },
  retryButton: {
    backgroundColor: '#fff',
    color: '#3b82f6',
    padding: '1rem 2rem',
    borderRadius: '0.75rem',
    border: '2px solid #3b82f6',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#eff6ff',
      transform: 'translateY(-2px)',
    },
  },

  // Header
  header: {
    marginBottom: '2rem',
    animation: 'slideIn 0.5s ease-out',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: '600',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#eff6ff',
      transform: 'translateX(-4px)',
    },
  },
  backButtonIcon: {
    fontSize: '1.25rem',
  },

  // Main Grid
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '2rem',
    animation: 'fadeIn 0.5s ease-out 0.2s both',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr 350px',
      gap: '1.5rem',
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '1rem',
    },
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },

  // Gallery
  galleryCard: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    animation: 'fadeIn 0.5s ease-out',
    transition: 'all 0.3s ease',
    ':hover': {
      boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.15)',
    },
  },
  mainImageContainer: {
    position: 'relative',
    height: '400px',
    backgroundColor: '#f1f5f9',
    cursor: 'pointer',
    overflow: 'hidden',
    '@media (max-width: 768px)': {
      height: '300px',
    },
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
    ':hover': {
      transform: 'scale(1.05)',
    },
  },
  fullscreenButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    transition: 'all 0.2s ease',
    opacity: 0.8,
    zIndex: 5,
    ':hover': {
      opacity: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      transform: 'scale(1.1)',
    },
  },
  promoBadge: {
    position: 'absolute',
    top: '15px',
    left: '15px',
    backgroundColor: '#dc2626',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    boxShadow: '0 4px 6px rgba(220, 38, 38, 0.3)',
    zIndex: 5,
    animation: 'pulse 2s infinite',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    transition: 'all 0.2s ease',
    opacity: 0,
    animation: 'fadeIn 0.3s ease forwards',
    zIndex: 5,
    ':hover': {
      opacity: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      transform: 'translateY(-50%) scale(1.1)',
    },
  },
  imageCounter: {
    position: 'absolute',
    bottom: '15px',
    right: '15px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '2rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    backdropFilter: 'blur(4px)',
    zIndex: 5,
  },
  
  // Nouveaux styles pour le défilement automatique
  autoPlayIndicator: {
    position: 'absolute',
    top: '15px',
    right: '60px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '999px',
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#fff',
    zIndex: 5,
    backdropFilter: 'blur(4px)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  autoPlayIndicatorDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    animation: 'pulseDot 1.5s ease-in-out infinite',
  },
  autoPlayIndicatorText: {
    fontSize: '0.65rem',
    fontWeight: '600',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
  },
  progressBarFill: {
    height: '100%',
    width: '100%',
    backgroundColor: '#3b82f6',
    transformOrigin: 'left',
  },
  thumbnailProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  thumbnailProgressBar: {
    height: '100%',
    width: '100%',
    backgroundColor: '#3b82f6',
    transformOrigin: 'left',
  },
  
  thumbnailsContainer: {
    display: 'flex',
    gap: '0.75rem',
    padding: '1rem',
    overflowX: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: '#3b82f6 #e2e8f0',
    '::-webkit-scrollbar': {
      height: '6px',
    },
    '::-webkit-scrollbar-track': {
      background: '#e2e8f0',
      borderRadius: '3px',
    },
    '::-webkit-scrollbar-thumb': {
      background: '#3b82f6',
      borderRadius: '3px',
    },
  },
  thumbnail: {
    position: 'relative',
    width: '80px',
    height: '80px',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    border: '3px solid transparent',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
    },
  },
  thumbnailActive: {
    borderColor: '#3b82f6',
    transform: 'scale(1.05)',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imageCountBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: '#fff',
    borderRadius: '2rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    alignSelf: 'flex-start',
    marginTop: '0.5rem',
    animation: 'fadeIn 0.5s ease-out',
  },
  imageCountIcon: {
    fontSize: '1rem',
  },
  noImageCard: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    border: '2px dashed #e2e8f0',
    padding: '4rem 2rem',
    textAlign: 'center',
    animation: 'fadeIn 0.5s ease-out',
  },
  noImageIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  noImageText: {
    color: '#64748b',
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  noImageSubtext: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    animation: 'fadeIn 0.5s ease-out',
    transition: 'all 0.3s ease',
    ':hover': {
      boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-2px)',
    },
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
  },
  cardTitleIcon: {
    fontSize: '1.5rem',
    color: '#3b82f6',
  },

  // Service Header
  serviceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  serviceName: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    flex: 1,
    '@media (max-width: 768px)': {
      fontSize: '1.5rem',
    },
  },
  serviceActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionIconButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    color: '#64748b',
    ':hover': {
      backgroundColor: '#f1f5f9',
      transform: 'scale(1.1)',
    },
    ':active': {
      transform: 'scale(0.9)',
    },
  },
  domaineTag: {
    display: 'inline-block',
    backgroundColor: '#dbeafe',
    color: '#3b82f6',
    padding: '0.5rem 1rem',
    borderRadius: '2rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#bfdbfe',
      transform: 'scale(1.02)',
    },
  },

  // Description
  descriptionSection: {
    marginTop: '1.5rem',
  },
  sectionSubtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '0.75rem',
  },
  sectionIcon: {
    fontSize: '1.25rem',
    color: '#3b82f6',
  },
  description: {
    color: '#475569',
    fontSize: '1rem',
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap',
    marginBottom: '0.5rem',
  },
  readMoreButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: '0.25rem 0',
    transition: 'all 0.2s ease',
    ':hover': {
      color: '#2563eb',
      textDecoration: 'underline',
    },
  },

  // Info List
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e2e8f0',
    ':last-child': {
      borderBottom: 'none',
      paddingBottom: 0,
    },
  },
  infoLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    color: '#64748b',
  },
  infoIcon: {
    fontSize: '1rem',
    color: '#94a3b8',
  },
  infoValue: {
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
  },

  // Prix
  priceValue: {
    color: '#059669',
    fontWeight: '700',
    fontSize: '1.25rem',
  },
  pricePromoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.25rem',
  },
  promoPrice: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: '1.25rem',
  },
  originalPrice: {
    color: '#94a3b8',
    fontWeight: '500',
    fontSize: '0.9rem',
    textDecoration: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#dc2626',
    color: '#fff',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  priceOnRequest: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#f97316',
    backgroundColor: '#fff7ed',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  promoPeriod: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginTop: '0.5rem',
  },
  promoIcon: {
    fontSize: '1.2rem',
  },

  // Badges
  badgeSuccess: {
    backgroundColor: '#d1fae5',
    color: '#059669',
    padding: '0.25rem 0.75rem',
    borderRadius: '2rem',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  badgeWarning: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
    padding: '0.25rem 0.75rem',
    borderRadius: '2rem',
    fontSize: '0.875rem',
    fontWeight: '600',
  },

  // Schedule
  scheduleDetails: {
    marginTop: '0.5rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
  },
  scheduleTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.75rem',
  },
  scheduleIcon: {
    fontSize: '1.2rem',
    color: '#3b82f6',
  },
  scheduleItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px dashed #e2e8f0',
    ':last-child': {
      borderBottom: 'none',
    },
  },
  scheduleDay: {
    fontSize: '0.9rem',
    color: '#475569',
    textTransform: 'capitalize',
  },
  scheduleTime: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#059669',
  },
  scheduleClosed: {
    fontSize: '0.9rem',
    color: '#ef4444',
  },

  // Contact Buttons
  contactButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  contactButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '1rem',
    borderRadius: '0.75rem',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    ':hover': {
      backgroundColor: '#f1f5f9',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      ':hover': {
        transform: 'none',
        boxShadow: 'none',
      },
    },
  },
  whatsappButton: {
    backgroundColor: '#f0fff4',
    borderColor: '#bbf7d0',
    ':hover': {
      backgroundColor: '#dcfce7',
    },
  },
  contactButtonIcon: {
    fontSize: '1.5rem',
    color: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
  },
  contactButtonTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  contactButtonSubtitle: {
    fontSize: '0.8rem',
    color: '#64748b',
  },

  // Entreprise
  entrepriseLink: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textDecoration: 'none',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
      transform: 'translateX(4px)',
    },
  },
  entrepriseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  entrepriseLogo: {
    width: '60px',
    height: '60px',
    borderRadius: '0.75rem',
    objectFit: 'cover',
  },
  entrepriseLogoPlaceholder: {
    width: '60px',
    height: '60px',
    borderRadius: '0.75rem',
    backgroundColor: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entrepriseLogoPlaceholderIcon: {
    fontSize: '2rem',
    color: '#3b82f6',
  },
  entrepriseDetails: {
    flex: 1,
  },
  entrepriseName: {
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  verifiedIcon: {
    fontSize: '1rem',
    color: '#3b82f6',
  },
  entrepriseLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: '#64748b',
    fontSize: '0.9rem',
    marginBottom: '0.25rem',
  },
  locationIcon: {
    fontSize: '1rem',
    color: '#94a3b8',
  },
  entrepriseRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.9rem',
  },
  starIcon: {
    color: '#fbbf24',
    fontSize: '1rem',
  },
  ratingCount: {
    color: '#94a3b8',
    fontSize: '0.8rem',
  },
  viewLink: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  },

  // Actions Card
  actionsCard: {
    display: 'flex',
    gap: '0.75rem',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
    },
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
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },

  // Rendez-vous Section
  rendezVousSection: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f0f9ff',
    borderRadius: '0.75rem',
    border: '1px solid #bae6fd',
  },
  
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
    ':hover': {
      backgroundColor: '#2563eb',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  
  rendezVousHint: {
    fontSize: '0.8rem',
    color: '#0369a1',
    marginTop: '0.5rem',
    textAlign: 'center',
  },

  // Info Box
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: '1.25rem',
    borderRadius: '0.75rem',
    border: '1px solid #bfdbfe',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  infoBoxIcon: {
    fontSize: '1.5rem',
    color: '#3b82f6',
    flexShrink: 0,
  },
  infoBoxTitle: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: '0.25rem',
  },
  infoBoxText: {
    fontSize: '0.875rem',
    color: '#1e3a8a',
    lineHeight: '1.5',
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    animation: 'fadeIn 0.3s ease-out',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
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
    '@media (max-width: 768px)': {
      padding: '1rem',
      flexDirection: 'column',
      gap: '0.5rem',
      alignItems: 'flex-start',
    },
  },
  modalTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
  },
  modalTitleIcon: {
    fontSize: '1.25rem',
  },
  modalControls: {
    display: 'flex',
    gap: '0.5rem',
    '@media (max-width: 768px)': {
      alignSelf: 'flex-end',
    },
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
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.3)',
      transform: 'scale(1.1)',
    },
    ':disabled': {
      opacity: 0.3,
      cursor: 'not-allowed',
      transform: 'none',
    },
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
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#dc2626',
      transform: 'scale(1.1)',
    },
  },
  modalImageContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative',
    '@media (max-width: 768px)': {
      padding: '1rem',
    },
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 200px)',
    objectFit: 'contain',
    borderRadius: '0.5rem',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    transition: 'transform 0.3s ease',
  },
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
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.3)',
      transform: 'translateY(-50%) scale(1.1)',
    },
    '@media (max-width: 768px)': {
      width: '40px',
      height: '40px',
      fontSize: '1.5rem',
    },
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
  },
  toggleThumbnailsButton: {
    backgroundColor: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '0.5rem 1rem',
    borderRadius: '2rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    alignSelf: 'center',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderColor: 'rgba(255,255,255,0.5)',
    },
  },
  modalThumbnailsContainer: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    padding: '0.5rem 0',
    justifyContent: 'center',
    scrollbarWidth: 'thin',
    scrollbarColor: '#3b82f6 rgba(255,255,255,0.3)',
    '::-webkit-scrollbar': {
      height: '6px',
    },
    '::-webkit-scrollbar-track': {
      background: 'rgba(255,255,255,0.3)',
      borderRadius: '3px',
    },
    '::-webkit-scrollbar-thumb': {
      background: '#3b82f6',
      borderRadius: '3px',
    },
    '@media (max-width: 768px)': {
      justifyContent: 'flex-start',
    },
  },
  modalThumbnail: {
    width: '60px',
    height: '60px',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    border: '3px solid transparent',
    cursor: 'pointer',
    padding: 0,
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
    },
  },
  modalThumbnailActive: {
    borderColor: '#3b82f6',
  },
  modalThumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
};