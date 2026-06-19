import { useState, useEffect } from 'react';
import { entrepriseApi } from '../../api/entrepriseApi';
import paiementApi from '../../api/paiementApi';
import theme from '../../config/theme';
import {
  FiX, FiCheckCircle, FiAlertTriangle, FiBriefcase,
  FiCreditCard, FiLoader, FiArrowRight
} from 'react-icons/fi';
import { MdOutlineStorefront, MdOutlineVerified } from 'react-icons/md';

export default function PlanCheckoutModal({ isOpen, onClose, plan, onSuccess }) {
  const [entreprises, setEntreprises]     = useState([]);
  const [selectedId, setSelectedId]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [paying, setPaying]               = useState(false);
  const [error, setError]                 = useState('');

  // Charger les entreprises validées du prestataire
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSelectedId(null);
    loadEntreprises();
  }, [isOpen]);

  const loadEntreprises = async () => {
    setLoading(true);
    try {
      const data = await entrepriseApi.getMesEntreprises();
      // Seules les entreprises validées peuvent souscrire
      const validated = (data || []).filter(e => e.status === 'validated');
      setEntreprises(validated);
      if (validated.length === 1) setSelectedId(validated[0].id);
    } catch {
      setError('Impossible de charger vos entreprises.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedId) { setError('Veuillez sélectionner une entreprise.'); return; }
    setPaying(true);
    setError('');
    try {
      const res = await paiementApi.initierPaiement(plan.id, selectedId);
      if (!res.success) throw new Error(res.message || 'Erreur lors de l\'initialisation');

      const paymentUrl = res.data?.payment_url;
      if (paymentUrl) {
        // Redirection vers FedaPay (le callback reviendra sur /paiement/success)
        window.location.href = paymentUrl;
      } else {
        throw new Error('URL de paiement introuvable');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'initialisation du paiement');
      setPaying(false);
    }
  };

  if (!isOpen || !plan) return null;

  const selected = entreprises.find(e => e.id === selectedId);

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.title}><FiCreditCard size={18} /> Souscrire au plan</h2>
            <p style={s.subtitle}>{plan.name} — {formatPrice(plan.price)}</p>
          </div>
          <button onClick={onClose} style={s.closeBtn}><FiX size={20} /></button>
        </div>

        {/* Body */}
        <div style={s.body}>
          {loading ? (
            <div style={s.center}>
              <Spinner /> <span style={s.loadingTxt}>Chargement des entreprises...</span>
            </div>
          ) : entreprises.length === 0 ? (
            <div style={s.emptyBox}>
              <FiAlertTriangle size={32} color="#d97706" />
              <p style={s.emptyTxt}>
                Aucune entreprise validée trouvée.<br />
                Votre entreprise doit être approuvée par un admin avant de souscrire.
              </p>
            </div>
          ) : (
            <>
              <p style={s.label}>Sélectionnez l'entreprise à abonner :</p>
              <div style={s.list}>
                {entreprises.map(e => {
                  const isSelected = e.id === selectedId;
                  const activeSub  = e.abonnement_actif;
                  return (
                    <div
                      key={e.id}
                      style={{ ...s.card, ...(isSelected ? s.cardSelected : {}) }}
                      onClick={() => { setSelectedId(e.id); setError(''); }}
                    >
                      <div style={s.cardLeft}>
                        <div style={{ ...s.iconWrap, backgroundColor: isSelected ? '#dbeafe' : '#f1f5f9' }}>
                          <MdOutlineStorefront size={20} color={isSelected ? theme.colors.primary : '#64748b'} />
                        </div>
                        <div>
                          <p style={s.entName}>{e.name}</p>
                          {activeSub ? (
                            <span style={s.badgeActif}>
                              <MdOutlineVerified size={11} /> Abonné · {activeSub.plan?.name}
                            </span>
                          ) : e.is_in_trial ? (
                            <span style={s.badgeTrial}>Essai en cours</span>
                          ) : (
                            <span style={s.badgeNone}>Aucun abonnement actif</span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div style={s.checkCircle}>
                          <FiCheckCircle size={18} color={theme.colors.primary} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Récapitulatif */}
              {selected && (
                <div style={s.recap}>
                  <p style={s.recapTitle}>Récapitulatif</p>
                  <div style={s.recapRow}><span>Entreprise</span><strong>{selected.name}</strong></div>
                  <div style={s.recapRow}><span>Plan</span><strong>{plan.name}</strong></div>
                  <div style={s.recapRow}><span>Durée</span><strong>{plan.duration_text}</strong></div>
                  <div style={{ ...s.recapRow, marginTop: 8 }}>
                    <span>Montant</span>
                    <strong style={{ color: theme.colors.primary, fontSize: '1.1rem' }}>
                      {formatPrice(plan.price)}
                    </strong>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div style={s.errorBox}>
              <FiAlertTriangle size={15} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <button onClick={onClose} style={s.btnSecondary} disabled={paying}>Annuler</button>
          <button
            onClick={handlePay}
            style={{ ...s.btnPrimary, opacity: (!selectedId || paying || loading) ? 0.6 : 1 }}
            disabled={!selectedId || paying || loading || entreprises.length === 0}
          >
            {paying ? <><Spinner white /> Redirection...</> : <><FiArrowRight size={15} /> Payer {selected ? formatPrice(plan.price) : ''}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (price) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);

const Spinner = ({ white }) => (
  <span style={{
    display: 'inline-block', width: 14, height: 14,
    border: `2px solid ${white ? 'rgba(255,255,255,.35)' : '#cbd5e1'}`,
    borderTopColor: white ? '#fff' : theme.colors.primary,
    borderRadius: '50%', animation: 'spin .7s linear infinite', marginRight: 6
  }} />
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const P = theme.colors?.primary || '#2563eb';

const s = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '1rem', backdropFilter: 'blur(3px)'
  },
  modal: {
    backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 500,
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 25px 60px rgba(0,0,0,.2)', overflow: 'hidden'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0'
  },
  title: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0
  },
  subtitle: { color: '#64748b', fontSize: '.875rem', marginTop: 3 },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#94a3b8', padding: 4, borderRadius: 8
  },
  body:  { padding: '1.5rem', overflowY: 'auto', flex: 1 },
  footer: {
    display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem',
    borderTop: '1px solid #e2e8f0'
  },

  label: { fontSize: '.875rem', fontWeight: 600, color: '#334155', marginBottom: '.75rem' },
  list:  { display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1rem' },

  card: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '.875rem 1rem', border: '2px solid #e2e8f0', borderRadius: 12,
    cursor: 'pointer', transition: 'all .15s'
  },
  cardSelected: { borderColor: P, backgroundColor: '#eff6ff' },
  cardLeft: { display: 'flex', alignItems: 'center', gap: '.75rem' },
  iconWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 40, height: 40, borderRadius: 10
  },
  entName: { fontWeight: 600, fontSize: '.9rem', color: '#0f172a', margin: '0 0 3px' },

  badgeActif:  { display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', backgroundColor:'#d1fae5', color:'#065f46', borderRadius:999, fontSize:'.7rem', fontWeight:500 },
  badgeTrial:  { display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', backgroundColor:'#fef3c7', color:'#b45309', borderRadius:999, fontSize:'.7rem', fontWeight:500 },
  badgeNone:   { display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', backgroundColor:'#f1f5f9', color:'#64748b', borderRadius:999, fontSize:'.7rem', fontWeight:500 },

  checkCircle: { flexShrink: 0 },

  recap: {
    backgroundColor: '#f8fafc', borderRadius: 10,
    padding: '1rem', marginBottom: '.75rem'
  },
  recapTitle: { fontSize: '.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: .4, marginBottom: '.5rem' },
  recapRow: { display: 'flex', justifyContent: 'space-between', fontSize: '.875rem', color: '#475569', marginBottom: 4 },

  errorBox: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '.75rem 1rem', backgroundColor: '#fee2e2', color: '#b91c1c',
    borderRadius: 8, fontSize: '.875rem', marginTop: '.75rem'
  },
  emptyBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '1rem', padding: '2rem', textAlign: 'center'
  },
  emptyTxt: { color: '#64748b', lineHeight: 1.6, margin: 0 },

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '2rem' },
  loadingTxt: { color: '#64748b', fontSize: '.875rem' },

  btnPrimary: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: '.875rem', backgroundColor: P, border: 'none',
    borderRadius: 10, color: '#fff', fontSize: '.9rem', fontWeight: 600, cursor: 'pointer'
  },
  btnSecondary: {
    flex: 1, padding: '.875rem', backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1', borderRadius: 10, color: '#1e293b',
    fontSize: '.9rem', fontWeight: 500, cursor: 'pointer'
  },
};