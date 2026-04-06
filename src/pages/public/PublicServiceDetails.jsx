// src/pages/public/PublicServiceDetails.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../../api/publicApi';
import ChatModal from '../../components/Chat/ChatModal';
import ContactModal from '../../components/ContactModal';
import { useAuth } from '../../contexts/AuthContext';
import { usePendingAction } from '../../hooks/usePendingAction';
import StarRating from '../../components/Services/StarRating';
import { 
  FiArrowLeft, FiMapPin, FiClock, FiDollarSign, 
  FiPhone, FiMail, FiNavigation, FiShare2, FiHeart,
  FiCalendar, FiInfo, FiChevronLeft, FiChevronRight,
  FiX, FiMaximize2, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import {
  MdBusiness, MdOutlineWork, MdOutlineDescription,
  MdOutlineWhatsapp, MdOutlineLocationOn,
  MdPhotoLibrary, MdZoomIn, MdOutlineLocalOffer,
  MdAccessTime, MdEventAvailable, MdSchedule
} from 'react-icons/md';
import { FaComments, FaWhatsapp, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

// CONSTANTES
const JS_DAY_TO_KEY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const KEY_TO_FR = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};

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

const getFullSchedule = (service) => {
  if (service?.is_always_open || service?.is_open_24h) {
    return {
      isOpen: true,
      schedule: DAYS_ORDER.map(day => ({
        day: KEY_TO_FR[day],
        isOpen: true,
        start: '00:00',
        end: '23:59',
        isToday: day === JS_DAY_TO_KEY[new Date().getDay()]
      }))
    };
  }

  const now = new Date();
  const currentDayKey = JS_DAY_TO_KEY[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const scheduleData = DAYS_ORDER.map(day => {
    const schedule = service?.schedule?.[day];
    const isOpen = schedule?.is_open === true || schedule?.is_open === "1";
    const start = schedule?.start || schedule?.start_time || null;
    const end = schedule?.end || schedule?.end_time || null;
    
    return {
      day: KEY_TO_FR[day],
      dayKey: day,
      isOpen,
      start: start,
      end: end,
      isToday: day === currentDayKey
    };
  });

  const todaySchedule = scheduleData.find(d => d.isToday);
  let isCurrentlyOpen = false;
  
  if (todaySchedule?.isOpen && todaySchedule.start && todaySchedule.end) {
    const start = parseTimeToMinutes(todaySchedule.start);
    const end = parseTimeToMinutes(todaySchedule.end);
    if (start !== null && end !== null) {
      isCurrentlyOpen = end < start
        ? currentMinutes >= start || currentMinutes <= end
        : currentMinutes >= start && currentMinutes <= end;
    }
  }

  return {
    isOpen: isCurrentlyOpen,
    schedule: scheduleData
  };
};

// COMPOSANTS
const StatusBadge = ({ status }) => {
  if (!status) return null;
  
  return (
    <div className="status-badge" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: status.isOpen ? '#fef2f2' : '#fef2f2',
      color: '#dc2626',
      borderRadius: '16px',
      padding: '12px 20px',
      marginBottom: '24px',
      border: `1px solid #fecaca`,
    }}>
      <div className="status-icon-wrapper" style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: '#fecaca',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {status.isOpen ? <FiCheckCircle size={24} color="#dc2626" /> : <FiAlertCircle size={24} color="#dc2626" />}
      </div>
      <div className="status-info" style={{ flex: 1 }}>
        <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>{status.isOpen ? 'Ouvert maintenant' : 'Fermé actuellement'}</div>
        {status.sublabel && (
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{status.sublabel}</div>
        )}
      </div>
    </div>
  );
};

