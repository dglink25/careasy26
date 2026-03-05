import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicApi } from '../../api/publicApi';

import { 
  FaWrench, FaFire, FaTag, FaClock, 
  FaArrowRight, FaRegClock, FaDoorOpen, FaDoorClosed,
  FaQuestionCircle, FaCheckCircle, FaTimesCircle,
  FaChevronLeft, FaChevronRight, FaPause, FaPlay
} from 'react-icons/fa';
import { MdVerified, MdOutlineLocalOffer, MdBusiness } from 'react-icons/md';
import { HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineQuestionMarkCircle } from 'react-icons/hi';
const AUTOPLAY_INTERVAL = 4000; 
const AUTOPLAY_PAUSE_DURATION = 10000; 

const JS_DAY_TO_KEY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const KEY_TO_FR = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};

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
      // Cherche le prochain jour ouvert
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
const useServicesImages = (services) => {
  const [imageIndices, setImageIndices] = useState({});
  const [autoPlayStates, setAutoPlayStates] = useState({});
  const intervalsRef = useRef({});
  const timeoutsRef = useRef({});

  useEffect(() => {
    const initialIndices = {};
    const initialAutoPlay = {};
    services.forEach(service => {
      if (service.medias?.length > 0) {
        initialIndices[service.id] = 0;
        initialAutoPlay[service.id] = true;
      }
    });
    setImageIndices(initialIndices);
    setAutoPlayStates(initialAutoPlay);
  }, [services]);

  // Fonction pour passer à l'image suivante
  const nextImage = useCallback((serviceId, totalImages) => {
    setImageIndices(prev => ({
      ...prev,
      [serviceId]: ((prev[serviceId] || 0) + 1) % totalImages
    }));
  }, []);

  // Fonction pour revenir à l'image précédente
  const prevImage = useCallback((serviceId, totalImages) => {
    setImageIndices(prev => ({
      ...prev,
      [serviceId]: (prev[serviceId] || 0) === 0 ? totalImages - 1 : (prev[serviceId] || 0) - 1
    }));
  }, []);

  // Fonction pour aller à une image spécifique
  const goToImage = useCallback((serviceId, index) => {
    setImageIndices(prev => ({
      ...prev,
      [serviceId]: index
    }));
  }, []);

  // Fonction pour gérer l'interaction utilisateur
  const handleUserInteraction = useCallback((serviceId) => {
    // Mettre en pause l'auto-play pour ce service
    setAutoPlayStates(prev => ({
      ...prev,
      [serviceId]: false
    }));

    // Nettoyer l'intervalle existant
    if (intervalsRef.current[serviceId]) {
      clearInterval(intervalsRef.current[serviceId]);
      delete intervalsRef.current[serviceId];
    }

    // Nettoyer le timeout existant
    if (timeoutsRef.current[serviceId]) {
      clearTimeout(timeoutsRef.current[serviceId]);
      delete timeoutsRef.current[serviceId];
    }
  timeoutsRef.current[serviceId] = setTimeout(() => {
      setAutoPlayStates(prev => ({
        ...prev,
        [serviceId]: true
      }));
      delete timeoutsRef.current[serviceId];
    }, AUTOPLAY_PAUSE_DURATION);
  }, []);
useEffect(() => {
     Object.values(intervalsRef.current).forEach(clearInterval);
    intervalsRef.current = {};
  services.forEach(service => {
      const totalImages = service.medias?.length || 0;
      if (totalImages >= 2 && autoPlayStates[service.id]) {
        intervalsRef.current[service.id] = setInterval(() => {
          nextImage(service.id, totalImages);
        }, AUTOPLAY_INTERVAL);
      }
    });

    // Nettoyage au démontage
    return () => {
      Object.values(intervalsRef.current).forEach(clearInterval);
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, [services, autoPlayStates, nextImage]);

  return {
    imageIndices,
    nextImage,
    prevImage,
    goToImage,
    autoPlayStates,
    handleUserInteraction
  };
};

const StatusIcon = ({ type, size = '1rem', color }) => {
  const s = { fontSize: size, color, flexShrink: 0 };
  if (type === 'always') return <HiOutlineClock style={s} />;
  if (type === 'open') return <HiOutlineCheckCircle style={s} />;
  if (type === 'closed') return <HiOutlineXCircle style={s} />;
  return <HiOutlineQuestionMarkCircle style={s} />;
};

const OpenStatusBadge = ({ status }) => {
  if (!status) return null;
  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      right: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      backgroundColor: status.bg,
      color: status.color,
      border: `1.5px solid ${status.color}55`,
      borderRadius: '999px',
      padding: '5px 11px',
      fontSize: '0.78rem',
      fontWeight: '700',
      backdropFilter: 'blur(6px)',
      zIndex: 3,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      maxWidth: 'calc(100% - 20px)',
      letterSpacing: '0.01em',
    }}>
      <StatusIcon type={status.icon} color={status.color} />
      <span>{status.label}</span>
    </div>
  );
};

