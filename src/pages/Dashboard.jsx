import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { entrepriseApi } from '../api/entrepriseApi';
import { serviceApi } from '../api/serviceApi';
import { 
  FiSettings, FiShoppingBag, FiHeart, FiCalendar, FiBell, 
  FiTrendingUp, FiActivity, FiBarChart2, FiTarget, FiPlus, 
  FiBriefcase, FiInfo, FiChevronRight, FiUsers, FiDollarSign, FiTool,
  FiClock, FiGift, FiAlertCircle, FiLock
} from 'react-icons/fi';
import { 
  MdDashboard, MdOutlineBusiness, MdOutlineWork, 
  MdOutlineInsights, MdOutlineStorefront, 
  MdOutlineInventory, MdOutlineDirectionsCar,
  MdTimer, MdHourglassEmpty, MdWarning
} from 'react-icons/md';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showBecomeProviderModal, setShowBecomeProviderModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState('');
  const [isProvider, setIsProvider] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [entreprises, setEntreprises] = useState([]);
  const [services, setServices] = useState([]);
  
  // État pour le compte à rebours de l'essai
  const [trialTimeLeft, setTrialTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    isActive: false,
    isExpired: false
  });
  
  const [currentPlan, setCurrentPlan] = useState({
    name: 'Essai Gratuit',
    maxServices: 0,
    maxEmployees: 0,
    maxEntreprises: 1,
    hasApiAccess: false,
    servicesCount: 0,
    employeesCount: 0,
    entreprisesCount: 0
  });

  const [stats, setStats] = useState({
    totalEntreprises: 0,
    validatedEntreprises: 0,
    pendingEntreprises: 0,
    totalServices: 0,
    servicesWithPrice: 0,
    services24h: 0,
    activeClients: 24,
    monthlyRevenue: 0
  });

  // EFFET PRINCIPAL POUR LA REDIRECTION
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login', { 
        state: { from: '/dashboard' },
        replace: true 
      });
      return;
    }

    switch (user.role) {
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'prestataire':
      case 'provider':
        setIsProvider(true);
        setDataLoading(false);
        break;
      case 'client':
      default:
        setIsProvider(false);
        setDataLoading(false);
        break;
    }
  }, [user, authLoading, navigate]);

  // EFFET POUR LE COMPTE À REBOURS
  useEffect(() => {
    if (!isProvider || !entreprises.length) return;

    const validatedEntreprise = entreprises.find(e => 
      e.status === 'validated' && e.trial_ends_at
    );

    if (!validatedEntreprise) {
      setTrialTimeLeft({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
        isActive: false,
        isExpired: false
      });
      
      setCurrentPlan(prev => ({
        ...prev,
        maxServices: validatedEntreprise?.max_services_allowed || 3,
        maxEmployees: validatedEntreprise?.max_employees_allowed || 1,
        maxEntreprises: 1,
        hasApiAccess: validatedEntreprise?.has_api_access || false,
        servicesCount: stats.totalServices || 0,
        employeesCount: 1,
        entreprisesCount: stats.totalEntreprises || 0
      }));
      
      return;
    }

    setCurrentPlan({
      name: 'Essai Gratuit',
      maxServices: validatedEntreprise.max_services_allowed || 3,
      maxEmployees: validatedEntreprise.max_employees_allowed || 1,
      maxEntreprises: 1,
      hasApiAccess: validatedEntreprise.has_api_access || false,
      servicesCount: stats.totalServices || 0,
      employeesCount: 1,
      entreprisesCount: stats.totalEntreprises || 0
    });

    const updateCountdown = () => {
      const now = new Date().getTime();
      const endDate = new Date(validatedEntreprise.trial_ends_at).getTime();
      const distance = endDate - now;

      if (distance < 0) {
        setTrialTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
          isActive: false,
          isExpired: true
        });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTrialTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        total: distance,
        isActive: true,
        isExpired: false
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isProvider, entreprises, stats.totalServices, stats.totalEntreprises]);

  // EFFET POUR CHARGER LES DONNÉES PRESTATAIRE
  useEffect(() => {
    const loadProviderData = async () => {
      if (!isProvider || !user) return;
      
      try {
        setDataLoading(true);
        
        const entreprisesData = await entrepriseApi.getMesEntreprises();
        setEntreprises(entreprisesData || []);
        
        const servicesData = await serviceApi.getMesServices();
        setServices(servicesData || []);
        
        const validatedEntreprises = (entreprisesData || []).filter(e => e.status === 'validated').length;
        const pendingEntreprises = (entreprisesData || []).filter(e => e.status === 'pending').length;
        const servicesWithPrice = (servicesData || []).filter(s => s.price).length;
        const services24h = (servicesData || []).filter(s => s.is_open_24h).length;
        
        const monthlyRevenue = (servicesData || [])
          .filter(s => s.price)
          .reduce((acc, s) => acc + (s.price * 3), 0);

        setStats({
          totalEntreprises: (entreprisesData || []).length,
          validatedEntreprises,
          pendingEntreprises,
          totalServices: (servicesData || []).length,
          servicesWithPrice,
          services24h,
          activeClients: 24,
          monthlyRevenue
        });
      } catch (err) {
        console.error('Erreur chargement données prestataire:', err);
      } finally {
        setDataLoading(false);
      }
    };

    if (isProvider) {
      loadProviderData();
    }
  }, [isProvider, user]);

  // Vérification des limites
  const canCreateEntreprise = () => {
    return stats.totalEntreprises < currentPlan.maxEntreprises;
  };

  const canCreateService = () => {
    return stats.totalServices < currentPlan.maxServices;
  };

  const handleCreateEntreprise = (e) => {
    if (!canCreateEntreprise()) {
      e.preventDefault();
      setLimitModalType('entreprise');
      setShowLimitModal(true);
    }
  };

  const handleCreateService = (e) => {
    if (!canCreateService()) {
      e.preventDefault();
      setLimitModalType('service');
      setShowLimitModal(true);
    }
  };

  const handleManageEntreprises = (e) => {
    if (stats.totalEntreprises === 0) {
      e.preventDefault();
      setLimitModalType('no-entreprise');
      setShowLimitModal(true);
    }
  };

  const handleManageServices = (e) => {
    if (stats.totalServices === 0) {
      e.preventDefault();
      setLimitModalType('no-service');
      setShowLimitModal(true);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>
          {authLoading ? 'Vérification de votre session...' : 'Chargement de votre espace...'}
        </p>
        <p style={styles.loadingSubtext}>
          {authLoading ? 'Préparation de votre tableau de bord...' : 'Récupération de vos données...'}
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
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

  const formatTimeUnit = (value) => {
    return value.toString().padStart(2, '0');
  };

  // Composant Timer
  const TrialTimer = () => {
    if (!trialTimeLeft.isActive && !trialTimeLeft.isExpired) {
      return (
        <div style={styles.timerInactive}>
          <FiClock style={styles.timerIcon} />
          <span>Aucune période d'essai active</span>
        </div>
      );
    }

    if (trialTimeLeft.isExpired) {
      return (
        <div style={styles.timerExpired}>
          <FiAlertCircle style={styles.timerIcon} />
          <div style={styles.timerContent}>
            <span style={styles.timerLabel}>Période d'essai expirée</span>
            <Link to="/abonnements" style={styles.timerAction}>
              Souscrire un abonnement
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.timerCard}>
        <div style={styles.timerHeader}>
          <FiGift style={styles.timerGiftIcon} />
          <div>
            <h4 style={styles.timerTitle}>Période d'essai gratuite</h4>
            <p style={styles.timerSubtitle}>30 jours offerts pour découvrir la plateforme</p>
          </div>
        </div>
        
        <div style={styles.timerDisplay}>
          <div style={styles.timerUnit}>
            <span style={styles.timerNumber}>{formatTimeUnit(trialTimeLeft.days)}</span>
            <span style={styles.timerUnitLabel}>Jours</span>
          </div>
          <span style={styles.timerSeparator}>:</span>
          <div style={styles.timerUnit}>
            <span style={styles.timerNumber}>{formatTimeUnit(trialTimeLeft.hours)}</span>
            <span style={styles.timerUnitLabel}>Heures</span>
          </div>
          <span style={styles.timerSeparator}>:</span>
          <div style={styles.timerUnit}>
            <span style={styles.timerNumber}>{formatTimeUnit(trialTimeLeft.minutes)}</span>
            <span style={styles.timerUnitLabel}>Minutes</span>
          </div>
          <span style={styles.timerSeparator}>:</span>
          <div style={styles.timerUnit}>
            <span style={styles.timerNumber}>{formatTimeUnit(trialTimeLeft.seconds)}</span>
            <span style={styles.timerUnitLabel}>Secondes</span>
          </div>
        </div>

        <div style={styles.timerProgressBar}>
          <div 
            style={{
              ...styles.timerProgressFill,
              width: `${((30 * 24 * 60 * 60 * 1000 - trialTimeLeft.total) / (30 * 24 * 60 * 60 * 1000)) * 100}%`
            }}
          />
        </div>

        <div style={styles.timerFooter}>
          <div style={styles.timerStats}>
            <div style={styles.timerStat}>
              <span style={styles.timerStatLabel}>Services utilisés</span>
              <span style={styles.timerStatValue}>
                {currentPlan.servicesCount} / {currentPlan.maxServices}
              </span>
            </div>
            <div style={styles.timerStat}>
              <span style={styles.timerStatLabel}>Entreprises</span>
              <span style={styles.timerStatValue}>
                {currentPlan.entreprisesCount} / {currentPlan.maxEntreprises}
              </span>
            </div>
          </div>
          <Link to="/plans" style={styles.timerLink}>
            Voir les offres
          </Link>
        </div>
      </div>
    );
  };

  // DASHBOARD CLIENT
  if (!isProvider) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.header}>
            <div style={styles.headerMain}>
              <div>
                <h1 style={styles.title}>
                  <FiShoppingBag style={styles.titleIcon} />
                  Espace Client
                </h1>
                <p style={styles.subtitle}>
                  Bienvenue sur votre espace personnel, {user?.name?.split(' ')[0] || 'Client'} !
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

          <div style={styles.clientMainContent}>
            <div style={styles.clientLeftColumn}>
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

            <div style={styles.clientRightColumn}>
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
            </div>
          </div>
        </div>

        {/* Timer de période d'essai */}
        <div style={styles.timerSection}>
          <TrialTimer />
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
            <div style={{
              ...styles.statTrend,
              backgroundColor: stats.totalEntreprises >= currentPlan.maxEntreprises ? '#fee2e2' : '#f0fdf4',
              color: stats.totalEntreprises >= currentPlan.maxEntreprises ? '#dc2626' : '#16a34a'
            }}>
              <FiActivity style={styles.statTrendIcon} />
              <span style={styles.statTrendText}>
                {stats.totalEntreprises >= currentPlan.maxEntreprises ? 'Limite atteinte' : `${currentPlan.maxEntreprises - stats.totalEntreprises} restante`}
              </span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIconContainer}>
              <MdOutlineWork style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>
                {stats.totalServices} / {currentPlan.maxServices}
              </div>
              <div style={styles.statLabel}>Services</div>
              <div style={styles.statSubtext}>
                {stats.servicesWithPrice} avec tarif • {stats.services24h} 24h/24
              </div>
            </div>
            <div style={{
              ...styles.statTrend,
              backgroundColor: stats.totalServices >= currentPlan.maxServices ? '#fee2e2' : '#f0fdf4',
              color: stats.totalServices >= currentPlan.maxServices ? '#dc2626' : '#16a34a'
            }}>
              <FiActivity style={styles.statTrendIcon} />
              <span style={styles.statTrendText}>
                {stats.totalServices >= currentPlan.maxServices ? 'Limite atteinte' : `${currentPlan.maxServices - stats.totalServices} restants`}
              </span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIconContainer}>
              <FiUsers style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>
                {currentPlan.employeesCount} / {currentPlan.maxEmployees}
              </div>
              <div style={styles.statLabel}>Employés</div>
              <div style={styles.statSubtext}>
                Limite du plan {currentPlan.name}
              </div>
            </div>
            <div style={{
              ...styles.statTrend,
              backgroundColor: currentPlan.employeesCount >= currentPlan.maxEmployees ? '#fee2e2' : '#f0fdf4',
              color: currentPlan.employeesCount >= currentPlan.maxEmployees ? '#dc2626' : '#16a34a'
            }}>
              <FiUsers style={styles.statTrendIcon} />
              <span style={styles.statTrendText}>
                {currentPlan.employeesCount >= currentPlan.maxEmployees ? 'Max atteint' : `${currentPlan.maxEmployees - currentPlan.employeesCount} places`}
              </span>
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
                <Link 
                  to={canCreateService() ? "/services/creer" : "#"} 
                  style={{
                    ...styles.actionCard,
                    opacity: canCreateService() ? 1 : 0.7,
                    cursor: canCreateService() ? 'pointer' : 'not-allowed'
                  }}
                  onClick={handleCreateService}
                >
                  <div style={{
                    ...styles.actionIcon,
                    backgroundColor: canCreateService() ? '#dbeafe' : '#fee2e2'
                  }}>
                    {canCreateService() ? <FiPlus /> : <FiLock />}
                  </div>
                  <div style={styles.actionContent}>
                    <div style={styles.actionTitle}>Nouveau service</div>
                    <div style={styles.actionDescription}>
                      {canCreateService() ? 'Ajouter un service' : 'Limite atteinte'}
                    </div>
                  </div>
                  <FiChevronRight style={styles.actionArrow} />
                </Link>

                <Link 
                  to={canCreateEntreprise() ? "/entreprises/creer" : "#"} 
                  style={{
                    ...styles.actionCard,
                    opacity: canCreateEntreprise() ? 1 : 0.7,
                    cursor: canCreateEntreprise() ? 'pointer' : 'not-allowed'
                  }}
                  onClick={handleCreateEntreprise}
                >
                  <div style={{
                    ...styles.actionIcon,
                    backgroundColor: canCreateEntreprise() ? '#dbeafe' : '#fee2e2'
                  }}>
                    {canCreateEntreprise() ? <MdOutlineBusiness /> : <FiLock />}
                  </div>
                  <div style={styles.actionContent}>
                    <div style={styles.actionTitle}>Nouvelle entreprise</div>
                    <div style={styles.actionDescription}>
                      {canCreateEntreprise() ? 'Créer une entreprise' : 'Limite atteinte'}
                    </div>
                  </div>
                  <FiChevronRight style={styles.actionArrow} />
                </Link>

                <Link 
                  to={stats.totalServices > 0 ? "/mes-services" : "#"} 
                  style={{
                    ...styles.actionCard,
                    opacity: stats.totalServices > 0 ? 1 : 0.7,
                    cursor: stats.totalServices > 0 ? 'pointer' : 'not-allowed'
                  }}
                  onClick={handleManageServices}
                >
                  <div style={{
                    ...styles.actionIcon,
                    backgroundColor: stats.totalServices > 0 ? '#dbeafe' : '#fee2e2'
                  }}>
                    {stats.totalServices > 0 ? <MdOutlineWork /> : <FiLock />}
                  </div>
                  <div style={styles.actionContent}>
                    <div style={styles.actionTitle}>Gérer les services</div>
                    <div style={styles.actionDescription}>
                      {stats.totalServices > 0 ? 'Voir tous les services' : 'Aucun service'}
                    </div>
                  </div>
                  <FiChevronRight style={styles.actionArrow} />
                </Link>

                <Link 
                  to={stats.totalEntreprises > 0 ? "/mes-entreprises" : "#"} 
                  style={{
                    ...styles.actionCard,
                    opacity: stats.totalEntreprises > 0 ? 1 : 0.7,
                    cursor: stats.totalEntreprises > 0 ? 'pointer' : 'not-allowed'
                  }}
                  onClick={handleManageEntreprises}
                >
                  <div style={{
                    ...styles.actionIcon,
                    backgroundColor: stats.totalEntreprises > 0 ? '#dbeafe' : '#fee2e2'
                  }}>
                    {stats.totalEntreprises > 0 ? <FiBriefcase /> : <FiLock />}
                  </div>
                  <div style={styles.actionContent}>
                    <div style={styles.actionTitle}>Gérer les entreprises</div>
                    <div style={styles.actionDescription}>
                      {stats.totalEntreprises > 0 ? 'Voir les entreprises' : 'Aucune entreprise'}
                    </div>
                  </div>
                  <FiChevronRight style={styles.actionArrow} />
                </Link>
              </div>
            </div>

            {/* Plan d'abonnement */}
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>
                  <FiGift style={styles.sectionIcon} />
                  Plan actuel
                </h3>
                <Link to="/plans" style={styles.viewAllLink}>
                  Changer de plan
                </Link>
              </div>
              <div style={styles.planInfo}>
                <div style={styles.planName}>
                  <span style={styles.planNameText}>{currentPlan.name}</span>
                  {currentPlan.name === 'Essai Gratuit' && (
                    <span style={styles.planBadge}>30 jours</span>
                  )}
                </div>
                <div style={styles.planFeatures}>
                  <div style={styles.planFeature}>
                    <span style={styles.planFeatureLabel}>Entreprises max</span>
                    <span style={styles.planFeatureValue}>{currentPlan.maxEntreprises}</span>
                  </div>
                  <div style={styles.planFeature}>
                    <span style={styles.planFeatureLabel}>Services max</span>
                    <span style={styles.planFeatureValue}>{currentPlan.maxServices}</span>
                  </div>
                  <div style={styles.planFeature}>
                    <span style={styles.planFeatureLabel}>Employés max</span>
                    <span style={styles.planFeatureValue}>{currentPlan.maxEmployees}</span>
                  </div>
                </div>
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
                <Link to={stats.totalEntreprises > 0 ? "/mes-entreprises" : "#"} 
                  style={{
                    ...styles.viewAllLink,
                    opacity: stats.totalEntreprises > 0 ? 1 : 0.5,
                    pointerEvents: stats.totalEntreprises > 0 ? 'auto' : 'none'
                  }}
                >
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
                          {entreprise.trial_ends_at && entreprise.status === 'validated' && (
                            <span style={styles.trialBadge}>
                              Essai
                            </span>
                          )}
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
                    <Link 
                      to={canCreateEntreprise() ? "/entreprises/creer" : "#"} 
                      style={{
                        ...styles.emptyStateButton,
                        opacity: canCreateEntreprise() ? 1 : 0.5,
                        cursor: canCreateEntreprise() ? 'pointer' : 'not-allowed'
                      }}
                      onClick={handleCreateEntreprise}
                    >
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
                <Link to={stats.totalServices > 0 ? "/mes-services" : "#"} 
                  style={{
                    ...styles.viewAllLink,
                    opacity: stats.totalServices > 0 ? 1 : 0.5,
                    pointerEvents: stats.totalServices > 0 ? 'auto' : 'none'
                  }}
                >
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
                    <Link 
                      to={canCreateService() ? "/services/creer" : "#"} 
                      style={{
                        ...styles.emptyStateButton,
                        opacity: canCreateService() ? 1 : 0.5,
                        cursor: canCreateService() ? 'pointer' : 'not-allowed'
                      }}
                      onClick={handleCreateService}
                    >
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
                <FiDollarSign />
              </div>
              <h4 style={styles.tipCardTitle}>Tarifs transparents</h4>
              <p style={styles.tipCardText}>
                Indiquez des prix clairs pour plus de visibilité.
              </p>
            </div>
            <div style={styles.tipCard}>
              <div style={styles.tipIcon}>
                <FiCalendar />
              </div>
              <h4 style={styles.tipCardTitle}>Disponibilité</h4>
              <p style={styles.tipCardText}>
                Mettez à jour vos horaires régulièrement.
              </p>
            </div>
            <div style={styles.tipCard}>
              <div style={styles.tipIcon}>
                <FiInfo />
              </div>
              <h4 style={styles.tipCardTitle}>Descriptions riches</h4>
              <p style={styles.tipCardText}>
                Décrivez précisément vos services et compétences.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de limite atteinte */}
      {showLimitModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLimitModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <MdWarning style={{...styles.modalIcon, color: '#f59e0b'}} />
              <h2 style={styles.modalTitle}>
                {limitModalType === 'entreprise' && 'Limite d\'entreprises atteinte'}
                {limitModalType === 'service' && 'Limite de services atteinte'}
                {limitModalType === 'no-entreprise' && 'Aucune entreprise'}
                {limitModalType === 'no-service' && 'Aucun service'}
              </h2>
              <button 
                onClick={() => setShowLimitModal(false)}
                style={styles.modalCloseButton}
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              {limitModalType === 'entreprise' && (
                <>
                  <p style={styles.modalText}>
                    Vous avez atteint la limite maximale d'entreprises autorisée par votre plan actuel.
                  </p>
                  <div style={styles.modalInfoBox}>
                    <FiInfo style={styles.modalInfoIcon} />
                    <p style={styles.modalInfoText}>
                      <strong>Plan actuel :</strong> {currentPlan.name} ({currentPlan.maxEntreprises} entreprise maximum)
                    </p>
                  </div>
                </>
              )}

              {limitModalType === 'service' && (
                <>
                  <p style={styles.modalText}>
                    Vous avez atteint la limite maximale de services autorisée par votre plan actuel.
                  </p>
                  <div style={styles.modalInfoBox}>
                    <FiInfo style={styles.modalInfoIcon} />
                    <p style={styles.modalInfoText}>
                      <strong>Plan actuel :</strong> {currentPlan.name} ({currentPlan.maxServices} services maximum)
                    </p>
                  </div>
                </>
              )}

              {limitModalType === 'no-entreprise' && (
                <>
                  <p style={styles.modalText}>
                    Vous n'avez pas encore créé d'entreprise. Pour accéder à cette section, vous devez d'abord créer votre première entreprise.
                  </p>
                  <div style={styles.modalInfoBox}>
                    <FiInfo style={styles.modalInfoIcon} />
                    <p style={styles.modalInfoText}>
                      Une fois votre entreprise créée et validée, vous pourrez gérer vos services et vos informations.
                    </p>
                  </div>
                </>
              )}

              {limitModalType === 'no-service' && (
                <>
                  <p style={styles.modalText}>
                    Vous n'avez pas encore créé de service. Pour accéder à cette section, vous devez d'abord créer vos services.
                  </p>
                  <div style={styles.modalInfoBox}>
                    <FiInfo style={styles.modalInfoIcon} />
                    <p style={styles.modalInfoText}>
                      Une fois vos services créés, vous pourrez les gérer et les modifier depuis cette interface.
                    </p>
                  </div>
                </>
              )}

              <div style={styles.modalSteps}>
                <h4 style={{marginBottom: '1rem', color: '#1e293b'}}>Solutions disponibles :</h4>
                
                {(limitModalType === 'entreprise' || limitModalType === 'service') && (
                  <>
                    <div style={styles.modalStep}>
                      <div style={{...styles.stepNumber, backgroundColor: '#f59e0b'}}>1</div>
                      <div style={styles.stepContent}>
                        <h4 style={styles.stepTitle}>Passer à un plan supérieur</h4>
                        <p style={styles.stepText}>
                          Bénéficiez de limites plus élevées et de fonctionnalités supplémentaires
                        </p>
                      </div>
                    </div>
                    
                    <div style={styles.modalStep}>
                      <div style={{...styles.stepNumber, backgroundColor: '#f59e0b'}}>2</div>
                      <div style={styles.stepContent}>
                        <h4 style={styles.stepTitle}>Optimiser vos ressources</h4>
                        <p style={styles.stepText}>
                          Supprimez ou désactivez les éléments que vous n'utilisez plus
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {(limitModalType === 'no-entreprise' || limitModalType === 'no-service') && (
                  <div style={styles.modalStep}>
                    <div style={{...styles.stepNumber, backgroundColor: '#f59e0b'}}>1</div>
                    <div style={styles.stepContent}>
                      <h4 style={styles.stepTitle}>
                        {limitModalType === 'no-entreprise' ? 'Créer votre première entreprise' : 'Créer votre premier service'}
                      </h4>
                      <p style={styles.stepText}>
                        {limitModalType === 'no-entreprise' 
                          ? 'Commencez par créer votre entreprise pour proposer vos services'
                          : 'Une fois votre entreprise créée, ajoutez vos services pour les rendre visibles'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button 
                onClick={() => setShowLimitModal(false)}
                style={styles.modalCancelButton}
              >
                Fermer
              </button>
              {(limitModalType === 'entreprise' || limitModalType === 'service') && (
                <Link 
                  to="/plans"
                  style={styles.modalConfirmButton}
                  onClick={() => setShowLimitModal(false)}
                >
                  Voir les plans
                </Link>
              )}
              {limitModalType === 'no-entreprise' && (
                <Link 
                  to="/entreprises/creer"
                  style={styles.modalConfirmButton}
                  onClick={() => setShowLimitModal(false)}
                >
                  Créer une entreprise
                </Link>
              )}
              {limitModalType === 'no-service' && (
                <Link 
                  to="/services/creer"
                  style={styles.modalConfirmButton}
                  onClick={() => setShowLimitModal(false)}
                >
                  Créer un service
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES (inchangés, garder ceux déjà présents)
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
    minHeight: '100vh',
    gap: '1rem',
    backgroundColor: '#f8fafc',
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #ef4444',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  loadingText: {
    color: '#1e293b',
    fontSize: '1.25rem',
    fontWeight: '600',
  },
  loadingSubtext: {
    color: '#64748b',
    fontSize: '0.95rem',
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
  timerSection: {
    marginBottom: '2rem',
  },
  timerCard: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    padding: '1.5rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    background: 'linear-gradient(135deg, #e80a0aff 0%, #c1201aff 100%)',
    color: '#fff',
  },
  timerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  timerGiftIcon: {
    fontSize: '2rem',
  },
  timerTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
  },
  timerSubtitle: {
    fontSize: '0.875rem',
    opacity: 0.9,
  },
  timerDisplay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  timerUnit: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '80px',
  },
  timerNumber: {
    fontSize: '2.5rem',
    fontWeight: '700',
    lineHeight: 1,
  },
  timerUnitLabel: {
    fontSize: '0.75rem',
    opacity: 0.9,
    marginTop: '0.25rem',
  },
  timerSeparator: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  timerProgressBar: {
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '3px',
    marginBottom: '1rem',
    overflow: 'hidden',
  },
  timerProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: '3px',
    transition: 'width 1s linear',
  },
  timerFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerStats: {
    display: 'flex',
    gap: '1.5rem',
  },
  timerStat: {
    display: 'flex',
    flexDirection: 'column',
  },
  timerStatLabel: {
    fontSize: '0.75rem',
    opacity: 0.9,
    marginBottom: '0.125rem',
  },
  timerStatValue: {
    fontSize: '1rem',
    fontWeight: '600',
  },
  timerLink: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '600',
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '0.5rem',
  },
  timerInactive: {
    backgroundColor: '#f1f5f9',
    borderRadius: '1rem',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#64748b',
    border: '1px dashed #cbd5e1',
  },
  timerExpired: {
    backgroundColor: '#fee2e2',
    borderRadius: '1rem',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#991b1b',
    border: '1px solid #fecaca',
  },
  timerIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  timerContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerLabel: {
    fontWeight: '500',
  },
  timerAction: {
    color: '#dc2626',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.875rem',
  },
  planInfo: {
    padding: '0.5rem 0',
  },
  planName: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  planNameText: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  planBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  planFeatures: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  planFeature: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '0.75rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.5rem',
  },
  planFeatureLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginBottom: '0.25rem',
  },
  planFeatureValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  trialBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    fontSize: '0.625rem',
    fontWeight: '600',
    marginLeft: '0.5rem',
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
    color: '#ef4444',
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
    color: '#ef4444',
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
  welcomeCard: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    borderRadius: '1.5rem',
    padding: '2rem',
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#fff',
    boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)',
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
    color: '#ef4444',
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
};

// Ajouter l'animation globale
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);