import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';
import { entrepriseApi } from '../../api/entrepriseApi';
import ServiceVisibilityToggle from '../../components/Services/ServiceVisibilityToggle';
import theme from '../../config/theme';

// Import des icônes React Icons
import {
  FiPlus,
  FiSearch,
  FiTool,
  FiBriefcase,
  FiTag,
  FiDollarSign,
  FiClock,
  FiEye,
  FiEyeOff,
  FiChevronRight,
  FiAlertCircle,
  FiRefreshCw,
  FiGrid,
  FiMapPin,
  FiUser,
  FiEdit,
  FiTrash2,
  FiFilter,
  FiDownload,
  FiPrinter,
  FiX,
  FiCheck,
  FiAlertTriangle,
  FiLock,
  FiGift,
  FiActivity
} from 'react-icons/fi';
import {
  MdBusiness,
  MdOutlineWork,
  MdOutlineDescription,
  MdOutlineLocationOn,
  MdOutlineAccessTime,
  MdOutlineStar,
  MdOutlineVerified,
  MdOutlineLibraryAdd,
  MdOutlineDashboard,
  MdOutlineInventory,
  MdOutlineAttachMoney,
  MdOutlineSchedule,
  MdOutlineVisibility,
  MdOutlineMoreVert,
  MdOutlineLocalOffer,
  MdOutlineDiscount,
  MdOutlineWarning,
  MdTimer
} from 'react-icons/md';

// Fonction pour formater le prix
const formatPrice = (price) => {
  if (!price) return null;
  return `${price.toLocaleString('fr-FR')} FCFA`;
};