// Badge promo (sur l'image)
const PromoBadge = ({ discount }) => (
  <div style={{
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: '#dc2626',
    color: '#fff',
    padding: '5px 13px',
    borderRadius: '999px',
    fontSize: '0.82rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    zIndex: 3,
    boxShadow: '0 4px 12px rgba(220,38,38,0.4)',
    letterSpacing: '0.02em',
    animation: 'pulseBadge 2s ease-in-out infinite',
  }}>
    <FaFire style={{ fontSize: '0.72rem' }} />
    -{discount}%
  </div>
);

// Indicateur de défilement automatique
const AutoPlayIndicator = ({ autoPlay, currentIndex, totalImages }) => (
  <div style={{
    position: 'absolute',
    top: '10px',
    right: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '600',
    backdropFilter: 'blur(4px)',
    zIndex: 4,
    border: '1px solid rgba(255,255,255,0.2)',
  }}>
    
  </div>
);

// Barre de progression
const ProgressBar = ({ totalImages, currentIndex }) => (
  <div style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 4,
  }}>
    <div style={{
      height: '100%',
      width: `${((currentIndex + 1) / totalImages) * 100}%`,
      backgroundColor: '#3b82f6',
      transition: 'width 0.3s ease',
    }} />
  </div>
);

// Miniatures de navigation
const ImageThumbnails = ({ medias, currentIndex, onThumbnailClick }) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '5px',
      padding: '5px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '20px',
      backdropFilter: 'blur(4px)',
      zIndex: 4,
    }}>
      {medias.map((_, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onThumbnailClick(index);
          }}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            backgroundColor: index === currentIndex ? '#3b82f6' : '#fff',
            transition: 'all 0.2s ease',
            transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  );
};

// Ligne horaires du jour (dans la carte)
const HoursChip = ({ status }) => {
  if (!status?.todayHours || status.todayHours === 'Fermé' || status.todayHours === 'Non défini') return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '0.78rem',
      color: status.color,
      backgroundColor: status.bg,
      padding: '3px 9px',
      borderRadius: '999px',
      fontWeight: '600',
      flexShrink: 0,
      border: `1px solid ${status.color}33`,
    }}>
      <FaClock style={{ fontSize: '0.7rem' }} />
      <span>{status.todayHours}</span>
    </div>
  );
};

