import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChatModal from '../components/Chat/ChatModal';
import { publicApi } from './../api/publicApi';
import StarRating from '../components/Services/StarRating';
import theme from './../config/theme';

import {
  FaWrench, FaPaintBrush, FaCog, FaSnowflake,
  FaShieldAlt, FaGraduationCap,
  FaArrowRight, FaComments, FaTimes,
  FaPhone, FaWhatsapp,
  FaClock, FaFire, FaTag,
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { MdVerified, MdOutlineLocalOffer } from 'react-icons/md';
import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineQuestionMarkCircle,
} from 'react-icons/hi';

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

  const nextImage = useCallback((serviceId, totalImages) => {
    setImageIndices(prev => ({
      ...prev,
      [serviceId]: ((prev[serviceId] || 0) + 1) % totalImages
    }));
  }, []);

  const prevImage = useCallback((serviceId, totalImages) => {
    setImageIndices(prev => ({
      ...prev,
      [serviceId]: (prev[serviceId] || 0) === 0 ? totalImages - 1 : (prev[serviceId] || 0) - 1
    }));
  }, []);

  const goToImage = useCallback((serviceId, index) => {
    setImageIndices(prev => ({
      ...prev,
      [serviceId]: index
    }));
  }, []);

  const handleUserInteraction = useCallback((serviceId) => {
    setAutoPlayStates(prev => ({
      ...prev,
      [serviceId]: false
    }));

    if (intervalsRef.current[serviceId]) {
      clearInterval(intervalsRef.current[serviceId]);
      delete intervalsRef.current[serviceId];
    }

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
      backgroundColor: '#dc2626',
      transition: 'width 0.3s ease',
    }} />
  </div>
);

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
  }}>
    <FaFire style={{ fontSize: '0.72rem' }} />
    -{discount}%
  </div>
);

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
        color: '#dc2626', fontWeight: '700', fontSize: '0.9rem',
        backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '999px', whiteSpace: 'nowrap',
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

const WeekScheduleTooltip = ({ schedule, visible }) => {
  if (!visible || !schedule) return null;
  const todayKey = JS_DAY_TO_KEY[new Date().getDay()];
  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(100% + 8px)',
      right: 0,
      backgroundColor: '#1e293b',
      color: '#f8fafc',
      borderRadius: '12px',
      padding: '12px 14px',
      minWidth: '210px',
      zIndex: 50,
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      fontSize: '0.78rem',
      pointerEvents: 'none',
    }}>
      <div style={{ fontWeight: '700', marginBottom: '8px', color: '#e2e8f0', fontSize: '0.82rem', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
        Horaires de la semaine
      </div>
      {DAYS_ORDER.map(key => {
        const day = schedule[key];
        const isToday = key === todayKey;
        return (
          <div key={key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '3px 0',
            fontWeight: isToday ? '700' : '400',
            color: isToday ? '#fbbf24' : (day?.is_open ? '#cbd5e1' : '#475569'),
          }}>
            <span>{KEY_TO_FR[key]}{isToday ? ' ★' : ''}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {day?.is_open && day.start && day.end
                ? `${day.start} – ${day.end}`
                : 'Fermé'}
            </span>
          </div>
        );
      })}
      <div style={{
        position: 'absolute', bottom: '-6px', right: '18px',
        width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid #1e293b',
      }} />
    </div>
  );
};

