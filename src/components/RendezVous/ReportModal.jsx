// src/components/RendezVous/ReportModal.jsx
// Signaler un service après avoir déjà soumis un avis
// Appel : POST /reviews/{rendezVousId}/report

import { useState } from 'react';
import api from '../../api/axios';
import { FiX, FiAlertTriangle, FiSend } from 'react-icons/fi';

const REASONS = [
  'Service non conforme à la description',
  'Prestataire non présentable ou impoli',
  'Escroquerie ou fraude',
  'Rendez-vous non honoré',
  'Problème de qualité grave',
  'Autre',
];

export default function ReportModal({ rendezVous, onClose, onSuccess }) {
  const [reason, setReason]   = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) { setError('Veuillez sélectionner une raison.'); return; }

    try {
      setLoading(true);
      setError('');
      const { data } = await api.post(`/reviews/${rendezVous.id}/report`, {
        reason,
        details: details.trim() || null,
      });
      onSuccess?.(data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors du signalement.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.headerIcon}><FiAlertTriangle /></div>
          <div>
            <h2 style={s.title}>Signaler ce service</h2>
            <p style={s.subtitle}>{rendezVous?.service?.name}</p>
          </div>
          <button onClick={onClose} style={s.closeBtn}><FiX /></button>
        </div>

        <p style={s.intro}>
          Votre signalement sera examiné par notre équipe. Soyez précis pour
          nous aider à traiter votre demande efficacement.
        </p>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ padding: '0 1.5rem 1.5rem' }}>
          <div style={s.formGroup}>
            <label style={s.label}>Raison du signalement *</label>
            <div style={s.reasonList}>
              {REASONS.map((r) => (
                <label key={r} style={{ ...s.reasonItem, ...(reason === r ? s.reasonItemActive : {}) }}>
                  <input
                    type="radio" name="reason" value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    style={{ display: 'none' }}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={s.formGroup}>
            <label style={s.label}>Détails supplémentaires</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Décrivez le problème en détail..."
              maxLength={500}
              rows={3}
              style={s.textarea}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !reason}
            style={{
              ...s.submitBtn,
              opacity: (loading || !reason) ? 0.6 : 1,
              cursor: (loading || !reason) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Envoi...' : <><FiSend /> Envoyer le signalement</>}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1300, padding: '1rem',
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '20px', width: '100%',
    maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
    animation: 'reviewIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9',
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: '50%', backgroundColor: '#fef3c7',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#f59e0b', fontSize: '1.1rem', flexShrink: 0,
  },
  title: { fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0, flex: 1 },
  subtitle: { fontSize: '0.8rem', color: '#64748b' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem' },
  intro: { padding: '0.875rem 1.5rem', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, margin: 0 },
  errorBox: {
    margin: '0 1.5rem 0.75rem', padding: '0.75rem 1rem',
    backgroundColor: '#fef2f2', borderRadius: '10px',
    color: '#dc2626', fontSize: '0.875rem',
  },
  formGroup: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' },
  reasonList: { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  reasonItem: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.625rem 1rem', borderRadius: '10px', cursor: 'pointer',
    border: '2px solid #e2e8f0', fontSize: '0.875rem', color: '#475569',
    transition: 'all 0.15s',
  },
  reasonItemActive: {
    borderColor: '#f59e0b', backgroundColor: '#fffbeb', color: '#b45309', fontWeight: 600,
  },
  textarea: {
    width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0',
    borderRadius: '10px', fontSize: '0.875rem', resize: 'vertical',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    width: '100%', padding: '0.875rem', backgroundColor: '#f59e0b', color: '#fff',
    border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 600,
  },
};