// src/components/RendezVous/ReviewModal.jsx
// Affiche un modal pour soumettre une note (1-5 étoiles) + commentaire
// Appel : POST /reviews/{rendezVousId}

import { useState } from 'react';
import api from '../../api/axios';
import { FiX, FiStar, FiSend, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function ReviewModal({ rendezVous, onClose, onSuccess }) {
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Veuillez sélectionner une note.'); return; }

    try {
      setLoading(true);
      setError('');
      const { data } = await api.post(`/reviews/${rendezVous.id}`, {
        rating,
        comment: comment.trim() || null,
      });
      onSuccess?.(data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'envoi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const starLabel = ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent'];

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.title}>Votre avis</h2>
            <p style={s.subtitle}>{rendezVous?.service?.name}</p>
          </div>
          <button onClick={onClose} style={s.closeBtn}><FiX /></button>
        </div>

        {/* Service info */}
        <div style={s.serviceInfo}>
          <div style={s.serviceAvatar}>
            {rendezVous?.entreprise?.logo
              ? <img src={rendezVous.entreprise.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>
                  {rendezVous?.entreprise?.name?.charAt(0)}
                </span>
            }
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>
              {rendezVous?.entreprise?.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {rendezVous?.date ? new Date(rendezVous.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
            </div>
          </div>
        </div>

        {error && (
          <div style={s.errorBox}>
            <FiAlertCircle /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Étoiles */}
          <div style={s.starsSection}>
            <p style={s.starsLabel}>Note globale</p>
            <div style={s.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  style={{
                    ...s.star,
                    color: star <= (hovered || rating) ? '#f59e0b' : '#e2e8f0',
                    transform: star <= (hovered || rating) ? 'scale(1.2)' : 'scale(1)',
                  }}
                >
                  <FiStar style={{ fill: star <= (hovered || rating) ? '#f59e0b' : 'none' }} />
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p style={s.starHint}>{starLabel[hovered || rating]}</p>
            )}
          </div>

          {/* Commentaire */}
          <div style={s.formGroup}>
            <label style={s.label}>Commentaire (optionnel)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec ce service..."
              maxLength={500}
              rows={4}
              style={s.textarea}
            />
            <p style={s.charCount}>{comment.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={loading || rating === 0}
            style={{
              ...s.submitBtn,
              opacity: (loading || rating === 0) ? 0.6 : 1,
              cursor: (loading || rating === 0) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Envoi...' : <><FiSend /> Envoyer mon avis</>}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1200, padding: '1rem',
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '20px', width: '100%',
    maxWidth: '460px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
    animation: 'reviewIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #f1f5f9',
  },
  title: { fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  subtitle: { fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#94a3b8', fontSize: '1.25rem', padding: '0.25rem',
  },
  serviceInfo: {
    display: 'flex', alignItems: 'center', gap: '0.875rem',
    padding: '1rem 1.5rem', backgroundColor: '#f8fafc',
  },
  serviceAvatar: {
    width: 44, height: 44, borderRadius: '10px', overflow: 'hidden',
    backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    margin: '0 1.5rem', padding: '0.75rem 1rem', backgroundColor: '#fef2f2',
    borderRadius: '10px', color: '#dc2626', fontSize: '0.875rem', fontWeight: 500,
  },
  starsSection: { padding: '1.25rem 1.5rem 0.75rem', textAlign: 'center' },
  starsLabel: { fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' },
  stars: { display: 'flex', justifyContent: 'center', gap: '0.5rem' },
  star: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '2rem', transition: 'all 0.15s ease', padding: '0.25rem',
  },
  starHint: { fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600, marginTop: '0.5rem' },
  formGroup: { padding: '0.75rem 1.5rem' },
  label: { display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' },
  textarea: {
    width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0',
    borderRadius: '10px', fontSize: '0.9rem', resize: 'vertical',
    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  charCount: { fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right', marginTop: '0.25rem' },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    width: 'calc(100% - 3rem)', margin: '0.5rem 1.5rem 1.5rem',
    padding: '0.875rem', backgroundColor: '#ef4444', color: '#fff',
    border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 600,
    transition: 'all 0.2s',
  },
};