const ServiceCard = ({ 
  service, 
  onContact, 
  status,
  imageIndex,
  onNextImage,
  onPrevImage,
  onGoToImage,
  autoPlay,
  onUserInteraction 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const promoActive = isPromoActive(service);
  const discount = calculateDiscount(service);
  const promoPeriod = formatPromoPeriod(service);
  const hasSchedule = service?.schedule && Object.keys(service.schedule).length > 0;
  const totalImages = service.medias?.length || 0;

  return (
    <div style={styles.serviceCard} className="service-card">
      <div 
        style={styles.serviceImageContainer}
        onMouseEnter={() => onUserInteraction()}
      >
        {service.medias?.length > 0 ? (
          <>
            <img
              src={service.medias[imageIndex]}
              alt={service.name}
              style={styles.serviceImage}
              loading="lazy"
            />
            
            {service.medias.length > 1 && autoPlay && (
              <ProgressBar 
                totalImages={service.medias.length}
                currentIndex={imageIndex}
              />
            )}
            
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
          <div style={styles.servicePlaceholder}>
            <FaWrench style={{ fontSize: '2.5rem', color: '#dc2626', opacity: 0.5 }} />
          </div>
        )}
        
        {promoActive && discount && <PromoBadge discount={discount} />}
        <OpenStatusBadge status={status} />
        
        {service.medias?.length > 1 && (
          <div style={{
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
          }}>
            +{service.medias.length - 1}
          </div>
        )}
      </div>

      <div style={styles.serviceContent}>
        <div style={styles.serviceHeader}>
          <h3 style={styles.serviceName}>{service.name}</h3>
          <PriceDisplay service={service} promoActive={promoActive} />
        </div>

        {promoActive && promoPeriod && (
          <div style={styles.promoPeriod}>
            <MdOutlineLocalOffer style={{ fontSize: '0.9rem', flexShrink: 0 }} />
            <span>{promoPeriod}</span>
          </div>
        )}

        {status?.sublabel ? (
          <p style={{ ...styles.statusSublabel, color: status.color }}>
            <StatusIcon type={status.icon} color={status.color} size="0.8rem" />
            {status.sublabel}
          </p>
        ) : null}

        <div style={styles.divider} />

        <StarRating
          rating={service.average_rating}
          total={service.total_reviews}
          compact={true}
        />

        <div style={styles.serviceInfo}>
          <div style={styles.entrepriseInfo}>
            {service.entreprise?.logo ? (
              <img src={service.entreprise.logo} alt="" style={styles.entrepriseLogo} />
            ) : (
              <div style={styles.entrepriseLogoPlaceholder}>
                {service.entreprise?.name?.charAt(0) || 'E'}
              </div>
            )}
            <span style={styles.entrepriseName}>
              {service.entreprise?.name || 'Entreprise'}
              {service.entreprise?.is_verified && (
                <MdVerified style={{ color: '#dc2626', fontSize: '0.85rem', marginLeft: '3px' }} />
              )}
            </span>
          </div>

          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => hasSchedule && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <HoursChip status={status} />
            {hasSchedule && <WeekScheduleTooltip schedule={service.schedule} visible={showTooltip} />}
          </div>
        </div>

        <div style={styles.serviceDescriptionRow}>
          <p style={styles.serviceDescription}>
            {service.descriptions
              ? service.descriptions.length > 70
                ? service.descriptions.substring(0, 70) + '…'
                : service.descriptions
              : 'Aucune description disponible'}
          </p>
          <Link to={`/service/${service.id}`} style={styles.seeMoreLink} className="see-more-link">
            Voir plus <FaArrowRight style={{ fontSize: '0.75rem', marginLeft: '3px' }} />
          </Link>
        </div>
      </div>

      <button
        onClick={() => onContact(service)}
        style={styles.contactButton}
        className="contact-button"
      >
        <FaComments style={{ marginRight: '8px' }} />
        {status?.isOpen === false ? 'Laisser un message' : 'Contacter'}
      </button>
    </div>
  );
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [services, setServices] = useState([]);
  const [partners, setPartners] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [openStatuses, setOpenStatuses] = useState({});

  const sectionsRef = useRef([]);

  const {
    imageIndices,
    nextImage,
    prevImage,
    goToImage,
    autoPlayStates,
    handleUserInteraction
  } = useServicesImages(services);

  const heroSlides = useMemo(() => [
    { image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600', title: 'Mécanique Automobile', subtitle: 'Réparation et entretien de tous véhicules', icon: <FaWrench /> },
    { image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1600', title: 'Peinture & Carrosserie', subtitle: 'Redonnez vie à votre véhicule', icon: <FaPaintBrush /> },
    { image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600', title: 'Pneumatique', subtitle: 'Pneus neufs et vulcanisation', icon: <FaCog /> },
    { image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1600', title: 'Climatisation', subtitle: 'Roulez au frais toute l\'année', icon: <FaSnowflake /> },
    { image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600', title: 'Auto-école', subtitle: 'Apprenez à conduire en toute sécurité', icon: <FaGraduationCap /> },
    { image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600', title: 'Assurance Automobile', subtitle: 'Protégez votre véhicule', icon: <FaShieldAlt /> },
  ], []);

  const domaines = useMemo(() => [
    { id: 1, name: 'Mécanique', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800', description: 'Réparation moteur, boîte de vitesses, suspension', icon: <FaWrench /> },
    { id: 2, name: 'Peinture', image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800', description: 'Carrosserie, débosselage, peinture complète', icon: <FaPaintBrush /> },
    { id: 3, name: 'Pneumatique', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', description: 'Pneus, jantes, équilibrage, vulcanisation', icon: <FaCog /> },
    { id: 4, name: 'Climatisation', image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800', description: 'Recharge gaz, réparation système AC', icon: <FaSnowflake /> },
    { id: 5, name: 'Auto-école', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800', description: 'Permis B, formation complète', icon: <FaGraduationCap /> },
    { id: 6, name: 'Assurance', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800', description: 'Tous types d\'assurances auto', icon: <FaShieldAlt /> },
  ], []);

  const updateOpenStatuses = useCallback(() => {
    const newStatuses = {};
    services.forEach(service => {
      newStatuses[service.id] = getOpenStatus(service);
    });
    setOpenStatuses(newStatuses);
  }, [services]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide(p => (p + 1) % heroSlides.length), 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, partnersData] = await Promise.all([
          publicApi.getServices(),
          publicApi.getEntreprises(),
        ]);
        setServices(servicesData.slice(0, 6));
        setPartners(partnersData.slice(0, 10));
      } catch (err) {
        console.error('Erreur chargement données:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    updateOpenStatuses();
    const interval = setInterval(updateOpenStatuses, 60000);
    return () => clearInterval(interval);
  }, [updateOpenStatuses]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('animate-in'); }),
      { threshold: 0.1 }
    );
    sectionsRef.current.forEach(s => s && observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const locationState = window.history.state?.usr;
    if (user && locationState?.openContactModal && locationState?.selectedService) {
      setSelectedService(locationState.selectedService);
      setShowContactModal(true);
      navigate(location.pathname, { replace: true, state: {} });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, location.pathname, navigate]);

  const openContactPopup = (service) => {
    setSelectedService(service);
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname, openContactModal: true, selectedService: service } });
    } else {
      setShowContactModal(true);
    }
  };

  const openChat = () => {
    setShowContactModal(false);
    setTimeout(() => setShowChatModal(true), 300);
  };

  return (
    <div style={styles.container}>
      {/* Hero Carousel */}
      <div style={styles.heroSection}>
        {heroSlides.map((slide, index) => (
          <div key={index} style={{
            ...styles.slide,
            backgroundImage: `url(${slide.image})`,
            opacity: currentSlide === index ? 1 : 0,
            zIndex: currentSlide === index ? 1 : 0,
          }}>
            <div style={styles.slideOverlay} />
            <div style={styles.slideContent}>
              <div style={styles.slideIcon}>{slide.icon}</div>
              <h1 style={styles.slideTitle}>{slide.title}</h1>
              <p style={styles.slideSubtitle}>{slide.subtitle}</p>
              {!user && (
                <div style={styles.heroButtons}>
                  <Link to="/register" style={styles.primaryButton}>
                    Commencer maintenant <FaArrowRight style={{ marginLeft: '0.5rem' }} />
                  </Link>
                  <Link to="/entreprises" style={styles.secondaryButton}>
                    Explorer les services
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
        <div style={styles.indicators}>
          {heroSlides.map((_, index) => (
            <button key={index} onClick={() => setCurrentSlide(index)} style={{
              ...styles.indicator,
              backgroundColor: currentSlide === index ? '#dc2626' : 'rgba(255,255,255,0.5)',
            }} />
          ))}
        </div>
      </div>

      {/* Section Domaines */}
      <div ref={el => sectionsRef.current[0] = el} className="animate-section" style={styles.section}>
        <h2 style={styles.sectionTitle}>Domaines d'Expertise</h2>
        <p style={styles.sectionSubtitle}>Plus de 20 catégories de services pour tous vos besoins automobiles</p>
        <div style={styles.domainesGrid}>
          {domaines.map((domaine) => (
            <Link key={domaine.id} to={`/entreprises?domaine=${domaine.id}`} style={styles.domaineCard} className="domaine-card">
              <div style={{ ...styles.domaineImage, backgroundImage: `url(${domaine.image})` }}>
                <div style={styles.domaineOverlay}>
                  <div style={styles.domaineIcon}>{domaine.icon}</div>
                </div>
              </div>
              <div style={styles.domaineContent}>
                <h3 style={styles.domaineName}>{domaine.name}</h3>
                <p style={styles.domaineDescription}>{domaine.description}</p>
                <button style={styles.domaineButton}>Voir plus <FaArrowRight style={{ marginLeft: '0.5rem' }} /></button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Section Services Récents */}
      <div
        ref={el => sectionsRef.current[1] = el}
        className="animate-section"
        style={{ ...styles.section, backgroundColor: '#f8fafc', maxWidth: '100%', padding: '6rem 2rem' }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={styles.sectionTitle}>Services Récents</h2>
          <p style={styles.sectionSubtitle}>Découvrez les derniers services ajoutés par nos prestataires</p>

          <div style={styles.servicesGrid}>
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onContact={openContactPopup}
                status={openStatuses[service.id] || getOpenStatus(service)}
                imageIndex={imageIndices[service.id] || 0}
                onNextImage={() => nextImage(service.id, service.medias?.length || 0)}
                onPrevImage={() => prevImage(service.id, service.medias?.length || 0)}
                onGoToImage={(index) => goToImage(service.id, index)}
                autoPlay={autoPlayStates[service.id] || false}
                onUserInteraction={() => handleUserInteraction(service.id)}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/services" style={styles.ctaButton}>
              Voir tous les services <FaArrowRight style={{ marginLeft: '0.5rem' }} />
            </Link>
          </div>
        </div>
      </div>

      {/* Section Partenaires */}
      <div ref={el => sectionsRef.current[2] = el} className="animate-section" style={styles.partnersSection}>
        <h2 style={styles.sectionTitle}>Nos Entreprises de Confiance</h2>
        <div style={styles.partnersTrack}>
          <div style={styles.partnersSlide} className="partners-scroll">
            {[...partners, ...partners].map((partner, index) => (
              <div key={index} style={styles.partnerCard}>
                {partner.logo ? (
                  <img src={partner.logo} alt={partner.name} style={styles.partnerImage} />
                ) : (
                  <div style={styles.partnerPlaceholder}>{partner.name.charAt(0)}</div>
                )}
                <p style={styles.partnerName}>{partner.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Final - Masqué si utilisateur connecté */}
      {!user && (
        <div ref={el => sectionsRef.current[3] = el} className="animate-section" style={styles.ctaSection}>
          <h2 style={styles.ctaTitle}>Prêt à démarrer ?</h2>
          <p style={styles.ctaText}>Rejoignez des milliers de Béninois qui font confiance à CarEasy</p>
          <Link to="/register" style={styles.ctaButtonLarge}>Créer un compte gratuitement</Link>
        </div>
      )}

      {/* Modal Contact */}
      {user && showContactModal && selectedService && (
        <div style={styles.contactModalOverlay} onClick={() => setShowContactModal(false)}>
          <div style={styles.contactModal} onClick={e => e.stopPropagation()}>
            <div style={styles.contactModalHeader}>
              <div style={styles.contactModalAvatar}>
                {selectedService.entreprise?.logo ? (
                  <img src={selectedService.entreprise.logo} alt="" style={styles.contactModalLogo} />
                ) : (
                  <div style={styles.contactModalLogoPlaceholder}>
                    {selectedService.entreprise?.name?.charAt(0) || 'E'}
                  </div>
                )}
              </div>
              <div style={styles.contactModalInfo}>
                <h3 style={styles.contactModalTitle}>{selectedService.entreprise?.name || 'Prestataire'}</h3>
                <p style={styles.contactModalService}>{selectedService.name}</p>
              </div>
              <button onClick={() => setShowContactModal(false)} style={styles.contactModalClose}><FaTimes /></button>
            </div>
            <div style={styles.contactModalBody}>
              <p style={styles.contactModalInstruction}>Choisissez votre méthode de contact préférée :</p>
              <div style={styles.contactMethodsGrid}>
                <button onClick={() => {
                  selectedService.entreprise?.call_phone
                    ? window.location.href = `tel:${selectedService.entreprise.call_phone}`
                    : alert('Numéro non disponible');
                  setShowContactModal(false);
                }} style={styles.contactMethodButton} className="contact-method-button">
                  <div style={{ ...styles.contactMethodIcon, backgroundColor: '#10b981' }}><FaPhone /></div>
                  <div style={styles.contactMethodContent}>
                    <div style={styles.contactMethodTitle}>Appeler</div>
                    <div style={styles.contactMethodSubtitle}>{selectedService.entreprise?.call_phone || 'Non disponible'}</div>
                  </div>
                  <span style={styles.contactMethodArrow}>→</span>
                </button>
                <button onClick={() => {
                  if (selectedService.entreprise?.whatsapp_phone) {
                    const msg = encodeURIComponent(`Bonjour ${selectedService.entreprise.name}, je suis intéressé par votre service: ${selectedService.name}`);
                    window.open(`https://wa.me/${selectedService.entreprise.whatsapp_phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                  } else alert('WhatsApp non disponible');
                  setShowContactModal(false);
                }} style={styles.contactMethodButton} className="contact-method-button">
                  <div style={{ ...styles.contactMethodIcon, backgroundColor: '#25D366' }}><FaWhatsapp /></div>
                  <div style={styles.contactMethodContent}>
                    <div style={styles.contactMethodTitle}>WhatsApp</div>
                    <div style={styles.contactMethodSubtitle}>Message instantané</div>
                  </div>
                  <span style={styles.contactMethodArrow}>→</span>
                </button>
                <button onClick={openChat} style={styles.contactMethodButton} className="contact-method-button">
                  <div style={{ ...styles.contactMethodIcon, backgroundColor: '#dc2626' }}><FaComments /></div>
                  <div style={styles.contactMethodContent}>
                    <div style={styles.contactMethodTitle}>Messagerie</div>
                    <div style={styles.contactMethodSubtitle}>Discuter en direct</div>
                  </div>
                  <span style={styles.contactMethodArrow}>→</span>
                </button>
              </div>
              <div style={styles.contactModalFooter}>
                <p style={styles.contactModalNote}>
                  <strong>Recommandé :</strong> La messagerie permet de suivre vos conversations et partager des photos/vidéos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {user && selectedService && showChatModal && (
        <ChatModal
          serviceId={selectedService.id} 
          receiverId={selectedService.entreprise?.prestataire_id}
          receiverName={selectedService.entreprise?.name || 'Prestataire'}
          onClose={() => { setSelectedService(null); setShowChatModal(false); }}
        />
      )}

      {/* CSS global */}
      <style>{`
        @keyframes scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-section {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-section.animate-in { opacity: 1; transform: translateY(0); }
        .domaine-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .domaine-card:hover { transform: translateY(-12px) scale(1.02); box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        .service-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .service-card:hover { transform: translateY(-8px); box-shadow: 0 16px 32px rgba(0,0,0,0.14); }
        .service-card:hover .image-nav-button {
          opacity: 0.7 !important;
        }
        .contact-button { transition: all 0.3s ease; }
        .contact-button:hover { background-color: #b91c1c !important; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(220,38,38,0.3); }
        .contact-method-button { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .contact-method-button:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); border-color: #dc2626 !important; }
        .see-more-link:hover { color: #b91c1c !important; transform: translateX(3px); display: inline-flex; }
        .partners-scroll { animation: scroll 30s linear infinite; }
        .partners-scroll:hover { animation-play-state: paused; }
        @media (max-width: 768px) {
          .servicesGrid { grid-template-columns: 1fr !important; }
          .domainesGrid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .heroButtons { flex-direction: column; align-items: center; }
          .heroButtons a { width: 80%; text-align: center; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#ffffff', minHeight: '100vh' },

  // Hero
  heroSection: { position: 'relative', height: '100vh', overflow: 'hidden' },
  slide: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 1s ease-in-out' },
  slideOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)' },
  slideContent: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 2, width: '90%', maxWidth: '900px', animation: 'fadeInUp 1s ease-out' },
  slideIcon: { fontSize: '5rem', color: '#dc2626', marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' },
  slideTitle: { fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 'bold', color: '#fff', marginBottom: '1rem', textShadow: '2px 2px 8px rgba(0,0,0,0.5)' },
  slideSubtitle: { fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', color: '#fff', marginBottom: '2.5rem', textShadow: '1px 1px 4px rgba(0,0,0,0.5)' },
  heroButtons: { display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' },
  primaryButton: { backgroundColor: '#dc2626', color: '#fff', padding: '1.25rem 3rem', borderRadius: '999px', textDecoration: 'none', fontWeight: '600', fontSize: '1.125rem', display: 'inline-flex', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', transition: 'all 0.3s ease' },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', padding: '1.25rem 3rem', borderRadius: '999px', textDecoration: 'none', fontWeight: '600', fontSize: '1.125rem', border: '2px solid #fff', transition: 'all 0.3s ease' },
  indicators: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', zIndex: 3 },
  indicator: { width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #fff', cursor: 'pointer', transition: 'all 0.3s ease', background: 'transparent' },

  // Sections
  section: { maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem' },
  sectionTitle: { fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem', color: '#1e293b' },
  sectionSubtitle: { fontSize: '1.2rem', textAlign: 'center', color: '#64748b', marginBottom: '4rem', maxWidth: '700px', margin: '0 auto 4rem' },

  // Domaines
  domainesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' },
  domaineCard: { backgroundColor: '#ffffff', borderRadius: '24px', overflow: 'hidden', textDecoration: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' },
  domaineImage: { position: 'relative', height: '220px', backgroundSize: 'cover', backgroundPosition: 'center' },
  domaineOverlay: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #dc262680, #dc2626CC)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  domaineIcon: { fontSize: '4rem', color: '#fff', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' },
  domaineContent: { padding: '2rem' },
  domaineName: { fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem' },
  domaineDescription: { color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.6' },
  domaineButton: { backgroundColor: '#dc2626', color: '#fff', padding: '0.875rem 2rem', borderRadius: '999px', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', transition: 'all 0.3s ease' },

  // Services
  servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem', marginBottom: '1rem' },
  serviceCard: { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'visible', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
  serviceImageContainer: { position: 'relative', height: '210px', overflow: 'hidden', borderRadius: '14px 14px 0 0', backgroundColor: '#f1f5f9', flexShrink: 0 },
  serviceImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' },
  servicePlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  serviceContent: { padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  serviceHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' },
  serviceName: { fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0, flex: 1, lineHeight: '1.35' },
  promoPeriod: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#dc2626', backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '8px', border: '1px dashed #fecaca', fontWeight: '600' },
  statusSublabel: { fontSize: '0.78rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' },
  divider: { height: '1px', backgroundColor: '#f1f5f9', margin: '2px 0' },
  serviceInfo: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' },
  entrepriseInfo: { display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 },
  entrepriseLogo: { width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fecaca', flexShrink: 0 },
  entrepriseLogoPlaceholder: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 },
  entrepriseName: { fontSize: '0.82rem', color: '#475569', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' },
  serviceDescriptionRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px', marginTop: 'auto' },
  serviceDescription: { color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5', margin: 0, flex: 1 },
  seeMoreLink: { display: 'inline-flex', alignItems: 'center', color: '#dc2626', fontWeight: '700', fontSize: '0.82rem', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s ease' },
  contactButton: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '13px 18px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', borderTop: '1px solid #fecaca', borderRadius: '0 0 14px 14px', letterSpacing: '0.01em' },
  ctaButton: { backgroundColor: '#dc2626', color: '#fff', padding: '1rem 2.5rem', borderRadius: '999px', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', transition: 'all 0.3s ease' },

  // Partenaires
  partnersSection: { padding: '4rem 0', backgroundColor: '#f8fafc', overflow: 'hidden' },
  partnersTrack: { overflow: 'hidden', padding: '1rem 0' },
  partnersSlide: { display: 'flex', gap: '3rem', width: 'max-content' },
  partnerCard: { backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', textAlign: 'center', minWidth: '200px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  partnerImage: { width: '90px', height: '90px', margin: '0 auto 1rem', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fecaca' },
  partnerPlaceholder: { width: '90px', height: '90px', margin: '0 auto 1rem', borderRadius: '50%', backgroundColor: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold' },
  partnerName: { fontWeight: '600', color: '#1e293b', fontSize: '1rem' },

  // CTA final
  ctaSection: { padding: '6rem 2rem', textAlign: 'center', backgroundColor: '#dc2626' },
  ctaTitle: { fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 'bold', color: '#fff', marginBottom: '1rem' },
  ctaText: { fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' },
  ctaButtonLarge: { backgroundColor: '#fff', color: '#dc2626', padding: '1.25rem 3rem', borderRadius: '999px', textDecoration: 'none', fontWeight: '600', fontSize: '1.25rem', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', transition: 'all 0.3s ease' },

  // Modal contact
  contactModalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem', backdropFilter: 'blur(10px)' },
  contactModal: { backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '450px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', overflow: 'hidden', animation: 'modalSlideIn 0.4s cubic-bezier(0.4,0,0.2,1)' },
  contactModalHeader: { display: 'flex', alignItems: 'center', padding: '1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'relative' },
  contactModalAvatar: { marginRight: '1rem' },
  contactModalLogo: { width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #dc2626' },
  contactModalLogoPlaceholder: { width: '60px', height: '60px', borderRadius: '12px', backgroundColor: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem' },
  contactModalInfo: { flex: 1 },
  contactModalTitle: { fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: '0 0 0.25rem 0' },
  contactModalService: { fontSize: '0.95rem', color: '#64748b', margin: 0 },
  contactModalClose: { position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'transparent', border: 'none', color: '#64748b', fontSize: '1.25rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', transition: 'all 0.3s ease' },
  contactModalBody: { padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  contactModalInstruction: { textAlign: 'center', color: '#64748b', fontSize: '1rem', margin: 0 },
  contactMethodsGrid: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  contactMethodButton: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: '16px', border: '2px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.3s ease' },
  contactMethodIcon: { width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#fff', flexShrink: 0 },
  contactMethodContent: { flex: 1 },
  contactMethodTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' },
  contactMethodSubtitle: { fontSize: '0.9rem', color: '#64748b' },
  contactMethodArrow: { color: '#dc2626', fontSize: '1.5rem', opacity: 0.7 },
  contactModalFooter: { paddingTop: '1rem', borderTop: '1px solid #e2e8f0' },
  contactModalNote: { fontSize: '0.9rem', color: '#64748b', textAlign: 'center', margin: 0, lineHeight: '1.6', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px' },
};