// careasy-frontend/src/pages/Home.jsx - VERSION CORRIGÉE
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChatModal from '../components/Chat/ChatModal';
import { publicApi } from './../api/publicApi';
import theme from './../config/theme';

import { 
  FaWrench, FaPaintBrush, FaCog, FaSnowflake, 
  FaCar, FaShieldAlt, FaGraduationCap, FaOilCan,
  FaArrowRight, FaComments, FaTimes,
  FaMapMarkerAlt, FaPhone, FaEnvelope, FaStar,
  FaClock, FaWhatsapp, FaUserCircle
} from 'react-icons/fa';

export default function Home() {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [services, setServices] = useState([]);
  const [partners, setPartners] = useState([]);
  // showChatbot supprimé — remplacé par AIChatWidget global dans App.jsx
  const sectionsRef = useRef([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // Hero slides avec vraies images
  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600',
      title: 'Mécanique Automobile',
      subtitle: 'Réparation et entretien de tous véhicules',
      icon: <FaWrench />
    },
    {
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1600',
      title: 'Peinture & Carrosserie',
      subtitle: 'Redonnez vie à votre véhicule',
      icon: <FaPaintBrush />
    },
    {
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600',
      title: 'Pneumatique',
      subtitle: 'Pneus neufs et vulcanisation',
      icon: <FaCog />
    },
    {
      image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1600',
      title: 'Climatisation',
      subtitle: 'Roulez au frais toute l\'année',
      icon: <FaSnowflake />
    },
    {
      image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600',
      title: 'Auto-école',
      subtitle: 'Apprenez à conduire en toute sécurité',
      icon: <FaGraduationCap />
    },
    {
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600',
      title: 'Assurance Automobile',
      subtitle: 'Protégez votre véhicule',
      icon: <FaShieldAlt />
    }
  ];

  const domaines = [
    {
      id: 1,
      name: 'Mécanique',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
      description: 'Réparation moteur, boîte de vitesses, suspension',
      icon: <FaWrench />
    },
    {
      id: 2,
      name: 'Peinture',
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800',
      description: 'Carrosserie, débosselage, peinture complète',
      icon: <FaPaintBrush />
    },
    {
      id: 3,
      name: 'Pneumatique',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      description: 'Pneus, jantes, équilibrage, vulcanisation',
      icon: <FaCog />
    },
    {
      id: 4,
      name: 'Climatisation',
      image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800',
      description: 'Recharge gaz, réparation système AC',
      icon: <FaSnowflake />
    },
    {
      id: 5,
      name: 'Auto-école',
      image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
      description: 'Permis B, formation complète',
      icon: <FaGraduationCap />
    },
    {
      id: 6,
      name: 'Assurance',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
      description: 'Tous types d\'assurances auto',
      icon: <FaShieldAlt />
    }
  ];

  // Auto-slide carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch services récents
  useEffect(() => {
    fetchRecentServices();
    fetchPartners();
  }, []);

  const fetchRecentServices = async () => {
    try {
      const data = await publicApi.getServices();
      setServices(data.slice(0, 6));
    } catch (err) {
      console.error('Erreur chargement services:', err);
    }
  };

  const fetchPartners = async () => {
    try {
      const data = await publicApi.getEntreprises();
      setPartners(data.slice(0, 10));
    } catch (err) {
      console.error('Erreur chargement Entreprise:', err);
    }
  };

  // Intersection Observer pour animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Fonction pour ouvrir le popup de contact
  const openContactPopup = (service) => {
    setSelectedService(service);
    setShowContactModal(true);
  };

  // Fonction pour ouvrir le chat
  const openChat = (service) => {
    setSelectedService(service);
    setShowContactModal(false);
    setShowChatModal(true);
  };

  return (
    <div style={styles.container}>
      {/* Hero Carousel avec vraies images */}
      <div style={styles.heroSection}>
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            style={{
              ...styles.slide,
              backgroundImage: `url(${slide.image})`,
              opacity: currentSlide === index ? 1 : 0,
              zIndex: currentSlide === index ? 1 : 0,
            }}
          >
            <div style={styles.slideOverlay} />
            <div style={styles.slideContent}>
              <div style={styles.slideIcon}>{slide.icon}</div>
              <h1 style={styles.slideTitle}>{slide.title}</h1>
              <p style={styles.slideSubtitle}>{slide.subtitle}</p>
              {!user && (
                <div style={styles.heroButtons}>
                  <Link to="/register" style={styles.primaryButton}>
                    Commencer maintenant <FaArrowRight style={{marginLeft: '0.5rem'}} />
                  </Link>
                  <Link to="/entreprises" style={styles.secondaryButton}>
                    Explorer les services
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Indicateurs */}
        <div style={styles.indicators}>
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                ...styles.indicator,
                backgroundColor: currentSlide === index ? theme.colors.primary : 'rgba(255,255,255,0.5)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Section Domaines avec vraies images */}
      <div 
        ref={el => sectionsRef.current[0] = el}
        className="animate-section"
        style={styles.section}
      >
        <h2 style={styles.sectionTitle}>Domaines d'Expertise</h2>
        <p style={styles.sectionSubtitle}>
          Plus de 20 catégories de services pour tous vos besoins automobiles
        </p>
        
        <div style={styles.domainesGrid}>
          {domaines.map((domaine) => (
            <Link
              key={domaine.id}
              to={`/entreprises?domaine=${domaine.id}`}
              style={styles.domaineCard}
              className="domaine-card"
            >
              <div 
                style={{
                  ...styles.domaineImage,
                  backgroundImage: `url(${domaine.image})`
                }}
              >
                <div style={styles.domaineOverlay}>
                  <div style={styles.domaineIcon}>{domaine.icon}</div>
                </div>
              </div>
              <div style={styles.domaineContent}>
                <h3 style={styles.domaineName}>{domaine.name}</h3>
                <p style={styles.domaineDescription}>{domaine.description}</p>
                <button style={styles.domaineButton}>
                  Voir plus <FaArrowRight style={{marginLeft: '0.5rem'}} />
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Section Services Récents - AVEC 3 LIGNES ET POPUP DE CONTACT */}
      <div 
        ref={el => sectionsRef.current[1] = el}
        className="animate-section"
        style={{...styles.section, backgroundColor: theme.colors.secondary}}
      >
        <h2 style={styles.sectionTitle}>Services Récents</h2>
        <p style={styles.sectionSubtitle}>
          Découvrez les derniers services ajoutés par nos prestataires
        </p>
        
        <div style={styles.servicesGrid}>
          {services.map((service) => (
            <div key={service.id} style={styles.serviceCard} className="service-card">
              {/* Image */}
              {service.medias && service.medias.length > 0 ? (
                <div style={styles.serviceImage}>
                  <img 
                    src={service.medias[0]}
                    alt={service.name}
                    style={styles.serviceImg}
                  />
                </div>
              ) : (
                <div style={styles.servicePlaceholder}>
                  <FaWrench style={{fontSize: '3rem', color: theme.colors.primary}} />
                </div>
              )}
              
              {/* CONTENU - 3 LIGNES CORRIGÉES */}
              <div style={styles.serviceContent}>
                {/* Ligne 1: Nom du service + Prix sur la même ligne */}
                <div style={styles.serviceHeader}>
                  <h3 style={styles.serviceName}>{service.name}</h3>
                  <div style={styles.servicePrice}>
                    {service.price 
                      ? `${service.price.toLocaleString()} FCFA`
                      : 'Prix sur demande'
                    }
                  </div>
                </div>

                {/* Ligne 2: Logo entreprise + Nom + Horaires */}
                <div style={styles.serviceInfo}>
                  <div style={styles.entrepriseInfo}>
                    {service.entreprise?.logo ? (
                      <img 
                        src={service.entreprise.logo}
                        alt={service.entreprise.name}
                        style={styles.entrepriseLogo}
                      />
                    ) : (
                      <div style={styles.entrepriseLogoPlaceholder}>
                        {service.entreprise?.name?.charAt(0) || 'E'}
                      </div>
                    )}
                    <span style={styles.entrepriseName}>
                      {service.entreprise?.name || 'Entreprise'}
                    </span>
                  </div>
                  <div style={styles.serviceHours}>
                    <span style={{marginRight: '0.4rem'}}>🕐</span>
                    <span>
                      {service.start_time && service.end_time 
                        ? `${service.start_time} - ${service.end_time}`
                        : service.is_open_24h 
                          ? '24h/24'
                          : 'Horaires non spécifiés'
                      }
                    </span>
                  </div>
                </div>

                {/* Ligne 3: Description avec points de suspension + Voir plus sur la même ligne */}
                <div style={styles.serviceDescriptionRow}>
                  <p style={styles.serviceDescription}>
                    {service.descriptions 
                      ? (service.descriptions.length > 60 
                          ? service.descriptions.substring(0, 60) + '...' 
                          : service.descriptions)
                      : 'Aucune description disponible'
                    }
                  </p>
                  <Link 
                    to={`/service/${service.id}`}
                    style={styles.seeMoreLink}
                    title="Voir plus de détails"
                  >
                    Voir plus <FaArrowRight style={{marginLeft: '0.25rem', fontSize: '0.9rem'}} />
                  </Link>
                </div>
              </div>
              
              {/* Bouton Contacter avec popup (TOUJOURS visible) */}
              <button
                  onClick={() => openContactPopup(service)}
                  style={styles.contactButton}
                  className="contact-button"
                >
                  <FaComments style={{marginRight: '0.5rem'}} />
                  Contacter
                </button>
            </div>
          ))}
        </div>
        
        <div style={styles.sectionCta}>
          <Link to="/services" style={styles.ctaButton}>
            Voir tous les services <FaArrowRight style={{marginLeft: '0.5rem'}} />
          </Link>
        </div>
      </div>

      {/* Section Partenaires avec logos/images défilants */}
      <div 
        ref={el => sectionsRef.current[2] = el}
        className="animate-section"
        style={styles.partnersSection}
      >
        <h2 style={styles.sectionTitle}>Nos Entreprises de Confiance</h2>
        <div style={styles.partnersTrack}>
          <div style={styles.partnersSlide} className="partners-scroll">
            {[...partners, ...partners].map((partner, index) => (
              <div key={index} style={styles.partnerCard}>
                {partner.logo ? (
                  <img 
                    src={partner.logo}
                    alt={partner.name}
                    style={styles.partnerImage}
                  />
                ) : (
                  <div style={styles.partnerPlaceholder}>
                    {partner.name.charAt(0)}
                  </div>
                )}
                <p style={styles.partnerName}>{partner.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div 
        ref={el => sectionsRef.current[3] = el}
        className="animate-section"
        style={styles.ctaSection}
      >
        <h2 style={styles.ctaTitle}>Prêt à démarrer ?</h2>
        <p style={styles.ctaText}>
          Rejoignez des milliers de Béninois qui font confiance à CarEasy
        </p>
        {!user && (
          <Link to="/register" style={styles.ctaButtonLarge}>
            Créer un compte gratuitement
          </Link>
        )}
      </div>

      {/* ℹ️ Le bouton CarAI flottant est géré par AIChatWidget dans App.jsx */}

      {/* MODAL DE CONTACT PROFESSIONNEL AVEC 3 BOUTONS */}
      {showContactModal && selectedService && (
        <div style={styles.contactModalOverlay} onClick={() => setShowContactModal(false)}>
          <div style={styles.contactModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.contactModalHeader}>
              <div style={styles.contactModalAvatar}>
                {selectedService.entreprise?.logo ? (
                  <img 
                    src={selectedService.entreprise.logo}
                    alt={selectedService.entreprise.name}
                    style={styles.contactModalLogo}
                  />
                ) : (
                  <div style={styles.contactModalLogoPlaceholder}>
                    {selectedService.entreprise?.name?.charAt(0) || 'E'}
                  </div>
                )}
              </div>
              <div style={styles.contactModalInfo}>
                <h3 style={styles.contactModalTitle}>
                  {selectedService.entreprise?.name || 'Prestataire'}
                </h3>
                <p style={styles.contactModalService}>
                  {selectedService.name}
                </p>
              </div>
              <button 
                onClick={() => setShowContactModal(false)}
                style={styles.contactModalClose}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={styles.contactModalBody}>
              <p style={styles.contactModalInstruction}>
                Choisissez votre méthode de contact préférée :
              </p>
              
              <div style={styles.contactMethodsGrid}>
                {/* Bouton Appeler */}
                <button
                  onClick={() => {
                    if (selectedService.entreprise?.call_phone) {
                      window.open(`tel:${selectedService.entreprise.call_phone}`, '_blank');
                    } else {
                      alert('Numéro de téléphone non disponible');
                    }
                    setShowContactModal(false);
                  }}
                  style={styles.contactMethodButton}
                  className="contact-method-button"
                >
                  <div style={styles.contactMethodIconCall}>
                    <FaPhone />
                  </div>
                  <div style={styles.contactMethodContent}>
                    <div style={styles.contactMethodTitle}>Appeler</div>
                    <div style={styles.contactMethodSubtitle}>
                      {selectedService.entreprise?.call_phone || 'Numéro non disponible'}
                    </div>
                  </div>
                  <div style={styles.contactMethodArrow}>→</div>
                </button>
                
                {/* Bouton WhatsApp */}
                <button
                  onClick={() => {
                    if (selectedService.entreprise?.whatsapp_phone) {
                      const message = encodeURIComponent(`Bonjour ${selectedService.entreprise.name}, je suis intéressé par votre service: ${selectedService.name}`);
                      window.open(`https://wa.me/${selectedService.entreprise.whatsapp_phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                    } else {
                      alert('Numéro WhatsApp non disponible');
                    }
                    setShowContactModal(false);
                  }}
                  style={styles.contactMethodButton}
                  className="contact-method-button"
                >
                  <div style={styles.contactMethodIconWhatsApp}>
                    <FaWhatsapp />
                  </div>
                  <div style={styles.contactMethodContent}>
                    <div style={styles.contactMethodTitle}>WhatsApp</div>
                    <div style={styles.contactMethodSubtitle}>
                      Message instantané
                    </div>
                  </div>
                  <div style={styles.contactMethodArrow}>→</div>
                </button>
                
                {/* Bouton Message/Chat */}
                <button
                  onClick={() => {
                    if (user) {
                      setShowContactModal(false);
                      setTimeout(() => {
                        setShowChatModal(true);
                      }, 300);
                    } else {
                      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                    }
                  }}
                  style={styles.contactMethodButton}
                  className="contact-method-button"
                >
                  <div style={styles.contactMethodIconChat}>
                    <FaComments />
                  </div>
                  <div style={styles.contactMethodContent}>
                    <div style={styles.contactMethodTitle}>
                      {user ? 'Messagerie' : 'Messagerie'}
                    </div>
                    <div style={styles.contactMethodSubtitle}>
                      {user ? 'Discuter en direct' : 'Connectez-vous pour discuter'}
                    </div>
                  </div>
                  <div style={styles.contactMethodArrow}>→</div>
                </button>
              </div>
              
              <div style={styles.contactModalFooter}>
                <p style={styles.contactModalNote}>
                  <strong>Recommandé :</strong> La messagerie permet de suivre vos conversations et de partager des photos/vidéos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHAT (seulement pour utilisateurs connectés) */}
      {user && selectedService && showChatModal && (
        <ChatModal
          receiverId={selectedService.entreprise?.prestataire_id}
          receiverName={selectedService.entreprise?.name || 'Prestataire'}
          onClose={() => {
            setSelectedService(null);
            setShowChatModal(false);
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-section {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.8s ease-out;
        }
        
        .animate-section.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        
        .domaine-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .domaine-card:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        
        .service-card {
          transition: all 0.3s ease;
        }
        
        .service-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
        }
        
        .contact-button {
          transition: all 0.3s ease;
        }
        
        .contact-button:hover {
          background-color: ${theme.colors.primaryDark || '#dc2626'} !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        
        .contact-method-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .contact-method-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }
        
        .partners-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .partners-scroll:hover {
          animation-play-state: paused;
        }
        
        .seeMoreLink:hover {
          color: ${theme.colors.primaryDark || '#dc2626'};
          transform: translateX(3px);
        }

        @media (max-width: 768px) {
          .servicesGrid {
            grid-template-columns: 1fr !important;
          }
          
          .domainesGrid {
            grid-template-columns: 1fr !important;
          }
          
          .heroButtons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: theme.colors.background,
    minHeight: '100vh',
  },
  
  // Hero avec vraies images
  heroSection: {
    position: 'relative',
    height: '100vh',
    overflow: 'hidden',
  },
  slide: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'opacity 1s ease-in-out',
  },
  slideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
  },
  slideContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    zIndex: 2,
    width: '90%',
    maxWidth: '900px',
  },
  slideIcon: {
    fontSize: '5rem',
    color: theme.colors.primary,
    marginBottom: '1.5rem',
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
  },
  slideTitle: {
    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '1rem',
    textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
  },
  slideSubtitle: {
    fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
    color: '#fff',
    marginBottom: '2.5rem',
    textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
  },
  heroButtons: {
    display: 'flex',
    gap: '1.5rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    padding: '1.25rem 3rem',
    borderRadius: theme.borderRadius.xl,
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1.125rem',
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    transition: 'all 0.3s',
    border: 'none',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    padding: '1.25rem 3rem',
    borderRadius: theme.borderRadius.xl,
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1.125rem',
    border: '2px solid #fff',
    transition: 'all 0.3s',
  },
  indicators: {
    position: 'absolute',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '12px',
    zIndex: 3,
  },
  indicator: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid #fff',
    cursor: 'pointer',
    transition: 'all 0.3s',
    background: 'transparent',
  },
  
  // Sections
  section: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '6rem 2rem',
  },
  sectionTitle: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '1rem',
    color: theme.colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: '1.25rem',
    textAlign: 'center',
    color: theme.colors.text.secondary,
    marginBottom: '4rem',
    maxWidth: '700px',
    margin: '0 auto 4rem',
  },
  
  // Domaines avec vraies images
  domainesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2.5rem',
  },
  domaineCard: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    textDecoration: 'none',
    boxShadow: theme.shadows.lg,
    border: `2px solid ${theme.colors.primaryLight}`,
  },
  domaineImage: {
    position: 'relative',
    height: '200px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  domaineOverlay: {
    width: '100%',
    height: '100%',
    background: `linear-gradient(135deg, ${theme.colors.primary}40, ${theme.colors.primary}80)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  domaineIcon: {
    fontSize: '4rem',
    color: '#fff',
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
  },
  domaineContent: {
    padding: '2rem',
  },
  domaineName: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: '0.75rem',
  },
  domaineDescription: {
    color: theme.colors.text.secondary,
    marginBottom: '1.5rem',
    lineHeight: '1.6',
  },
  domaineButton: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    padding: '0.875rem 2rem',
    borderRadius: theme.borderRadius.lg,
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.3s',
  },
  
  // Services - NOUVEAUX STYLES
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem',
  },
  serviceCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    boxShadow: theme.shadows.md,
    border: `2px solid ${theme.colors.primaryLight}`,
    display: 'flex',
    flexDirection: 'column',
  },
  serviceImage: {
    height: '200px',
    overflow: 'hidden',
  },
  serviceImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  servicePlaceholder: {
    height: '200px',
    backgroundColor: theme.colors.primaryLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceContent: {
    padding: '1.5rem',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  serviceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
    gap: '1rem',
  },
  serviceName: {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    margin: 0,
    flex: 1,
    lineHeight: '1.3',
  },
  servicePrice: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: '1rem',
    whiteSpace: 'nowrap',
    textAlign: 'right',
  },
  serviceInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '0.75rem',
    borderBottom: `1px solid ${theme.colors.primaryLight}40`,
  },
  entrepriseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  entrepriseLogo: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  entrepriseLogoPlaceholder: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: theme.colors.primary,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.8rem',
  },
  entrepriseName: {
    fontSize: '0.85rem',
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  serviceHours: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.8rem',
    color: theme.colors.text.secondary,
  },
  serviceDescriptionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: '0.5rem',
    gap: '1rem',
  },
  serviceDescription: {
    color: theme.colors.text.secondary,
    fontSize: '0.9rem',
    lineHeight: '1.4',
    margin: 0,
    flex: 1,
  },
  seeMoreLink: {
    display: 'flex',
    alignItems: 'center',
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: '0.85rem',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  contactButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: `0 0 ${theme.borderRadius.xl} ${theme.borderRadius.xl}`,
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: 'auto',
  },
  sectionCta: {
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    padding: '1rem 2.5rem',
    borderRadius: theme.borderRadius.lg,
    textDecoration: 'none',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: theme.shadows.lg,
  },
  
  // Partenaires avec images défilantes
  partnersSection: {
    padding: '4rem 0',
    backgroundColor: theme.colors.secondary,
    overflow: 'hidden',
  },
  partnersTrack: {
    overflow: 'hidden',
  },
  partnersSlide: {
    display: 'flex',
    gap: '3rem',
    width: 'max-content',
  },
  partnerCard: {
    backgroundColor: theme.colors.background,
    padding: '2rem',
    borderRadius: theme.borderRadius.lg,
    textAlign: 'center',
    minWidth: '180px',
    border: `2px solid ${theme.colors.primaryLight}`,
  },
  partnerImage: {
    width: '80px',
    height: '80px',
    margin: '0 auto 1rem',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  partnerPlaceholder: {
    width: '80px',
    height: '80px',
    margin: '0 auto 1rem',
    borderRadius: '50%',
    backgroundColor: theme.colors.primary,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  partnerName: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  // CTA
  ctaSection: {
    padding: '6rem 2rem',
    textAlign: 'center',
    background: `linear-gradient(135deg, ${theme.colors.primary}, #991b1b)`,
  },
  ctaTitle: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '1rem',
  },
  ctaText: {
    fontSize: '1.25rem',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: '2.5rem',
  },
  ctaButtonLarge: {
    backgroundColor: '#fff',
    color: theme.colors.primary,
    padding: '1.25rem 3rem',
    borderRadius: theme.borderRadius.xl,
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1.25rem',
    display: 'inline-block',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  },
  

  // Modal de Contact PROFESSIONNEL
  contactModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '1rem',
    backdropFilter: 'blur(10px)',
  },
  contactModal: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: '450px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
    animation: 'modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  contactModalHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '1.5rem',
    backgroundColor: '#f8fafc',
    borderBottom: `1px solid ${theme.colors.primaryLight}`,
    position: 'relative',
  },
  contactModalAvatar: {
    marginRight: '1rem',
  },
  contactModalLogo: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    objectFit: 'cover',
    border: `2px solid ${theme.colors.primaryLight}`,
  },
  contactModalLogoPlaceholder: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    backgroundColor: theme.colors.primary,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.25rem',
    border: `2px solid ${theme.colors.primaryLight}`,
  },
  contactModalInfo: {
    flex: 1,
  },
  contactModalTitle: {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    margin: '0 0 0.25rem 0',
  },
  contactModalService: {
    fontSize: '0.9rem',
    color: theme.colors.text.secondary,
    margin: 0,
  },
  contactModalClose: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: theme.colors.text.secondary,
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.25rem',
    opacity: 0.7,
  },
  contactModalBody: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  contactModalInstruction: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontSize: '0.95rem',
    margin: 0,
  },
  contactMethodsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  contactMethodButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.25rem',
    borderRadius: theme.borderRadius.lg,
    border: `2px solid #e2e8f0`,
    backgroundColor: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.3s ease',
    width: '100%',
  },
  contactMethodIconCall: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    color: '#fff',
    backgroundColor: '#10b981',
    flexShrink: 0,
  },
  contactMethodIconWhatsApp: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    color: '#fff',
    backgroundColor: '#25D366',
    flexShrink: 0,
  },
  contactMethodIconChat: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    color: '#fff',
    backgroundColor: theme.colors.primary,
    flexShrink: 0,
  },
  contactMethodContent: {
    flex: 1,
  },
  contactMethodTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: '0.25rem',
  },
  contactMethodSubtitle: {
    fontSize: '0.85rem',
    color: theme.colors.text.secondary,
  },
  contactMethodArrow: {
    color: theme.colors.primary,
    fontSize: '1.25rem',
    opacity: 0.7,
  },
  contactModalFooter: {
    paddingTop: '1rem',
    borderTop: `1px solid ${theme.colors.primaryLight}40`,
  },
  contactModalNote: {
    fontSize: '0.85rem',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    margin: 0,
    lineHeight: '1.5',
  },
};