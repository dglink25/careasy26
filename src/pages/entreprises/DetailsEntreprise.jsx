// careasy-frontend/src/pages/entreprises/DetailsEntreprise.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { entrepriseApi } from '../../api/entrepriseApi';
import { serviceApi } from '../../api/serviceApi';
import { useAuth } from '../../contexts/AuthContext';
import theme from '../../config/theme';

// Import des icônes
import {
  FiLock,
  FiGift,
  FiAlertCircle,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiCalendar,
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiStar,
  FiUsers,
  FiBriefcase,
  FiTag,
  FiDollarSign,
  FiInfo,
  FiFileText,
  FiImage,
  FiShoppingBag,
  FiTool,
  FiSettings,
  FiChevronRight,
  FiActivity,
  FiBarChart2,
  FiTrendingUp,
  FiTarget
} from 'react-icons/fi';
import {
  MdBusiness,
  MdOutlineVerified,
  MdOutlinePending,
  MdOutlineWarning,
  MdOutlineLocationOn,
  MdOutlinePerson,
  MdOutlinePhone,
  MdOutlineEmail,
  MdOutlineWork,
  MdOutlineTimer,
  MdOutlineStorefront,
  MdOutlineInventory,
  MdOutlineAttachMoney,
  MdOutlineDescription,
  MdOutlineDocumentScanner,
  MdOutlineImage,
  MdOutlineStar,
  MdOutlineDashboard
} from 'react-icons/md';

