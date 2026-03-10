/**
 * AbonnementsPage.jsx
 * Page unifiée — remplace Plans.jsx ET MesAbonnements.jsx
 * Route : /abonnements
 *
 * Deux onglets :
 *   • "Plans disponibles"   (ancien Plans.jsx)
 *   • "Mes abonnements"     (ancien MesAbonnements.jsx)
 *
 * Usage dans App.jsx :
 *   import AbonnementsPage from './pages/prestataire/AbonnementsPage';
 *   <Route path="/abonnements" element={<ProtectedRoute><AbonnementsPage /></ProtectedRoute>} />
 *   <Route path="/plans"       element={<Navigate to="/abonnements" replace />} />
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import planApi     from '../../api/planApi';
import paiementApi from '../../api/paiementApi';
import { entrepriseApi } from '../../api/entrepriseApi';
import theme from '../../config/theme';
import PaiementModal from '../../components/Paiement/PaiementModal';

import {
  FiCheckCircle, FiXCircle, FiBriefcase, FiUsers, FiZap, FiAward,
  FiInfo, FiChevronRight, FiRefreshCw, FiClock, FiStar,
  FiGift, FiAlertTriangle, FiCreditCard, FiFileText, FiTrendingUp,
} from 'react-icons/fi';
import { FaCrown, FaRocket, FaRegGem } from 'react-icons/fa';
import {
  MdOutlineCompareArrows, MdOutlineVerified,
  MdOutlineBusinessCenter, MdOutlineStorefront, MdOutlineWarning,
} from 'react-icons/md';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS PLANS
// ─────────────────────────────────────────────────────────────────────────────
const getPlanIcon     = (code) => {
  if (code?.includes('VP1')) return <FiZap     style={{ color: '#f59e0b' }} />;
  if (code?.includes('VP2')) return <FaCrown   style={{ color: '#3b82f6' }} />;
  if (code?.includes('VP3')) return <FaRocket  style={{ color: '#10b981' }} />;
  return <FaRegGem style={{ color: '#8b5cf6' }} />;
};
const getPlanGradient = (code) => {
  if (code?.includes('VP1')) return 'linear-gradient(135deg,#f59e0b,#fbbf24)';
  if (code?.includes('VP2')) return 'linear-gradient(135deg,#3b82f6,#60a5fa)';
  if (code?.includes('VP3')) return 'linear-gradient(135deg,#10b981,#34d399)';
  return 'linear-gradient(135deg,#8b5cf6,#a78bfa)';
};
const getPlanBadge    = (code) => {
  if (code?.includes('VP1')) return 'Débutant';
  if (code?.includes('VP2')) return 'Professionnel';
  if (code?.includes('VP3')) return 'Premium';
  return 'Standard';
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function AbonnementsPage() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();

  // L'URL peut forcer un onglet : /abonnements?tab=plans  ou  ?tab=mes
  const defaultTab  = new URLSearchParams(location.search).get('tab') === 'plans' ? 'plans' : 'mes';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    navigate(`/abonnements?tab=${tab}`, { replace: true });
  };

  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444' }}>
          {toast.type === 'success' ? <FiCheckCircle size={20} /> : <FiInfo size={20} />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div style={s.content}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}><FiAward style={s.titleIcon} />Abonnements</h1>
            <p style={s.subtitle}>Gérez vos plans et suivez vos abonnements actifs</p>
          </div>
        </div>

        {/* ── Onglets ─────────────────────────────────────────────────────── */}
        <div style={s.tabs}>
          <button
            onClick={() => switchTab('mes')}
            style={{ ...s.tab, ...(activeTab === 'mes' ? s.tabActive : {}) }}
          >
            <FiAward size={16} />
            Mes abonnements
          </button>
          <button
            onClick={() => switchTab('plans')}
            style={{ ...s.tab, ...(activeTab === 'plans' ? s.tabActive : {}) }}
          >
            <FiStar size={16} />
            Plans disponibles
          </button>
        </div>

        {/* ── Contenu ─────────────────────────────────────────────────────── */}
        {activeTab === 'mes'
          ? <MesAbonnementsTab showToast={showToast} onGoToPlans={() => switchTab('plans')} />
          : <PlansTab          showToast={showToast} onGoToMes={()   => switchTab('mes')}   />
        }
      </div>

      <style>{`
        @keyframes spin        { to   { transform: rotate(360deg); } }
        @keyframes slideInRight{ from { transform: translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes fadeIn      { from { opacity:0; } to { opacity:1; } }
        @keyframes slideIn     { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .plan-card:hover { transform:translateY(-6px); box-shadow:0 20px 40px rgba(0,0,0,.15); }
      `}</style>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ONGLET "MES ABONNEMENTS"