// Fonction pour vérifier si une promo est active
const isPromoActive = (service) => {
  if (!service.has_promo || !service.price_promo) return false;
  
  const now = new Date();
  
  // Si pas de dates définies, la promo est toujours active
  if (!service.promo_start_date && !service.promo_end_date) {
    return true;
  }
  
  // Vérifier les dates
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

// Fonction pour calculer le pourcentage de réduction
const calculateDiscount = (service) => {
  if (!service.has_promo || !service.price_promo || !service.price || service.price === 0) {
    return null;
  }
  const discount = ((service.price - service.price_promo) / service.price) * 100;
  return Math.round(discount);
};

export default function MesServices() {
  const [services, setServices] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // État pour les limites du plan - COMME DANS LE DASHBOARD
  const [currentPlan, setCurrentPlan] = useState({
    name: 'Essai Gratuit',
    maxServices: 3,
    servicesCount: 0,
    trialDaysLeft: 0,
    isTrialActive: false,
    isTrialExpired: false
  });

  // Statistiques - COMME DANS LE DASHBOARD
  const [stats, setStats] = useState({
    totalServices: 0,
    entreprises: 0,
    domaines: 0,
    withPrice: 0,
    onRequest: 0,
    withPromo: 0,
    activePromos: 0,
    active24h: 0
  });

  // État pour le modal de limite
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState('');
  
  // États pour la suppression
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    serviceId: null,
    serviceName: '',
    isDeleting: false
  });
  const [deleteSuccess, setDeleteSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Mettre à jour les stats quand les services changent
  useEffect(() => {
    if (services.length > 0 || entreprises.length > 0) {
      updateStatsAndPlan();
    }
  }, [services, entreprises]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Charger les entreprises pour obtenir les infos du plan
      const entreprisesData = await entrepriseApi.getMesEntreprises();
      setEntreprises(entreprisesData || []);
      
      // Charger les services
      const servicesData = await serviceApi.getMesServices();
      setServices(servicesData || []);
      
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fonction pour mettre à jour les stats et le plan - COMME DANS LE DASHBOARD
  const updateStatsAndPlan = () => {
    // Calculer les stats
    const withPrice = services.filter(s => s.price && !s.is_price_on_request).length;
    const onRequest = services.filter(s => s.is_price_on_request).length;
    const withPromo = services.filter(s => s.has_promo && s.price_promo).length;
    const activePromos = services.filter(s => isPromoActive(s)).length;
    const active24h = services.filter(s => s.is_open_24h).length;
    const domaines = new Set(services.map(s => s.domaine?.id)).size;

    setStats({
      totalServices: services.length,
      entreprises: Object.keys(groupServicesByEntreprise()).length,
      domaines,
      withPrice,
      onRequest,
      withPromo,
      activePromos,
      active24h
    });

    // Trouver la première entreprise validée avec période d'essai
    const validatedEntreprise = entreprises.find(e => 
      e.status === 'validated' && e.trial_ends_at
    );

    // Mettre à jour le plan
    setCurrentPlan({
      name: 'Essai Gratuit',
      maxServices: validatedEntreprise?.max_services_allowed || 3,
      servicesCount: services.length,
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
  const canCreateService = () => {
    return stats.totalServices < currentPlan.maxServices;
  };

  const handleCreateService = (e) => {
    if (!canCreateService()) {
      e.preventDefault();
      setLimitModalType('service');
      setShowLimitModal(true);
    }
  };

  // Fonction pour gérer le changement de visibilité
  const handleVisibilityToggle = (serviceId, newValue) => {
    setServices(prev =>
      prev.map(s => s.id === serviceId ? { ...s, is_visibility: newValue } : s)
    );
  };

  // Grouper par entreprise
  const groupServicesByEntreprise = () => {
    return services.reduce((acc, service) => {
      const entrepriseId = service.entreprise?.id || 'unknown';
      if (!acc[entrepriseId]) {
        acc[entrepriseId] = {
          entreprise: service.entreprise,
          services: []
        };
      }
      acc[entrepriseId].services.push(service);
      return acc;
    }, {});
  };

  // Filtrer services par recherche
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.entreprise?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.domaine?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const servicesByEntreprise = groupServicesByEntreprise();

  // Fonction pour ouvrir la modale de confirmation
  const openDeleteModal = (serviceId, serviceName) => {
    setDeleteModal({
      isOpen: true,
      serviceId,
      serviceName,
      isDeleting: false
    });
  };

  // Fonction pour fermer la modale
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      serviceId: null,
      serviceName: '',
      isDeleting: false
    });
  };

  // Fonction pour supprimer le service
  const handleDeleteService = async () => {
    if (!deleteModal.serviceId) return;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      await serviceApi.deleteService(deleteModal.serviceId);
      
      // Mettre à jour la liste des services
      const updatedServices = services.filter(service => service.id !== deleteModal.serviceId);
      setServices(updatedServices);

      // Afficher le message de succès
      setDeleteSuccess('Service supprimé avec succès !');
      
      // Fermer la modale
      closeDeleteModal();

      // Masquer le message après 3 secondes
      setTimeout(() => {
        setDeleteSuccess('');
      }, 3000);

    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression du service');
      closeDeleteModal();
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement de vos services...</p>
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
                <MdOutlineInventory style={styles.titleIcon} />
                Mes Services
              </h1>
              <p style={styles.subtitle}>
                Gérez tous les services proposés par vos entreprises
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
                to={canCreateService() ? "/services/creer" : "#"} 
                style={{
                  ...styles.createButton,
                  opacity: canCreateService() ? 1 : 0.7,
                  cursor: canCreateService() ? 'pointer' : 'not-allowed',
                  backgroundColor: canCreateService() ? '#ef4444' : '#94a3b8'
                }}
                onClick={handleCreateService}
              >
                {canCreateService() ? (
                  <FiPlus style={styles.createButtonIcon} />
                ) : (
                  <FiLock style={styles.createButtonIcon} />
                )}
                {canCreateService() ? 'Créer un service' : 'Limite atteinte'}
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
            {currentPlan.servicesCount >= currentPlan.maxServices && (
              <div style={styles.warningInfo}>
                <FiAlertCircle style={styles.warningIcon} />
                <span style={styles.warningText}>
                  Limite de services atteinte. Passez à un plan supérieur.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Message de succès de suppression */}
        {deleteSuccess && (
          <div style={styles.successMessage}>
            <FiCheck style={styles.successIcon} />
            <span>{deleteSuccess}</span>
          </div>
        )}

        {/* Statistiques améliorées */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIconContainer}>
              <MdOutlineInventory style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.totalServices}</div>
              <div style={styles.statLabel}>Services totaux</div>
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
              <MdBusiness style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.entreprises}</div>
              <div style={styles.statLabel}>Entreprises</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIconContainer}>
              <FiTag style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.domaines}</div>
              <div style={styles.statLabel}>Domaines</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIconContainer}>
              <FiDollarSign style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.withPrice}</div>
              <div style={styles.statLabel}>Avec tarif</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIconContainer}>
              <MdOutlineDiscount style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.activePromos}</div>
              <div style={styles.statLabel}>Promos actives</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIconContainer}>
              <FiClock style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.active24h}</div>
              <div style={styles.statLabel}>Disponible 24h/24</div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div style={styles.searchSection}>
          <div style={styles.searchContainer}>
            <FiSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher un service, entreprise ou domaine..."
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
              <FiFilter style={styles.filterIcon} />
              Filtrer
            </button>
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

        {/* Liste des services */}
        {filteredServices.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIconContainer}>
              <MdOutlineWork style={styles.emptyIcon} />
            </div>
            <h3 style={styles.emptyTitle}>
              {services.length === 0 
                ? "Aucun service créé"
                : "Aucun résultat trouvé"
              }
            </h3>
            <p style={styles.emptyText}>
              {services.length === 0 
                ? "Commencez par créer votre premier service pour vos entreprises validées."
                : `Aucun service ne correspond à "${searchTerm}"`
              }
            </p>
            {services.length === 0 && (
              <Link 
                to={canCreateService() ? "/services/creer" : "#"} 
                style={{
                  ...styles.emptyButton,
                  opacity: canCreateService() ? 1 : 0.7,
                  cursor: canCreateService() ? 'pointer' : 'not-allowed',
                  backgroundColor: canCreateService() ? '#ef4444' : '#94a3b8'
                }}
                onClick={handleCreateService}
              >
                {canCreateService() ? (
                  <FiPlus style={styles.emptyButtonIcon} />
                ) : (
                  <FiLock style={styles.emptyButtonIcon} />
                )}
                {canCreateService() ? 'Créer mon premier service' : 'Limite atteinte'}
              </Link>
            )}
          </div>
        ) : (
          <div style={styles.servicesContainer}>
            {Object.entries(servicesByEntreprise).map(([entrepriseId, data]) => (
              <div key={entrepriseId} style={styles.entrepriseSection}>
                {/* Header Entreprise */}
                <div style={styles.entrepriseHeader}>
                  <div style={styles.entrepriseInfo}>
                    {data.entreprise?.logo ? (
                      <img 
                        src={data.entreprise.logo}
                        alt={data.entreprise.name}
                        style={styles.entrepriseLogo}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div style={styles.entrepriseLogoPlaceholder}>
                        <MdBusiness style={styles.entrepriseLogoIcon} />
                      </div>
                    )}
                    <div style={styles.entrepriseDetails}>
                      <h2 style={styles.entrepriseName}>
                        {data.entreprise?.name || 'Entreprise'}
                      </h2>
                      <div style={styles.entrepriseMeta}>
                        {data.entreprise?.siege && (
                          <div style={styles.entrepriseMetaItem}>
                            <MdOutlineLocationOn style={styles.entrepriseMetaIcon} />
                            <span>{data.entreprise.siege}</span>
                          </div>
                        )}
                        <div style={styles.entrepriseMetaItem}>
                          <MdOutlineVerified style={styles.entrepriseMetaIcon} />
                          <span>{data.services.length} service{data.services.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link 
                    to={`/entreprises/${entrepriseId}`}
                    style={styles.viewEntrepriseLink}
                  >
                    <span>Voir l'entreprise</span>
                    <FiChevronRight style={styles.viewEntrepriseIcon} />
                  </Link>
                </div>

                {/* Grid des services */}
                <div style={styles.servicesGrid}>
                  {data.services.map((service) => {
                    const promoActive = isPromoActive(service);
                    const discount = calculateDiscount(service);
                    
                    return (
                      <div 
                        key={service.id} 
                        style={styles.serviceCard}
                        className="service-card"
                      >
                        {/* Badge visibilité si masqué */}
                        {!service.is_visibility && (
                          <div style={styles.visibilityBadge}>
                            <FiEyeOff size={12} />
                            <span>Masqué</span>
                          </div>
                        )}

                        {/* Badge promo si actif */}
                        {promoActive && (
                          <div style={styles.promoBadge}>
                            <MdOutlineLocalOffer />
                            <span>-{discount}%</span>
                          </div>
                        )}

                        {/* Images du service */}
                        <div style={styles.serviceImageContainer}>
                          {service.medias && service.medias.length > 0 ? (
                            <img 
                              src={service.medias[0]}
                              alt={service.name}
                              style={styles.serviceImage}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                const placeholder = e.target.parentElement.querySelector('.service-image-placeholder');
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          
                          <div 
                            className="service-image-placeholder"
                            style={{
                              ...styles.serviceImagePlaceholder,
                              display: (!service.medias || service.medias.length === 0) ? 'flex' : 'none'
                            }}
                          >
                            <MdOutlineWork style={styles.serviceImageIcon} />
                          </div>
                          
                          {service.medias && service.medias.length > 1 && (
                            <div style={styles.imageBadge}>
                              +{service.medias.length - 1}
                            </div>
                          )}
                        </div>

                        {/* Infos service */}
                        <div style={styles.serviceBody}>
                          <div style={styles.serviceHeader}>
                            <h3 style={styles.serviceName}>{service.name}</h3>
                            <div style={styles.serviceActionsMenu}>
                              <button 
                                style={styles.serviceActionButton}
                                onClick={() => openDeleteModal(service.id, service.name)}
                                title="Supprimer ce service"
                              >
                                <FiTrash2 style={styles.deleteIcon} />
                              </button>
                            </div>
                          </div>
                          
                          {service.domaine && (
                            <div style={styles.domaineTag}>
                              <FiTag style={styles.domaineTagIcon} />
                              <span>{service.domaine.name}</span>
                            </div>
                          )}

                          {service.descriptions && (
                            <p style={styles.serviceDescription}>
                              {service.descriptions.length > 100
                                ? service.descriptions.substring(0, 100) + '...'
                                : service.descriptions
                              }
                            </p>
                          )}

                          {/* Prix et horaires */}
                          <div style={styles.serviceDetails}>
                            {service.is_price_on_request ? (
                              <div style={styles.servicePriceOnRequest}>
                                <MdOutlineAttachMoney style={styles.servicePriceIcon} />
                                Sur devis
                              </div>
                            ) : promoActive ? (
                              <div style={styles.servicePricePromo}>
                                <div style={styles.pricePromoContainer}>
                                  <span style={styles.priceOld}>
                                    {formatPrice(service.price)}
                                  </span>
                                  <span style={styles.priceNew}>
                                    {formatPrice(service.price_promo)}
                                  </span>
                                </div>
                                {discount && (
                                  <span style={styles.discountBadge}>
                                    -{discount}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div style={styles.servicePrice}>
                                <FiDollarSign style={styles.servicePriceIcon} />
                                {service.price 
                                  ? formatPrice(service.price)
                                  : 'Prix non défini'
                                }
                              </div>
                            )}
                            
                            {service.is_open_24h ? (
                              <div style={styles.serviceHours}>
                                <FiClock style={styles.serviceHoursIcon} />
                                Disponible 24h/24
                              </div>
                            ) : service.start_time && service.end_time ? (
                              <div style={styles.serviceHours}>
                                <MdOutlineAccessTime style={styles.serviceHoursIcon} />
                                {service.start_time} - {service.end_time}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Footer avec actions et toggle de visibilité */}
                        <div style={styles.serviceFooter}>
                          <div style={{ ...styles.serviceFooterActions, justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <Link 
                                to={`/services/${service.id}`}
                                style={styles.viewButton}
                              >
                                <FiEye style={styles.viewButtonIcon} />
                                Détails
                              </Link>
                              <Link 
                                to={`/services/modifier/${service.id}`}
                                style={styles.editButton}
                              >
                                <FiEdit style={styles.editButtonIcon} />
                                Modifier
                              </Link>
                            </div>
                            <ServiceVisibilityToggle
                              serviceId={service.id}
                              isVisible={service.is_visibility}
                              onToggle={(val) => handleVisibilityToggle(service.id, val)}
                              compact={true}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
                Limite de services atteinte
              </h2>
              <button 
                onClick={() => setShowLimitModal(false)}
                style={styles.modalCloseButton}
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Vous avez atteint la limite maximale de services autorisée par votre plan actuel.
              </p>
              <div style={styles.modalInfoBox}>
                <FiAlertCircle style={styles.modalInfoIcon} />
                <p style={styles.modalInfoText}>
                  <strong>Plan actuel :</strong> {currentPlan.name} ({currentPlan.maxServices} services maximum)
                </p>
              </div>

              <div style={styles.modalSteps}>
                <h4 style={{marginBottom: '1rem', color: '#1e293b'}}>Solutions disponibles :</h4>
                
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
                      Supprimez ou désactivez les services que vous n'utilisez plus
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button 
                onClick={() => setShowLimitModal(false)}
                style={styles.modalCancelButton}
              >
                Fermer
              </button>
              <Link 
                to="/plans"
                style={styles.modalConfirmButton}
                onClick={() => setShowLimitModal(false)}
              >
                Voir les plans
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
      {deleteModal.isOpen && (
        <div style={styles.modalOverlay} onClick={closeDeleteModal}>
          <div 
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div style={styles.modalIconContainer}>
                <FiAlertTriangle style={styles.modalIcon} />
              </div>
              <button 
                onClick={closeDeleteModal}
                style={styles.modalCloseButton}
              >
                <FiX />
              </button>
            </div>

            <h3 style={styles.modalTitle}>Confirmer la suppression</h3>
            
            <p style={styles.modalText}>
              Êtes-vous sûr de vouloir supprimer le service <strong>"{deleteModal.serviceName}"</strong> ?
            </p>
            
            <p style={styles.modalWarning}>
              Cette action est irréversible. Toutes les données associées à ce service seront définitivement supprimées.
            </p>

            <div style={styles.modalActions}>
              <button
                onClick={closeDeleteModal}
                style={styles.modalCancelButton}
                disabled={deleteModal.isDeleting}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteService}
                style={styles.modalConfirmButton}
                disabled={deleteModal.isDeleting}
              >
                {deleteModal.isDeleting ? (
                  <>
                    <div style={styles.buttonSpinner}></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <FiTrash2 style={styles.modalConfirmIcon} />
                    Supprimer
                  </>
                )}
              </button>
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
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .service-card {
          animation: fadeIn 0.3s ease-out;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .service-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }
        
        .service-card:hover .promo-badge {
          animation: pulse 1s infinite;
        }
        
        .refreshing {
          animation: spin 1s linear infinite;
        }
        
        .modal-content {
          animation: scaleIn 0.3s ease-out;
        }
        
        .success-message {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Styles (avec ajouts pour les éléments de plan)
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
  
  // Message de succès
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    marginBottom: '1.5rem',
    animation: 'fadeIn 0.3s ease-out',
  },
  successIcon: {
    fontSize: '1.25rem',
  },

  // Header
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
    gridTemplateColumns: '1fr',
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

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
  },
  statIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    backgroundColor: '#fee2e2',
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
    color: '#64748b',
    fontWeight: '500',
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

  // Search
  searchSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
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
    transition: 'all 0.2s',
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

  // Error
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '1rem',
    borderRadius: '0.75rem',
    marginBottom: '2rem',
    animation: 'fadeIn 0.3s ease-out',
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
    transition: 'all 0.2s',
  },

  // Empty State
  emptyState: {
    backgroundColor: '#fff',
    padding: '4rem 2rem',
    borderRadius: '1.5rem',
    textAlign: 'center',
    border: '2px dashed #e2e8f0',
    animation: 'fadeIn 0.3s ease-out',
  },
  emptyIconContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    backgroundColor: '#fee2e2',
    borderRadius: '50%',
    marginBottom: '1.5rem',
    transition: 'all 0.3s',
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
    transition: 'all 0.2s',
  },
  emptyButtonIcon: {
    fontSize: '1.125rem',
  },

  // Services Container
  servicesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
  },
  entrepriseSection: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '1.5rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    animation: 'fadeIn 0.3s ease-out',
  },
  entrepriseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '2px solid #f1f5f9',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  entrepriseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  entrepriseLogo: {
    width: '64px',
    height: '64px',
    borderRadius: '0.75rem',
    objectFit: 'cover',
    border: '2px solid #e2e8f0',
  },
  entrepriseLogoPlaceholder: {
    width: '64px',
    height: '64px',
    borderRadius: '0.75rem',
    backgroundColor: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entrepriseLogoIcon: {
    fontSize: '2rem',
    color: '#ef4444',
  },
  entrepriseDetails: {
    flex: 1,
  },
  entrepriseName: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.5rem',
  },
  entrepriseMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  entrepriseMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  entrepriseMetaIcon: {
    fontSize: '1rem',
    color: '#94a3b8',
  },
  viewEntrepriseLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    color: '#ef4444',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
  },
  viewEntrepriseIcon: {
    fontSize: '1rem',
  },

  // Services Grid
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  
  // Service Card
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s',
    position: 'relative',
  },
  
  // Visibility Badge
  visibilityBadge: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '0.375rem 0.75rem',
    borderRadius: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    backdropFilter: 'blur(4px)',
  },
  
  // Promo Badge
  promoBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    zIndex: 10,
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)',
    animation: 'pulse 2s infinite',
  },

  serviceImageContainer: {
    position: 'relative',
    height: '180px',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  serviceImagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  serviceImageIcon: {
    fontSize: '3rem',
    color: '#94a3b8',
  },
  imageBadge: {
    position: 'absolute',
    bottom: '0.75rem',
    right: '0.75rem',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: '#fff',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  serviceBody: {
    padding: '1.5rem',
    flex: 1,
  },
  serviceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
  },
  serviceName: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    flex: 1,
  },
  serviceActionsMenu: {
    marginLeft: '0.5rem',
    display: 'flex',
    gap: '0.25rem',
  },
  serviceActionButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    ':hover': {
      color: '#ef4444',
    },
  },
  deleteIcon: {
    fontSize: '1.2rem',
  },
  domaineTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    marginBottom: '1rem',
  },
  domaineTagIcon: {
    fontSize: '0.875rem',
  },
  serviceDescription: {
    color: '#64748b',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    marginBottom: '1rem',
  },
  
  // Service Details
  serviceDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: 'auto',
  },
  
  servicePrice: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    color: '#059669',
    fontWeight: '700',
    fontSize: '1rem',
  },
  
  servicePriceOnRequest: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    color: '#f97316',
    fontWeight: '700',
    fontSize: '1rem',
    backgroundColor: '#fff7ed',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid #fed7aa',
  },
  
  servicePricePromo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff1f2',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid #fecdd3',
  },
  
  pricePromoContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  
  priceOld: {
    fontSize: '0.875rem',
    color: '#6b7280',
    textDecoration: 'line-through',
  },
  
  priceNew: {
    fontSize: '1.125rem',
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
  
  servicePriceIcon: {
    fontSize: '0.875rem',
  },
  
  serviceHours: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    color: '#6366f1',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  serviceHoursIcon: {
    fontSize: '0.875rem',
  },
  
  // Service Footer
  serviceFooter: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #f1f5f9',
  },
  serviceFooterActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    flex: 1,
    justifyContent: 'center',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#dc2626',
      transform: 'translateY(-2px)',
    },
  },
  viewButtonIcon: {
    fontSize: '0.875rem',
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    flex: 1,
    justifyContent: 'center',
    textDecoration: 'none',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e2e8f0',
    },
  },
  editButtonIcon: {
    fontSize: '0.875rem',
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
  
  // MODALE DE SUPPRESSION
  modalIconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalWarning: {
    fontSize: '0.875rem',
    color: '#ef4444',
    backgroundColor: '#fee2e2',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    marginBottom: '2rem',
    border: '1px solid #fecaca',
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
  },
  modalConfirmIcon: {
    fontSize: '1rem',
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  // Responsive
  '@media (max-width: 1024px)': {
    statsGrid: {
      gridTemplateColumns: 'repeat(3, 1fr)',
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
    servicesGrid: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    },
    entrepriseHeader: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    viewEntrepriseLink: {
      alignSelf: 'flex-start',
    },
  },
  '@media (max-width: 480px)': {
    statsGrid: {
      gridTemplateColumns: '1fr',
    },
    servicesGrid: {
      gridTemplateColumns: '1fr',
    },
    serviceFooterActions: {
      flexDirection: 'column',
    },
    modalActions: {
      flexDirection: 'column',
    },
  },
};