export default function DetailsEntreprise() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entreprise, setEntreprise] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [error, setError] = useState('');
  
  // État pour le compte à rebours de l'essai - COMME DANS LE DASHBOARD
  const [trialTimeLeft, setTrialTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    isActive: false,
    isExpired: false
  });
  
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
    servicesWithPrice: 0,
    services24h: 0,
    monthlyRevenue: 0
  });

  // État pour le modal de limite
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState('');

  useEffect(() => {
    fetchEntreprise();
  }, [id]);

  // Effet pour charger les services quand l'entreprise est chargée
  useEffect(() => {
    if (entreprise) {
      fetchServices();
    }
  }, [entreprise]);

  // Effet pour mettre à jour les stats et le plan quand les données changent
  useEffect(() => {
    if (entreprise && services.length >= 0) {
      updateStatsAndPlan();
    }
  }, [entreprise, services]);

  // EFFET POUR LE COMPTE À REBOURS - COMME DANS LE DASHBOARD
  useEffect(() => {
    if (!entreprise || entreprise.status !== 'validated' || !entreprise.trial_ends_at) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const endDate = new Date(entreprise.trial_ends_at).getTime();
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
  }, [entreprise]);

  const fetchEntreprise = async () => {
    try {
      setLoading(true);
      const data = await entrepriseApi.getEntreprise(id);
      setEntreprise(data);
      setError('');
    } catch (err) {
      console.error('Erreur chargement entreprise:', err);
      setError('Entreprise non trouvée');
      setTimeout(() => navigate('/mes-entreprises'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    if (!entreprise) return;
    
    try {
      setServicesLoading(true);
      
      const response = await serviceApi.getServicesByEntreprise(entreprise.id);
      
      let servicesData = [];
      if (response) {
        if (Array.isArray(response)) {
          servicesData = response;
        } else if (response.data && Array.isArray(response.data)) {
          servicesData = response.data;
        } else if (response.services && Array.isArray(response.services)) {
          servicesData = response.services;
        }
      }
      
      setServices(servicesData);
      
    } catch (err) {
      console.error('Erreur chargement services:', err);
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  // Fonction pour mettre à jour les stats et le plan - CORRIGÉE
  const updateStatsAndPlan = () => {
    if (!entreprise) return;

    // Calculer les stats à partir des services
    const servicesWithPrice = services.filter(s => s.price).length;
    const services24h = services.filter(s => s.is_open_24h).length;
    
    const monthlyRevenue = services
      .filter(s => s.price)
      .reduce((acc, s) => acc + (s.price * 3), 0);

    setStats({
      totalServices: services.length,
      servicesWithPrice,
      services24h,
      monthlyRevenue
    });

    // Mettre à jour le plan
    setCurrentPlan({
      name: 'Essai Gratuit',
      maxServices: entreprise.max_services_allowed || 3,
      servicesCount: services.length,
      trialDaysLeft: entreprise.trial_ends_at ? calculateDaysLeft(entreprise.trial_ends_at) : 0,
      isTrialActive: entreprise.trial_ends_at ? isTrialActive(entreprise.trial_ends_at) : false,
      isTrialExpired: entreprise.trial_ends_at ? isTrialExpired(entreprise.trial_ends_at) : false
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

  // FONCTION POUR RAFRAÎCHIR LES DONNÉES
  const refreshData = async () => {
    await fetchServices();
  };

  // Vérification des limites - COMME DANS LE DASHBOARD
  const canCreateService = () => {
    return services.length < currentPlan.maxServices;
  };

  // Calcul du pourcentage d'utilisation
  const getUsagePercentage = () => {
    const currentCount = services.length;
    const maxAllowed = currentPlan.maxServices;
    
    if (maxAllowed === 0) return 0;
    return Math.min(100, (currentCount / maxAllowed) * 100);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        icon: <FiClock />,
        text: 'En attente de validation', 
        color: '#f59e0b',
        bgColor: '#FEF3C7'
      },
      validated: { 
        icon: <FiCheckCircle />,
        text: 'Validée', 
        color: '#10b981',
        bgColor: '#D1FAE5'
      },
      rejected: { 
        icon: <FiXCircle />,
        text: 'Rejetée', 
        color: '#ef4444',
        bgColor: '#FEE2E2'
      },
    };
    const badge = badges[status] || badges.pending;
    
    return (
      <div style={{...styles.statusBanner, backgroundColor: badge.bgColor, borderColor: badge.color}}>
        <span style={{...styles.statusEmoji, color: badge.color}}>{badge.icon}</span>
        <div>
          <div style={{...styles.statusText, color: badge.color}}>
            {badge.text}
          </div>
          {status === 'pending' && (
            <div style={styles.statusSubtext}>
              Votre entreprise est en cours de validation par l'administration
            </div>
          )}
          {status === 'validated' && (
            <div style={styles.statusSubtext}>
              Votre entreprise a été validée. Vous pouvez maintenant créer des services.
            </div>
          )}
          {status === 'rejected' && entreprise?.admin_note && (
            <div style={styles.statusSubtext}>
              Raison: {entreprise.admin_note}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleCreateService = (e) => {
    if (!canCreateService()) {
      e.preventDefault();
      setLimitModalType('service');
      setShowLimitModal(true);
    }
  };

  const handleManageServices = (e) => {
    if (services.length === 0) {
      e.preventDefault();
      setLimitModalType('no-service');
      setShowLimitModal(true);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatTimeUnit = (value) => {
    return value.toString().padStart(2, '0');
  };

  // Composant Timer - CORRIGÉ
  const TrialTimer = () => {
    if (!trialTimeLeft.isActive && !trialTimeLeft.isExpired) {
      return (
        <div style={styles.timerInactive}>
          <FiClock style={styles.timerIcon} />
          <span>Aucune période d'essai active pour cette entreprise</span>
        </div>
      );
    }

    if (trialTimeLeft.isExpired) {
      return (
        <div style={styles.timerExpired}>
          <FiAlertCircle style={styles.timerIcon} />
          <div style={styles.timerContent}>
            <span style={styles.timerLabel}>Période d'essai expirée</span>
            <Link to="/plans" style={styles.timerAction}>
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
          <Link to="/plans" style={styles.timerLink}>
            Voir les offres
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (error || !entreprise) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={styles.errorTitle}>{error || 'Entreprise introuvable'}</h2>
          <Link to="/mes-entreprises" style={styles.errorButton}>
            ← Retour à mes entreprises
          </Link>
        </div>
      </div>
    );
  }

  const usagePercentage = getUsagePercentage();
  const canCreate = canCreateService();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <Link to="/mes-entreprises" style={styles.backButton}>
            ← Retour à mes entreprises
          </Link>
          <div style={styles.headerTop}>
            <div>
              <h1 style={styles.title}>{entreprise.name}</h1>
              <p style={styles.subtitle}>
                <FiCalendar style={styles.subtitleIcon} />
                Créée le {new Date(entreprise.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {entreprise.status === 'validated' && (
              <div style={styles.headerActions}>
                <button onClick={refreshData} style={styles.refreshButton}>
                  <FiClock style={styles.refreshIcon} />
                  Actualiser
                </button>
                <Link to={`/entreprises/${entreprise.id}/edit`} style={styles.editButton}>
                  <FiEdit style={styles.editButtonIcon} />
                  Modifier
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Timer de période d'essai - UNIQUEMENT pour les entreprises validées */}
        {entreprise.status === 'validated' && (
          <div style={styles.timerSection}>
            <TrialTimer />
          </div>
        )}

        {/* Statut */}
        {getStatusBadge(entreprise.status)}

        {/* Grid principal */}
        <div style={styles.mainGrid}>
          {/* Colonne gauche */}
          <div style={styles.leftColumn}>
            {/* Carte Logo & Images */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <FiImage style={styles.cardTitleIcon} />
                Médias
              </h2>
              
              <div style={styles.mediaGrid}>
                {entreprise.logo ? (
                  <div style={styles.mediaItem}>
                    <p style={styles.mediaLabel}>Logo</p>
                    <img 
                      src={entreprise.logo}
                      alt="Logo"
                      style={styles.mediaImage}
                    />
                  </div>
                ) : (
                  <div style={styles.mediaPlaceholder}>
                    <MdOutlineImage style={styles.placeholderIcon} />
                    <p style={styles.placeholderText}>Aucun logo</p>
                  </div>
                )}

                {entreprise.image_boutique ? (
                  <div style={styles.mediaItem}>
                    <p style={styles.mediaLabel}>Image boutique</p>
                    <img 
                      src={entreprise.image_boutique}
                      alt="Boutique"
                      style={styles.mediaImage}
                    />
                  </div>
                ) : (
                  <div style={styles.mediaPlaceholder}>
                    <MdOutlineStorefront style={styles.placeholderIcon} />
                    <p style={styles.placeholderText}>Aucune image</p>
                  </div>
                )}
              </div>
            </div>

            {/* Carte Domaines */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <FiTag style={styles.cardTitleIcon} />
                Domaines d'activité
              </h2>
              {entreprise.domaines && entreprise.domaines.length > 0 ? (
                <div style={styles.domainesGrid}>
                  {entreprise.domaines.map((domaine) => (
                    <div key={domaine.id} style={styles.domaineTag}>
                      {domaine.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyText}>Aucun domaine défini</p>
              )}
            </div>

          </div>

          {/* Colonne droite */}
          <div style={styles.rightColumn}>
            {/* Carte Informations générales */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <MdOutlineDashboard style={styles.cardTitleIcon} />
                Informations générales
              </h2>
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    <MdBusiness style={styles.infoItemIcon} />
                    Nom
                  </span>
                  <span style={styles.infoValue}>{entreprise.name}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    <MdOutlineLocationOn style={styles.infoItemIcon} />
                    Siège
                  </span>
                  <span style={styles.infoValue}>{entreprise.siege || 'Non renseigné'}</span>
                </div>
                {entreprise.google_formatted_address && (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>
                      <FiMapPin style={styles.infoItemIcon} />
                      Adresse
                    </span>
                    <span style={styles.infoValue}>{entreprise.google_formatted_address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Carte Documents légaux */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <FiFileText style={styles.cardTitleIcon} />
                Documents légaux
              </h2>
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    <FiBriefcase style={styles.infoItemIcon} />
                    Numéro IFU
                  </span>
                  <span style={styles.infoValue}>{entreprise.ifu_number}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    <FiBriefcase style={styles.infoItemIcon} />
                    Numéro RCCM
                  </span>
                  <span style={styles.infoValue}>{entreprise.rccm_number}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    <MdOutlineDocumentScanner style={styles.infoItemIcon} />
                    Certificat
                  </span>
                  <span style={styles.infoValue}>{entreprise.certificate_number}</span>
                </div>
              </div>
            </div>

            {/* Carte Dirigeant */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <MdOutlinePerson style={styles.cardTitleIcon} />
                Dirigeant
              </h2>
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    <FiUsers style={styles.infoItemIcon} />
                    Nom complet
                  </span>
                  <span style={styles.infoValue}>{entreprise.pdg_full_name}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    <FiTool style={styles.infoItemIcon} />
                    Profession
                  </span>
                  <span style={styles.infoValue}>{entreprise.pdg_full_profession}</span>
                </div>
              </div>
            </div>

            {/* Carte Contact */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <FiPhone style={styles.cardTitleIcon} />
                Contact
              </h2>
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    <FiPhone style={styles.infoItemIcon} />
                    WhatsApp
                  </span>
                  <span style={styles.infoValue}>
                    {entreprise.whatsapp_phone ? (
                      <a 
                        href={`https://wa.me/${entreprise.whatsapp_phone.replace(/\s+/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#25D366', textDecoration: 'none', fontWeight: '600' }}
                      >
                        {entreprise.whatsapp_phone}
                      </a>
                    ) : 'Non renseigné'}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    <FiPhone style={styles.infoItemIcon} />
                    Téléphone
                  </span>
                  <span style={styles.infoValue}>
                    {entreprise.call_phone ? (
                      <a 
                        href={`tel:${entreprise.call_phone}`}
                        style={{ color: '#ef4444', textDecoration: 'none', fontWeight: '600' }}
                      >
                        {entreprise.call_phone}
                      </a>
                    ) : 'Non renseigné'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de limite atteinte - COMME DANS LE DASHBOARD */}
      {showLimitModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLimitModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <MdOutlineWarning style={{...styles.modalIcon, color: '#f59e0b'}} />
              <h2 style={styles.modalTitle}>
                {limitModalType === 'service' && 'Limite de services atteinte'}
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

              {limitModalType === 'no-service' && (
                <>
                  <p style={styles.modalText}>
                    Vous n'avez pas encore créé de service pour cette entreprise.
                  </p>
                  <div style={styles.modalInfoBox}>
                    <FiInfo style={styles.modalInfoIcon} />
                    <p style={styles.modalInfoText}>
                      Commencez par créer votre premier service pour le proposer aux clients.
                    </p>
                  </div>
                </>
              )}

              <div style={styles.modalSteps}>
                <h4 style={{marginBottom: '1rem', color: '#1e293b'}}>Solutions disponibles :</h4>
                
                {limitModalType === 'service' && (
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
                          Supprimez ou désactivez les services que vous n'utilisez plus
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {limitModalType === 'no-service' && (
                  <div style={styles.modalStep}>
                    <div style={{...styles.stepNumber, backgroundColor: '#f59e0b'}}>1</div>
                    <div style={styles.stepContent}>
                      <h4 style={styles.stepTitle}>Créer votre premier service</h4>
                      <p style={styles.stepText}>
                        Commencez par créer un service pour le proposer aux clients
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
              {limitModalType === 'service' && (
                <Link 
                  to="/plans"
                  style={styles.modalConfirmButton}
                  onClick={() => setShowLimitModal(false)}
                >
                  Voir les plans
                </Link>
              )}
              {limitModalType === 'no-service' && canCreate && (
                <Link 
                  to={`/services/creer?entreprise=${entreprise.id}`}
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

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
    border: `4px solid #dbeafe`,
    borderTop: `4px solid #ef4444`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  smallSpinner: {
    width: '30px',
    height: '30px',
    border: `3px solid #dbeafe`,
    borderTop: `3px solid #ef4444`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '1.125rem',
  },
  servicesLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '1rem',
    color: '#64748b',
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
    backgroundColor: '#ef4444',
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
    color: '#ef4444',
    textDecoration: 'none',
    fontWeight: '600',
    marginBottom: '1rem',
    display: 'inline-block',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    textDecoration: 'none',
    fontWeight: '600',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
  },
  refreshIcon: {
    fontSize: '1rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  subtitleIcon: {
    fontSize: '1rem',
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    textDecoration: 'none',
    fontWeight: '600',
    border: '1px solid #e2e8f0',
  },
  editButtonIcon: {
    fontSize: '1rem',
  },

  // Styles pour le timer - COMME DANS LE DASHBOARD
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

  statusBanner: {
    padding: '1.5rem',
    borderRadius: '1rem',
    marginBottom: '2rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    border: '2px solid',
  },
  statusEmoji: {
    fontSize: '1.5rem',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  statusText: {
    fontSize: '1.25rem',
    fontWeight: '700',
    marginBottom: '0.25rem',
  },
  statusSubtext: {
    fontSize: '0.95rem',
    color: '#64748b',
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
  card: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: `1px solid #e2e8f0`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  cardTitleIcon: {
    fontSize: '1.25rem',
    color: '#ef4444',
  },
  linkButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
  },
  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  mediaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  mediaLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#64748b',
  },
  mediaImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '0.75rem',
    border: `2px solid #e2e8f0`,
  },
  mediaPlaceholder: {
    width: '100%',
    height: '200px',
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
    border: `2px dashed #cbd5e1`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  placeholderIcon: {
    fontSize: '3rem',
    color: '#94a3b8',
  },
  placeholderText: {
    color: '#64748b',
    fontSize: '0.875rem',
  },
  domainesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  domaineTag: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    paddingBottom: '1rem',
    borderBottom: `1px solid #e2e8f0`,
  },
  infoItemIcon: {
    fontSize: '0.875rem',
    marginRight: '0.375rem',
    color: '#94a3b8',
  },
  infoLabel: {
    fontWeight: '500',
    color: '#475569',
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
  },
  infoValue: {
    color: '#1e293b',
    textAlign: 'right',
    flex: 1,
    fontWeight: '500',
  },
  servicesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  serviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
    textDecoration: 'none',
    border: `1px solid #e2e8f0`,
    transition: 'all 0.3s',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.25rem',
  },
  servicePrice: {
    fontSize: '0.875rem',
    color: '#ef4444',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  priceIcon: {
    fontSize: '0.75rem',
  },
  serviceArrow: {
    color: '#94a3b8',
    fontSize: '1.25rem',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    padding: '1rem 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '1rem 0',
  },
  emptyStateIcon: {
    fontSize: '3rem',
    color: '#94a3b8',
    marginBottom: '1rem',
  },
  emptyButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    textDecoration: 'none',
    fontWeight: '600',
    marginTop: '1rem',
  },
  emptyButtonIcon: {
    fontSize: '1rem',
  },

  // Styles du modal - COMME DANS LE DASHBOARD
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
    flexDirection: 'column',
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