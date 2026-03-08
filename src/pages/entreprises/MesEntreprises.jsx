// careasy-frontend/src/pages/entreprises/MesEntreprises.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { entrepriseApi } from '../../api/entrepriseApi';
import { serviceApi } from '../../api/serviceApi';
import { useAuth } from '../../contexts/AuthContext';

// Import des icônes React Icons
import {
  FiActivity,
  FiPlus,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertCircle,
  FiBriefcase,
  FiUsers,
  FiTag,
  FiCalendar,
  FiMapPin,
  FiChevronRight,
  FiDownload,
  FiPrinter,
  FiGrid,
  FiStar,
  FiLock,
  FiGift,
  FiDollarSign,
  FiTool
} from 'react-icons/fi';
import {
  MdBusiness,
  MdOutlineVerified,
  MdOutlinePending,
  MdOutlineWarning,
  MdOutlineDashboard,
  MdOutlineLibraryAdd,
  MdOutlineLocationOn,
  MdOutlinePerson,
  MdOutlineEmail,
  MdOutlinePhone,
  MdOutlineMoreVert,
  MdOutlineAttachMoney,
  MdOutlineDescription,
  MdOutlineWork,
  MdTimer
} from 'react-icons/md';

export default function MesEntreprises() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entreprises, setEntreprises] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // État pour les limites du plan - MÊME STRUCTURE QUE LE DASHBOARD
  const [currentPlan, setCurrentPlan] = useState({
    name: 'Essai Gratuit',
    maxEntreprises: 1,
    maxServices: 3,
    maxEmployees: 1,
    hasApiAccess: false,
    entreprisesCount: 0,
    servicesCount: 0,
    employeesCount: 0,
    trialDaysLeft: 0,
    isTrialActive: false,
    isTrialExpired: false
  });

  // Statistiques - MÊME STRUCTURE QUE LE DASHBOARD
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

  // État pour le modal de limite
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState('');

  // Charger les données au montage
  useEffect(() => {
    fetchData();
  }, []);

  // Mettre à jour les stats et le plan quand les données changent
  useEffect(() => {
    if (entreprises.length > 0 || services.length > 0) {
      updateStatsAndPlan();
    }
  }, [entreprises, services]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Charger les entreprises
      const entreprisesData = await entrepriseApi.getMesEntreprises();
      setEntreprises(entreprisesData || []);
      
      // Charger tous les services
      await fetchAllServices();
      
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllServices = async () => {
    try {
      setServicesLoading(true);
      const servicesData = await serviceApi.getMesServices();
      
      let servicesList = [];
      if (servicesData) {
        if (Array.isArray(servicesData)) {
          servicesList = servicesData;
        } else if (servicesData.data && Array.isArray(servicesData.data)) {
          servicesList = servicesData.data;
        } else if (servicesData.services && Array.isArray(servicesData.services)) {
          servicesList = servicesData.services;
        }
      }
      
      setServices(servicesList);
      
    } catch (err) {
      console.error('Erreur chargement services:', err);
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  // Fonction pour mettre à jour les stats et le plan - COMME DANS LE DASHBOARD
  const updateStatsAndPlan = () => {
    // Calculer les stats
    const validatedEntreprises = entreprises.filter(e => e.status === 'validated').length;
    const pendingEntreprises = entreprises.filter(e => e.status === 'pending').length;
    const servicesWithPrice = services.filter(s => s.price).length;
    const services24h = services.filter(s => s.is_open_24h).length;
    
    const monthlyRevenue = services
      .filter(s => s.price)
      .reduce((acc, s) => acc + (s.price * 3), 0);

    setStats({
      totalEntreprises: entreprises.length,
      validatedEntreprises,
      pendingEntreprises,
      totalServices: services.length,
      servicesWithPrice,
      services24h,
      activeClients: 24,
      monthlyRevenue
    });

    // Trouver la première entreprise validée avec période d'essai
    const validatedEntreprise = entreprises.find(e => 
      e.status === 'validated' && e.trial_ends_at
    );

    // Mettre à jour le plan avec les vraies données
    setCurrentPlan({
      name: 'Essai Gratuit',
      maxEntreprises: 1,
      maxServices: validatedEntreprise?.max_services_allowed || 3,
      maxEmployees: validatedEntreprise?.max_employees_allowed || 1,
      hasApiAccess: validatedEntreprise?.has_api_access || false,
      entreprisesCount: entreprises.length,
      servicesCount: services.length,
      employeesCount: 1,
      trialDaysLeft: validatedEntreprise ? calculateDaysLeft(validatedEntreprise.trial_ends_at) : 0,
      isTrialActive: validatedEntreprise ? isTrialActive(validatedEntreprise.trial_ends_at) : false,
      isTrialExpired: validatedEntreprise ? isTrialExpired(validatedEntreprise.trial_ends_at) : false
    });
  };

  // Fonctions utilitaires pour les dates
  const calculateDaysLeft = (trialEndsAt) => {
    if (!trialEndsAt) return 0;
    const end = new Date(trialEndsAt).getTime();
    const now = new Date().getTime();
    const distance = end - now;
    return Math.max(0, Math.floor(distance / (1000 * 60 * 60 * 24)));
  };

  const isTrialActive = (trialEndsAt) => {
    if (!trialEndsAt) return false;
    return new Date(trialEndsAt).getTime() > new Date().getTime();
  };

  const isTrialExpired = (trialEndsAt) => {
    if (!trialEndsAt) return false;
    return new Date(trialEndsAt).getTime() <= new Date().getTime();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Vérification des limites - COMME DANS LE DASHBOARD
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

  const handleDeleteEntreprise = async (id, name) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      try {
        // Appel API pour supprimer l'entreprise
        // await entrepriseApi.deleteEntreprise(id);
        
        // Mettre à jour la liste
        const updatedEntreprises = entreprises.filter(e => e.id !== id);
        setEntreprises(updatedEntreprises);
        
        // Recharger les services
        await fetchAllServices();
        
      } catch (err) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: <FiClock />,
        text: 'En attente',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        iconColor: '#d97706'
      },
      validated: {
        icon: <FiCheckCircle />,
        text: 'Validée',
        color: '#10b981',
        bgColor: '#d1fae5',
        iconColor: '#059669'
      },
      rejected: {
        icon: <FiXCircle />,
        text: 'Rejetée',
        color: '#ef4444',
        bgColor: '#fee2e2',
        iconColor: '#dc2626'
      },
      draft: {
        icon: <MdOutlineWarning />,
        text: 'Brouillon',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        iconColor: '#4b5563'
      }
    };
    return configs[status] || configs.pending;
  };

  const filteredEntreprises = entreprises.filter(e => {
    if (filter !== 'all' && e.status !== filter) return false;
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      e.name.toLowerCase().includes(searchLower) ||
      e.pdg_full_name.toLowerCase().includes(searchLower) ||
      e.ifu_number.toLowerCase().includes(searchLower) ||
      e.rccm_number.toLowerCase().includes(searchLower) ||
      e.siege.toLowerCase().includes(searchLower)
    );
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement de vos entreprises...</p>
          <p style={styles.loadingSubtext}>Veuillez patienter</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header avec actions */}
        <div style={styles.header}>
          <div style={styles.headerMain}>
            <div>
              <h1 style={styles.title}>
                <MdBusiness style={styles.titleIcon} />
                Mes Entreprises
              </h1>
              <p style={styles.subtitle}>
                Gérez vos entreprises et suivez leur statut de validation
              </p>
            </div>
            <div style={styles.headerActions}>
              <button 
                onClick={handleRefresh}
                style={styles.headerActionButton}
                disabled={refreshing}
              >
                <FiRefreshCw style={refreshing ? styles.refreshingIcon : styles.headerActionIcon} />
                {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
              </button>
              
              {/* Bouton de création avec vérification de limite - COMME DANS LE DASHBOARD */}
              <Link 
                to={canCreateEntreprise() ? "/entreprises/creer" : "#"} 
                style={{
                  ...styles.createButton,
                  opacity: canCreateEntreprise() ? 1 : 0.7,
                  cursor: canCreateEntreprise() ? 'pointer' : 'not-allowed',
                  backgroundColor: canCreateEntreprise() ? '#ef4444' : '#94a3b8'
                }}
                onClick={handleCreateEntreprise}
              >
                {canCreateEntreprise() ? (
                  <FiPlus style={styles.createButtonIcon} />
                ) : (
                  <FiLock style={styles.createButtonIcon} />
                )}
                {canCreateEntreprise() ? 'Nouvelle entreprise' : 'Limite atteinte'}
              </Link>
            </div>
          </div>
        </div>

        {/* Carte d'information du plan - COMME DANS LE DASHBOARD */}
        <div style={styles.planCard}>
          <div style={styles.planCardHeader}>
            <div style={styles.planCardTitle}>
              <FiGift style={styles.planCardIcon} />
              <span>Plan actuel : <strong>{currentPlan.name}</strong></span>
            </div>
            <Link to="/plans" style={styles.planCardLink}>
              Changer de plan
            </Link>
          </div>
          <div style={styles.planCardBody}>
            <div style={styles.planProgress}>
              <div style={styles.planProgressItem}>
                <span style={styles.planProgressLabel}>Entreprises</span>
                <div style={styles.planProgressBarContainer}>
                  <div style={styles.planProgressBar}>
                    <div style={{
                      ...styles.planProgressFill,
                      width: `${currentPlan.maxEntreprises > 0 ? (currentPlan.entreprisesCount / currentPlan.maxEntreprises) * 100 : 0}%`,
                      backgroundColor: currentPlan.entreprisesCount >= currentPlan.maxEntreprises ? '#dc2626' : '#10b981'
                    }} />
                  </div>
                  <span style={styles.planProgressValue}>
                    {currentPlan.entreprisesCount} / {currentPlan.maxEntreprises}
                  </span>
                </div>
              </div>
              <div style={styles.planProgressItem}>
                <span style={styles.planProgressLabel}>Services</span>
                <div style={styles.planProgressBarContainer}>
                  <div style={styles.planProgressBar}>
                    <div style={{
                      ...styles.planProgressFill,
                      width: `${currentPlan.maxServices > 0 ? (currentPlan.servicesCount / currentPlan.maxServices) * 100 : 0}%`,
                      backgroundColor: currentPlan.servicesCount >= currentPlan.maxServices ? '#dc2626' : '#10b981'
                    }} />
                  </div>
                  <span style={styles.planProgressValue}>
                    {currentPlan.servicesCount} / {currentPlan.maxServices}
                  </span>
                </div>
              </div>
            </div>
            {currentPlan.isTrialActive && (
              <div style={styles.trialInfo}>
                <MdTimer style={styles.trialIcon} />
                <span style={styles.trialText}>
                  {currentPlan.trialDaysLeft} jours restants sur votre période d'essai
                </span>
              </div>
            )}
            {(currentPlan.entreprisesCount >= currentPlan.maxEntreprises || currentPlan.servicesCount >= currentPlan.maxServices) && (
              <div style={styles.warningInfo}>
                <FiAlertCircle style={styles.warningIcon} />
                <span style={styles.warningText}>
                  Limite {currentPlan.entreprisesCount >= currentPlan.maxEntreprises ? 'd\'entreprises' : 'de services'} atteinte. Passez à un plan supérieur.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques améliorées - COMME DANS LE DASHBOARD */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIconContainer}>
              <MdBusiness style={styles.statIcon} />
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
              <div style={styles.statNumber}>{stats.totalServices}</div>
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
            <div style={{...styles.statIconContainer, backgroundColor: '#fef3c7'}}>
              <MdOutlinePending style={{...styles.statIcon, color: '#d97706'}} />
            </div>
            <div style={styles.statContent}>
              <div style={{...styles.statNumber, color: '#d97706'}}>{stats.pendingEntreprises}</div>
              <div style={styles.statLabel}>En attente</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{...styles.statIconContainer, backgroundColor: '#d1fae5'}}>
              <MdOutlineVerified style={{...styles.statIcon, color: '#059669'}} />
            </div>
            <div style={styles.statContent}>
              <div style={{...styles.statNumber, color: '#059669'}}>{stats.validatedEntreprises}</div>
              <div style={styles.statLabel}>Validées</div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div style={styles.searchSection}>
          <div style={styles.searchContainer}>
            <FiSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher une entreprise, PDG, IFU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={styles.clearSearchButton}
              >
                ✕
              </button>
            )}
          </div>
          <div style={styles.filterActions}>
            <button style={styles.filterButton}>
              <FiDownload style={styles.filterIcon} />
              Exporter
            </button>
            <button style={styles.filterButton}>
              <FiPrinter style={styles.filterIcon} />
              Imprimer
            </button>
          </div>
        </div>

        {/* Filtres de statut */}
        <div style={styles.filterContainer}>
          <button 
            onClick={() => setFilter('all')}
            style={{
              ...styles.filterButtonStatus,
              ...(filter === 'all' ? styles.filterButtonStatusActive : {})
            }}
          >
            <FiGrid style={styles.filterButtonIcon} />
            Toutes ({stats.totalEntreprises})
          </button>
          <button 
            onClick={() => setFilter('pending')}
            style={{
              ...styles.filterButtonStatus,
              ...(filter === 'pending' ? styles.filterButtonStatusActive : {})
            }}
          >
            <FiClock style={styles.filterButtonIcon} />
            En attente ({stats.pendingEntreprises})
          </button>
          <button 
            onClick={() => setFilter('validated')}
            style={{
              ...styles.filterButtonStatus,
              ...(filter === 'validated' ? styles.filterButtonStatusActive : {})
            }}
          >
            <FiCheckCircle style={styles.filterButtonIcon} />
            Validées ({stats.validatedEntreprises})
          </button>
          <button 
            onClick={() => setFilter('rejected')}
            style={{
              ...styles.filterButtonStatus,
              ...(filter === 'rejected' ? styles.filterButtonStatusActive : {})
            }}
          >
            <FiXCircle style={styles.filterButtonIcon} />
            Rejetées ({stats.rejected})
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div style={styles.error}>
            <FiAlertCircle style={styles.errorIcon} />
            <div>
              <div style={styles.errorTitle}>Erreur de chargement</div>
              <div style={styles.errorText}>{error}</div>
            </div>
            <button onClick={fetchData} style={styles.errorRetryButton}>
              Réessayer
            </button>
          </div>
        )}

        {/* Liste des entreprises */}
        {filteredEntreprises.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIconContainer}>
              <MdBusiness style={styles.emptyIcon} />
            </div>
            <h3 style={styles.emptyTitle}>
              {entreprises.length === 0 
                ? "Aucune entreprise créée"
                : `Aucune entreprise "${filter}" trouvée`
              }
            </h3>
            <p style={styles.emptyText}>
              {entreprises.length === 0 
                ? "Commencez par créer votre première entreprise pour proposer vos services."
                : `Aucune entreprise ne correspond à vos critères de recherche.`
              }
            </p>
            {entreprises.length === 0 && (
              <Link 
                to={canCreateEntreprise() ? "/entreprises/creer" : "#"} 
                style={{
                  ...styles.emptyButton,
                  opacity: canCreateEntreprise() ? 1 : 0.7,
                  cursor: canCreateEntreprise() ? 'pointer' : 'not-allowed',
                  backgroundColor: canCreateEntreprise() ? '#ef4444' : '#94a3b8'
                }}
                onClick={handleCreateEntreprise}
              >
                {canCreateEntreprise() ? (
                  <FiPlus style={styles.emptyButtonIcon} />
                ) : (
                  <FiLock style={styles.emptyButtonIcon} />
                )}
                {canCreateEntreprise() ? 'Créer ma première entreprise' : 'Limite atteinte'}
              </Link>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredEntreprises.map((entreprise) => {
              const statusConfig = getStatusConfig(entreprise.status);
              
              return (
                <div key={entreprise.id} style={styles.card}>
                  {/* Header avec logo et actions */}
                  <div style={styles.cardHeader}>
                    <div style={styles.cardHeaderMain}>
                      {entreprise.logo ? (
                        <img 
                          src={entreprise.logo}
                          alt={entreprise.name}
                          style={styles.logo}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={styles.logoPlaceholder}>
                          <MdBusiness style={styles.logoIcon} />
                        </div>
                      )}
                      
                      <div style={styles.cardHeaderInfo}>
                        <h3 style={styles.cardTitle}>{entreprise.name}</h3>
                        <div style={{
                          ...styles.statusBadge,
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color
                        }}>
                          {statusConfig.icon}
                          <span>{statusConfig.text}</span>
                        </div>
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <button style={styles.cardActionButton}>
                        <MdOutlineMoreVert />
                      </button>
                    </div>
                  </div>

                  {/* Infos entreprise */}
                  <div style={styles.cardBody}>
                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <MdOutlinePerson style={styles.infoIcon} />
                        <div>
                          <div style={styles.infoLabel}>Dirigeant</div>
                          <div style={styles.infoValue}>{entreprise.pdg_full_name}</div>
                        </div>
                      </div>
                      
                      <div style={styles.infoItem}>
                        <FiBriefcase style={styles.infoIcon} />
                        <div>
                          <div style={styles.infoLabel}>IFU / RCCM</div>
                          <div style={styles.infoValue}>
                            {entreprise.ifu_number || 'Non renseigné'}
                          </div>
                        </div>
                      </div>
                      
                      <div style={styles.infoItem}>
                        <MdOutlineLocationOn style={styles.infoIcon} />
                        <div>
                          <div style={styles.infoLabel}>Siège</div>
                          <div style={styles.infoValue}>{entreprise.siege}</div>
                        </div>
                      </div>
                    </div>

                    {/* Domaines */}
                    {entreprise.domaines && entreprise.domaines.length > 0 && (
                      <div style={styles.domainesSection}>
                        <div style={styles.domainesLabel}>
                          <FiTag style={styles.domainesIcon} />
                          Domaines d'expertise
                        </div>
                        <div style={styles.domainesList}>
                          {entreprise.domaines.slice(0, 4).map((domaine) => (
                            <span key={domaine.id} style={styles.domaineTag}>
                              {domaine.name}
                            </span>
                          ))}
                          {entreprise.domaines.length > 4 && (
                            <span style={styles.domaineTag}>
                              +{entreprise.domaines.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer avec actions */}
                  <div style={styles.cardFooter}>
                    <div style={styles.cardFooterInfo}>
                      <div style={styles.dateInfo}>
                        <FiCalendar style={styles.dateIcon} />
                        <span style={styles.dateText}>
                          Créée le {new Date(entreprise.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div style={styles.cardFooterActions}>
                      <Link 
                        to={`/entreprises/${entreprise.id}`}
                        style={styles.viewButton}
                      >
                        <FiEye style={styles.viewButtonIcon} />
                        Voir
                      </Link>
                      <Link 
                        to={`/entreprises/${entreprise.id}/edit`}
                        style={styles.editButton}
                      >
                        <FiEdit style={styles.editButtonIcon} />
                        Modifier
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de limite atteinte - COMME DANS LE DASHBOARD */}
      {showLimitModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLimitModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <MdOutlineWarning style={{...styles.modalIcon, color: '#f59e0b'}} />
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
                    <FiAlertCircle style={styles.modalInfoIcon} />
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
                    <FiAlertCircle style={styles.modalInfoIcon} />
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
                    <FiAlertCircle style={styles.modalInfoIcon} />
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
                    <FiAlertCircle style={styles.modalInfoIcon} />
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

      {/* CSS pour animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .entreprise-card {
          animation: fadeIn 0.3s ease-out;
          transition: all 0.3s ease;
        }
        
        .entreprise-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }
        
        .refreshing {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

// Styles (avec les nouveaux styles pour les barres de progression)
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
    border: `4px solid #dbeafe`,
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
  header: {
    marginBottom: '2rem',
  },
  headerMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
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
    gap: '0.75rem',
    alignItems: 'center',
  },
  headerActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    padding: '0.625rem 1rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    color: '#475569',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  headerActionIcon: {
    fontSize: '1rem',
  },
  refreshingIcon: {
    fontSize: '1rem',
    animation: 'spin 1s linear infinite',
  },
  createButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '0.875rem 1.75rem',
    borderRadius: '0.75rem',
    textDecoration: 'none',
    fontWeight: '600',
    boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)',
    transition: 'all 0.2s',
  },
  createButtonIcon: {
    fontSize: '1.125rem',
  },

  // Styles pour la carte du plan - COMME DANS LE DASHBOARD
  planCard: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  planCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  planCardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
    color: '#475569',
  },
  planCardIcon: {
    fontSize: '1.25rem',
    color: '#f59e0b',
  },
  planCardLink: {
    color: '#ef4444',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  planCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  planProgress: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  planProgressItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  planProgressLabel: {
    fontSize: '0.875rem',
    color: '#475569',
    fontWeight: '500',
  },
  planProgressBarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  planProgressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  planProgressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  planProgressValue: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    minWidth: '60px',
    textAlign: 'right',
  },
  trialInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#fef3c7',
    borderRadius: '0.5rem',
    border: '1px solid #fde68a',
  },
  trialIcon: {
    fontSize: '1rem',
    color: '#d97706',
  },
  trialText: {
    fontSize: '0.875rem',
    color: '#b45309',
    fontWeight: '500',
  },
  warningInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#fee2e2',
    borderRadius: '0.5rem',
    border: '1px solid #fecaca',
  },
  warningIcon: {
    fontSize: '1rem',
    color: '#dc2626',
  },
  warningText: {
    fontSize: '0.875rem',
    color: '#b91c1c',
    fontWeight: '500',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '1.25rem',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'all 0.3s',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  },
  statIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    backgroundColor: '#dbeafe',
    borderRadius: '0.75rem',
  },
  statIcon: {
    fontSize: '1.5rem',
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
  searchSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
    minWidth: '300px',
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.25rem',
    color: '#94a3b8',
  },
  searchInput: {
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 3rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.3s',
    backgroundColor: '#fff',
  },
  clearSearchButton: {
    position: 'absolute',
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0',
  },
  filterActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    padding: '0.625rem 1rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    color: '#475569',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterIcon: {
    fontSize: '1rem',
  },
  filterContainer: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  filterButtonStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fff',
    color: '#475569',
    border: '2px solid #e2e8f0',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
    transition: 'all 0.3s',
  },
  filterButtonStatusActive: {
    backgroundColor: '#ef4444',
    color: '#fff',
    borderColor: '#ef4444',
  },
  filterButtonIcon: {
    fontSize: '1rem',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '1rem',
    borderRadius: '0.75rem',
    marginBottom: '2rem',
  },
  errorIcon: {
    fontSize: '1.5rem',
    color: '#ef4444',
    flexShrink: 0,
  },
  errorTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: '0.25rem',
  },
  errorText: {
    fontSize: '0.875rem',
    color: '#991b1b',
  },
  errorRetryButton: {
    marginLeft: 'auto',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: '4rem 2rem',
    borderRadius: '1.5rem',
    textAlign: 'center',
    border: '2px dashed #e2e8f0',
  },
  emptyIconContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    backgroundColor: '#dbeafe',
    borderRadius: '50%',
    marginBottom: '1.5rem',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    color: '#ef4444',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.75rem',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '1rem',
    marginBottom: '2rem',
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  emptyButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '0.875rem 2rem',
    borderRadius: '0.75rem',
    textDecoration: 'none',
    fontWeight: '600',
    boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)',
  },
  emptyButtonIcon: {
    fontSize: '1.125rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '2rem',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    transition: 'all 0.3s',
  },
  cardHeader: {
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '2px solid #f1f5f9',
  },
  cardHeaderMain: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    flex: 1,
  },
  logo: {
    width: '64px',
    height: '64px',
    borderRadius: '0.75rem',
    objectFit: 'cover',
    border: '2px solid #e2e8f0',
    flexShrink: 0,
  },
  logoPlaceholder: {
    width: '64px',
    height: '64px',
    borderRadius: '0.75rem',
    backgroundColor: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoIcon: {
    fontSize: '2rem',
    color: '#ef4444',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.5rem',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  cardActions: {
    marginLeft: '0.5rem',
  },
  cardActionButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: '1.5rem',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  infoIcon: {
    fontSize: '1rem',
    color: '#94a3b8',
    marginTop: '0.125rem',
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500',
    marginBottom: '0.125rem',
  },
  infoValue: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: '1.4',
  },
  domainesSection: {
    paddingTop: '1rem',
    borderTop: '1px solid #f1f5f9',
  },
  domainesLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '0.75rem',
  },
  domainesIcon: {
    fontSize: '1rem',
    color: '#94a3b8',
  },
  domainesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  domaineTag: {
    backgroundColor: '#f0f9ff',
    color: '#943535ff',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  cardFooter: {
    padding: '1rem 1.5rem',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  cardFooterInfo: {
    flex: 1,
  },
  dateInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  dateIcon: {
    fontSize: '0.875rem',
    color: '#94a3b8',
  },
  dateText: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500',
  },
  cardFooterActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: '#08ad53ff',
    color: '#fff',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  viewButtonIcon: {
    fontSize: '0.75rem',
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  editButtonIcon: {
    fontSize: '0.75rem',
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  deleteButtonIcon: {
    fontSize: '0.75rem',
  },

  // Styles du modal
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