// Affichage prix
const PriceDisplay = ({ service, promoActive }) => {
  if (service.is_price_on_request) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        color: '#ea580c', fontWeight: '700', fontSize: '0.85rem',
        backgroundColor: '#fff7ed', padding: '4px 10px', borderRadius: '999px',
        border: '1px solid #fdba7444',
      }}>
        <FaTag style={{ fontSize: '0.72rem' }} /> Sur devis
      </div>
    );
  }
  if (promoActive && service.price_promo) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
        <span style={{
          color: '#dc2626', fontWeight: '800', fontSize: '0.95rem',
          backgroundColor: '#fee2e2', padding: '3px 9px', borderRadius: '999px',
        }}>
          {formatPrice(service.price_promo)}
        </span>
        {service.price && (
          <span style={{ color: '#94a3b8', fontSize: '0.75rem', textDecoration: 'line-through', paddingRight: '4px' }}>
            {formatPrice(service.price)}
          </span>
        )}
      </div>
    );
  }
  if (service.price) {
    return (
      <span style={{
        color: '#3b82f6', fontWeight: '700', fontSize: '0.9rem',
        backgroundColor: '#dbeafe44', padding: '4px 10px', borderRadius: '999px', whiteSpace: 'nowrap',
      }}>
        {formatPrice(service.price)}
      </span>
    );
  }
  return (
    <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>
      Prix sur demande
    </span>
  );
};
const ServiceCard = ({ service, status, imageIndex, onNextImage, onPrevImage, onGoToImage, autoPlay, onUserInteraction }) => {
  const hasActivePromo = isPromoActive(service);
  const discount = calculateDiscount(service);
  const promoPeriod = formatPromoPeriod(service);
  const totalImages = service.medias?.length || 0;

  return (
    <Link
      to={`/service/${service.id}`}
      style={styles.card}
      className="service-card"
      onClick={(e) => {
        if (e.target.closest('.image-nav-button') || e.target.closest('.thumbnail-dot')) {
          e.preventDefault();
        }
      }}
    >
       <div 
        style={styles.cardImage}
        onMouseEnter={() => onUserInteraction()}
      >
        {service.medias && service.medias.length > 0 ? (
          <>
            <img 
              src={service.medias[imageIndex]}
              alt={`${service.name} - Image ${imageIndex + 1}`}
              style={styles.image}
            />
            
           
            
            {/* Barre de progression */}
            {service.medias.length > 1 && autoPlay && (
              <ProgressBar 
                totalImages={service.medias.length}
                currentIndex={imageIndex}
              />
            )}
            
           
            
            {/* Boutons de navigation */}
            {service.medias.length > 1 && (
              <>
                <button 
                  className="image-nav-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onPrevImage();
                    onUserInteraction();
                  }}
                  style={{
                    position: 'absolute',
                    left: '5px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: '#fff',
                    border: 'none',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    transition: 'all 0.2s ease',
                    opacity: 0,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                >
                  <FaChevronLeft style={{ fontSize: '0.8rem' }} />
                </button>
                <button 
                  className="image-nav-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNextImage();
                    onUserInteraction();
                  }}
                  style={{
                    position: 'absolute',
                    right: '5px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: '#fff',
                    border: 'none',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    transition: 'all 0.2s ease',
                    opacity: 0,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                >
                  <FaChevronRight style={{ fontSize: '0.8rem' }} />
                </button>
              </>
            )}
          </>
        ) : (
          <div style={styles.imagePlaceholder}>
            <FaWrench style={{ fontSize: '3rem', color: '#3b82f6', opacity: 0.5 }} />
          </div>
        )}
        
        {/* Badge promotion */}
        {hasActivePromo && discount && (
          <PromoBadge discount={discount} />
        )}
        
        {/* Badge d'ouverture */}
        <OpenStatusBadge status={status} />
        
        {/* Badge nombre de photos */}
        {service.medias?.length > 1 && (
          <div style={styles.imageBadge}>
            +{service.medias.length - 1}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div style={styles.cardBody}>
        {/* En-tête avec nom et prix */}
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>{service.name}</h3>
          <PriceDisplay service={service} promoActive={hasActivePromo} />
        </div>
        
        {/* Domaine */}
        {service.domaine && (
          <div style={styles.domaineTag}>
            {service.domaine.name}
          </div>
        )}

        {/* Période de promotion */}
        {hasActivePromo && promoPeriod && (
          <div style={styles.promoPeriod}>
            <MdOutlineLocalOffer style={{ fontSize: '0.9rem', flexShrink: 0 }} />
            <span>{promoPeriod}</span>
          </div>
        )}

        {/* Description */}
        {service.descriptions && (
          <p style={styles.description}>
            {service.descriptions.substring(0, 100)}
            {service.descriptions.length > 100 ? '...' : ''}
          </p>
        )}

        {/* Sous-label statut */}
        {status?.sublabel && (
          <p style={{ ...styles.statusSublabel, color: status.color }}>
            <StatusIcon type={status.icon} color={status.color} size="0.8rem" />
            {status.sublabel}
          </p>
        )}

        {/* Horaires du jour si disponible */}
        {status?.todayHours && status.todayHours !== 'Fermé' && status.todayHours !== 'Non défini' && (
          <div style={styles.hours}>
            <FaRegClock style={{ marginRight: '5px', color: '#64748b' }} />
            <span>{status.todayHours}</span>
          </div>
        )}
      </div>

      {/* Footer avec entreprise */}
      <div style={styles.cardFooter}>
        {service.entreprise && (
          <div style={styles.entrepriseInfo}>
            {service.entreprise.logo ? (
              <img 
                src={service.entreprise.logo}
                alt={service.entreprise.name}
                style={styles.entrepriseLogo}
              />
            ) : (
              <div style={styles.logoPlaceholder}>
                <MdBusiness style={{ fontSize: '1.2rem', color: '#3b82f6' }} />
              </div>
            )}
            <span style={styles.entrepriseName}>
              {service.entreprise.name}
              {service.entreprise.is_verified && (
                <MdVerified style={{ color: '#3b82f6', fontSize: '0.9rem', marginLeft: '4px' }} />
              )}
            </span>
          </div>
        )}
        <span style={styles.viewLink}>
          Voir <FaArrowRight style={{ fontSize: '0.8rem', marginLeft: '4px' }} />
        </span>
      </div>
    </Link>
  );
};
export default function PublicServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openStatuses, setOpenStatuses] = useState({});
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedDomaine, setSelectedDomaine] = useState(searchParams.get('type') || 'all');

  // Hook personnalisé pour gérer les images de tous les services
  const {
    imageIndices,
    nextImage,
    prevImage,
    goToImage,
    autoPlayStates,
    handleUserInteraction
  } = useServicesImages(services);

  useEffect(() => {
    fetchData();
  }, []);

  // Mettre à jour les statuts d'ouverture toutes les minutes
  useEffect(() => {
    if (services.length > 0) {
      updateOpenStatuses();
      const interval = setInterval(updateOpenStatuses, 60000);
      return () => clearInterval(interval);
    }
  }, [services]);

  // Mettre à jour les filtres depuis l'URL
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setSelectedDomaine(searchParams.get('type') || 'all');
  }, [searchParams]);

  const updateOpenStatuses = () => {
    const newStatuses = {};
    services.forEach(service => {
      newStatuses[service.id] = getOpenStatus(service);
    });
    setOpenStatuses(newStatuses);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesData, domainesData] = await Promise.all([
        publicApi.getServices(),
        publicApi.getDomaines()
      ]);
      setServices(servicesData);
      
      // Calculer les statuts d'ouverture
      const statuses = {};
      servicesData.forEach(service => {
        statuses[service.id] = getOpenStatus(service);
      });
      setOpenStatuses(statuses);
      
      setDomaines(domainesData);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des services');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour des paramètres URL
  const updateFilters = (search, domaine) => {
    const params = {};
    if (search) params.search = search;
    if (domaine !== 'all') params.type = domaine;
    setSearchParams(params);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    updateFilters(value, selectedDomaine);
  };

  const handleDomaineChange = (domaineId) => {
    setSelectedDomaine(domaineId);
    updateFilters(searchTerm, domaineId);
  };

  // Filtrage des services
  const filteredServices = services.filter(s => {
    const matchSearch = !searchTerm || 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.entreprise?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.domaine?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.descriptions?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchDomaine = selectedDomaine === 'all' || 
      s.domaine?.id === parseInt(selectedDomaine);
    
    return matchSearch && matchDomaine;
  });

  // Statistiques
  const stats = {
    total: services.length,
    filtered: filteredServices.length,
    domaines: new Set(services.map(s => s.domaine?.id).filter(Boolean)).size,
    withPrice: services.filter(s => s.price).length,
    withPromo: services.filter(s => isPromoActive(s)).length,
    openNow: services.filter(s => {
      const status = getOpenStatus(s);
      return status.isOpen === true;
    }).length
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement des services...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Hero */}
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>Services Automobiles</h1>
          <p style={styles.heroSubtitle}>
            Découvrez {stats.total} services professionnels répartis dans {stats.domaines} domaines
          </p>
        </div>

        {/* Statistiques rapides */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.total}</div>
            <div style={styles.statLabel}>Services disponibles</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.domaines}</div>
            <div style={styles.statLabel}>Domaines d'expertise</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.openNow}</div>
            <div style={styles.statLabel}>Ouverts maintenant</div>
          </div>
          {stats.withPromo > 0 && (
            <div style={{...styles.statCard, backgroundColor: '#fef2f2'}}>
              <div style={{...styles.statNumber, color: '#dc2626'}}>{stats.withPromo}</div>
              <div style={styles.statLabel}>En promotion</div>
            </div>
          )}
        </div>

        {/* Filtres */}
        <div style={styles.filtersSection}>
          {/* Recherche */}
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Rechercher un service..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button 
                onClick={() => handleSearchChange('')}
                style={styles.clearButton}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtres par domaine */}
          <div style={styles.domainesFilter}>
            <button
              onClick={() => handleDomaineChange('all')}
              style={{
                ...styles.domaineButton,
                ...(selectedDomaine === 'all' ? styles.domaineButtonActive : {})
              }}
            >
              Tous ({services.length})
            </button>
            {domaines.map(domaine => {
              const count = services.filter(s => s.domaine?.id === domaine.id).length;
              if (count === 0) return null;
              
              return (
                <button
                  key={domaine.id}
                  onClick={() => handleDomaineChange(domaine.id.toString())}
                  style={{
                    ...styles.domaineButton,
                    ...(selectedDomaine === domaine.id.toString() ? styles.domaineButtonActive : {})
                  }}
                >
                  {domaine.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Résultats */}
        <div style={styles.resultsHeader}>
          <h2 style={styles.resultsTitle}>
            {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''} 
            {searchTerm && ` pour "${searchTerm}"`}
            {selectedDomaine !== 'all' && ` dans "${domaines.find(d => d.id === parseInt(selectedDomaine))?.name}"`}
          </h2>
          {(searchTerm || selectedDomaine !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedDomaine('all');
                setSearchParams({});
              }}
              style={styles.resetButton}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {filteredServices.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <h3 style={styles.emptyTitle}>Aucun service trouvé</h3>
            <p style={styles.emptyText}>
              {searchTerm || selectedDomaine !== 'all'
                ? "Aucun résultat ne correspond à vos critères. Essayez d'autres filtres."
                : "Aucun service disponible pour le moment."
              }
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredServices.map((service) => {
              const status = openStatuses[service.id] || getOpenStatus(service);
              
              return (
                <ServiceCard
                  key={service.id}
                  service={service}
                  status={status}
                  imageIndex={imageIndices[service.id] || 0}
                  onNextImage={() => nextImage(service.id, service.medias?.length || 0)}
                  onPrevImage={() => prevImage(service.id, service.medias?.length || 0)}
                  onGoToImage={(index) => goToImage(service.id, index)}
                  autoPlay={autoPlayStates[service.id] || false}
                  onUserInteraction={() => handleUserInteraction(service.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseBadge {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(220,38,38,0.4); }
          50%       { transform: scale(1.06); box-shadow: 0 6px 16px rgba(220,38,38,0.55); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .service-card {
          transition: all 0.3s ease;
          animation: fadeIn 0.5s ease-out;
          text-decoration: none;
          color: inherit;
        }
        .service-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }
        .service-card:hover .image-nav-button {
          opacity: 0.7 !important;
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
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 1rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
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
  },
  hero: {
    textAlign: 'center',
    marginBottom: '3rem',
    padding: '2rem 1rem',
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '1rem',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#64748b',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '1rem',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: '0.5rem',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  filtersSection: {
    marginBottom: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    padding: '1rem 3rem 1rem 1.5rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    outline: 'none',
    backgroundColor: '#fff',
    ':focus': {
      borderColor: '#3b82f6',
    },
  },
  clearButton: {
    position: 'absolute',
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.25rem',
    color: '#94a3b8',
    cursor: 'pointer',
    ':hover': {
      color: '#64748b',
    },
  },
  domainesFilter: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  domaineButton: {
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.3s',
    ':hover': {
      borderColor: '#3b82f6',
      color: '#3b82f6',
    },
  },
  domaineButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#e4e1e1',
    color: '#fff',
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '0.75rem',
    marginBottom: '2rem',
    border: '2px solid #dc2626',
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  resultsTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1e293b',
  },
  resetButton: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#e2e8f0',
    },
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: '4rem 2rem',
    borderRadius: '1.5rem',
    textAlign: 'center',
    border: '2px dashed #e2e8f0',
  },
  emptyIcon: {
    fontSize: '5rem',
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '0.75rem',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '1.125rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '2rem',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    overflow: 'hidden',
    border: '2px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardImage: {
    position: 'relative',
    height: '200px',
    overflow: 'hidden',
    backgroundColor: '#dbeafe',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
  },
  imageBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '0.5rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    backdropFilter: 'blur(4px)',
    zIndex: 3,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: '1.5rem',
    flex: 1,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '0.5rem',
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    flex: 1,
    lineHeight: '1.4',
  },
  domaineTag: {
    display: 'inline-block',
    backgroundColor: '#dbeafe',
    color: '#3b82f6',
    padding: '4px 10px',
    borderRadius: '0.5rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
  },
  description: {
    color: '#64748b',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    marginBottom: '0.75rem',
  },
  statusSublabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  promoPeriod: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.8rem',
    color: '#dc2626',
    backgroundColor: '#fff1f2',
    padding: '4px 10px',
    borderRadius: '0.5rem',
    border: '1px dashed #fca5a5',
    fontWeight: '600',
    marginBottom: '0.75rem',
  },
  hours: {
    display: 'flex',
    alignItems: 'center',
    color: '#64748b',
    fontSize: '0.85rem',
    fontWeight: '500',
    marginTop: '0.5rem',
    backgroundColor: '#f1f5f9',
    padding: '4px 10px',
    borderRadius: '0.5rem',
    width: 'fit-content',
  },
  cardFooter: {
    padding: '1rem 1.5rem',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entrepriseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  entrepriseLogo: {
    width: '36px',
    height: '36px',
    borderRadius: '0.5rem',
    objectFit: 'cover',
    border: '2px solid #e2e8f0',
  },
  logoPlaceholder: {
    width: '36px',
    height: '36px',
    borderRadius: '0.5rem',
    backgroundColor: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #e2e8f0',
  },
  entrepriseName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  viewLink: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.2s ease',
    ':hover': {
      transform: 'translateX(3px)',
    },
  },
};