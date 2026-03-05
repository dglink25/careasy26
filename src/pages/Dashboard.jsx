import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { entrepriseApi } from '../api/entrepriseApi';
import { serviceApi } from '../api/serviceApi';
import { 
  FiSettings, FiShoppingBag, FiClock, FiCheckCircle, FiHeart, 
  FiCalendar, FiMapPin, FiPhone, FiMail, FiBell, FiHelpCircle, 
  FiTrendingUp, FiActivity, FiBarChart2, FiTarget, FiPlus, 
  FiBriefcase, FiInfo, FiChevronRight, FiUsers 
} from 'react-icons/fi';
import { 
  MdDashboard, MdOutlineBusiness, MdOutlineWork, MdOutlinePerson, 
  MdOutlineEmail, MdOutlinePhone, MdOutlineVerified, MdOutlineNotifications, 
  MdOutlineSettings, MdOutlineDescription, MdOutlineLocationOn, 
  MdOutlineAccessTime, MdOutlineAttachMoney, MdOutlineAnalytics, 
  MdOutlineInsights, MdOutlineStorefront, MdOutlineLibraryAdd, 
  MdOutlineInventory, MdOutlineSchedule, MdOutlineDirectionsCar, 
  MdOutlineLocalShipping, MdOutlineTwoWheeler 
} from 'react-icons/md';