const ScheduleCard = ({ schedule }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedSchedule = isExpanded ? schedule.schedule : schedule.schedule.slice(0, 3);
  
  return (
    <div className="schedule-card" style={{
      background: '#f8fafc',
      borderRadius: '16px',
      padding: '16px',
      marginTop: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdSchedule style={{ color: '#dc2626', fontSize: '1.25rem' }} />
          <span style={{ fontWeight: '600', color: '#1e293b' }}>Horaires d'ouverture</span>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#dc2626',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          {isExpanded ? 'Voir moins' : 'Voir plus'}
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayedSchedule.map((day, idx) => (
          <div 
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: idx < displayedSchedule.length - 1 ? '1px solid #e2e8f0' : 'none',
              background: day.isToday ? '#fef2f2' : 'transparent',
              borderRadius: '8px',
              margin: day.isToday ? '-8px 0' : '0',
              padding: day.isToday ? '8px 12px' : '8px 0'
            }}
          >
            <span style={{ 
              fontWeight: day.isToday ? '600' : '400',
              color: day.isToday ? '#dc2626' : '#475569'
            }}>
              {day.day}
              {day.isToday && <span style={{ fontSize: '0.75rem', marginLeft: '8px' }}>(Aujourd'hui)</span>}
            </span>
            {day.isOpen ? (
              <span style={{ color: '#059669', fontWeight: '500' }}>
                {day.start && day.end ? `${day.start} - ${day.end}` : 'Horaires non définis'}
              </span>
            ) : (
              <span style={{ color: '#dc2626' }}>Fermé</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="loading-container" style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  }}>
    <div className="loading-content" style={{
      textAlign: 'center'
    }}>
      <div className="spinner" style={{
        width: '60px',
        height: '60px',
        border: '4px solid #fef2f2',
        borderTop: '4px solid #dc2626',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      <p style={{ fontSize: '1.125rem', marginBottom: '8px', color: '#1e293b' }}>Chargement du service...</p>
      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Veuillez patienter</p>
    </div>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const ErrorDisplay = ({ error, onRetry }) => (
  <div className="error-container" style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: '20px'
  }}>
    <div className="error-card" style={{
      background: '#fff',
      borderRadius: '24px',
      padding: '48px',
      textAlign: 'center',
      maxWidth: '500px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <FiAlertCircle size={64} color="#dc2626" style={{ marginBottom: '24px' }} />
      <h2 style={{ fontSize: '28px', color: '#1e293b', marginBottom: '12px' }}>{error || 'Service non trouvé'}</h2>
      <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: '1.6' }}>
        Le service que vous recherchez n'existe pas ou a été supprimé.
      </p>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/services" style={{
          background: '#dc2626',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '12px',
          textDecoration: 'none',
          fontWeight: '600',
          transition: 'all 0.3s'
        }}>
          ← Retour aux services
        </Link>
        {onRetry && (
          <button onClick={onRetry} style={{
            background: '#fff',
            color: '#dc2626',
            padding: '12px 24px',
            borderRadius: '12px',
            border: '2px solid #dc2626',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Réessayer
          </button>
        )}
      </div>
    </div>
  </div>
);

const FullscreenModal = ({ isOpen, onClose, medias, initialIndex, serviceName }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  
  useEffect(() => {
    if (initialIndex !== undefined) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      switch(e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowLeft': setCurrentIndex(prev => Math.max(0, prev - 1)); break;
        case 'ArrowRight': setCurrentIndex(prev => Math.min(medias?.length - 1, prev + 1)); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, medias?.length, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fullscreen-modal" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div className="modal-content" style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <img 
          src={medias[currentIndex]}
          alt={`${serviceName} - Vue agrandie`}
          style={{
            maxWidth: '100%',
            maxHeight: '90vh',
            objectFit: 'contain'
          }}
        />
        
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.5)',
          border: 'none',
          color: '#fff',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FiX size={20} />
        </button>
        
        {medias.length > 1 && (
          <>
            <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              color: '#fff',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiChevronLeft size={24} />
            </button>
            <button onClick={() => setCurrentIndex(prev => Math.min(medias.length - 1, prev + 1))} style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              color: '#fff',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiChevronRight size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default function PublicServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireAuth } = usePendingAction({ redirectPath: `/service/${id}` });

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const hasActivePromo = useMemo(() => service && isPromoActive(service), [service]);
  const discountPercentage = useMemo(() => service && calculateDiscount(service), [service]);
  const promoPeriod = useMemo(() => service && formatPromoPeriod(service), [service]);
  const scheduleInfo = useMemo(() => service && getFullSchedule(service), [service]);

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
    } catch (err) {
      setError('Service non trouvé');
      setTimeout(() => navigate('/services'), 2000);
    } finally {
      setLoading(false);
    }
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

  if (loading) return <LoadingSpinner />;
  if (error || !service) return <ErrorDisplay error={error} onRetry={fetchService} />;

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .service-details {
          animation: fadeInUp 0.6s ease-out;
        }

        .gallery-image {
          transition: transform 0.3s ease;
        }

        .gallery-image:hover {
          transform: scale(1.05);
        }

        .thumbnail {
          transition: all 0.2s ease;
        }

        .thumbnail:hover {
          transform: scale(1.05);
          border-color: #dc2626;
        }

        .contact-btn {
          transition: all 0.3s ease;
        }

        .contact-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(220,38,38,0.3);
        }

        @media (max-width: 768px) {
          .service-name {
            font-size: 1.75rem !important;
          }
        }

        @media (max-width: 640px) {
          .service-name {
            font-size: 1.5rem !important;
          }
          
          .gallery-container {
            height: 300px !important;
          }
        }

        @media (max-width: 480px) {
          .service-name {
            font-size: 1.25rem !important;
          }
          
          .gallery-container {
            height: 250px !important;
          }
        }
      `}</style>

      <div className="service-details" style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '2rem 1rem'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <Link to="/services" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#dc2626',
              textDecoration: 'none',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '12px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s'
            }}>
              <FiArrowLeft />
              <span>Retour aux services</span>
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: '2rem',
          }}>
            {/* Left Column - Gallery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                background: '#fff',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div className="gallery-container" style={{
                  position: 'relative',
                  height: '450px',
                  background: '#f1f5f9',
                  cursor: 'pointer',
                }} onClick={() => openModal(currentImageIndex)}>
                  <img 
                    src={service.medias?.[currentImageIndex]} 
                    alt={service.name}
                    className="gallery-image"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  
                  <button onClick={(e) => { e.stopPropagation(); openModal(currentImageIndex); }} style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    color: '#fff',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(5px)'
                  }}>
                    <FiMaximize2 size={20} />
                  </button>
                  
                  {service.medias?.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); prevImage(); }} style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: '#fff',
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FiChevronLeft size={24} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); nextImage(); }} style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: '#fff',
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FiChevronRight size={24} />
                      </button>
                    </>
                  )}
                  
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    {currentImageIndex + 1} / {service.medias?.length || 0}
                  </div>
                </div>
                
                {service.medias?.length > 1 && (
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '16px',
                    overflowX: 'auto',
                    background: '#fff'
                  }}>
                    {service.medias.map((media, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className="thumbnail"
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: idx === currentImageIndex ? '3px solid #dc2626' : '2px solid #e2e8f0',
                          cursor: 'pointer',
                          padding: 0,
                          background: 'transparent',
                          flexShrink: 0
                        }}
                      >
                        <img 
                          src={media}
                          alt={`${service.name} ${idx + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Enterprise Card */}
              {service.entreprise && (
                <div style={{
                  background: '#fff',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <h3 style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1.25rem',
                    marginBottom: '16px',
                    color: '#1e293b'
                  }}>
                    <MdBusiness style={{ color: '#dc2626' }} />
                    Entreprise
                  </h3>
                  
                  <Link to={`/entreprises/${service.entreprise.id}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    transition: 'all 0.3s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {service.entreprise.logo ? (
                        <img 
                          src={service.entreprise.logo} 
                          alt={service.entreprise.name}
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '12px',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '12px',
                          backgroundColor: '#fef2f2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          color: '#dc2626'
                        }}>
                          <MdBusiness size={32} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                          {service.entreprise.name}
                        </div>
                        {service.entreprise.siege && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.875rem' }}>
                            <FaMapMarkerAlt size={12} />
                            <span>{service.entreprise.siege}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{ color: '#dc2626', fontSize: '20px' }}>→</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Main Info Card */}
              <div style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h1 className="service-name" style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: 0,
                    flex: 1
                  }}>
                    {service.name}
                  </h1>
                  
                </div>
                
                {service.domaine && (
                  <div style={{
                    display: 'inline-block',
                    background: '#fef2f2',
                    color: '#dc2626',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}>
                    {service.domaine.name}
                  </div>
                )}
                
                <StarRating rating={service.average_rating} total={service.total_reviews} />
                
                {service.descriptions && (
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '12px',
                      color: '#475569'
                    }}>
                      <MdOutlineDescription />
                      Description
                    </h3>
                    <p style={{
                      color: '#64748b',
                      lineHeight: '1.6',
                      fontSize: '0.95rem'
                    }}>
                      {service.descriptions}
                    </p>
                  </div>
                )}
              </div>

              {/* Pricing Card */}
              <div style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '1.25rem',
                  marginBottom: '16px',
                  color: '#1e293b'
                }}>
                  <FiDollarSign style={{ color: '#dc2626' }} />
                  Tarification
                </h3>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontWeight: '600', color: '#475569' }}>Prix</span>
                  {hasActivePromo ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                          {formatPrice(service.price)}
                        </span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
                          {formatPrice(service.price_promo)}
                        </span>
                        <span style={{
                          background: '#dc2626',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '700'
                        }}>
                          -{discountPercentage}%
                        </span>
                      </div>
                      {promoPeriod && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px' }}>
                          {promoPeriod}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
                      {service.price ? formatPrice(service.price) : 'Sur devis'}
                    </span>
                  )}
                </div>
                
                {service.is_price_on_request && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: '#fef2f2',
                    borderRadius: '12px',
                    color: '#dc2626'
                  }}>
                    <FiInfo />
                    <span style={{ fontSize: '0.875rem' }}>Prix sur demande - Contactez le prestataire pour un devis personnalisé</span>
                  </div>
                )}
              </div>

              {/* Schedule Card */}
              {scheduleInfo && (
                <div style={{
                  background: '#fff',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <h3 style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1.25rem',
                    marginBottom: '16px',
                    color: '#1e293b'
                  }}>
                    <FiClock style={{ color: '#dc2626' }} />
                    Horaires & Disponibilité
                  </h3>
                  
                  <div style={{
                    padding: '16px',
                    background: scheduleInfo.isOpen ? '#fef2f2' : '#fef2f2',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: `1px solid #fecaca`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {scheduleInfo.isOpen ? (
                        <FiCheckCircle style={{ color: '#dc2626', fontSize: '24px' }} />
                      ) : (
                        <FiAlertCircle style={{ color: '#dc2626', fontSize: '24px' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: '700', color: '#dc2626' }}>
                          {scheduleInfo.isOpen ? 'Ouvert maintenant' : 'Fermé actuellement'}
                        </div>
                        {scheduleInfo.isOpen ? (
                          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Nous sommes disponibles pour vous servir
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Consultez nos horaires ci-dessous
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <ScheduleCard schedule={scheduleInfo} />
                </div>
              )}

              {/* Contact & Actions Card */}
              <div style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '1.25rem',
                  marginBottom: '16px',
                  color: '#1e293b'
                }}>
                  <FaComments style={{ color: '#dc2626' }} />
                  Contact & Actions
                </h3>
                
                <button 
                  onClick={() => setShowContactModal(true)}
                  className="contact-btn"
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}
                >
                  <FaComments size={20} />
                  <span>Contacter le prestataire</span>
                </button>
                
                <button 
                  onClick={handleRendezVous}
                  className="contact-btn"
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#1e293b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}
                >
                  <FiCalendar size={20} />
                  <span>Prendre rendez-vous</span>
                </button>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                 
                  
                  <button onClick={handleShare} style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: '#475569',
                    fontWeight: '500'
                  }}>
                    <FiShare2 />
                    Partager
                  </button>
                </div>
              </div>

              {/* Help Box */}
              <div style={{
                background: '#fef2f2',
                borderRadius: '20px',
                padding: '20px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                border: '1px solid #fecaca'
              }}>
                <FiInfo style={{ color: '#dc2626', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Besoin d'aide ?</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.875rem', lineHeight: '1.5' }}>
                    Contactez directement le prestataire pour plus d'informations ou pour prendre rendez-vous.
                    Notre équipe est là pour vous accompagner.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        entreprise={service?.entreprise}
        serviceName={service?.name}
        onChat={() => setShowChatModal(true)}
      />

      {user && service?.entreprise && showChatModal && (
        <ChatModal
          receiverId={service.entreprise.prestataire_id}
          receiverName={service.entreprise.name || 'Prestataire'}
          onClose={() => setShowChatModal(false)}
        />
      )}

      <FullscreenModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        medias={service?.medias}
        initialIndex={modalImageIndex}
        serviceName={service?.name}
      />
    </>
  );
}