// ═════════════════════════════════════════════════════════════════════════════
function MesAbonnementsTab({ showToast, onGoToPlans }) {
  const location = useLocation();
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [selected, setSelected]       = useState(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [toCancel, setToCancel]       = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling]   = useState(false);

  useEffect(() => {
    fetchData();
    if (new URLSearchParams(location.search).get('payment') === 'success') {
      showToast('success', 'Paiement réussi ! Votre abonnement est actif.');
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const abonnementsData = (await paiementApi.getAbonnements()).data || [];
      let entreprisesData   = [];
      try { entreprisesData = await entrepriseApi.getMesEntreprises() || []; } catch {}

      const all = [...abonnementsData];
      entreprisesData.forEach(e => {
        if (e.status === 'validated' && e.trial_ends_at) {
          if (all.find(s => s.type === 'trial' && s.entreprise_id === e.id)) return;
          const end      = new Date(e.trial_ends_at);
          const now      = new Date();
          const isActive = end > now;
          const daysLeft = Math.max(0, Math.floor((end - now) / 86400000));
          all.push({
            id: `trial-${e.id}`, reference: `TRIAL-${e.id}`, type: 'trial',
            entreprise_id: e.id, entreprise_name: e.name,
            plan: {
              id: null, name: 'Essai Gratuit', code: 'TRIAL',
              description: "30 jours pour découvrir la plateforme",
              duration_text: '30 jours',
              features_list: ['3 services max','1 employé max','Support standard','Statistiques de base'],
              max_services: e.max_services_allowed || 3,
              max_employees: e.max_employees_allowed || 1,
              has_api_access: e.has_api_access || false,
            },
            date_debut: new Date(e.created_at).toLocaleDateString('fr-FR'),
            date_fin: end.toLocaleDateString('fr-FR'),
            date_fin_obj: end,
            statut: isActive ? 'actif' : 'expiré',
            jours_restants: daysLeft,
            est_actif: isActive, est_essai: true,
            montant: 'Gratuit', paiement: null, renouvellement_auto: false,
            metadata: { max_services: e.max_services_allowed || 3, services_count: e.services_count || 0 },
          });
        }
      });

      all.sort((a, b) => {
        const dA = a.date_fin_obj || new Date(a.date_fin.split('/').reverse().join('-'));
        const dB = b.date_fin_obj || new Date(b.date_fin.split('/').reverse().join('-'));
        return dB - dA;
      });
      setAbonnements(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancel = async () => {
    if (!toCancel || toCancel.type === 'trial') return;
    setCancelling(true);
    try {
      await paiementApi.annulerAbonnement(toCancel.id, { reason: cancelReason });
      showToast('success', 'Abonnement annulé avec succès');
      setCancelModal(false); setToCancel(null); setCancelReason('');
      fetchData();
    } catch { showToast('error', "Erreur lors de l'annulation"); }
    finally   { setCancelling(false); }
  };

  const handleInvoice = (a) => {
    if (a.est_essai) { showToast('error', "Aucune facture pour la période d'essai"); return; }
    if (a.paiement?.facture_url) window.open(a.paiement.facture_url, '_blank');
    else showToast('error', 'Facture non disponible');
  };

  const StatutBadge = ({ a }) => {
    if (a.est_essai) return a.est_actif
      ? <span style={bA.essai}><FiGift />Essai · {a.jours_restants}j</span>
      : <span style={bA.expire}><FiAlertTriangle />Essai expiré</span>;
    if (a.est_actif) return <span style={bA.actif}><MdOutlineVerified />Actif</span>;
    if (['expiré','expire'].includes(a.statut)) return <span style={bA.expire}><FiXCircle />Expiré</span>;
    return <span style={bA.annule}><FiXCircle />{a.statut_libelle || a.statut}</span>;
  };

  if (loading) return <Loader text="Chargement de vos abonnements..." />;

  return (
    <>
      {/* Résumé */}
      {abonnements.length > 0 && (
        <div style={s.summaryCards}>
          {[
            { icon: FiAward,          val: abonnements.length,                            label: 'Total abonnements' },
            { icon: MdOutlineVerified, val: abonnements.filter(a => a.est_actif).length,  label: 'Actifs' },
            { icon: FiGift,           val: abonnements.filter(a => a.est_essai).length,   label: 'Essais gratuits' },
          ].map(({ icon: Icon, val, label }) => (
            <div key={label} style={s.summaryCard}>
              <div style={s.summaryIconWrap}><Icon size={20} color={theme.colors.primary} /></div>
              <div>
                <div style={s.summaryLabel}>{label}</div>
                <div style={s.summaryValue}>{val}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton refresh */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1.25rem' }}>
        <button onClick={() => { setRefreshing(true); fetchData(); }} style={s.refreshBtn} disabled={refreshing}>
          <FiRefreshCw size={14} style={refreshing ? s.spin : {}} />
          {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
        </button>
      </div>

      {/* Liste vide */}
      {abonnements.length === 0 ? (
        <div style={s.emptyState}>
          <FiInfo size={56} color="#cbd5e1" />
          <h3 style={s.emptyTitle}>Aucun abonnement</h3>
          <p style={s.emptyText}>Vous n'avez pas encore souscrit d'abonnement.</p>
          <button onClick={onGoToPlans} style={s.emptyBtn}>Voir les plans disponibles</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {abonnements.map(a => (
            <div key={a.id} style={s.abCard}>
              {/* Header card */}
              <div style={s.abCardHead}>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                  <div style={{ ...s.abCardIcon, backgroundColor: a.est_essai ? '#fef3c7' : '#dbeafe' }}>
                    {a.est_essai ? <FiGift color="#d97706" /> : <MdOutlineBusinessCenter color={theme.colors.primary} />}
                  </div>
                  <div>
                    <h3 style={s.abCardTitle}>
                      {a.plan.name}
                      {a.est_essai && <span style={s.essaiBadge}>Essai gratuit</span>}
                    </h3>
                    <div style={s.abCardMeta}>
                      <span>{a.plan.code}</span>
                      {a.entreprise_name && (
                        <><span style={{ color:'#cbd5e1' }}>•</span>
                        <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                          <MdOutlineStorefront size={13} />{a.entreprise_name}
                        </span></>
                      )}
                    </div>
                  </div>
                </div>
                <StatutBadge a={a} />
              </div>

              {/* Body card */}
              <div style={s.abCardBody}>
                <div style={s.infoGrid}>
                  {[
                    { icon: FiClock,    label: 'Début', val: a.date_debut },
                    { icon: FiClock,    label: 'Fin',   val: a.date_fin   },
                    ...(a.est_actif ? [{ icon: FiClock, label: 'Jours restants', val: `${a.jours_restants} j`, highlight: a.jours_restants <= 7 }] : []),
                  ].map(({ icon: Icon, label, val, highlight }) => (
                    <div key={label} style={s.infoItem}>
                      <div style={s.infoIconWrap}><Icon size={14} color={theme.colors.primary} /></div>
                      <div>
                        <div style={s.infoLabel}>{label}</div>
                        <div style={{ ...s.infoVal, color: highlight ? '#dc2626' : '#0f172a' }}>{val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer card */}
                <div style={s.abCardFoot}>
                  <span style={a.est_essai ? s.montantGratuit : s.montant}>
                    {a.est_essai ? 'Gratuit' : (a.montant || '—')}
                  </span>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    {a.est_actif && !a.est_essai && (
                      <button onClick={() => { setToCancel(a); setCancelModal(true); }} style={s.btnIcon} title="Annuler">
                        <FiXCircle size={16} color="#b91c1c" />
                      </button>
                    )}
                    <button onClick={() => handleInvoice(a)} style={{ ...s.btnIcon, opacity: a.est_essai ? .4 : 1 }} title="Facture" disabled={a.est_essai}>
                      <FiFileText size={16} color="#475569" />
                    </button>
                    <button onClick={() => setSelected(a)} style={s.btnDetails}>
                      Détails <FiChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA bas de page */}
      <div style={s.ctaBanner}>
        <div>
          <p style={s.ctaTitle}>Besoin d'un plan supérieur ?</p>
          <p style={s.ctaSub}>Découvrez nos offres et boostez votre activité.</p>
        </div>
        <button onClick={onGoToPlans} style={s.ctaBtn}>
          <FiStar size={14} /> Voir les plans
        </button>
      </div>

      {/* ── Modal détails ────────────────────────────────────────────────── */}
      {selected && (
        <Overlay onClose={() => setSelected(null)}>
          <div style={s.modal}>
            <ModalClose onClose={() => setSelected(null)} />
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>Détails de l'abonnement</h2>
              <StatutBadge a={selected} />
            </div>
            <div style={s.modalBody}>
              <ModalSection icon={FiAward} title="Plan">
                <p style={{ fontWeight:700, fontSize:'1.1rem', color:'#0f172a' }}>{selected.plan.name}</p>
                <p style={{ color:'#64748b', fontSize:'.875rem' }}>{selected.plan.description}</p>
              </ModalSection>
              <ModalSection icon={FiClock} title="Période">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
                  {[['Début', selected.date_debut],['Fin', selected.date_fin],selected.est_actif && ['Jours restants', `${selected.jours_restants} j`]]
                    .filter(Boolean).map(([l,v]) => (
                      <div key={l}><div style={s.infoLabel}>{l}</div><div style={s.infoVal}>{v}</div></div>
                  ))}
                </div>
              </ModalSection>
              {selected.est_essai && (
                <ModalSection icon={FiGift} title="Période d'essai">
                  <div style={s.trialBar}><div style={{ ...s.trialFill, width:`${((30-selected.jours_restants)/30)*100}%` }} /></div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.8rem', color:'#64748b', marginTop:4 }}>
                    <span>Jour {30-selected.jours_restants}/30</span><span>{selected.jours_restants} restants</span>
                  </div>
                </ModalSection>
              )}
              {selected.plan.features_list?.length > 0 && (
                <ModalSection icon={FiCheckCircle} title="Fonctionnalités">
                  {selected.plan.features_list.map((f,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', fontSize:'.9rem', color:'#334155' }}>
                      <FiCheckCircle size={14} color="#10b981" />{f}
                    </div>
                  ))}
                </ModalSection>
              )}
            </div>
            <div style={s.modalFoot}>
              {selected.est_actif && !selected.est_essai && (
                <button style={s.btnDanger} onClick={() => { setCancelModal(true); setToCancel(selected); setSelected(null); }}>
                  <FiXCircle size={14} />Annuler l'abonnement
                </button>
              )}
              <button style={s.btnPrimary} onClick={() => setSelected(null)}>Fermer</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── Modal annulation ─────────────────────────────────────────────── */}
      {cancelModal && (
        <Overlay onClose={() => setCancelModal(false)}>
          <div style={{ ...s.modal, maxWidth:440 }}>
            <ModalClose onClose={() => setCancelModal(false)} />
            <div style={s.modalHead}><h2 style={s.modalTitle}>Annuler l'abonnement</h2></div>
            <div style={s.modalBody}>
              <div style={s.warnBox}>
                <MdOutlineWarning size={20} color="#d97706" />
                <p style={{ margin:0, fontSize:'.9rem', color:'#78350f' }}>
                  Cette action est irréversible. Vous perdrez l'accès aux fonctionnalités à la fin de la période en cours.
                </p>
              </div>
              <label style={s.formLabel}>Motif d'annulation (optionnel)</label>
              <textarea rows={4} value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                style={s.textarea} placeholder="Dites-nous pourquoi vous annulez..." />
            </div>
            <div style={s.modalFoot}>
              <button style={s.btnSecondary} onClick={() => setCancelModal(false)}>Retour</button>
              <button style={s.btnDanger} onClick={handleCancel} disabled={cancelling}>
                {cancelling ? <><Spinner />&nbsp;Annulation...</> : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ONGLET "PLANS DISPONIBLES"
// ═════════════════════════════════════════════════════════════════════════════
function PlansTab({ showToast, onGoToMes }) {
  const [plans, setPlans]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [selected, setSelected]         = useState(null);
  const [comparison, setComparison]     = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [planToPay, setPlanToPay]       = useState(null);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await planApi.getPublicPlans();
      setPlans(res.data || []);
    } catch { showToast('error', 'Erreur lors du chargement des plans'); }
    finally   { setLoading(false); setRefreshing(false); }
  };

  const handleCompare = async () => {
    try {
      const res = await planApi.comparePlans();
      setComparison(res.data || []);
    } catch { showToast('error', 'Erreur lors de la comparaison'); }
  };

  const handleSubscribe = (plan) => { setPlanToPay(plan); setPaymentModal(true); };

  const onPaymentSuccess = () => {
    showToast('success', 'Paiement réussi ! Votre abonnement est activé.');
    setPaymentModal(false); setPlanToPay(null);
    fetchPlans();
  };

  if (loading) return <Loader text="Chargement des plans..." />;

  return (
    <>
      <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <button onClick={() => { setRefreshing(true); fetchPlans(); }} style={s.refreshBtn} disabled={refreshing}>
          <FiRefreshCw size={14} style={refreshing ? s.spin : {}} />
          {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
        </button>
        <button onClick={handleCompare} style={s.compareBtn}>
          <MdOutlineCompareArrows size={16} />Comparer les plans
        </button>
      </div>

      {plans.length === 0 ? (
        <div style={s.emptyState}>
          <FiInfo size={56} color="#cbd5e1" />
          <h3 style={s.emptyTitle}>Aucun plan disponible</h3>
          <p style={s.emptyText}>Les plans seront bientôt disponibles.</p>
        </div>
      ) : (
        <div style={s.plansGrid}>
          {plans.map(plan => (
            <div key={plan.id} style={s.planCard} className="plan-card">
              <div style={{ ...s.planHead, background: getPlanGradient(plan.code) }}>
                <div style={s.planBadge}>{getPlanBadge(plan.code)}</div>
                <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>{getPlanIcon(plan.code)}</div>
                <h3 style={s.planName}>{plan.name}</h3>
                <span style={s.planCode}>{plan.code}</span>
              </div>
              <div style={s.planBody}>
                <div style={s.planPrice}>
                  <span style={s.priceAmt}>
                    {new Intl.NumberFormat('fr-FR',{style:'currency',currency:'XOF',minimumFractionDigits:0}).format(plan.price)}
                  </span>
                  <span style={s.pricePeriod}>/{plan.duration_text}</span>
                </div>
                {plan.description && <p style={s.planDesc}>{plan.description}</p>}
                <div style={s.planStats}>
                  {plan.max_services  && <StatItem icon={FiBriefcase} val={plan.max_services}  label="Services max" />}
                  {plan.max_employees && <StatItem icon={FiUsers}     val={plan.max_employees} label="Employés max" />}
                </div>
                <div style={{ marginBottom:'1.5rem', flex:1 }}>
                  <p style={{ fontSize:'.875rem', fontWeight:600, color:'#1e293b', marginBottom:'.75rem' }}>Fonctionnalités</p>
                  {(plan.features_list || []).slice(0,4).map((f,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.875rem', color:'#475569', marginBottom:6 }}>
                      <FiCheckCircle size={14} color="#10b981" />{f}
                    </div>
                  ))}
                </div>
                <div style={s.planBtns}>
                  <button style={s.btnOutline} onClick={() => setSelected(plan)}>
                    <FiInfo size={14} />Détails
                  </button>
                  <button style={s.btnSolid} onClick={() => handleSubscribe(plan)}>
                    <FiStar size={14} />Obtenir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA bas de page */}
      <div style={s.ctaBanner}>
        <div>
          <p style={s.ctaTitle}>Déjà abonné ?</p>
          <p style={s.ctaSub}>Consultez et gérez vos abonnements en cours.</p>
        </div>
        <button onClick={onGoToMes} style={s.ctaBtn}>
          <FiAward size={14} /> Mes abonnements
        </button>
      </div>

      {/* Modal paiement */}
      {paymentModal && planToPay && (
        <PaiementModal plan={planToPay} onClose={() => { setPaymentModal(false); setPlanToPay(null); }} onSuccess={onPaymentSuccess} />
      )}

      {/* Modal comparaison */}
      {comparison && (
        <Overlay onClose={() => setComparison(null)}>
          <div style={{ ...s.modal, maxWidth:860 }}>
            <ModalClose onClose={() => setComparison(null)} />
            <div style={s.modalHead}><h2 style={s.modalTitle}><MdOutlineCompareArrows size={20} color={theme.colors.primary} /> Comparaison des plans</h2></div>
            <div style={{ overflowX:'auto', padding:'1.5rem' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={s.cmpTh}>Fonctionnalités</th>
                    {comparison.map(p => (
                      <th key={p.id} style={s.cmpTh}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                          <div style={{ ...s.cmpIcon, background: getPlanGradient(p.code) }}>{getPlanIcon(p.code)}</div>
                          <strong>{p.name}</strong>
                          <span style={{ fontSize:'.75rem', color:'#64748b' }}>{p.formatted_price}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Durée', p => p.duration],
                    ['Services max', p => p.max_services_text],
                    ['Employés max', p => p.max_employees_text],
                    ['Support prioritaire', p => p.has_priority_support ? <span style={{color:'#10b981'}}>✓ Oui</span> : <span style={{color:'#ef4444'}}>✗ Non</span>],
                    ['Statistiques avancées', p => p.has_analytics      ? <span style={{color:'#10b981'}}>✓ Oui</span> : <span style={{color:'#ef4444'}}>✗ Non</span>],
                    ['Notifications SMS', p => p.has_api_access         ? <span style={{color:'#10b981'}}>✓ Oui</span> : <span style={{color:'#ef4444'}}>✗ Non</span>],
                  ].map(([label, fn]) => (
                    <tr key={label}>
                      <td style={s.cmpTd}>{label}</td>
                      {comparison.map(p => <td key={p.id} style={s.cmpTd}>{fn(p)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={s.modalFoot}>
              <button style={s.btnPrimary} onClick={() => setComparison(null)}>Fermer</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Modal détails plan */}
      {selected && (
        <Overlay onClose={() => setSelected(null)}>
          <div style={{ ...s.modal, maxWidth:500 }}>
            <div style={{ ...s.planHead, background: getPlanGradient(selected.code), borderRadius:'1rem 1rem 0 0', position:'relative' }}>
              <ModalClose onClose={() => setSelected(null)} light />
              <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>{getPlanIcon(selected.code)}</div>
              <h2 style={{ color:'#fff', fontWeight:700, fontSize:'1.5rem', marginBottom:4 }}>{selected.name}</h2>
              <span style={s.planCode}>{selected.code}</span>
            </div>
            <div style={s.modalBody}>
              <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
                <span style={{ fontSize:'2rem', fontWeight:700, color: theme.colors.primary }}>
                  {new Intl.NumberFormat('fr-FR',{style:'currency',currency:'XOF',minimumFractionDigits:0}).format(selected.price)}
                </span>
                <span style={{ color:'#64748b' }}>/{selected.duration_text}</span>
              </div>
              {selected.description && <p style={{ color:'#475569', textAlign:'center', marginBottom:'1.5rem', lineHeight:1.6 }}>{selected.description}</p>}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
                {[
                  selected.max_services  && { icon: FiBriefcase, val: selected.max_services,  label: 'Services max' },
                  selected.max_employees && { icon: FiUsers,     val: selected.max_employees, label: 'Employés max' },
                  { icon: FiClock, val: selected.duration_text, label: 'Durée' },
                ].filter(Boolean).map(({ icon: Icon, val, label }) => (
                  <div key={label} style={{ backgroundColor:'#f8fafc', borderRadius:8, padding:'0.75rem', display:'flex', alignItems:'center', gap:8 }}>
                    <Icon size={16} color={theme.colors.primary} />
                    <div><div style={{ fontWeight:700, color:'#0f172a' }}>{val}</div><div style={{ fontSize:'.75rem', color:'#64748b' }}>{label}</div></div>
                  </div>
                ))}
              </div>
              {(selected.features_list || []).map((f,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', backgroundColor:'#f8fafc', borderRadius:6, marginBottom:6, fontSize:'.875rem', color:'#334155' }}>
                  <FiCheckCircle size={14} color="#10b981" />{f}
                </div>
              ))}
            </div>
            <div style={s.modalFoot}>
              <button style={s.btnSecondary} onClick={() => setSelected(null)}>Fermer</button>
              <button style={s.btnPrimary} onClick={() => { setSelected(null); handleSubscribe(selected); }}>
                <FiStar size={14} />Souscrire
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MICRO-COMPOSANTS
// ─────────────────────────────────────────────────────────────────────────────
const Loader = ({ text }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:'1rem' }}>
    <div style={{ width:48, height:48, border:`3px solid #e2e8f0`, borderTop:`3px solid ${theme.colors.primary}`, borderRadius:'50%', animation:'spin 1s linear infinite' }} />
    <p style={{ color:'#64748b' }}>{text}</p>
  </div>
);

const Spinner = () => (
  <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }} />
);

const Overlay = ({ children, onClose }) => (
  <div onClick={onClose} style={{ position:'fixed', inset:0, backgroundColor:'rgba(15,23,42,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem', animation:'fadeIn .2s ease' }}>
    <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:550, maxHeight:'90vh', overflow:'auto' }}>
      {children}
    </div>
  </div>
);

const ModalClose = ({ onClose, light }) => (
  <button onClick={onClose} style={{ position:'absolute', top:'1rem', right:'1rem', background: light ? 'rgba(255,255,255,.2)' : 'none', border:'none', fontSize:'1.75rem', color: light ? '#fff' : '#94a3b8', cursor:'pointer', lineHeight:1, width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
);

const ModalSection = ({ icon: Icon, title, children }) => (
  <div style={{ marginBottom:'1.5rem', paddingBottom:'1.5rem', borderBottom:'1px solid #f1f5f9' }}>
    <h3 style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.85rem', fontWeight:600, color:'#334155', textTransform:'uppercase', letterSpacing:.3, marginBottom:'1rem' }}>
      <Icon size={14} color={theme.colors.primary} />{title}
    </h3>
    {children}
  </div>
);

const StatItem = ({ icon: Icon, val, label }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0.75rem', backgroundColor:'#f8fafc', borderRadius:8 }}>
    <Icon size={16} color={theme.colors.primary} />
    <div><div style={{ fontWeight:700, fontSize:'1rem', color:'#1e293b' }}>{val}</div><div style={{ fontSize:'.75rem', color:'#64748b' }}>{label}</div></div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const P = theme.colors.primary;

const bA = {
  actif:  { display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', backgroundColor:'#d1fae5', color:'#065f46', borderRadius:999, fontSize:'.8rem', fontWeight:500 },
  essai:  { display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', backgroundColor:'#fef3c7', color:'#b45309', borderRadius:999, fontSize:'.8rem', fontWeight:500 },
  expire: { display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', backgroundColor:'#fee2e2', color:'#b91c1c', borderRadius:999, fontSize:'.8rem', fontWeight:500 },
  annule: { display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', backgroundColor:'#f1f5f9', color:'#475569',  borderRadius:999, fontSize:'.8rem', fontWeight:500 },
};

const s = {
  page:    { minHeight:'100vh', backgroundColor:'#f8fafc', padding:'2rem 0' },
  content: { maxWidth:1100, margin:'0 auto', padding:'0 1.5rem' },

  // Toast
  toast: { position:'fixed', top:24, right:24, color:'#fff', padding:'1rem 1.5rem', borderRadius:12, display:'flex', alignItems:'center', gap:12, boxShadow:'0 10px 25px rgba(0,0,0,.15)', zIndex:10000, animation:'slideInRight .3s ease', minWidth:280, fontSize:'.9rem', fontWeight:500 },

  // Header + tabs
  header:   { marginBottom:'1.5rem' },
  title:    { display:'flex', alignItems:'center', gap:12, fontSize:'2rem', fontWeight:700, color:'#0f172a', marginBottom:6 },
  titleIcon:{ fontSize:'2rem', color: P },
  subtitle: { color:'#475569', fontSize:'.95rem' },

  tabs: { display:'flex', gap:4, backgroundColor:'#f1f5f9', borderRadius:12, padding:4, marginBottom:'2rem', width:'fit-content' },
  tab:  { display:'flex', alignItems:'center', gap:8, padding:'.625rem 1.25rem', borderRadius:9, border:'none', backgroundColor:'transparent', color:'#64748b', fontSize:'.9rem', fontWeight:500, cursor:'pointer', transition:'all .2s' },
  tabActive: { backgroundColor:'#fff', color:'#0f172a', fontWeight:600, boxShadow:'0 1px 4px rgba(0,0,0,.08)' },

  // Shared buttons
  refreshBtn: { display:'flex', alignItems:'center', gap:6, padding:'.5rem 1rem', backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:10, color:'#475569', fontSize:'.875rem', fontWeight:500, cursor:'pointer' },
  compareBtn: { display:'flex', alignItems:'center', gap:6, padding:'.5rem 1.25rem', backgroundColor: P, border:'none', borderRadius:10, color:'#fff', fontSize:'.875rem', fontWeight:600, cursor:'pointer' },
  spin: { animation:'spin 1s linear infinite' },

  btnPrimary:   { flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'.875rem', backgroundColor: P, border:'none', borderRadius:10, color:'#fff', fontSize:'.9rem', fontWeight:600, cursor:'pointer' },
  btnSecondary: { flex:1, padding:'.875rem', backgroundColor:'#f1f5f9', color:'#1e293b', border:'1px solid #cbd5e1', borderRadius:10, fontSize:'.9rem', fontWeight:500, cursor:'pointer' },
  btnDanger:    { flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'.875rem', backgroundColor:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:10, fontSize:'.9rem', fontWeight:600, cursor:'pointer' },
  btnOutline:   { flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'.75rem', backgroundColor:'#fff', border:`2px solid ${P}`, borderRadius:8, color: P, fontSize:'.875rem', fontWeight:600, cursor:'pointer' },
  btnSolid:     { flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'.75rem', backgroundColor: P, border:'none', borderRadius:8, color:'#fff', fontSize:'.875rem', fontWeight:600, cursor:'pointer' },
  btnIcon:      { display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, backgroundColor:'#f1f5f9', border:'none', borderRadius:8, cursor:'pointer' },
  btnDetails:   { display:'flex', alignItems:'center', gap:4, padding:'.5rem 1rem', backgroundColor:'#f1f5f9', border:'none', borderRadius:8, color:'#1e293b', fontSize:'.875rem', fontWeight:500, cursor:'pointer' },

  // Summary
  summaryCards:   { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' },
  summaryCard:    { backgroundColor:'#fff', padding:'1.25rem', borderRadius:12, border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:'1rem' },
  summaryIconWrap:{ display:'flex', alignItems:'center', justifyContent:'center', width:44, height:44, backgroundColor:'#f1f5f9', borderRadius:10 },
  summaryLabel:   { fontSize:'.7rem', color:'#64748b', textTransform:'uppercase', letterSpacing:.5 },
  summaryValue:   { fontSize:'1.5rem', fontWeight:600, color:'#0f172a', lineHeight:1.2 },

  // Abonnement card
  abCard:     { backgroundColor:'#fff', borderRadius:16, border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.05)' },
  abCardHead: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.25rem 1.5rem', borderBottom:'1px solid #f1f5f9' },
  abCardIcon: { display:'flex', alignItems:'center', justifyContent:'center', width:48, height:48, borderRadius:12, fontSize:'1.25rem' },
  abCardTitle:{ fontSize:'1.1rem', fontWeight:600, color:'#0f172a', marginBottom:4, display:'flex', alignItems:'center', gap:8 },
  abCardMeta: { display:'flex', alignItems:'center', gap:6, fontSize:'.875rem', color:'#64748b' },
  abCardBody: { padding:'1.5rem' },
  abCardFoot: { display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'1rem', borderTop:'1px solid #f1f5f9' },
  essaiBadge: { backgroundColor:'#fef3c7', color:'#b45309', padding:'2px 8px', borderRadius:12, fontSize:'.65rem', fontWeight:700, textTransform:'uppercase' },

  infoGrid:   { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.25rem' },
  infoItem:   { display:'flex', alignItems:'center', gap:10 },
  infoIconWrap:{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, backgroundColor:'#f8fafc', borderRadius:8 },
  infoLabel:  { fontSize:'.65rem', color:'#64748b', textTransform:'uppercase', letterSpacing:.5, marginBottom:2 },
  infoVal:    { fontSize:'.9rem', fontWeight:500, color:'#0f172a' },
  montant:    { fontSize:'1rem', fontWeight:600, color: P },
  montantGratuit: { fontSize:'.9rem', fontWeight:600, color:'#059669', backgroundColor:'#d1fae5', padding:'4px 12px', borderRadius:999 },

  // Plans
  plansGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'2rem', marginBottom:'2rem' },
  planCard:  { backgroundColor:'#fff', borderRadius:'1rem', overflow:'hidden', boxShadow:'0 4px 6px -1px rgba(0,0,0,.1)', transition:'all .3s', display:'flex', flexDirection:'column', animation:'slideIn .3s ease' },
  planHead:  { position:'relative', padding:'2rem', color:'#fff', textAlign:'center' },
  planBadge: { position:'absolute', top:'1rem', right:'1rem', padding:'3px 12px', backgroundColor:'rgba(255,255,255,.2)', borderRadius:999, fontSize:'.75rem', fontWeight:600, backdropFilter:'blur(4px)' },
  planName:  { fontSize:'1.5rem', fontWeight:700, marginBottom:6, color:'#fff' },
  planCode:  { display:'inline-block', padding:'3px 16px', backgroundColor:'rgba(255,255,255,.2)', borderRadius:999, fontSize:'.75rem', fontWeight:600, color:'#fff' },
  planBody:  { padding:'2rem', flex:1, display:'flex', flexDirection:'column' },
  planPrice: { marginBottom:'1rem', paddingBottom:'1rem', borderBottom:'1px solid #e2e8f0', textAlign:'center' },
  priceAmt:  { fontSize:'2rem', fontWeight:700, color: P },
  pricePeriod:{ fontSize:'.875rem', color:'#64748b' },
  planDesc:  { fontSize:'.875rem', color:'#475569', marginBottom:'1.5rem', lineHeight:1.6, textAlign:'center' },
  planStats: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'0.75rem', marginBottom:'1.5rem' },
  planBtns:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem', marginTop:'auto' },

  // Modal
  modal:     { backgroundColor:'#fff', borderRadius:16, width:'100%', boxShadow:'0 25px 50px rgba(0,0,0,.2)', position:'relative' },
  modalHead: { padding:'1.5rem 1.5rem 1rem', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' },
  modalTitle:{ fontSize:'1.25rem', fontWeight:600, color:'#0f172a', display:'flex', alignItems:'center', gap:8 },
  modalBody: { padding:'1.5rem' },
  modalFoot: { padding:'1.25rem 1.5rem 1.5rem', borderTop:'1px solid #e2e8f0', display:'flex', gap:'1rem' },

  // Comparison table
  cmpTh: { padding:'1rem', textAlign:'center', fontSize:'.875rem', fontWeight:600, color:'#1e293b', borderBottom:'2px solid #e2e8f0' },
  cmpTd: { padding:'.875rem 1rem', textAlign:'center', fontSize:'.875rem', color:'#475569', borderBottom:'1px solid #e2e8f0' },
  cmpIcon:{ display:'flex', alignItems:'center', justifyContent:'center', width:44, height:44, borderRadius:10, fontSize:'1.25rem' },

  // Trial bar
  trialBar:  { height:8, backgroundColor:'#e2e8f0', borderRadius:4, overflow:'hidden', marginBottom:4 },
  trialFill: { height:'100%', backgroundColor:'#f59e0b', borderRadius:4, transition:'width .3s ease' },

  // Misc
  warnBox:    { display:'flex', alignItems:'flex-start', gap:10, padding:'1rem', backgroundColor:'#fef3c7', borderRadius:10, marginBottom:'1.5rem' },
  formLabel:  { display:'block', fontSize:'.875rem', fontWeight:500, color:'#1e293b', marginBottom:6 },
  textarea:   { width:'100%', padding:'.75rem', border:'1px solid #cbd5e1', borderRadius:8, fontSize:'.9rem', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' },

  // CTA banner
  ctaBanner: { marginTop:'2.5rem', backgroundColor:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' },
  ctaTitle:  { fontWeight:600, color:'#0f172a', marginBottom:2 },
  ctaSub:    { fontSize:'.875rem', color:'#64748b' },
  ctaBtn:    { display:'flex', alignItems:'center', gap:6, padding:'.75rem 1.5rem', backgroundColor: P, border:'none', borderRadius:10, color:'#fff', fontSize:'.875rem', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' },

  // Empty
  emptyState: { textAlign:'center', padding:'4rem 2rem', backgroundColor:'#fff', borderRadius:16, border:'1px solid #e2e8f0' },
  emptyTitle: { fontSize:'1.375rem', fontWeight:600, color:'#0f172a', marginTop:'1rem', marginBottom:'.5rem' },
  emptyText:  { color:'#475569', fontSize:'.95rem', marginBottom:'1.5rem' },
  emptyBtn:   { padding:'.75rem 2rem', backgroundColor: P, color:'#fff', border:'none', borderRadius:10, fontSize:'.9rem', fontWeight:600, cursor:'pointer' },
};