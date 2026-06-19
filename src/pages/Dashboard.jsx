import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { entrepriseApi } from '../api/entrepriseApi';
import { serviceApi } from '../api/serviceApi';
import paiementApi from '../api/paiementApi';
import api from '../api/axios';
import {
  FiSettings, FiShoppingBag, FiHeart, FiCalendar, FiBell,
  FiActivity, FiBarChart2, FiTarget, FiPlus,
  FiBriefcase, FiInfo, FiChevronRight, FiUsers, FiDollarSign, FiTool,
  FiClock, FiGift, FiAlertCircle, FiLock,
  FiArrowRight, FiX, FiAward, FiCheck,
} from 'react-icons/fi';
import {
  MdDashboard, MdOutlineBusiness, MdOutlineWork,
  MdOutlineInsights, MdOutlineStorefront,
  MdOutlineInventory, MdOutlineDirectionsCar,
  MdWarning, MdOutlineVerified,
} from 'react-icons/md';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt    = (v) => v.toString().padStart(2, '0');
const fmtXOF = (n) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF', minimumFractionDigits: 0,
  }).format(n);

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toasts } = useNotifications();

  // ── état UI ──────────────────────────────────────────────────────────────
  const [unreadCount,            setUnreadCount]            = useState(0);
  const [dismissedBanner,        setDismissedBanner]        = useState(false);
  const [dataLoading,            setDataLoading]            = useState(true);
  const [isProvider,             setIsProvider]             = useState(false);

  // Modal "Devenir prestataire" (dashboard client)
  const [showBecomeProviderModal, setShowBecomeProviderModal] = useState(false);

  // Modal limite plan
  const [showLimitModal,  setShowLimitModal]  = useState(false);
  const [limitModalType,  setLimitModalType]  = useState('');

  // ── Modal paiement ────────────────────────────────────────────────────────
  const [showPayModal,        setShowPayModal]        = useState(false);
  const [payPlanId,           setPayPlanId]           = useState(null);   // plan sélectionné
  const [paySelectedEntreprise, setPaySelectedEntreprise] = useState(''); // entreprise_id choisie
  const [payLoading,          setPayLoading]          = useState(false);
  const [payError,            setPayError]            = useState('');

  // ── données métier ────────────────────────────────────────────────────────
  const [entreprises,         setEntreprises]         = useState([]);
  const [validatedEntreprises,setValidatedEntreprises]= useState([]);
  const [pendingEntreprises,  setPendingEntreprises]  = useState([]);
  const [rejectedEntreprises, setRejectedEntreprises] = useState([]);
  const [services,            setServices]            = useState([]);

  // ── plan actif (source unique de vérité = /abonnements/actif) ────────────
  const [currentPlan, setCurrentPlan] = useState({
    name:            'Aucun plan',
    isPaid:          false,
    maxServices:     0,
    maxEmployees:    0,
    maxEntreprises:  1,
    hasApiAccess:    false,
    servicesCount:   0,
    employeesCount:  0,
    entreprisesCount:0,
  });

  // ── compte à rebours essai ────────────────────────────────────────────────
  const [trialTimeLeft, setTrialTimeLeft] = useState({
    days:0, hours:0, minutes:0, seconds:0, total:0, isActive:false, isExpired:false,
  });

  // ── stats dashboard ───────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalEntreprises:0, validatedEntreprises:0, pendingEntreprises:0,
    totalServices:0, servicesWithPrice:0, services24h:0, monthlyRevenue:0,
  });

  const timerRef = useRef(null);

  // ── Notifications non lues ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data?.unread_count || 0);
      } catch { /* silencieux */ }
    };
    fetchUnread();
    const iv = setInterval(fetchUnread, 30_000);
    return () => clearInterval(iv);
  }, [user]);

  useEffect(() => {
    if (!user || toasts.length === 0) return;
    api.get('/notifications/unread-count')
      .then(res => setUnreadCount(res.data?.unread_count || 0))
      .catch(() => {});
  }, [toasts.length, user]);

  // ── Chargement principal ──────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login', { state: { from: '/dashboard' }, replace: true }); return; }
    if (user.role === 'admin') { navigate('/admin/dashboard', { replace: true }); return; }
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadDashboard = async () => {
    try {
      setDataLoading(true);
      const all = await entrepriseApi.getMesEntreprises();

      const validated = (all || []).filter(e => e.status === 'validated');
      const pending   = (all || []).filter(e => e.status === 'pending');
      const rejected  = (all || []).filter(e => e.status === 'rejected');

      setEntreprises(all || []);
      setValidatedEntreprises(validated);
      setPendingEntreprises(pending);
      setRejectedEntreprises(rejected);

      if (validated.length > 0) {
        setIsProvider(true);
        await loadProviderData(all);
      } else {
        setIsProvider(false);
        setDataLoading(false);
      }
    } catch {
      setIsProvider(false);
      setDataLoading(false);
    }
  };

  // ── Chargement données prestataire ────────────────────────────────────────
  const loadProviderData = async (entreprisesData) => {
    try {
      // 1. Services
      const svc = await serviceApi.getMesServices();
      setServices(svc || []);

      // 2. Stats générales
      const validatedCnt = (entreprisesData || []).filter(e => e.status === 'validated').length;
      const pendingCnt   = (entreprisesData || []).filter(e => e.status === 'pending').length;
      const revenue      = (svc || []).filter(s => s.price).reduce((a, s) => a + s.price * 3, 0);

      setStats({
        totalEntreprises:    (entreprisesData || []).length,
        validatedEntreprises: validatedCnt,
        pendingEntreprises:   pendingCnt,
        totalServices:        (svc || []).length,
        servicesWithPrice:    (svc || []).filter(s => s.price).length,
        services24h:          (svc || []).filter(s => s.is_open_24h).length,
        monthlyRevenue:       revenue,
      });

      // 3. ── CORRECTION CLEF : récupérer le vrai abonnement actif ──────────
      //    Priorité : payant > essai  (logique miroir du AbonnementController)
      try {
        const abRes = await paiementApi.getAbonnementActif();

        if (abRes.success && abRes.data) {
          const ab      = abRes.data;
          const isEssai = ab.est_essai || ab.type === 'trial';
          const ve      = (entreprisesData || []).find(e => e.status === 'validated');

          // Limites : depuis le plan payant, ou depuis le champ entreprise pour l'essai
          const maxSvc = isEssai
            ? (ve?.max_services_allowed  || 3)
            : (ab.plan?.max_services  || 999);
          const maxEmp = isEssai
            ? (ve?.max_employees_allowed || 1)
            : (ab.plan?.max_employees || 999);

          setCurrentPlan({
            name:            ab.plan?.name ?? (isEssai ? 'Essai Gratuit' : 'Plan actif'),
            isPaid:          !isEssai,
            maxServices:     maxSvc,
            maxEmployees:    maxEmp,
            maxEntreprises:  1,
            hasApiAccess:    ab.plan?.has_api_access || ve?.has_api_access || false,
            servicesCount:   (svc || []).length,
            employeesCount:  0,
            entreprisesCount:(entreprisesData || []).length,
          });

          // Compte à rebours uniquement pour les essais
          if (isEssai && ab.date_fin) {
            startTrialCountdown(ab.date_fin);
          } else {
            // Abonnement payant actif → pas de compte à rebours
            if (timerRef.current) clearInterval(timerRef.current);
            setTrialTimeLeft({ days:0, hours:0, minutes:0, seconds:0, total:0, isActive:false, isExpired:false });
          }

        } else {
          // Aucun abonnement actif → fallback sur données entreprise
          const ve = (entreprisesData || []).find(e => e.status === 'validated' && e.trial_ends_at);
          if (ve) {
            const expired = new Date(ve.trial_ends_at) <= new Date();
            setCurrentPlan({
              name:            expired ? 'Essai expiré' : 'Essai Gratuit',
              isPaid:          false,
              maxServices:     ve.max_services_allowed  || 3,
              maxEmployees:    ve.max_employees_allowed || 1,
              maxEntreprises:  1,
              hasApiAccess:    false,
              servicesCount:   (svc || []).length,
              employeesCount:  0,
              entreprisesCount:(entreprisesData || []).length,
            });
            if (!expired) startTrialCountdown(ve.trial_ends_at);
          }
        }
      } catch (abErr) {
        console.error('Erreur chargement abonnement actif:', abErr);
        // Fallback : lire trial depuis l'entreprise validée
        const ve = (entreprisesData || []).find(e => e.status === 'validated' && e.trial_ends_at);
        if (ve) {
          setCurrentPlan({
            name:            'Essai Gratuit',
            isPaid:          false,
            maxServices:     ve.max_services_allowed  || 3,
            maxEmployees:    ve.max_employees_allowed || 1,
            maxEntreprises:  1,
            hasApiAccess:    ve.has_api_access || false,
            servicesCount:   (svc || []).length,
            employeesCount:  0,
            entreprisesCount:(entreprisesData || []).length,
          });
          startTrialCountdown(ve.trial_ends_at);
        }
      }
    } catch (err) {
      console.error('loadProviderData:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // ── Compte à rebours essai ────────────────────────────────────────────────
  const startTrialCountdown = useCallback((dateFinStr) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const compute = () => {
      const end   = new Date(dateFinStr);
      const total = end - new Date();
      if (total <= 0) {
        setTrialTimeLeft({ days:0, hours:0, minutes:0, seconds:0, total:0, isActive:false, isExpired:true });
        clearInterval(timerRef.current);
        return;
      }
      setTrialTimeLeft({
        days:    Math.floor(total / 86_400_000),
        hours:   Math.floor((total % 86_400_000) / 3_600_000),
        minutes: Math.floor((total % 3_600_000)  / 60_000),
        seconds: Math.floor((total % 60_000)      / 1_000),
        total,
        isActive:  true,
        isExpired: false,
      });
    };

    compute();
    timerRef.current = setInterval(compute, 1_000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Vérifications limites ─────────────────────────────────────────────────
  const canCreateEntreprise = () => stats.totalEntreprises < currentPlan.maxEntreprises;
  const canCreateService    = () => stats.totalServices    < currentPlan.maxServices;

  const handleCreateEntreprise  = (e) => { if (!canCreateEntreprise()) { e.preventDefault(); setLimitModalType('entreprise');    setShowLimitModal(true); } };
  const handleCreateService     = (e) => { if (!canCreateService())    { e.preventDefault(); setLimitModalType('service');        setShowLimitModal(true); } };
  const handleManageEntreprises = (e) => { if (!stats.totalEntreprises){ e.preventDefault(); setLimitModalType('no-entreprise'); setShowLimitModal(true); } };
  const handleManageServices    = (e) => { if (!stats.totalServices)   { e.preventDefault(); setLimitModalType('no-service');    setShowLimitModal(true); } };

  // ── Ouverture modal paiement ──────────────────────────────────────────────
  const openPayModal = (planId) => {
    setPayPlanId(planId);
    setPayError('');
    // Pré-sélectionner la première entreprise validée si une seule
    setPaySelectedEntreprise(
      validatedEntreprises.length === 1 ? String(validatedEntreprises[0].id) : ''
    );
    setShowPayModal(true);
  };

  // ── Lancer le paiement ────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!paySelectedEntreprise) {
      setPayError('Veuillez sélectionner une entreprise.');
      return;
    }
    try {
      setPayLoading(true);
      setPayError('');
      const res = await paiementApi.initierPaiement(payPlanId, Number(paySelectedEntreprise));
      if (res.success && res.data?.payment_url) {
        // Redirection vers la page de paiement externe
        window.location.href = res.data.payment_url;
      } else if (res.success) {
        // Paiement immédiat (ex : essai, coupon) → recharger le dashboard
        setShowPayModal(false);
        await loadDashboard();
      } else {
        setPayError(res.message || 'Erreur lors de l\'initiation du paiement.');
      }
    } catch (err) {
      setPayError(err?.message || 'Erreur de connexion.');
    } finally {
      setPayLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────────

  if (authLoading || dataLoading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={s.loadingText}>
          {authLoading ? 'Vérification de la session...' : 'Chargement de votre espace...'}
        </p>
      </div>
    );
  }

  if (!user) return null;

  // ── Sous-composants inline ─────────────────────────────────────────────────

  const BellBtn = () => (
    <button
      onClick={() => navigate('/notifications')}
      style={{ ...s.headerBtn, position: 'relative' }}
      title="Voir les notifications"
    >
      <FiBell style={s.headerBtnIcon} />
      {unreadCount > 0 && (
        <span style={s.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </button>
  );

  // Bannière statut (en attente / rejeté)
  const StatusBanner = () => {
    if (dismissedBanner) return null;

    if (pendingEntreprises.length > 0) {
      const e = pendingEntreprises[0];
      return (
        <div style={s.bannerPending}>
          <div style={s.bannerLeft}>
            <div style={s.bannerDot} />
            <div>
              <p style={s.bannerTitle}>
                Votre entreprise <strong>« {e.name} »</strong> est en cours de validation
              </p>
              <p style={s.bannerSub}>
                Soumise le {new Date(e.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                &nbsp;·&nbsp;Délai estimé : 24 à 48 h ouvrables
              </p>
            </div>
          </div>
          <div style={s.bannerRight}>
            <span style={s.bannerChip}>⏳ En attente</span>
            <button onClick={() => setDismissedBanner(true)} style={s.bannerClose}><FiX size={16} /></button>
          </div>
        </div>
      );
    }

    if (rejectedEntreprises.length > 0 && pendingEntreprises.length === 0) {
      const e = rejectedEntreprises[0];
      return (
        <div style={s.bannerRejected}>
          <div style={s.bannerLeft}>
            <FiAlertCircle size={20} color="#dc2626" style={{ flexShrink:0, marginTop:2 }} />
            <div>
              <p style={{ ...s.bannerTitle, color:'#7f1d1d' }}>
                Votre entreprise <strong>« {e.name} »</strong> a été refusée
              </p>
              {e.admin_note && <p style={{ ...s.bannerSub, color:'#991b1b' }}>Motif : {e.admin_note}</p>}
              <Link to="/entreprises/creer" style={s.bannerLink}>
                Soumettre une nouvelle demande <FiArrowRight size={12} />
              </Link>
            </div>
          </div>
          <button onClick={() => setDismissedBanner(true)} style={s.bannerClose}><FiX size={16} /></button>
        </div>
      );
    }
    return null;
  };

  // Bannière abonnement (essai / expiré) — cachée si payant
  const SubscriptionBanner = () => {
    if (currentPlan.isPaid) return null;
    const isExpiringSoon = trialTimeLeft.isActive && trialTimeLeft.days <= 5;
    const isExpired      = trialTimeLeft.isExpired || (!trialTimeLeft.isActive && currentPlan.name.toLowerCase().includes('essai'));
    if (!trialTimeLeft.isActive && !isExpired) return null;

    return (
      <div style={{
        ...s.subBanner,
        backgroundColor: isExpired ? '#fee2e2' : isExpiringSoon ? '#fef3c7' : '#eff6ff',
        borderColor:     isExpired ? '#fca5a5' : isExpiringSoon ? '#fde68a' : '#bfdbfe',
      }}>
        <div style={s.subBannerLeft}>
          {isExpired
            ? <FiAlertCircle size={18} color="#dc2626" />
            : <FiGift size={18} color={isExpiringSoon ? '#d97706' : '#2563eb'} />}
          <span style={{ fontSize:'.9rem', color: isExpired ? '#b91c1c' : '#1e293b' }}>
            {isExpired
              ? "Votre période d'essai a expiré. Souscrivez un plan pour continuer."
              : isExpiringSoon
                ? `Essai : encore ${trialTimeLeft.days}j ${trialTimeLeft.hours}h — passez au payant !`
                : `Vous êtes en période d'essai — ${trialTimeLeft.days} jours restants.`}
          </span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate('/abonnements?tab=plans')} style={s.subBannerBtn}>
            Voir les plans <FiArrowRight size={13} />
          </button>
          <button onClick={() => setDismissedBanner(true)} style={s.subBannerClose}><FiX size={14} /></button>
        </div>
      </div>
    );
  };

  // Bloc compte à rebours essai (dans le dashboard prestataire)
  const TrialTimer = () => {
    // Abonnement payant → ne pas afficher le timer
    if (currentPlan.isPaid) return null;

    if (!trialTimeLeft.isActive && !trialTimeLeft.isExpired) return (
      <div style={s.timerInactive}>
        <FiClock style={s.timerIcon} />
        <span>Aucune période d'essai active</span>
      </div>
    );
    if (trialTimeLeft.isExpired) return (
      <div style={s.timerExpired}>
        <FiAlertCircle style={s.timerIcon} />
        <div style={s.timerContent}>
          <span>Période d'essai expirée</span>
          <Link to="/abonnements" style={s.timerAction}>Souscrire un abonnement</Link>
        </div>
      </div>
    );
    return (
      <div style={s.timerCard}>
        <div style={s.timerHeader}>
          <FiGift style={s.timerGiftIcon} />
          <div>
            <h4 style={s.timerTitle}>Période d'essai gratuite</h4>
            <p style={s.timerSubtitle}>30 jours offerts pour découvrir la plateforme</p>
          </div>
        </div>
        <div style={s.timerDisplay}>
          {[
            { v: trialTimeLeft.days,    l: 'Jours' },
            { v: trialTimeLeft.hours,   l: 'Heures' },
            { v: trialTimeLeft.minutes, l: 'Minutes' },
            { v: trialTimeLeft.seconds, l: 'Secondes' },
          ].map((u, i) => (
            <div key={u.l} style={{ display:'flex', alignItems:'center' }}>
              {i > 0 && <span style={s.timerSep}>:</span>}
              <div style={s.timerUnit}>
                <span style={s.timerNum}>{fmt(u.v)}</span>
                <span style={s.timerUnitL}>{u.l}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={s.timerBar}>
          <div style={{ ...s.timerFill, width:`${Math.min(100, ((30*86400000 - trialTimeLeft.total) / (30*86400000)) * 100)}%` }} />
        </div>
        <div style={s.timerFooter}>
          <div style={s.timerStats}>
            <div style={s.timerStat}><span style={s.timerStatL}>Services</span><span style={s.timerStatV}>{currentPlan.servicesCount}/{currentPlan.maxServices}</span></div>
            <div style={s.timerStat}><span style={s.timerStatL}>Entreprises</span><span style={s.timerStatV}>{currentPlan.entreprisesCount}/{currentPlan.maxEntreprises}</span></div>
          </div>
          <button onClick={() => navigate('/abonnements?tab=plans')} style={s.timerLink}>
            Voir les offres
          </button>
        </div>
      </div>
    );
  };

  // ─── Modal sélection entreprise + paiement ─────────────────────────────────
  const PayModal = () => {
    if (!showPayModal) return null;
    return (
      <div style={s.overlay} onClick={() => !payLoading && setShowPayModal(false)}>
        <div style={s.modal} onClick={e => e.stopPropagation()}>
          {/* En-tête */}
          <div style={s.modalHeader}>
            <FiAward style={{ ...s.modalIcon, color:'#2563eb' }} />
            <h2 style={s.modalTitle}>Souscrire à un abonnement</h2>
            <button
              onClick={() => !payLoading && setShowPayModal(false)}
              style={s.modalClose}
              disabled={payLoading}
            >×</button>
          </div>

          {/* Corps */}
          <div style={s.modalBody}>
            <p style={s.modalText}>
              Sélectionnez l'entreprise pour laquelle vous souhaitez activer cet abonnement.
            </p>

            {validatedEntreprises.length === 0 ? (
              <div style={s.infoBox}>
                <FiInfo style={s.infoIcon} />
                <p style={s.infoText}>
                  Vous n'avez aucune entreprise validée. Créez et faites valider votre entreprise d'abord.
                </p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1rem' }}>
                {validatedEntreprises.map(e => (
                  <label
                    key={e.id}
                    style={{
                      ...s.entrepriseOption,
                      borderColor: paySelectedEntreprise === String(e.id) ? '#2563eb' : '#e2e8f0',
                      backgroundColor: paySelectedEntreprise === String(e.id) ? '#eff6ff' : '#fff',
                      cursor: payLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="pay_entreprise"
                      value={String(e.id)}
                      checked={paySelectedEntreprise === String(e.id)}
                      onChange={() => { setPaySelectedEntreprise(String(e.id)); setPayError(''); }}
                      disabled={payLoading}
                      style={{ display:'none' }}
                    />
                    <div style={s.entrepriseOptionLeft}>
                      {e.logo
                        ? <img src={e.logo} alt={e.name} style={s.entrepriseOptionLogo} />
                        : <div style={s.entrepriseOptionLogoPlaceholder}><MdOutlineBusiness size={20} /></div>
                      }
                      <div>
                        <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.9rem' }}>{e.name}</div>
                        {e.domaine && <div style={{ fontSize:'0.75rem', color:'#64748b' }}>{e.domaine}</div>}
                      </div>
                    </div>
                    {paySelectedEntreprise === String(e.id) && (
                      <FiCheck size={18} color="#2563eb" style={{ flexShrink:0 }} />
                    )}
                  </label>
                ))}
              </div>
            )}

            {payError && (
              <div style={s.payErrorBox}>
                <FiAlertCircle size={16} />
                <span>{payError}</span>
              </div>
            )}
          </div>

          {/* Pied */}
          <div style={s.modalFooter}>
            <button
              onClick={() => !payLoading && setShowPayModal(false)}
              style={s.btnCancel}
              disabled={payLoading}
            >Annuler</button>
            <button
              onClick={handlePay}
              style={{
                ...s.btnConfirm,
                opacity: payLoading || !paySelectedEntreprise || validatedEntreprises.length === 0 ? 0.6 : 1,
                cursor:  payLoading || !paySelectedEntreprise || validatedEntreprises.length === 0 ? 'not-allowed' : 'pointer',
              }}
              disabled={payLoading || !paySelectedEntreprise || validatedEntreprises.length === 0}
            >
              {payLoading
                ? <><span style={s.btnSpinner} /> Traitement...</>
                : <><FiDollarSign size={16} /> Payer</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Modal limite plan ─────────────────────────────────────────────────────
  const LimitModal = () => {
    if (!showLimitModal) return null;
    return (
      <div style={s.overlay} onClick={() => setShowLimitModal(false)}>
        <div style={s.modal} onClick={e => e.stopPropagation()}>
          <div style={s.modalHeader}>
            <MdWarning style={{ ...s.modalIcon, color:'#f59e0b' }} />
            <h2 style={s.modalTitle}>
              {limitModalType === 'entreprise'    && "Limite d'entreprises atteinte"}
              {limitModalType === 'service'       && 'Limite de services atteinte'}
              {limitModalType === 'no-entreprise' && 'Aucune entreprise'}
              {limitModalType === 'no-service'    && 'Aucun service'}
            </h2>
            <button onClick={() => setShowLimitModal(false)} style={s.modalClose}>×</button>
          </div>
          <div style={s.modalBody}>
            <p style={s.modalText}>
              {limitModalType === 'entreprise'    && `Vous avez atteint la limite de ${currentPlan.maxEntreprises} entreprise(s) de votre plan.`}
              {limitModalType === 'service'       && `Vous avez atteint la limite de ${currentPlan.maxServices} service(s) de votre plan.`}
              {limitModalType === 'no-entreprise' && "Vous n'avez pas encore d'entreprise validée."}
              {limitModalType === 'no-service'    && "Vous n'avez pas encore créé de service."}
            </p>
          </div>
          <div style={s.modalFooter}>
            <button onClick={() => setShowLimitModal(false)} style={s.btnCancel}>Fermer</button>
            {(limitModalType === 'entreprise' || limitModalType === 'service') && (
              <Link to="/abonnements?tab=plans" style={s.btnConfirm} onClick={() => setShowLimitModal(false)}>
                Voir les plans
              </Link>
            )}
            {limitModalType === 'no-entreprise' && (
              <Link to="/entreprises/creer" style={s.btnConfirm} onClick={() => setShowLimitModal(false)}>
                Créer une entreprise
              </Link>
            )}
            {limitModalType === 'no-service' && (
              <Link to="/services/creer" style={s.btnConfirm} onClick={() => setShowLimitModal(false)}>
                Créer un service
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD CLIENT (non prestataire)
  // ─────────────────────────────────────────────────────────────────────────
  if (!isProvider) {
    return (
      <div style={s.container}>
        <div style={s.content}>
          <StatusBanner />

          <div style={s.header}>
            <div style={s.headerMain}>
              <div>
                <h1 style={s.title}><FiShoppingBag style={s.titleIcon} />Espace Client</h1>
                <p style={s.subtitle}>Bienvenue, {user?.name?.split(' ')[0]} !</p>
              </div>
              <div style={s.headerActions}>
                <BellBtn />
                <Link to="/settings" style={{ textDecoration:'none' }}>
                  <button style={s.headerBtn}><FiSettings style={s.headerBtnIcon} /></button>
                </Link>
              </div>
            </div>
          </div>

          <div style={s.welcomeCard}>
            <div style={s.welcomeContent}>
              <h2 style={s.welcomeTitle}>Bienvenue sur CarEasy !</h2>
              <p style={s.welcomeText}>
                En tant que client, explorez les services disponibles, prenez des rendez-vous et gérez vos demandes.
              </p>
              {pendingEntreprises.length > 0 ? (
                <div style={s.pendingNote}>
                  <FiClock size={16} style={{ flexShrink:0 }} />
                  <span>Votre demande est en cours de validation (24 à 48 h).</span>
                </div>
              ) : (
                <button onClick={() => setShowBecomeProviderModal(true)} style={s.becomeBtn}>
                  <MdOutlineStorefront style={s.buttonIcon} />
                  Devenir prestataire sur cette plateforme
                </button>
              )}
            </div>
            <div style={s.welcomeIllustration}>
              <MdOutlineDirectionsCar style={s.welcomeIcon} />
            </div>
          </div>

          <div style={s.statsGrid}>
            {[
              { icon:FiCalendar, num:0, label:'Rendez-vous à venir' },
              { icon:FiHeart,    num:0, label:'Favoris' },
            ].map(({ icon:Icon, num, label }) => (
              <div key={label} style={s.statCard}>
                <div style={s.statIconWrap}><Icon style={s.statIcon} /></div>
                <div style={s.statContent}>
                  <div style={s.statNum}>{num}</div>
                  <div style={s.statLabel}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={s.clientGrid}>
            <div style={s.sectionCard}>
              <div style={s.sectionHeader}>
                <h3 style={s.sectionTitle}><FiCalendar style={s.sectionIcon} />Prochains rendez-vous</h3>
                <Link to="/mes-rendez-vous" style={s.viewAll}>Voir tous</Link>
              </div>
              <div style={s.emptyState}>
                <FiCalendar style={s.emptyIcon} />
                <p style={s.emptyText}>Aucun rendez-vous prévu</p>
                <Link to="/entreprises" style={s.emptyBtn}>Explorer les services</Link>
              </div>
            </div>
            <div style={s.sectionCard}>
              <div style={s.sectionHeader}>
                <h3 style={s.sectionTitle}><FiHeart style={s.sectionIcon} />Mes favoris</h3>
                <Link to="/favoris" style={s.viewAll}>Voir tous</Link>
              </div>
              <div style={s.emptyState}>
                <FiHeart style={s.emptyIcon} />
                <p style={s.emptyText}>Aucun favori pour le moment</p>
                <Link to="/entreprises" style={s.emptyBtn}>Découvrir des services</Link>
              </div>
            </div>
          </div>

          {/* Modal devenir prestataire */}
          {showBecomeProviderModal && (
            <div style={s.overlay} onClick={() => setShowBecomeProviderModal(false)}>
              <div style={s.modal} onClick={e => e.stopPropagation()}>
                <div style={s.modalHeader}>
                  <MdOutlineStorefront style={s.modalIcon} />
                  <h2 style={s.modalTitle}>Devenir prestataire sur CarEasy</h2>
                  <button onClick={() => setShowBecomeProviderModal(false)} style={s.modalClose}>×</button>
                </div>
                <div style={s.modalBody}>
                  <p style={s.modalText}>Pour devenir prestataire, vous devez d'abord créer votre entreprise.</p>
                  <div style={s.infoBox}>
                    <FiInfo style={s.infoIcon} />
                    <p style={s.infoText}>Votre entreprise sera soumise à validation avant d'être visible sur la plateforme.</p>
                  </div>
                  <div style={s.steps}>
                    {[
                      { n:1, t:'Créer votre entreprise',     d:'Renseignez les informations de votre structure' },
                      { n:2, t:"Validation par l'équipe",    d:'Nous vérifions les informations (24-48h)' },
                      { n:3, t:'Ajouter vos services',       d:'Décrivez les prestations que vous proposez' },
                    ].map(step => (
                      <div key={step.n} style={s.step}>
                        <div style={s.stepNum}>{step.n}</div>
                        <div><h4 style={s.stepTitle}>{step.t}</h4><p style={s.stepText}>{step.d}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={s.modalFooter}>
                  <button onClick={() => setShowBecomeProviderModal(false)} style={s.btnCancel}>Plus tard</button>
                  <Link to="/entreprises/creer" style={s.btnConfirm} onClick={() => setShowBecomeProviderModal(false)}>
                    Créer mon entreprise
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.8;transform:scale(1.15)}} @keyframes badgePop{0%{transform:scale(0)}80%{transform:scale(1.2)}100%{transform:scale(1)}}`}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD PRESTATAIRE
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={s.container}>
      <div style={s.content}>

        {/* Bannières */}
        {!dismissedBanner && <SubscriptionBanner />}
        <StatusBanner />

        {/* En-tête */}
        <div style={s.header}>
          <div style={s.headerMain}>
            <div>
              <h1 style={s.title}><MdDashboard style={s.titleIcon} />Tableau de Bord Prestataire</h1>
              <p style={s.subtitle}>Bienvenue sur votre espace professionnel CarEasy</p>
            </div>
            <div style={s.headerActions}>
              <BellBtn />
              <Link to="/settings" style={{ textDecoration:'none' }}>
                <button style={s.headerBtn}><FiSettings style={s.headerBtnIcon} /></button>
              </Link>
            </div>
          </div>
        </div>

        {/* Compte à rebours essai (masqué si payant) */}
        <div style={{ marginBottom:'2rem' }}><TrialTimer /></div>

        {/* Stats */}
        <div style={s.statsGrid}>
          {[
            { icon:MdOutlineBusiness, num:stats.totalEntreprises,
              label:'Entreprises', sub:`${stats.validatedEntreprises} validées · ${stats.pendingEntreprises} en attente`,
              limit:currentPlan.maxEntreprises, count:stats.totalEntreprises },
            { icon:MdOutlineWork, num:`${stats.totalServices}/${currentPlan.maxServices}`,
              label:'Services', sub:`${stats.servicesWithPrice} avec tarif · ${stats.services24h} 24h/24`,
              limit:currentPlan.maxServices, count:stats.totalServices },
            { icon:FiUsers, num:`${currentPlan.employeesCount}/${currentPlan.maxEmployees}`,
              label:'Employés', sub:`Limite du plan ${currentPlan.name}`,
              limit:currentPlan.maxEmployees, count:currentPlan.employeesCount },
            { icon:FiDollarSign, num:fmtXOF(stats.monthlyRevenue),
              label:'Revenu estimé', sub:'Ce mois', noLimit:true },
          ].map((stat, i) => {
            const Icon    = stat.icon;
            const atLimit = !stat.noLimit && stat.count >= stat.limit;
            return (
              <div key={i} style={s.statCard}>
                <div style={s.statIconWrap}><Icon style={s.statIcon} /></div>
                <div style={s.statContent}>
                  <div style={s.statNum}>{stat.num}</div>
                  <div style={s.statLabel}>{stat.label}</div>
                  <div style={s.statSub}>{stat.sub}</div>
                </div>
                <div style={{ ...s.trend, backgroundColor:atLimit?'#fee2e2':'#f0fdf4', color:atLimit?'#dc2626':'#16a34a' }}>
                  <FiActivity style={{ fontSize:'0.875rem' }} />
                  <span>{stat.noLimit ? '+15%' : atLimit ? 'Limite atteinte' : `${stat.limit - stat.count} restant(s)`}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grille principale */}
        <div style={s.mainGrid}>
          {/* Colonne gauche */}
          <div style={s.leftCol}>
            {/* Actions rapides */}
            <div style={s.sectionCard}>
              <div style={s.sectionHeader}>
                <h3 style={s.sectionTitle}><FiTarget style={s.sectionIcon} />Actions rapides</h3>
              </div>
              <div style={s.actionsGrid}>
                {[
                  { to:canCreateService()    ?'/services/creer':'#', icon:canCreateService()    ?FiPlus:FiLock,          title:'Nouveau service',    desc:canCreateService()    ?'Ajouter un service':'Limite atteinte',  ok:canCreateService(),    onClick:handleCreateService,     bg:canCreateService()    ?'#dbeafe':'#fee2e2' },
                  { to:canCreateEntreprise() ?'/entreprises/creer':'#', icon:canCreateEntreprise()?MdOutlineBusiness:FiLock,  title:'Nouvelle entreprise',desc:canCreateEntreprise() ?'Créer une entreprise':'Limite atteinte', ok:canCreateEntreprise(), onClick:handleCreateEntreprise, bg:canCreateEntreprise() ?'#dbeafe':'#fee2e2' },
                  { to:stats.totalServices    >0?'/mes-services':'#',    icon:stats.totalServices    >0?MdOutlineWork:FiLock,   title:'Gérer les services', desc:stats.totalServices    >0?'Voir tous les services':'Aucun service',    ok:stats.totalServices    >0, onClick:handleManageServices,     bg:stats.totalServices    >0?'#dbeafe':'#fee2e2' },
                  { to:stats.totalEntreprises >0?'/mes-entreprises':'#', icon:stats.totalEntreprises >0?FiBriefcase:FiLock,     title:'Gérer les entreprises',desc:stats.totalEntreprises >0?'Voir les entreprises':'Aucune entreprise', ok:stats.totalEntreprises >0, onClick:handleManageEntreprises, bg:stats.totalEntreprises >0?'#dbeafe':'#fee2e2' },
                ].map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <Link key={i} to={a.to} onClick={a.onClick}
                      style={{ ...s.actionCard, opacity:a.ok?1:0.7, cursor:a.ok?'pointer':'not-allowed' }}>
                      <div style={{ ...s.actionIconWrap, backgroundColor:a.bg }}><Icon /></div>
                      <div style={s.actionContent}>
                        <div style={s.actionTitle}>{a.title}</div>
                        <div style={s.actionDesc}>{a.desc}</div>
                      </div>
                      <FiChevronRight style={{ fontSize:'1rem', color:'#94a3b8', flexShrink:0 }} />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Plan actuel */}
            <div style={s.sectionCard}>
              <div style={s.sectionHeader}>
                <h3 style={s.sectionTitle}><FiGift style={s.sectionIcon} />Plan actuel</h3>
                <button
                  onClick={() => navigate('/abonnements?tab=plans')}
                  style={{ ...s.viewAll, background:'none', border:'none', cursor:'pointer' }}
                >
                  {currentPlan.isPaid ? 'Gérer' : 'Changer de plan'}
                </button>
              </div>
              <div style={{ padding:'0.5rem 0' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap' }}>
                  {currentPlan.isPaid
                    ? <MdOutlineVerified size={20} color="#2563eb" />
                    : <FiGift size={20} color="#d97706" />}
                  <span style={{ fontSize:'1.125rem', fontWeight:600, color:'#1e293b' }}>{currentPlan.name}</span>
                  {!currentPlan.isPaid && <span style={s.planBadge}>Essai</span>}
                  {currentPlan.isPaid  && <span style={{ ...s.planBadge, backgroundColor:'#d1fae5', color:'#065f46' }}>Actif</span>}
                </div>
                {/* Bouton "Obtenir" si pas de plan payant */}
                {!currentPlan.isPaid && (
                  <button
                    onClick={() => openPayModal(null)}
                    style={{ ...s.btnConfirm, marginBottom:'1rem', width:'100%', justifyContent:'center' }}
                  >
                    <FiAward size={16} /> Obtenir un abonnement payant
                  </button>
                )}
                <div style={s.planFeatures}>
                  {[
                    { l:'Entreprises max', v:currentPlan.maxEntreprises },
                    { l:'Services max',    v:currentPlan.maxServices },
                    { l:'Employés max',    v:currentPlan.maxEmployees },
                  ].map(f => (
                    <div key={f.l} style={s.planFeature}>
                      <span style={s.planFeatureL}>{f.l}</span>
                      <span style={s.planFeatureV}>{f.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div style={s.rightCol}>
            {/* État des entreprises */}
            <div style={s.sectionCard}>
              <div style={s.sectionHeader}>
                <h3 style={s.sectionTitle}><MdOutlineStorefront style={s.sectionIcon} />État des entreprises</h3>
                <Link to={stats.totalEntreprises>0?'/mes-entreprises':'#'} style={{ ...s.viewAll, opacity:stats.totalEntreprises>0?1:0.5 }}>Voir toutes</Link>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                {entreprises.filter(e => e.status === 'validated').slice(0,3).map(e => (
                  <div key={e.id} style={s.listItem}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
                      {e.logo
                        ? <img src={e.logo} alt={e.name} style={s.logoImg} />
                        : <div style={s.logoPlaceholder}><MdOutlineBusiness /></div>
                      }
                      <div>
                        <div style={s.listItemTitle}>{e.name}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', flexWrap:'wrap' }}>
                          <span style={{ ...s.chip, backgroundColor:'#d1fae5', color:'#059669' }}>Validée</span>
                          {!currentPlan.isPaid && e.trial_ends_at && (
                            <span style={{ ...s.chip, backgroundColor:'#dbeafe', color:'#1e40af', fontSize:'0.65rem' }}>Essai</span>
                          )}
                          {currentPlan.isPaid && (
                            <span style={{ ...s.chip, backgroundColor:'#d1fae5', color:'#065f46', fontSize:'0.65rem' }}>Abonné</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize:'0.875rem', color:'#64748b' }}>{stats.totalServices} service(s)</span>
                  </div>
                ))}
                {entreprises.filter(e => e.status === 'validated').length === 0 && (
                  <div style={s.emptyState}>
                    <MdOutlineBusiness style={s.emptyIcon} />
                    <p style={s.emptyText}>Aucune entreprise validée</p>
                  </div>
                )}
              </div>
            </div>

            {/* Services récents */}
            <div style={s.sectionCard}>
              <div style={s.sectionHeader}>
                <h3 style={s.sectionTitle}><MdOutlineInventory style={s.sectionIcon} />Services récents</h3>
                <Link to={stats.totalServices>0?'/mes-services':'#'} style={{ ...s.viewAll, opacity:stats.totalServices>0?1:0.5 }}>Voir tous</Link>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {services.slice(0,3).map(svc => (
                  <div key={svc.id} style={s.listItem}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
                      <div style={s.svcIconWrap}>
                        {svc.medias?.length > 0
                          ? <img src={svc.medias[0]} alt={svc.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : <MdOutlineWork style={{ fontSize:'20px', color:'#9ca3af' }} />
                        }
                      </div>
                      <div>
                        <div style={s.listItemTitle}>{svc.name}</div>
                        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                          <span style={{ fontSize:'0.75rem', fontWeight:600, color:'#059669' }}>
                            {svc.price ? fmtXOF(svc.price) : 'Sur devis'}
                          </span>
                          {svc.is_open_24h && <span style={{ fontSize:'0.75rem', color:'#ef4444', fontWeight:600 }}>24h/24</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <div style={s.emptyState}>
                    <MdOutlineWork style={s.emptyIcon} />
                    <p style={s.emptyText}>Aucun service créé</p>
                    <Link to={canCreateService()?'/services/creer':'#'} style={s.emptyBtn} onClick={handleCreateService}>
                      Créer un service
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conseils */}
        <div style={s.tipsSection}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
            <MdOutlineInsights style={{ fontSize:'1.75rem', color:'#ef4444' }} />
            <h3 style={{ fontSize:'clamp(1.125rem,4vw,1.25rem)', fontWeight:700, color:'#1e293b' }}>
              Conseils pour optimiser votre présence
            </h3>
          </div>
          <div style={s.tipsGrid}>
            {[
              { icon:FiTool,       title:'Services complets',   text:'Ajoutez des photos de qualité et des descriptions détaillées.' },
              { icon:FiDollarSign, title:'Tarifs transparents', text:'Indiquez des prix clairs pour plus de visibilité.' },
              { icon:FiCalendar,   title:'Disponibilité',       text:'Mettez à jour vos horaires régulièrement.' },
              { icon:FiInfo,       title:'Descriptions riches', text:'Décrivez précisément vos services et compétences.' },
            ].map((tip, i) => {
              const Icon = tip.icon;
              return (
                <div key={i} style={s.tipCard}>
                  <div style={s.tipIcon}><Icon /></div>
                  <h4 style={s.tipTitle}>{tip.title}</h4>
                  <p style={s.tipText}>{tip.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modals */}
        <LimitModal />
        <PayModal />
      </div>

      <style>{`
        @keyframes spin     { to { transform:rotate(360deg); } }
        @keyframes pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.8;transform:scale(1.15)} }
        @keyframes badgePop { 0%{transform:scale(0)} 80%{transform:scale(1.2)} 100%{transform:scale(1)} }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  // Layout
  container:    { minHeight:'100vh', backgroundColor:'#f8fafc', padding:'2rem 0 4rem' },
  content:      { maxWidth:1400, margin:'0 auto', padding:'0 1.5rem' },
  loadingWrap:  { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'1rem', backgroundColor:'#f8fafc' },
  spinner:      { width:60, height:60, border:'4px solid #e2e8f0', borderTop:'4px solid #ef4444', borderRadius:'50%', animation:'spin 1s linear infinite' },
  loadingText:  { color:'#1e293b', fontSize:'1.25rem', fontWeight:600 },

  // Bannière abonnement
  subBanner:      { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1.5rem', border:'1px solid', flexWrap:'wrap', gap:'0.75rem', marginBottom:'1rem' },
  subBannerLeft:  { display:'flex', alignItems:'center', gap:10 },
  subBannerBtn:   { display:'flex', alignItems:'center', gap:5, padding:'6px 14px', backgroundColor:'#2563eb', color:'#fff', border:'none', borderRadius:8, fontSize:'.8rem', fontWeight:600, cursor:'pointer' },
  subBannerClose: { display:'flex', alignItems:'center', justifyContent:'center', width:30, height:30, backgroundColor:'rgba(0,0,0,.06)', border:'none', borderRadius:6, cursor:'pointer', color:'#475569' },

  // Bannière statut
  bannerPending:  { display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', backgroundColor:'#fffbeb', border:'1px solid #fcd34d', borderLeft:'4px solid #f59e0b', borderRadius:'0.75rem', padding:'1rem 1.25rem', marginBottom:'1.5rem' },
  bannerRejected: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', backgroundColor:'#fef2f2', border:'1px solid #fca5a5', borderLeft:'4px solid #ef4444', borderRadius:'0.75rem', padding:'1rem 1.25rem', marginBottom:'1.5rem' },
  bannerLeft:     { display:'flex', alignItems:'flex-start', gap:'0.875rem', flex:1 },
  bannerRight:    { display:'flex', alignItems:'center', gap:'0.75rem', flexShrink:0 },
  bannerDot:      { width:10, height:10, borderRadius:'50%', backgroundColor:'#f59e0b', flexShrink:0, marginTop:5, animation:'pulse 2s ease-in-out infinite', boxShadow:'0 0 0 3px rgba(245,158,11,.2)' },
  bannerTitle:    { fontWeight:600, color:'#78350f', fontSize:'0.9rem', margin:0 },
  bannerSub:      { color:'#92400e', fontSize:'0.8rem', margin:'0.25rem 0 0', lineHeight:1.5 },
  bannerLink:     { display:'inline-flex', alignItems:'center', gap:'0.25rem', color:'#dc2626', fontWeight:600, fontSize:'0.8rem', textDecoration:'none', marginTop:'0.5rem' },
  bannerChip:     { backgroundColor:'#fef3c7', color:'#d97706', border:'1px solid #fcd34d', borderRadius:999, padding:'0.25rem 0.75rem', fontSize:'0.75rem', fontWeight:700, whiteSpace:'nowrap' },
  bannerClose:    { background:'none', border:'none', color:'#94a3b8', cursor:'pointer', padding:'0.25rem', display:'flex', alignItems:'center', borderRadius:'0.25rem' },

  // Header
  header:       { marginBottom:'2rem' },
  headerMain:   { display:'flex', justifyContent:'space-between', alignItems:'center' },
  title:        { display:'flex', alignItems:'center', gap:'0.75rem', fontSize:'clamp(1.5rem,5vw,2.25rem)', fontWeight:800, color:'#1e293b', marginBottom:'0.5rem' },
  titleIcon:    { fontSize:'clamp(1.5rem,5vw,2.25rem)', color:'#ef4444' },
  subtitle:     { color:'#64748b', fontSize:'clamp(0.875rem,3vw,1.125rem)' },
  headerActions:{ display:'flex', gap:'0.5rem' },
  headerBtn:    { display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#fff', border:'1px solid #e2e8f0', width:44, height:44, borderRadius:'0.75rem', color:'#475569', cursor:'pointer', position:'relative' },
  headerBtnIcon:{ fontSize:'1.25rem' },
  badge:        { position:'absolute', top:-6, right:-6, backgroundColor:'#ef4444', color:'#fff', fontSize:'0.65rem', fontWeight:800, minWidth:18, height:18, borderRadius:999, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #f8fafc', padding:'0 3px', animation:'badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)' },

  // Welcome card (client)
  welcomeCard:         { background:'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)', borderRadius:'1.5rem', padding:'clamp(1.5rem,4vw,2rem)', marginBottom:'2rem', display:'flex', alignItems:'center', justifyContent:'space-between', color:'#fff', boxShadow:'0 10px 30px rgba(239,68,68,.3)' },
  welcomeContent:      { flex:1, paddingRight:'2rem' },
  welcomeTitle:        { fontSize:'clamp(1.5rem,5vw,2rem)', fontWeight:700, marginBottom:'1rem' },
  welcomeText:         { fontSize:'clamp(0.875rem,3vw,1rem)', opacity:0.9, marginBottom:'1.5rem', lineHeight:1.6 },
  welcomeIllustration: { flexShrink:0 },
  welcomeIcon:         { fontSize:'clamp(5rem,15vw,8rem)', opacity:0.8 },
  becomeBtn:           { backgroundColor:'#fff', color:'#ef4444', border:'none', padding:'clamp(0.75rem,2vw,1rem) clamp(1.5rem,4vw,2rem)', borderRadius:'0.75rem', fontSize:'clamp(0.875rem,2.5vw,1rem)', fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'0.75rem', boxShadow:'0 4px 15px rgba(0,0,0,.2)' },
  buttonIcon:          { fontSize:'1.25rem' },
  pendingNote:         { display:'inline-flex', alignItems:'center', gap:'0.5rem', backgroundColor:'rgba(255,255,255,.2)', color:'#fff', padding:'0.875rem 1.25rem', borderRadius:'0.75rem', fontSize:'0.875rem', fontWeight:500, border:'1px solid rgba(255,255,255,.3)', lineHeight:1.5 },

  // Grilles stats
  statsGrid:   { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1.5rem', marginBottom:'2rem' },
  statCard:    { backgroundColor:'#fff', padding:'clamp(1rem,3vw,1.5rem)', borderRadius:'1rem', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,.05)', display:'flex', alignItems:'center', gap:'1rem' },
  statIconWrap:{ display:'flex', alignItems:'center', justifyContent:'center', width:56, height:56, backgroundColor:'#dbeafe', borderRadius:'0.75rem', flexShrink:0 },
  statIcon:    { fontSize:'1.75rem', color:'#ef4444' },
  statContent: { flex:1 },
  statNum:     { fontSize:'clamp(1.25rem,4vw,1.75rem)', fontWeight:700, color:'#1e293b', marginBottom:'0.25rem' },
  statLabel:   { fontSize:'0.875rem', fontWeight:600, color:'#64748b', marginBottom:'0.25rem' },
  statSub:     { fontSize:'0.75rem', color:'#94a3b8' },
  trend:       { display:'flex', alignItems:'center', gap:'0.375rem', padding:'0.375rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.75rem', fontWeight:600, whiteSpace:'nowrap' },

  // Grilles contenu
  clientGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'1.5rem', marginBottom:'2rem' },
  mainGrid:   { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(350px,1fr))', gap:'2rem', marginBottom:'2rem' },
  leftCol:    { display:'flex', flexDirection:'column', gap:'1.5rem' },
  rightCol:   { display:'flex', flexDirection:'column', gap:'1.5rem' },

  // Cartes sections
  sectionCard:   { backgroundColor:'#fff', padding:'clamp(1rem,3vw,1.5rem)', borderRadius:'1rem', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,.05)' },
  sectionHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'2px solid #f1f5f9' },
  sectionTitle:  { display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'clamp(1rem,4vw,1.25rem)', fontWeight:700, color:'#1e293b' },
  sectionIcon:   { fontSize:'1.25rem', color:'#ef4444' },
  viewAll:       { color:'#ef4444', textDecoration:'none', fontSize:'0.875rem', fontWeight:600 },

  // Actions rapides
  actionsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'0.75rem' },
  actionCard:  { backgroundColor:'#f8fafc', border:'1px solid #e2e8f0', padding:'1rem', borderRadius:'0.75rem', display:'flex', alignItems:'center', gap:'0.75rem', textDecoration:'none', color:'inherit' },
  actionIconWrap:{ display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40, borderRadius:'0.5rem', fontSize:'1.25rem', color:'#ef4444', flexShrink:0 },
  actionContent: { flex:1 },
  actionTitle:   { fontSize:'0.875rem', fontWeight:600, color:'#1e293b', marginBottom:'0.125rem' },
  actionDesc:    { fontSize:'0.75rem', color:'#64748b' },

  // Plan
  planBadge:    { backgroundColor:'#dbeafe', color:'#1e40af', padding:'0.25rem 0.5rem', borderRadius:'0.375rem', fontSize:'0.75rem', fontWeight:600 },
  planFeatures: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:'1rem' },
  planFeature:  { display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'0.75rem', backgroundColor:'#f8fafc', borderRadius:'0.5rem' },
  planFeatureL: { fontSize:'0.75rem', color:'#64748b', marginBottom:'0.25rem' },
  planFeatureV: { fontSize:'1rem', fontWeight:600, color:'#1e293b' },

  // Liste items
  listItem:       { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem', borderRadius:'0.75rem', border:'1px solid #f1f5f9' },
  listItemTitle:  { fontSize:'0.875rem', fontWeight:600, color:'#1e293b', marginBottom:'0.25rem' },
  logoImg:        { width:40, height:40, borderRadius:'0.5rem', objectFit:'cover', border:'1px solid #e2e8f0' },
  logoPlaceholder:{ width:40, height:40, borderRadius:'0.5rem', backgroundColor:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', color:'#ef4444' },
  chip:           { padding:'0.2rem 0.5rem', borderRadius:'0.375rem', fontSize:'0.7rem', fontWeight:600 },
  svcIconWrap:    { width:40, height:40, borderRadius:'0.5rem', overflow:'hidden', backgroundColor:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },

  // États vides
  emptyState: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', textAlign:'center' },
  emptyIcon:  { fontSize:'2.5rem', color:'#94a3b8', marginBottom:'1rem' },
  emptyText:  { color:'#64748b', fontSize:'0.875rem', marginBottom:'1rem' },
  emptyBtn:   { backgroundColor:'#ef4444', color:'#fff', padding:'0.5rem 1rem', borderRadius:'0.5rem', textDecoration:'none', fontSize:'0.875rem', fontWeight:600, display:'inline-block' },

  // Conseils
  tipsSection: { backgroundColor:'#fff', padding:'clamp(1rem,4vw,2rem)', borderRadius:'1rem', border:'1px solid #e2e8f0' },
  tipsGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'1.5rem' },
  tipCard:     { backgroundColor:'#f8fafc', padding:'1.5rem', borderRadius:'0.75rem', border:'1px solid #e2e8f0' },
  tipIcon:     { display:'flex', alignItems:'center', justifyContent:'center', width:48, height:48, backgroundColor:'#dbeafe', borderRadius:'0.75rem', fontSize:'1.5rem', color:'#ef4444', marginBottom:'1rem' },
  tipTitle:    { fontSize:'1rem', fontWeight:600, color:'#1e293b', marginBottom:'0.5rem' },
  tipText:     { fontSize:'0.875rem', color:'#64748b', lineHeight:1.5 },

  // Timer essai
  timerCard:     { borderRadius:'1rem', padding:'clamp(1rem,3vw,1.5rem)', background:'linear-gradient(135deg,#e80a0a,#c1201a)', color:'#fff', boxShadow:'0 4px 6px -1px rgba(0,0,0,.1)' },
  timerHeader:   { display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' },
  timerGiftIcon: { fontSize:'2rem' },
  timerTitle:    { fontSize:'clamp(1rem,4vw,1.25rem)', fontWeight:600, marginBottom:'0.25rem' },
  timerSubtitle: { fontSize:'0.875rem', opacity:0.9 },
  timerDisplay:  { display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginBottom:'1.5rem' },
  timerUnit:     { display:'flex', flexDirection:'column', alignItems:'center', minWidth:'clamp(60px,15vw,80px)' },
  timerNum:      { fontSize:'clamp(1.5rem,5vw,2.5rem)', fontWeight:700, lineHeight:1 },
  timerUnitL:    { fontSize:'0.75rem', opacity:0.9, marginTop:'0.25rem' },
  timerSep:      { fontSize:'clamp(1.5rem,5vw,2.5rem)', fontWeight:700, color:'rgba(255,255,255,.5)' },
  timerBar:      { height:6, backgroundColor:'rgba(255,255,255,.2)', borderRadius:3, marginBottom:'1rem', overflow:'hidden' },
  timerFill:     { height:'100%', backgroundColor:'#fff', borderRadius:3, transition:'width 1s linear' },
  timerFooter:   { display:'flex', alignItems:'center', justifyContent:'space-between' },
  timerStats:    { display:'flex', gap:'1.5rem' },
  timerStat:     { display:'flex', flexDirection:'column' },
  timerStatL:    { fontSize:'0.75rem', opacity:0.9, marginBottom:'0.125rem' },
  timerStatV:    { fontSize:'1rem', fontWeight:600 },
  timerLink:     { color:'#fff', background:'none', border:'2px solid rgba(255,255,255,.6)', textDecoration:'none', fontSize:'0.875rem', fontWeight:600, padding:'0.5rem 1rem', borderRadius:'0.5rem', cursor:'pointer' },
  timerInactive: { backgroundColor:'#f1f5f9', borderRadius:'1rem', padding:'1rem', display:'flex', alignItems:'center', gap:'0.75rem', color:'#64748b', border:'1px dashed #cbd5e1' },
  timerExpired:  { backgroundColor:'#fee2e2', borderRadius:'1rem', padding:'1rem', display:'flex', alignItems:'center', gap:'0.75rem', color:'#991b1b', border:'1px solid #fecaca' },
  timerIcon:     { fontSize:'1.5rem', flexShrink:0 },
  timerContent:  { flex:1, display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', flexWrap:'wrap' },
  timerAction:   { color:'#dc2626', textDecoration:'none', fontWeight:600, fontSize:'0.875rem' },

  // Modals
  overlay:     { position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)', padding:'1rem' },
  modal:       { backgroundColor:'#fff', borderRadius:'1rem', maxWidth:520, width:'90%', maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 40px rgba(0,0,0,.2)' },
  modalHeader: { padding:'1.5rem', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:'1rem' },
  modalIcon:   { fontSize:'2rem', color:'#ef4444' },
  modalTitle:  { fontSize:'clamp(1rem,4vw,1.25rem)', fontWeight:700, color:'#1e293b', flex:1 },
  modalClose:  { background:'none', border:'none', fontSize:'2rem', color:'#64748b', cursor:'pointer', padding:0, lineHeight:1 },
  modalBody:   { padding:'1.5rem' },
  modalText:   { fontSize:'0.95rem', color:'#475569', lineHeight:1.6, marginBottom:'1rem' },
  modalFooter: { padding:'1.5rem', borderTop:'1px solid #e2e8f0', display:'flex', gap:'1rem' },
  btnCancel:   { flex:1, padding:'0.75rem', backgroundColor:'#fff', border:'2px solid #e2e8f0', borderRadius:'0.5rem', color:'#475569', fontSize:'0.95rem', fontWeight:600, cursor:'pointer' },
  btnConfirm:  { flex:1, padding:'0.75rem', backgroundColor:'#ef4444', border:'none', borderRadius:'0.5rem', color:'#fff', fontSize:'0.95rem', fontWeight:600, cursor:'pointer', textDecoration:'none', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' },
  infoBox:     { backgroundColor:'#f0f9ff', padding:'1rem', borderRadius:'0.75rem', display:'flex', alignItems:'flex-start', gap:'0.75rem', marginBottom:'1.5rem', border:'1px solid #bae6fd' },
  infoIcon:    { fontSize:'1.25rem', color:'#0284c7', flexShrink:0 },
  infoText:    { fontSize:'0.875rem', color:'#0369a1', lineHeight:1.5 },
  steps:       { display:'flex', flexDirection:'column', gap:'1rem' },
  step:        { display:'flex', alignItems:'flex-start', gap:'1rem' },
  stepNum:     { display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, backgroundColor:'#ef4444', color:'#fff', borderRadius:'50%', fontSize:'1rem', fontWeight:600, flexShrink:0 },
  stepTitle:   { fontSize:'1rem', fontWeight:600, color:'#1e293b', marginBottom:'0.25rem' },
  stepText:    { fontSize:'0.875rem', color:'#64748b' },

  // Modal paiement
  entrepriseOption:            { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', border:'2px solid', borderRadius:'0.75rem', transition:'all .15s' },
  entrepriseOptionLeft:        { display:'flex', alignItems:'center', gap:'0.75rem' },
  entrepriseOptionLogo:        { width:40, height:40, borderRadius:'0.5rem', objectFit:'cover', border:'1px solid #e2e8f0' },
  entrepriseOptionLogoPlaceholder:{ width:40, height:40, borderRadius:'0.5rem', backgroundColor:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', color:'#2563eb' },
  payErrorBox: { display:'flex', alignItems:'center', gap:'0.5rem', backgroundColor:'#fee2e2', color:'#dc2626', padding:'0.75rem 1rem', borderRadius:'0.5rem', fontSize:'0.875rem', marginTop:'0.5rem' },
  btnSpinner:  { display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,.4)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' },
};