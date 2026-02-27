// src/pages/public/PublicServiceDetails.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../../api/publicApi';
import ChatButton from '../../components/Chat/ChatButton';
import theme from '../../config/theme';
import { 
  FiArrowLeft, FiMapPin, FiClock, FiDollarSign, 
  FiPhone, FiMail, FiNavigation, FiShare2, FiHeart,
  FiCalendar, FiInfo, FiChevronLeft, FiChevronRight,
  FiX, FiMaximize2, FiMinimize2, FiDownload, FiExternalLink
} from 'react-icons/fi';
import {
  MdBusiness, MdOutlineWork, MdOutlineDescription,
  MdOutlineAccessTime, MdOutlineWhatsapp, MdOutlineLocationOn,
  MdPhotoLibrary, MdZoomIn, MdZoomOut, MdRotateRight
} from 'react-icons/md';

export default function PublicServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // États pour la modale
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Seuil minimum pour le swipe
  const minSwipeDistance = 50;

  useEffect(() => {
    fetchService();
    
    // Vérifier si dans les favoris
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
      console.error('Erreur chargement service:', err);
      setError('Service non trouvé');
      setTimeout(() => navigate('/services'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteServices') || '[]');
    
    if (isFavorite) {
      const newFavorites = favorites.filter(favId => favId !== id);
      localStorage.setItem('favoriteServices', JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      favorites.push(id);
      localStorage.setItem('favoriteServices', JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  const handleShare = async () => {
    if (navigator.share && service) {
      try {
        await navigator.share({
          title: service.name,
          text: `Découvrez ce service: ${service.name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Lien copié dans le presse-papiers !');
      } catch (err) {
        console.error('Erreur copie:', err);
      }
    }
  };

  const handleContact = (method) => {
    if (!service?.entreprise) return;

    const phone = service.entreprise.phone;
    const email = service.entreprise.email;

    switch(method) {
      case 'phone':
        window.open(`tel:${phone}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:${email}`, '_blank');
        break;
      case 'whatsapp':
        const message = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre service: ${service.name}`);
        window.open(`https://wa.me/${phone?.replace(/\D/g, '')}?text=${message}`, '_blank');
        break;
      case 'maps':
        if (service.entreprise.siege) {
          const address = encodeURIComponent(service.entreprise.siege);
          window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
        }
        break;
    }
  };

  // Gestionnaires pour la galerie principale
  const nextImage = () => {
    if (service?.medias?.length > 1) {
      setCurrentImageIndex(prev => (prev + 1) % service.medias.length);
    }
  };

  const prevImage = () => {
    if (service?.medias?.length > 1) {
      setCurrentImageIndex(prev => prev === 0 ? service.medias.length - 1 : prev - 1);
    }
  };

  // Gestionnaires pour la modale
  const openModal = (index) => {
    setModalImageIndex(index);
    setModalOpen(true);
    setZoomLevel(1);
  };

  const closeModal = () => {
    setModalOpen(false);
    setZoomLevel(1);
  };

  const nextModalImage = () => {
    if (service?.medias?.length > 1) {
      setModalImageIndex(prev => (prev + 1) % service.medias.length);
      setZoomLevel(1);
    }
  };

  const prevModalImage = () => {
    if (service?.medias?.length > 1) {
      setModalImageIndex(prev => prev === 0 ? service.medias.length - 1 : prev - 1);
      setZoomLevel(1);
    }
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  // Gestion du swipe tactile pour la modale
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
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextModalImage();
    } else if (isRightSwipe) {
      prevModalImage();
    }
  };

  // Télécharger l'image
  const downloadImage = async (url, index) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `service-${service?.name}-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement du service...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={styles.errorTitle}>{error || 'Service non trouvé'}</h2>
          <p style={styles.errorMessage}>Le service que vous recherchez n'existe pas ou a été supprimé.</p>
          <Link to="/services" style={styles.errorButton}>
            ← Retour aux services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header avec animations */}
        <div style={styles.header}>
          <Link to="/services" style={styles.backButton}>
            <FiArrowLeft style={styles.backButtonIcon} />
            <span>Retour aux services</span>
          </Link>
        </div>

        {/* Grid principal - Responsive */}
        <div style={styles.mainGrid}>
          {/* Colonne gauche - Images */}
          <div style={styles.leftColumn}>
            {service.medias && service.medias.length > 0 ? (
              <>
                <div style={styles.galleryCard}>
                  <div 
                    style={styles.mainImageContainer}
                    onClick={() => openModal(currentImageIndex)}
                  >
                    <img 
                      src={service.medias[currentImageIndex]}
                      alt={service.name}
                      style={styles.mainImage}
                      loading="lazy"
                    />
                    
                    {/* Bouton plein écran */}
                    <button 
                      style={styles.fullscreenButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(currentImageIndex);
                      }}
                      title="Voir en plein écran"
                    >
                      <FiMaximize2 />
                    </button>
                    
                    {/* Compteur d'images */}
                    <div style={styles.imageCounter}>
                      {currentImageIndex + 1} / {service.medias.length}
                    </div>
                    
                    {/* Navigation fléchée */}
                    {service.medias.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                          }}
                          style={{...styles.navButton, left: '10px'}}
                          title="Image précédente"
                        >
                          <FiChevronLeft />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                          }}
                          style={{...styles.navButton, right: '10px'}}
                          title="Image suivante"
                        >
                          <FiChevronRight />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Miniatures */}
                  {service.medias.length > 1 && (
                    <div style={styles.thumbnailsContainer}>
                      {service.medias.map((media, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          style={{
                            ...styles.thumbnail,
                            ...(index === currentImageIndex ? styles.thumbnailActive : {})
                          }}
                          title={`Voir l'image ${index + 1}`}
                        >
                          <img 
                            src={media}
                            alt={`${service.name} ${index + 1}`}
                            style={styles.thumbnailImage}
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Badge nombre d'images */}
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
                      <div style={styles.entrepriseLogoPlaceholder}>🏢</div>
                    )}
                    <div>
                      <div style={styles.entrepriseName}>
                        {service.entreprise.name}
                      </div>
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

          {/* Colonne droite - Informations */}
          <div style={styles.rightColumn}>
            {/* Carte principale */}
            <div style={styles.card}>
              <div style={styles.serviceHeader}>
                <h1 style={styles.serviceName}>{service.name}</h1>
                <button 
                  onClick={toggleFavorite}
                  style={styles.favoriteButton}
                  title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <FiHeart style={{
                    fontSize: '1.5rem',
                    color: isFavorite ? '#ef4444' : '#94a3b8',
                    fill: isFavorite ? '#ef4444' : 'none',
                    transition: 'all 0.3s ease'
                  }} />
                </button>
              </div>
              
              {service.domaine && (
                <div style={styles.domaineTag}>
                  🏷️ {service.domaine.name}
                </div>
              )}

              {service.descriptions && (
                <div style={styles.descriptionSection}>
                  <h3 style={styles.sectionSubtitle}>
                    <MdOutlineDescription style={styles.sectionIcon} />
                    Description
                  </h3>
                  <p style={styles.description}>{service.descriptions}</p>
                </div>
              )}
            </div>

            {/* Carte Prix & Horaires */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <FiDollarSign style={styles.cardTitleIcon} />
                Tarification & Horaires
              </h2>
              
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    <FiDollarSign style={styles.infoIcon} />
                    Prix
                  </span>
                  <span style={styles.priceValue}>
                    {service.price 
                      ? `${service.price.toLocaleString()} FCFA`
                      : 'Prix sur demande'
                    }
                  </span>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    <FiClock style={styles.infoIcon} />
                    Horaires
                  </span>
                  <span style={styles.infoValue}>
                    {service.is_open_24h 
                      ? '24h/24 - 7j/7'
                      : service.start_time && service.end_time
                        ? `${service.start_time} - ${service.end_time}`
                        : 'Non renseignés'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Carte Contact */}
            {service.entreprise && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>
                  <FiPhone style={styles.cardTitleIcon} />
                  Contact & Rendez-vous
                </h2>
                
                <div style={styles.contactButtons}>
                  <button 
                    onClick={() => handleContact('phone')}
                    style={styles.contactButton}
                  >
                    <FiPhone style={styles.contactButtonIcon} />
                    <div>
                      <div style={styles.contactButtonTitle}>Appeler</div>
                      <div style={styles.contactButtonSubtitle}>
                        {service.entreprise.phone || 'N/A'}
                      </div>
                    </div>
                  </button>

                  <ChatButton
                    receiverId={service.entreprise.prestataire_id}
                    receiverName={service.entreprise.name}
                    buttonText="Envoyer un message"
                    variant="secondary"
                  />
                  
                  <button 
                    onClick={() => handleContact('whatsapp')}
                    style={{...styles.contactButton, ...styles.whatsappButton}}
                  >
                    <MdOutlineWhatsapp style={styles.contactButtonIcon} />
                    <div>
                      <div style={styles.contactButtonTitle}>WhatsApp</div>
                      <div style={styles.contactButtonSubtitle}>Message direct</div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => handleContact('maps')}
                    style={styles.contactButton}
                  >
                    <FiNavigation style={styles.contactButtonIcon} />
                    <div>
                      <div style={styles.contactButtonTitle}>Itinéraire</div>
                      <div style={styles.contactButtonSubtitle}>Google Maps</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Actions rapides */}
            <div style={styles.actionsCard}>
              <button 
                onClick={toggleFavorite}
                style={styles.actionButton}
              >
                <FiHeart style={{
                  color: isFavorite ? '#ef4444' : '#94a3b8',
                  fill: isFavorite ? '#ef4444' : 'none'
                }} />
                {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </button>
              <button 
                onClick={handleShare}
                style={styles.actionButton}
              >
                <FiShare2 />
                Partager
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODALE PLEIN ÉCRAN - Galerie d'images */}
      {modalOpen && service?.medias && (
        <div 
          style={styles.modalOverlay}
          onClick={closeModal}
        >
          <div 
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header de la modale */}
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>
                <MdPhotoLibrary style={styles.modalTitleIcon} />
                <span>
                  Image {modalImageIndex + 1} sur {service.medias.length}
                </span>
              </div>
              <div style={styles.modalControls}>
                <button 
                  onClick={zoomOut}
                  style={styles.modalControlButton}
                  disabled={zoomLevel <= 1}
                  title="Zoom arrière"
                >
                  <MdZoomOut />
                </button>
                <button 
                  onClick={zoomIn}
                  style={styles.modalControlButton}
                  disabled={zoomLevel >= 3}
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
                  onClick={() => downloadImage(service.medias[modalImageIndex], modalImageIndex)}
                  style={styles.modalControlButton}
                  title="Télécharger"
                >
                  <FiDownload />
                </button>
                <button 
                  onClick={closeModal}
                  style={styles.modalCloseButton}
                  title="Fermer"
                >
                  <FiX />
                </button>
              </div>
            </div>

            {/* Image principale de la modale */}
            <div 
              style={styles.modalImageContainer}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img 
                src={service.medias[modalImageIndex]}
                alt={`${service.name} - Vue agrandie`}
                style={{
                  ...styles.modalImage,
                  transform: `scale(${zoomLevel})`,
                  transition: zoomLevel === 1 ? 'transform 0.3s ease' : 'none',
                  cursor: zoomLevel > 1 ? 'grab' : 'default'
                }}
              />
              
              {/* Navigation dans la modale */}
              {service.medias.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      prevModalImage();
                    }}
                    style={{...styles.modalNavButton, left: '20px'}}
                    title="Image précédente"
                  >
                    <FiChevronLeft />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      nextModalImage();
                    }}
                    style={{...styles.modalNavButton, right: '20px'}}
                    title="Image suivante"
                  >
                    <FiChevronRight />
                  </button>
                </>
              )}
            </div>

            {/* Miniatures dans la modale */}
            {service.medias.length > 1 && (
              <div style={styles.modalThumbnails}>
                <button 
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  style={styles.toggleThumbnailsButton}
                >
                  {showThumbnails ? 'Masquer' : 'Afficher'} les miniatures
                </button>
                
                {showThumbnails && (
                  <div style={styles.modalThumbnailsContainer}>
                    {service.medias.map((media, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setModalImageIndex(index);
                          setZoomLevel(1);
                        }}
                        style={{
                          ...styles.modalThumbnail,
                          ...(index === modalImageIndex ? styles.modalThumbnailActive : {})
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
      )}

      {/* CSS avec animations */}
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
        
        .card-hover {
          transition: all 0.3s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
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
  },
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
  header: {
    marginBottom: '2rem',
    animation: 'slideIn 0.5s ease-out',
  },
  backButton: {
    display: 'flex',
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
    '@media (max-width: 768px)': {
      height: '300px',
    },
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
    ':hover': {
      transform: 'scale(1.02)',
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
    ':hover': {
      opacity: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      transform: 'scale(1.1)',
    },
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
  },
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
  favoriteButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'scale(1.2)',
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
    color: '#64748b',
    fontSize: '1rem',
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap',
  },
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
  },
  infoValue: {
    color: '#1e293b',
    fontWeight: '600',
  },
  priceValue: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: '1.25rem',
  },
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
    ':hover': {
      backgroundColor: '#f1f5f9',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)',
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
  },
  contactButtonTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  contactButtonSubtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
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
    fontSize: '2rem',
  },
  entrepriseName: {
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '0.25rem',
  },
  entrepriseDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    color: '#64748b',
    fontSize: '0.9rem',
  },
  detailIcon: {
    fontSize: '1rem',
  },
  viewLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
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
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)',
    },
  },

  // Styles pour la modale
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