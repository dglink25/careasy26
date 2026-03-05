import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';
import theme from '../../config/theme';
import { 
  FiDollarSign, 
  FiClock, 
  FiCalendar,
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiPause
} from 'react-icons/fi';
import {
  MdBusiness,
  MdOutlineWork,
  MdOutlineLocationOn,
  MdOutlineAccessTime,
  MdOutlineStar,
  MdOutlineVerified,
  MdOutlineDiscount,
  MdOutlineLocalOffer,
  MdOutlineInfo
} from 'react-icons/md';

const formatPrice = (price) => {
  if (!price) return null;
  return `${price.toLocaleString('fr-FR')} FCFA`;
};

const isPromoActive = (service) => {
  if (!service.has_promo || !service.price_promo) return false;
  
  const now = new Date();
  
  if (!service.promo_start_date && !service.promo_end_date) {
    return true;
  }
  
  if (service.promo_start_date && service.promo_end_date) {
    const start = new Date(service.promo_start_date);
    const end = new Date(service.promo_end_date);
    return now >= start && now <= end;
  }
  
  if (service.promo_start_date) {
    return now >= new Date(service.promo_start_date);
  }
  
  if (service.promo_end_date) {
    return now <= new Date(service.promo_end_date);
  }
  
  return false;
};

const calculateDiscount = (service) => {
  if (!service.has_promo || !service.price_promo || !service.price || service.price === 0) {
    return null;
  }
  const discount = ((service.price - service.price_promo) / service.price) * 100;
  return Math.round(discount);
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
const AUTOPLAY_INTERVAL = 4000; 
const AUTOPLAY_PAUSE_DURATION = 10000; 

const useImageGallery = (medias) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const totalImages = medias?.length || 0;

  const nextImage = useCallback(() => {
    if (totalImages > 0) {
      setCurrentIndex((prev) => (prev + 1) % totalImages);
    }
  }, [totalImages]);
  const prevImage = useCallback(() => {
    if (totalImages > 0) {
      setCurrentIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
    }
  }, [totalImages]);

  const goToImage = useCallback((index) => {
    if (index >= 0 && index < totalImages) {
      setCurrentIndex(index);
    }
  }, [totalImages]);

  const handleUserInteraction = useCallback(() => {
    setAutoPlay(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    timeoutRef.current = setTimeout(() => {
      setAutoPlay(true);
      timeoutRef.current = null;
    }, AUTOPLAY_PAUSE_DURATION);
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoPlay && totalImages >= 2) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalImages);
      }, AUTOPLAY_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoPlay, totalImages]);

  return {
    currentIndex,
    nextImage,
    prevImage,
    goToImage,
    autoPlay,
    handleUserInteraction,
    totalImages
  };
};


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
    {autoPlay ? (
      <>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          animation: 'pulseDot 1.5s ease-in-out infinite',
        }} />
        <span>Auto {currentIndex + 1}/{totalImages}</span>
      </>
    ) : (
      <>
        <FiPause style={{ fontSize: '0.6rem' }} />
        <span>En pause</span>
      </>
    )}
  </div>
);

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