import {   
  FiDollarSign,
  FiTool 
} from 'react-icons/fi';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showBecomeProviderModal, setShowBecomeProviderModal] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entreprises, setEntreprises] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({
    totalEntreprises: 0,
    validatedEntreprises: 0,
    pendingEntreprises: 0,
    totalServices: 0,
    servicesWithPrice: 0,
    services24h: 0,
    activeClients: 0,
    monthlyRevenue: 0
  });

  // Redirection admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Vérifier le rôle utilisateur
  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      setLoading(true);
      
      // Vérifier si l'utilisateur a des entreprises
      const entreprisesData = await entrepriseApi.getMesEntreprises();
      const hasEntreprises = entreprisesData && entreprisesData.length > 0;
      
      if (hasEntreprises) {
        // C'est un prestataire
        setIsProvider(true);
        // Charger les données prestataire
        const servicesData = await serviceApi.getMesServices();
        setEntreprises(entreprisesData);
        setServices(servicesData);
        
        // Calculer les stats
        const validatedEntreprises = entreprisesData.filter(e => e.status === 'validated').length;
        const pendingEntreprises = entreprisesData.filter(e => e.status === 'pending').length;
        const servicesWithPrice = servicesData.filter(s => s.price).length;
        const services24h = servicesData.filter(s => s.is_open_24h).length;
        
        const monthlyRevenue = servicesData
          .filter(s => s.price)
          .reduce((acc, s) => acc + (s.price * 3), 0);

        setStats({
          totalEntreprises: entreprisesData.length,
          validatedEntreprises,
          pendingEntreprises,
          totalServices: servicesData.length,
          servicesWithPrice,
          services24h,
          activeClients: 24,
          monthlyRevenue
        });
      } else {
        // C'est un client
        setIsProvider(false);
      }
    } catch (err) {
      console.error('Erreur vérification rôle:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Admin loading
  if (user && user.role === 'admin') {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Redirection vers le dashboard administrateur...</p>
      </div>
    );
  }

  // Loading général
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement de votre espace...</p>
          <p style={styles.loadingSubtext}>Préparation de vos données</p>
        </div>
      </div>
    );
  }

  // DASHBOARD CLIENT
  if (!isProvider) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          {/* Header Client */}
          <div style={styles.header}>
            <div style={styles.headerMain}>
              <div>
                <h1 style={styles.title}>
                  <FiShoppingBag style={styles.titleIcon} />
                  Espace Client
                </h1>
                <p style={styles.subtitle}>
                  Bienvenue sur votre espace personnel, {user?.name?.split(' ')[0]} !
                </p>
              </div>
              <div style={styles.headerActions}>
                <button style={styles.headerActionButton}>
                  <FiBell style={styles.headerActionIcon} />
                  <span style={styles.notificationBadge}>0</span>
                </button>
                <Link to="/settings" style={{ textDecoration: 'none' }}>
                  <button style={styles.headerActionButton}>
                    <FiSettings style={styles.headerActionIcon} />
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Carte de bienvenue avec bouton Devenir Prestataire */}
          <div style={styles.welcomeCard}>
            <div style={styles.welcomeContent}>
              <h2 style={styles.welcomeTitle}>Bienvenue sur CarEasy !</h2>
              <p style={styles.welcomeText}>
                En tant que client, vous pouvez explorer les services disponibles, 
                prendre des rendez-vous et gérer vos demandes.
              </p>
              <button 
                onClick={() => setShowBecomeProviderModal(true)}
                style={styles.becomeProviderButton}
              >
                <MdOutlineStorefront style={styles.buttonIcon} />
                Devenir prestataire sur cette plateforme
              </button>
            </div>
            <div style={styles.welcomeIllustration}>
              <MdOutlineDirectionsCar style={styles.welcomeIcon} />
            </div>
          </div>

          {/* Statistiques client */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIconContainer}>
                <FiCalendar style={styles.statIcon} />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statNumber}>0</div>
                <div style={styles.statLabel}>Rendez-vous à venir</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIconContainer}>
                <FiHeart style={styles.statIcon} />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statNumber}>0</div>
                <div style={styles.statLabel}>Favoris</div>
              </div>
            </div>
          </div>

          {/* Contenu principal client */}
          <div style={styles.clientMainContent}>
            {/* Colonne gauche - Rendez-vous et activités */}
            <div style={styles.clientLeftColumn}>
              {/* Prochains rendez-vous */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.sectionTitle}>
                    <FiCalendar style={styles.sectionIcon} />
                    Prochains rendez-vous
                  </h3>
                  <Link to="/mes-rendez-vous" style={styles.viewAllLink}>
                    Voir tous
                  </Link>
                </div>
                <div style={styles.emptyState}>
                  <FiCalendar style={styles.emptyStateIcon} />
                  <p style={styles.emptyStateText}>Aucun rendez-vous prévu</p>
                  <Link to="/entreprises" style={styles.emptyStateButton}>
                    Explorer les services
                  </Link>
                </div>
              </div>
            </div>

            {/* Colonne droite - Favoris et recommandations */}
            <div style={styles.clientRightColumn}>
              {/* Services favoris */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.sectionTitle}>
                    <FiHeart style={styles.sectionIcon} />
                    Mes favoris
                  </h3>
                  <Link to="/favoris" style={styles.viewAllLink}>
                    Voir tous
                  </Link>
                </div>
                <div style={styles.emptyState}>
                  <FiHeart style={styles.emptyStateIcon} />
                  <p style={styles.emptyStateText}>Aucun favori pour le moment</p>
                  <Link to="/entreprises" style={styles.emptyStateButton}>
                    Découvrir des services
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Devenir Prestataire */}
          {showBecomeProviderModal && (
            <div style={styles.modalOverlay} onClick={() => setShowBecomeProviderModal(false)}>
              <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <MdOutlineStorefront style={styles.modalIcon} />
                  <h2 style={styles.modalTitle}>Devenir prestataire sur CarEasy</h2>
                  <button 
                    onClick={() => setShowBecomeProviderModal(false)}
                    style={styles.modalCloseButton}
                  >
                    ×
                  </button>
                </div>
                
                <div style={styles.modalBody}>
                  <p style={styles.modalText}>
                    Pour devenir prestataire et offrir vos services sur notre plateforme, 
                    vous devez d'abord créer votre entreprise.
                  </p>
                  
                  <div style={styles.modalInfoBox}>
                    <FiInfo style={styles.modalInfoIcon} />
                    <p style={styles.modalInfoText}>
                      Une fois votre entreprise créée, elle sera soumise à validation par 
                      notre équipe avant d'être visible sur la plateforme.
                    </p>
                  </div>

                  <div style={styles.modalSteps}>
                    <div style={styles.modalStep}>
                      <div style={styles.stepNumber}>1</div>
                      <div style={styles.stepContent}>
                        <h4 style={styles.stepTitle}>Créer votre entreprise</h4>
                        <p style={styles.stepText}>Renseignez les informations de votre structure</p>
                      </div>
                    </div>
                    
                    <div style={styles.modalStep}>
                      <div style={styles.stepNumber}>2</div>
                      <div style={styles.stepContent}>
                        <h4 style={styles.stepTitle}>Validation par l'équipe</h4>
                        <p style={styles.stepText}>Nous vérifions les informations (24-48h)</p>
                      </div>
                    </div>
                    <div style={styles.modalStep}>
                      <div style={styles.stepNumber}>3</div>
                      <div style={styles.stepContent}>
                        <h4 style={styles.stepTitle}>Ajouter vos services</h4>
                        <p style={styles.stepText}>Décrivez les prestations que vous proposez</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={styles.modalFooter}>
                  <button 
                    onClick={() => setShowBecomeProviderModal(false)}
                    style={styles.modalCancelButton}
                  >
                    Plus tard
                  </button>
                  <Link 
                    to="/entreprises/creer"
                    style={styles.modalConfirmButton}
                    onClick={() => setShowBecomeProviderModal(false)}
                  >
                    Continuer vers création d'entreprise
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DASHBOARD PRESTATAIRE
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header Prestataire */}
        <div style={styles.header}>
          <div style={styles.headerMain}>
            <div>
              <h1 style={styles.title}>
                <MdDashboard style={styles.titleIcon} />
                Tableau de Bord Prestataire
              </h1>
              <p style={styles.subtitle}>
                Bienvenue sur votre espace professionnel CarEasy
              </p>
            </div>
            <div style={styles.headerActions}>
              <button style={styles.headerActionButton}>
                <FiBell style={styles.headerActionIcon} />
                <span style={styles.notificationBadge}>3</span>
              </button>
              <Link to="/settings" style={{ textDecoration: 'none' }}>
                <button style={styles.headerActionButton}>
                  <FiSettings style={styles.headerActionIcon} />
                </button>
              </Link>
              <button style={styles.headerActionButton}>
                <FiHelpCircle style={styles.headerActionIcon} />
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques principales */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIconContainer}>
              <MdOutlineBusiness style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.totalEntreprises}</div>
              <div style={styles.statLabel}>Entreprises</div>
              <div style={styles.statSubtext}>
                {stats.validatedEntreprises} validées • {stats.pendingEntreprises} en attente
              </div>
            </div>
            <div style={styles.statTrend}>
              <FiTrendingUp style={styles.statTrendIcon} />
              <span style={styles.statTrendText}>+2 ce mois</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIconContainer}>
              <MdOutlineWork style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.totalServices}</div>
              <div style={styles.statLabel}>Services</div>
              <div style={styles.statSubtext}>
                {stats.servicesWithPrice} avec tarif • {stats.services24h} 24h/24
              </div>
            </div>
            <div style={styles.statTrend}>
              <FiTrendingUp style={styles.statTrendIcon} />
              <span style={styles.statTrendText}>+5 ce mois</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIconContainer}>
              <FiUsers style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.activeClients}</div>
              <div style={styles.statLabel}>Clients actifs</div>
              <div style={styles.statSubtext}>
                12 nouveaux ce mois
              </div>
            </div>
            <div style={styles.statTrend}>
              <FiActivity style={styles.statTrendIcon} />
              <span style={styles.statTrendText}>Actif</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIconContainer}>
              <FiDollarSign style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{formatPrice(stats.monthlyRevenue)}</div>
              <div style={styles.statLabel}>Revenue estimé</div>
              <div style={styles.statSubtext}>
                Ce mois
              </div>
            </div>
            <div style={styles.statTrend}>
              <FiBarChart2 style={styles.statTrendIcon} />
              <span style={styles.statTrendText}>+15%</span>
            </div>
          </div>
        </div>

        {/* Actions rapides et contenu principal */}
        <div style={styles.mainContent}>
          {/* Colonne gauche */}
          <div style={styles.leftColumn}>
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>
                  <FiTarget style={styles.sectionIcon} />
                  Actions rapides
                </h3>
              </div>
              <div style={styles.actionsGrid}>
                <Link to="/services/creer" style={styles.actionCard}>
                  <div style={styles.actionIcon}>
                    <FiPlus />
                  </div>
                  <div style={styles.actionContent}>
                    <div style={styles.actionTitle}>Nouveau service</div>
                    <div style={styles.actionDescription}>Ajouter un service</div>
                  </div>
                  <FiChevronRight style={styles.actionArrow} />
                </Link>

                <Link to="/entreprises/creer" style={styles.actionCard}>
                  <div style={styles.actionIcon}>
                    <MdOutlineBusiness />
                  </div>
                  <div style={styles.actionContent}>
                    <div style={styles.actionTitle}>Nouvelle entreprise</div>
                    <div style={styles.actionDescription}>Créer une entreprise</div>
                  </div>
                  <FiChevronRight style={styles.actionArrow} />
                </Link>

                <Link to="/mes-services" style={styles.actionCard}>
                  <div style={styles.actionIcon}>
                    <MdOutlineWork />
                  </div>
                  <div style={styles.actionContent}>
                    <div style={styles.actionTitle}>Gérer les services</div>
                    <div style={styles.actionDescription}>Voir tous les services</div>
                  </div>
                  <FiChevronRight style={styles.actionArrow} />
                </Link>

                <Link to="/mes-entreprises" style={styles.actionCard}>
                  <div style={styles.actionIcon}>
                    <FiBriefcase />
                  </div>
                  <div style={styles.actionContent}>
                    <div style={styles.actionTitle}>Gérer les entreprises</div>
                    <div style={styles.actionDescription}>Voir les entreprises</div>
                  </div>
                  <FiChevronRight style={styles.actionArrow} />
                </Link>
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div style={styles.rightColumn}>
            {/* État des entreprises */}
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>
                  <MdOutlineStorefront style={styles.sectionIcon} />
                  État des entreprises
                </h3>
                <Link to="/mes-entreprises" style={styles.viewAllLink}>
                  Voir toutes
                </Link>
              </div>
              <div style={styles.entreprisesList}>
                {entreprises.slice(0, 3).map((entreprise) => (
                  <div key={entreprise.id} style={styles.entrepriseItem}>
                    <div style={styles.entrepriseInfo}>
                      {entreprise.logo ? (
                        <img 
                          src={entreprise.logo}
                          alt={entreprise.name}
                          style={styles.entrepriseLogo}
                        />
                      ) : (
                        <div style={styles.entrepriseLogoPlaceholder}>
                          <MdOutlineBusiness />
                        </div>
                      )}
                      <div>
                        <div style={styles.entrepriseName}>{entreprise.name}</div>
                        <div style={styles.entrepriseStatus}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: entreprise.status === 'validated' ? '#d1fae5' : 
                                          entreprise.status === 'pending' ? '#fef3c7' : '#fee2e2',
                            color: entreprise.status === 'validated' ? '#059669' : 
                                  entreprise.status === 'pending' ? '#d97706' : '#dc2626'
                          }}>
                            {entreprise.status === 'validated' ? 'Validée' : 
                             entreprise.status === 'pending' ? 'En attente' : 'Rejetée'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={styles.entrepriseServices}>
                      {stats.totalServices || 0} service{stats.totalServices !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
                {entreprises.length === 0 && (
                  <div style={styles.emptyState}>
                    <MdOutlineBusiness style={styles.emptyStateIcon} />
                    <p style={styles.emptyStateText}>Aucune entreprise créée</p>
                    <Link to="/entreprises/creer" style={styles.emptyStateButton}>
                      Créer une entreprise
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Services récents */}
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>
                  <MdOutlineInventory style={styles.sectionIcon} />
                  Services récents
                </h3>
                <Link to="/mes-services" style={styles.viewAllLink}>
                  Voir tous
                </Link>
              </div>
              <div style={styles.servicesList}>
                {services.slice(0, 3).map((service) => (
                  <div key={service.id} style={styles.serviceItem}>
                    <div style={styles.serviceIconContainer}>
                      {service.medias && service.medias.length > 0 ? (
                        <img 
                          src={service.medias[0]}
                          alt={service.name}
                          style={styles.serviceIconImage}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : null}
                      
                      <div 
                        style={{
                          ...styles.serviceIconPlaceholder,
                          display: (!service.medias || service.medias.length === 0) ? 'flex' : 'none'
                        }}
                      >
                        <MdOutlineWork style={styles.serviceIconSvg} />
                      </div>
                    </div>
                    
                    <div style={styles.serviceInfo}>
                      <div style={styles.serviceName}>{service.name}</div>
                      <div style={styles.serviceDetails}>
                        <span style={styles.servicePrice}>
                          {service.price ? formatPrice(service.price) : 'Sur devis'}
                        </span>
                        {service.is_open_24h && (
                          <span style={styles.service24h}>24h/24</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <div style={styles.emptyState}>
                    <MdOutlineWork style={styles.emptyStateIcon} />
                    <p style={styles.emptyStateText}>Aucun service créé</p>
                    <Link to="/services/creer" style={styles.emptyStateButton}>
                      Créer un service
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conseils */}
        <div style={styles.tipsSection}>
          <div style={styles.tipsHeader}>
            <MdOutlineInsights style={styles.tipsIcon} />
            <h3 style={styles.tipsTitle}>Conseils pour optimiser votre présence</h3>
          </div>
          <div style={styles.tipsGrid}>
            <div style={styles.tipCard}>
              <div style={styles.tipIcon}>
                <FiTool />
              </div>
              <h4 style={styles.tipCardTitle}>Services complets</h4>
              <p style={styles.tipCardText}>
                Ajoutez des photos de qualité et des descriptions détaillées.
              </p>
            </div>
            <div style={styles.tipCard}>
              <div style={styles.tipIcon}>
                <MdOutlineAttachMoney />
              </div>
              <h4 style={styles.tipCardTitle}>Tarifs transparents</h4>
              <p style={styles.tipCardText}>
                Indiquez des prix clairs pour plus de visibilité.
              </p>
            </div>
            <div style={styles.tipCard}>
              <div style={styles.tipIcon}>
                <MdOutlineAccessTime />
              </div>
              <h4 style={styles.tipCardTitle}>Disponibilité</h4>
              <p style={styles.tipCardText}>
                Mettez à jour vos horaires régulièrement.
              </p>
            </div>
            <div style={styles.tipCard}>
              <div style={styles.tipIcon}>
                <MdOutlineDescription />
              </div>
              <h4 style={styles.tipCardTitle}>Descriptions riches</h4>
              <p style={styles.tipCardText}>
                Décrivez précisément vos services et compétences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// STYLES
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '2rem 0 4rem 0',
  },
  content: {
    maxWidth: '1400px',
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
    border: '4px solid #dbeafe',
    borderTop: '4px solid #ef4444',
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
  header: {
    marginBottom: '2rem',
  },
  headerMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '2.25rem',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '0.5rem',
  },
  titleIcon: {
    fontSize: '2.25rem',
    color: '#ef4444',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '1.125rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  headerActionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    width: '44px',
    height: '44px',
    borderRadius: '0.75rem',
    color: '#475569',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s',
  },
  headerActionIcon: {
    fontSize: '1.25rem',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: '600',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'all 0.3s',
  },
  statIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    backgroundColor: '#dbeafe',
    borderRadius: '0.75rem',
  },
  statIcon: {
    fontSize: '1.75rem',
    color: '#ef4444',
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.25rem',
  },
  statLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '0.25rem',
  },
  statSubtext: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  statTrend: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  statTrendIcon: {
    fontSize: '0.875rem',
  },
  statTrendText: {
    whiteSpace: 'nowrap',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '2rem',
    marginBottom: '2rem',
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
  sectionCard: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #f1f5f9',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionIcon: {
    fontSize: '1.25rem',
    color: '#ef4444',
  },
  viewAllLink: {
    color: '#ef4444',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
  },
  actionCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '1rem',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.3s',
  },
  actionIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: '#dbeafe',
    borderRadius: '0.5rem',
    fontSize: '1.25rem',
    color: '#ef4444',
    flexShrink: 0,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.125rem',
  },
  actionDescription: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  actionArrow: {
    fontSize: '1rem',
    color: '#94a3b8',
    flexShrink: 0,
  },
  entreprisesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  entrepriseItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid #f1f5f9',
  },
  entrepriseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  entrepriseLogo: {
    width: '40px',
    height: '40px',
    borderRadius: '0.5rem',
    objectFit: 'cover',
    border: '1px solid #e2e8f0',
  },
  entrepriseLogoPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '0.5rem',
    backgroundColor: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    color: '#f63e3bff',
  },
  entrepriseName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.125rem',
  },
  entrepriseStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  statusBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  entrepriseServices: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500',
  },
  servicesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  serviceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid #f1f5f9',
  },
  serviceIconContainer: {
    position: 'relative',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    flexShrink: 0
  },
  serviceIconImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    position: 'relative',
    zIndex: 1
  },
  serviceIconPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    zIndex: 0
  },
  serviceIconSvg: {
    fontSize: '20px',
    color: '#9ca3af'
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.125rem',
  },
  serviceDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  servicePrice: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#059669',
  },
  service24h: {
    fontSize: '0.75rem',
    color: '#ef4444',
    fontWeight: '600',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center',
  },
  emptyStateIcon: {
    fontSize: '2.5rem',
    color: '#94a3b8',
    marginBottom: '1rem',
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  emptyStateButton: {
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  },
  tipsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  tipsIcon: {
    fontSize: '1.75rem',
    color: '#ef4444',
  },
  tipsTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  tipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  tipCard: {
    backgroundColor: '#f8fafc',
    padding: '1.5rem',
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
  },
  tipIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    backgroundColor: '#dbeafe',
    borderRadius: '0.75rem',
    fontSize: '1.5rem',
    color: '#f63b3bff',
    marginBottom: '1rem',
  },
  tipCardTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.5rem',
  },
  tipCardText: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: '1.5',
  },

  // Styles client
  welcomeCard: {
    background: 'linear-gradient(135deg, #e51818ff 0%)',
    borderRadius: '1.5rem',
    padding: '2rem',
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#fff',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
  },
  welcomeContent: {
    flex: 1,
    paddingRight: '2rem',
  },
  welcomeTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '1rem',
  },
  welcomeText: {
    fontSize: '1rem',
    opacity: 0.9,
    marginBottom: '1.5rem',
    lineHeight: '1.6',
  },
  becomeProviderButton: {
    backgroundColor: '#fff',
    color: '#667eea',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.75rem',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
  buttonIcon: {
    fontSize: '1.25rem',
  },
  welcomeIllustration: {
    flexShrink: 0,
  },
  welcomeIcon: {
    fontSize: '8rem',
    opacity: 0.8,
  },
  clientMainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  clientLeftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  clientRightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  activitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid #f1f5f9',
  },
  activityIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: '#f0f9ff',
    borderRadius: '0.5rem',
    color: '#3b82f6',
    fontSize: '1rem',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: '0.875rem',
    color: '#1e293b',
    marginBottom: '0.25rem',
  },
  activityTime: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  recommendedServices: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  recommendedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  recommendedIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: '#f0f9ff',
    borderRadius: '0.5rem',
    color: '#3b82f6',
    fontSize: '1.25rem',
  },
  recommendedContent: {
    flex: 1,
  },
  recommendedTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.125rem',
  },
  recommendedDesc: {
    fontSize: '0.75rem',
    color: '#64748b',
  },

  // Styles modal
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
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  },
  modalHeader: {
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    position: 'relative',
  },
  modalIcon: {
    fontSize: '2rem',
    color: '#ef4444',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  modalCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0',
    lineHeight: 1,
  },
  modalBody: {
    padding: '1.5rem',
  },
  modalText: {
    fontSize: '0.95rem',
    color: '#475569',
    lineHeight: '1.6',
    marginBottom: '1rem',
  },
  modalInfoBox: {
    backgroundColor: '#f0f9ff',
    padding: '1rem',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    border: '1px solid #bae6fd',
  },
  modalInfoIcon: {
    fontSize: '1.25rem',
    color: '#0284c7',
    flexShrink: 0,
  },
  modalInfoText: {
    fontSize: '0.875rem',
    color: '#0369a1',
    lineHeight: '1.5',
  },
  modalSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  modalStep: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  stepNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: '#ef4444',
    color: '#fff',
    borderRadius: '50%',
    fontSize: '1rem',
    fontWeight: '600',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.25rem',
  },
  stepText: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  modalFooter: {
    padding: '1.5rem',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    gap: '1rem',
  },
  modalCancelButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '0.5rem',
    color: '#475569',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalConfirmButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#ef4444',
    border: 'none',
    borderRadius: '0.5rem',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    transition: 'all 0.2s',
  },

  // Responsive
  '@media (max-width: 1200px)': {
    mainContent: {
      gridTemplateColumns: '1fr',
    },
  },
  '@media (max-width: 968px)': {
    clientMainContent: {
      gridTemplateColumns: '1fr',
    },
    welcomeCard: {
      flexDirection: 'column',
      textAlign: 'center',
    },
    welcomeContent: {
      paddingRight: 0,
      marginBottom: '1.5rem',
    },
  },
  '@media (max-width: 768px)': {
    content: {
      padding: '0 1rem',
    },
    title: {
      fontSize: '1.75rem',
    },
    statsGrid: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    actionsGrid: {
      gridTemplateColumns: '1fr',
    },
    tipsGrid: {
      gridTemplateColumns: '1fr',
    },
  },
  '@media (max-width: 480px)': {
    statsGrid: {
      gridTemplateColumns: '1fr',
    },
    headerMain: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '1rem',
    },
    headerActions: {
      alignSelf: 'flex-end',
    },
  },
};