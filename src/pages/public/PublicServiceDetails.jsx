// src/pages/public/PublicServiceDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../../api/publicApi';
import ChatButton from '../../components/Chat/ChatButton';
import theme from '../../config/theme';
import { 
  FiArrowLeft, FiMapPin, FiClock, FiDollarSign, 
  FiPhone, FiMail, FiNavigation, FiShare2, FiHeart,
  FiCalendar, FiInfo, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import {
  MdBusiness, MdOutlineWork, MdOutlineDescription,
  MdOutlineAccessTime, MdOutlineWhatsapp, MdOutlineLocationOn
} from 'react-icons/md';

export default function PublicServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

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

  const handleShare = () => {
    if (navigator.share && service) {
      navigator.share({
        title: service.name,
        text: `Découvrez ce service: ${service.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié !');
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
        const message = encodeURIComponent(`Bonjour, je suis intéressé par: ${service.name}`);
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

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={styles.errorTitle}>{error}</h2>
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
        {/* Header */}
        <div style={styles.header}>
          <Link to="/services" style={styles.backButton}>
            <FiArrowLeft style={styles.backButtonIcon} />
            Retour aux services
          </Link>
        </div>

        {/* Grid principal */}
        <div style={styles.mainGrid}>
          {/* Colonne gauche - Images */}
          <div style={styles.leftColumn}>
            {service.medias && service.medias.length > 0 ? (
              <div style={styles.galleryCard}>
                <div style={styles.mainImageContainer}>
                  <img 
                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${service.medias[currentImageIndex]?.replace(/^\/?storage\//, '')}`}
                    alt={service.name}
                    style={styles.mainImage}
                  />
                  
                  {service.medias.length > 1 && (
                    <>
                      <button 
                        onClick={() => setCurrentImageIndex(prev => prev === 0 ? service.medias.length - 1 : prev - 1)}
                        style={{...styles.navButton, left: '10px'}}
                      >
                        <FiChevronLeft />
                      </button>
                      <button 
                        onClick={() => setCurrentImageIndex(prev => prev === service.medias.length - 1 ? 0 : prev + 1)}
                        style={{...styles.navButton, right: '10px'}}
                      >
                        <FiChevronRight />
                      </button>
                      <div style={styles.imageCounter}>
                        {currentImageIndex + 1} / {service.medias.length}
                      </div>
                    </>
                  )}
                </div>
                
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
                      >
                        <img 
                          src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${media?.replace(/^\/?storage\//, '')}`}
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
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${service.entreprise.logo?.replace(/^\/?storage\//, '')}`}
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
                    fill: isFavorite ? '#ef4444' : 'none'
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

      {/* CSS */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
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
  },
  errorIcon: {
    fontSize: '5rem',
  },
  errorTitle: {
    fontSize: '1.75rem',
    color: '#1e293b',
  },
  errorButton: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    padding: '1rem 2rem',
    borderRadius: '0.75rem',
    textDecoration: 'none',
    fontWeight: '600',
  },
  header: {
    marginBottom: '2rem',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: '600',
  },
  backButtonIcon: {
    fontSize: '1.25rem',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  },
  imageCounter: {
    position: 'absolute',
    bottom: '15px',
    right: '15px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
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
  },
  thumbnailActive: {
    borderColor: '#3b82f6',
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
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '1rem',
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
  },
  favoriteButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
  },
  domaineTag: {
    display: 'inline-block',
    backgroundColor: '#dbeafe',
    color: '#3b82f6',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
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
  },
  whatsappButton: {
    backgroundColor: '#f0fff4',
    borderColor: '#bbf7d0',
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
  },
};