export default function DetailsService() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const {
    currentIndex: currentImageIndex,
    nextImage,
    prevImage,
    goToImage,
    autoPlay,
    handleUserInteraction,
    totalImages
  } = useImageGallery(service?.medias);

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const data = await serviceApi.getServiceById(id);
      setService(data);
      setError('');
    } catch (err) {
      console.error('Erreur chargement service:', err);
      setError('Service non trouvé');
      setTimeout(() => navigate('/mes-services'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;
    
    try {
      await serviceApi.deleteService(service.id);
      navigate('/mes-services');
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement des détails...</p>
          <p style={styles.loadingSubtext}>Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={styles.errorTitle}>{error || 'Service introuvable'}</h2>
          <p style={styles.errorMessage}>
            Redirection vers la liste des services...
          </p>
        </div>
      </div>
    );
  }

  const promoActive = isPromoActive(service);
  const discount = calculateDiscount(service);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <Link to="/mes-services" style={styles.backButton}>
              <FiArrowLeft size={20} />
              <span>Retour à mes services</span>
            </Link>
          </div>
          <div style={styles.headerActions}>
            <Link 
              to={`/services/modifier/${service.id}`}
              style={styles.editButton}
            >
              <FiEdit size={16} />
              Modifier
            </Link>
            <button 
              onClick={() => setDeleteModal(true)}
              style={styles.deleteButton}
            >
              <FiTrash2 size={16} />
              Supprimer
            </button>
          </div>
        </div>

        <div style={styles.mainGrid}>
          <div style={styles.leftColumn}>
            {service.medias && service.medias.length > 0 ? (
              <div style={styles.galleryCard}>
                <div 
                  style={styles.mainImageContainer}
                  onMouseEnter={handleUserInteraction}
                >
                  <img 
                    src={service.medias[currentImageIndex]}
                    alt={service.name}
                    style={styles.mainImage}
                  />
                  
                  {service.medias.length > 1 && (
                    <AutoPlayIndicator 
                      autoPlay={autoPlay}
                      currentIndex={currentImageIndex}
                      totalImages={service.medias.length}
                    />
                  )}
                  
                  {service.medias.length > 1 && autoPlay && (
                    <ProgressBar 
                      totalImages={service.medias.length}
                      currentIndex={currentImageIndex}
                    />
                  )}
                  
                  {service.medias.length > 1 && (
                    <ImageThumbnails 
                      medias={service.medias}
                      currentIndex={currentImageIndex}
                      onThumbnailClick={(index) => {
                        goToImage(index);
                        handleUserInteraction();
                      }}
                    />
                  )}
                  
                  {service.medias.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          prevImage();
                          handleUserInteraction();
                        }}
                        style={{
                          ...styles.navButton,
                          left: '10px',
                          opacity: 0,
                        }}
                        className="image-nav-button"
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 0.9}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                      >
                        <FiChevronLeft size={20} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          nextImage();
                          handleUserInteraction();
                        }}
                        style={{
                          ...styles.navButton,
                          right: '10px',
                          opacity: 0,
                        }}
                        className="image-nav-button"
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 0.9}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                      >
                        <FiChevronRight size={20} />
                      </button>
                    </>
                  )}
                  
                  <div style={styles.imageCounter}>
                    {currentImageIndex + 1} / {service.medias.length}
                  </div>
                </div>
                
                {service.medias.length > 1 && (
                  <div style={styles.thumbnailsContainer}>
                    {service.medias.map((media, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          goToImage(index);
                          handleUserInteraction();
                        }}
                        style={{
                          ...styles.thumbnail,
                          ...(index === currentImageIndex ? styles.thumbnailActive : {})
                        }}
                      >
                        <img 
                          src={media}
                          alt={`${service.name} ${index + 1}`}
                          style={styles.thumbnailImage}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.noImageCard}>
                <MdOutlineWork style={styles.noImageIcon} />
                <p style={styles.noImageText}>Aucune image disponible</p>
              </div>
            )}

            {service.entreprise && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>
                  <MdBusiness style={styles.cardTitleIcon} />
                  Entreprise
                </h2>
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
                      />
                    ) : (
                      <div style={styles.entrepriseLogoPlaceholder}>
                        <MdBusiness style={styles.entrepriseLogoPlaceholderIcon} />
                      </div>
                    )}
                    <div style={styles.entrepriseDetails}>
                      <div style={styles.entrepriseName}>
                        {service.entreprise.name}
                      </div>
                      {service.entreprise.siege && (
                        <div style={styles.entrepriseLocation}>
                          <MdOutlineLocationOn style={styles.locationIcon} />
                          {service.entreprise.siege}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={styles.viewLink}>Voir l'entreprise →</span>
                </Link>
              </div>
            )}
          </div>

          <div style={styles.rightColumn}>
            <div style={styles.card}>
              <div style={styles.serviceHeader}>
                <h1 style={styles.serviceName}>{service.name}</h1>
                {service.domaine && (
                  <div style={styles.domaineTag}>
                    {service.domaine.name}
                  </div>
                )}
              </div>

              {promoActive && (
                <div style={styles.promoBanner}>
                  <MdOutlineLocalOffer style={styles.promoBannerIcon} />
                  <div style={styles.promoBannerContent}>
                    <span style={styles.promoBannerTitle}>Promotion active</span>
                    <span style={styles.promoBannerDiscount}>-{discount}%</span>
                  </div>
                </div>
              )}

              {service.descriptions && (
                <div style={styles.descriptionSection}>
                  <h3 style={styles.sectionSubtitle}>Description</h3>
                  <p style={styles.description}>{service.descriptions}</p>
                </div>
              )}
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <FiDollarSign style={styles.cardTitleIcon} />
                Tarification
              </h2>
              
              <div style={styles.infoList}>
                {service.is_price_on_request ? (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Type de tarif</span>
                    <div style={styles.priceOnRequest}>
                      <MdOutlineInfo style={styles.priceOnRequestIcon} />
                      <span>Sur devis</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {promoActive ? (
                      <>
                        <div style={styles.infoItem}>
                          <span style={styles.infoLabel}>Prix normal</span>
                          <span style={styles.priceOld}>
                            {formatPrice(service.price)}
                          </span>
                        </div>
                        
                        <div style={styles.infoItem}>
                          <span style={styles.infoLabel}>Prix promotionnel</span>
                          <div style={styles.pricePromoContainer}>
                            <span style={styles.pricePromo}>
                              {formatPrice(service.price_promo)}
                            </span>
                            <span style={styles.discountBadge}>
                              -{discount}%
                            </span>
                          </div>
                        </div>

                        {(service.promo_start_date || service.promo_end_date) && (
                          <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Validité promo</span>
                            <div style={styles.promoDates}>
                              {service.promo_start_date && (
                                <div style={styles.promoDate}>
                                  <FiCalendar size={12} />
                                  <span>Du {formatDate(service.promo_start_date)}</span>
                                </div>
                              )}
                              {service.promo_end_date && (
                                <div style={styles.promoDate}>
                                  <FiCalendar size={12} />
                                  <span>Au {formatDate(service.promo_end_date)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Prix</span>
                        <span style={styles.priceValue}>
                          {service.price 
                            ? formatPrice(service.price)
                            : 'Prix non défini'
                          }
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <FiClock style={styles.cardTitleIcon} />
                Disponibilité
              </h2>
              
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Horaires</span>
                  <div style={styles.hoursValue}>
                    <MdOutlineAccessTime style={styles.hoursIcon} />
                    {service.is_open_24h ? (
                      <span style={styles.hoursText}>24h/24 - 7j/7</span>
                    ) : service.start_time && service.end_time ? (
                      <span style={styles.hoursText}>
                        {service.start_time} - {service.end_time}
                      </span>
                    ) : (
                      <span style={styles.hoursText}>Non renseignés</span>
                    )}
                  </div>
                </div>

                {service.schedule && !service.is_open_24h && (
                  <div style={styles.scheduleDetails}>
                    <h4 style={styles.scheduleTitle}>Détail par jour</h4>
                    {Object.entries(service.schedule).map(([day, data]) => (
                      <div key={day} style={styles.scheduleItem}>
                        <span style={styles.scheduleDay}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </span>
                        {data.is_open ? (
                          <span style={styles.scheduleTime}>
                            {data.start} - {data.end}
                          </span>
                        ) : (
                          <span style={styles.scheduleClosed}>Fermé</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            
            <div style={styles.infoBox}>
              <MdOutlineInfo style={styles.infoBoxIcon} />
              <div>
                <h4 style={styles.infoBoxTitle}>Besoin de modifications ?</h4>
                <p style={styles.infoBoxText}>
                  Pour modifier ce service, utilisez le bouton "Modifier" en haut de page.
                  Toutes les modifications seront visibles immédiatement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {deleteModal && (
        <div style={styles.modalOverlay} onClick={() => setDeleteModal(false)}>
          <div 
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>Confirmer la suppression</h3>
            <p style={styles.modalText}>
              Êtes-vous sûr de vouloir supprimer le service <strong>"{service.name}"</strong> ?
            </p>
            <p style={styles.modalWarning}>
              Cette action est irréversible.
            </p>
            <div style={styles.modalActions}>
              <button
                onClick={() => setDeleteModal(false)}
                style={styles.modalCancelButton}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                style={styles.modalConfirmButton}
              >
                <FiTrash2 size={16} />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        .service-card {
          animation: fadeIn 0.3s ease-out;
        }

        .image-nav-button {
          transition: opacity 0.2s ease !important;
        }

        .image-nav-button:hover {
          opacity: 0.9 !important;
          transform: translateY(-50%) scale(1.1) !important;
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem',
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
    border: `4px solid #fee2e2`,
    borderTop: `4px solid #ef4444`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#475569',
    fontSize: '1.125rem',
  },
  loadingSubtext: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1.5rem',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: '4rem',
  },
  errorTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  errorMessage: {
    color: '#64748b',
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#64748b',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f1f5f9',
      color: '#ef4444',
    },
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fff',
    border: '2px solid #ef4444',
    color: '#ef4444',
    padding: '0.625rem 1.25rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#ef4444',
      color: '#fff',
      transform: 'translateY(-2px)',
    },
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fff',
    border: '2px solid #dc2626',
    color: '#dc2626',
    padding: '0.625rem 1.25rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#dc2626',
      color: '#fff',
      transform: 'translateY(-2px)',
    },
  },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '2rem',
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

  galleryCard: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  },
  mainImageContainer: {
    position: 'relative',
    height: '400px',
    backgroundColor: '#f1f5f9',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#1e293b',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    fontSize: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 5,
    ':hover': {
      backgroundColor: '#fff',
      transform: 'translateY(-50%) scale(1.1)',
    },
  },
  imageCounter: {
    position: 'absolute',
    bottom: '1rem',
    right: '1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '2rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    zIndex: 3,
  },
  thumbnailsContainer: {
    display: 'flex',
    gap: '0.75rem',
    padding: '1rem',
    overflowX: 'auto',
  },
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
    transition: 'all 0.2s',
  },
  thumbnailActive: {
    borderColor: '#ef4444',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  noImageCard: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    border: '2px dashed #e2e8f0',
    padding: '4rem 2rem',
    textAlign: 'center',
  },
  noImageIcon: {
    fontSize: '4rem',
    color: '#94a3b8',
    marginBottom: '1rem',
  },
  noImageText: {
    color: '#64748b',
    fontSize: '1.125rem',
  },

  card: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    animation: 'fadeIn 0.3s ease-out',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '1.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #f1f5f9',
  },
  cardTitleIcon: {
    fontSize: '1.25rem',
    color: '#ef4444',
  },

  serviceHeader: {
    marginBottom: '1.5rem',
  },
  serviceName: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '1rem',
    lineHeight: '1.2',
  },
  domaineTag: {
    display: 'inline-block',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    padding: '0.5rem 1rem',
    borderRadius: '2rem',
    fontSize: '0.875rem',
    fontWeight: '600',
  },

  promoBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backgroundColor: '#fff1f2',
    border: '2px solid #fecdd3',
    padding: '1rem',
    borderRadius: '0.75rem',
    marginBottom: '1.5rem',
  },
  promoBannerIcon: {
    fontSize: '2rem',
    color: '#ef4444',
  },
  promoBannerContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoBannerTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#ef4444',
  },
  promoBannerDiscount: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#ef4444',
  },

  descriptionSection: {
    marginTop: '1.5rem',
  },
  sectionSubtitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.75rem',
  },
  description: {
    color: '#475569',
    fontSize: '0.95rem',
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap',
  },

  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '1rem',
    borderBottom: '1px solid #f1f5f9',
    ':last-child': {
      borderBottom: 'none',
      paddingBottom: 0,
    },
  },
  infoLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#64748b',
  },

  priceValue: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#059669',
  },
  priceOnRequest: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    color: '#f97316',
    backgroundColor: '#fff7ed',
    padding: '0.5rem 1rem',
    borderRadius: '2rem',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  priceOnRequestIcon: {
    fontSize: '1rem',
  },
  priceOld: {
    fontSize: '1rem',
    color: '#6b7280',
    textDecoration: 'line-through',
  },
  pricePromoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  pricePromo: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#ef4444',
  },
  discountBadge: {
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  promoDates: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  promoDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    color: '#6b7280',
    fontSize: '0.75rem',
  },

  hoursValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  hoursIcon: {
    fontSize: '1rem',
    color: '#6366f1',
  },
  hoursText: {
    fontWeight: '600',
    color: '#1e293b',
  },
  scheduleDetails: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
  },
  scheduleTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.75rem',
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
    fontSize: '0.875rem',
    color: '#475569',
    textTransform: 'capitalize',
  },
  scheduleTime: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#059669',
  },
  scheduleClosed: {
    fontSize: '0.875rem',
    color: '#ef4444',
  },

  entrepriseLink: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    textDecoration: 'none',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f1f5f9',
      transform: 'translateY(-2px)',
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
    backgroundColor: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entrepriseLogoPlaceholderIcon: {
    fontSize: '2rem',
    color: '#ef4444',
  },
  entrepriseDetails: {
    flex: 1,
  },
  entrepriseName: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.25rem',
  },
  entrepriseLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  locationIcon: {
    fontSize: '1rem',
    color: '#94a3b8',
  },
  viewLink: {
    color: '#ef4444',
    fontSize: '0.875rem',
    fontWeight: '600',
    alignSelf: 'flex-end',
  },

  // Info Box
  infoBox: {
    backgroundColor: '#dbeafe',
    padding: '1.25rem',
    borderRadius: '0.75rem',
    border: '1px solid #93c5fd',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  infoBoxIcon: {
    fontSize: '1.5rem',
    color: '#1e40af',
    flexShrink: 0,
  },
  infoBoxTitle: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: '0.25rem',
  },
  infoBoxText: {
    fontSize: '0.75rem',
    color: '#1e3a8a',
    lineHeight: '1.5',
  },

  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(5px)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    padding: '2rem',
    maxWidth: '400px',
    width: '90%',
    animation: 'fadeIn 0.3s ease-out',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '1rem',
  },
  modalText: {
    fontSize: '0.95rem',
    color: '#4b5563',
    marginBottom: '1rem',
  },
  modalWarning: {
    fontSize: '0.875rem',
    color: '#ef4444',
    backgroundColor: '#fee2e2',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    marginBottom: '1.5rem',
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e5e7eb',
    },
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#dc2626',
    },
  },

  '@media (max-width: 768px)': {
    content: {
      padding: '0 1rem',
    },
    header: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    headerActions: {
      width: '100%',
    },
    editButton: {
      flex: 1,
      justifyContent: 'center',
    },
    deleteButton: {
      flex: 1,
      justifyContent: 'center',
    },
    mainGrid: {
      gridTemplateColumns: '1fr',
    },
    mainImageContainer: {
      height: '300px',
    },
    serviceName: {
      fontSize: '1.5rem',
    },
    promoBannerContent: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '0.5rem',
    },
    modalActions: {
      flexDirection: 'column',
    },
  },
};