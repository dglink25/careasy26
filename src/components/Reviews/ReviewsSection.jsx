// src/components/Reviews/ReviewsSection.jsx
// Carrousel d'avis clients avec défilement automatique + modal "Voir tous"
// Usage: <ReviewsSection serviceId={id} />

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';
import {
  FiStar,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiUser,
  FiMessageSquare,
  FiTrendingUp,
  FiAward,
} from 'react-icons/fi';

/* ─── helpers ──────────────────────────────────────────────────────────── */
const AUTOPLAY_INTERVAL = 4500;

const StarRow = ({ rating, size = 14, color = '#f59e0b' }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <FiStar
        key={s}
        size={size}
        style={{
          color: s <= rating ? color : '#e2e8f0',
          fill: s <= rating ? color : 'none',
          flexShrink: 0,
        }}
      />
    ))}
  </div>
);

const Avatar = ({ name, size = 40 }) => {
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: colors[idx] + '22',
        border: `2px solid ${colors[idx]}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors[idx],
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
};

const RatingBar = ({ label, value, max, total }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: '#64748b', width: 24, textAlign: 'right' }}>{label}</span>
      <FiStar size={11} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
      <div style={{ flex: 1, height: 6, backgroundColor: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: '#f59e0b',
            borderRadius: 99,
            transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: '#94a3b8', width: 24 }}>{value}</span>
    </div>
  );
};

/* ─── main component ────────────────────────────────────────────────────── */
export default function ReviewsSection({ serviceId }) {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [current, setCurrent]   = useState(0);
  const [paused, setPaused]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const MODAL_PER_PAGE = 6;

  const timerRef = useRef(null);
  const carouselRef = useRef(null);

  /* fetch */
  useEffect(() => {
    if (!serviceId) return;
    setLoading(true);
    api
      .get(`/services/${serviceId}/reviews`)
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : r.data?.reviews || [];
        setReviews(data);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [serviceId]);

  /* autoplay */
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (reviews.length > 1 && !paused) {
      timerRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % reviews.length);
      }, AUTOPLAY_INTERVAL);
    }
  }, [reviews.length, paused]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const goTo = (idx) => {
    setCurrent(idx);
    setPaused(true);
    clearInterval(timerRef.current);
    setTimeout(() => setPaused(false), 8000);
  };
  const prev = () => goTo((current - 1 + reviews.length) % reviews.length);
  const next = () => goTo((current + 1) % reviews.length);

  /* stats */
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  /* modal pagination */
  const modalReviews = reviews.slice((modalPage - 1) * MODAL_PER_PAGE, modalPage * MODAL_PER_PAGE);
  const totalPages   = Math.ceil(reviews.length / MODAL_PER_PAGE);

  /* ─── empty / loading ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={s.section}>
        <div style={s.sectionHead}>
          <FiMessageSquare style={{ color: '#ef4444' }} />
          <h2 style={s.sectionTitle}>Avis clients</h2>
        </div>
        <div style={s.skeleton}>
          {[1, 2].map((i) => (
            <div key={i} style={s.skeletonCard}>
              <div style={s.skeletonLine} />
              <div style={{ ...s.skeletonLine, width: '60%', marginTop: 8 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div style={s.section}>
        <div style={s.sectionHead}>
          <FiMessageSquare style={{ color: '#ef4444' }} />
          <h2 style={s.sectionTitle}>Avis clients</h2>
        </div>
        <div style={s.empty}>
          <FiStar size={32} style={{ color: '#e2e8f0' }} />
          <p style={s.emptyText}>Aucun avis pour l'instant.</p>
          <p style={s.emptySubText}>Soyez le premier à donner votre avis après votre rendez-vous.</p>
        </div>
      </div>
    );
  }

  const rev = reviews[current];

  return (
    <div style={s.section}>
      {/* ── header ── */}
      <div style={s.sectionHead}>
        <FiMessageSquare style={{ color: '#ef4444' }} />
        <h2 style={s.sectionTitle}>Avis clients</h2>
        <div style={s.badge}>{reviews.length} avis</div>
        <button style={s.seeAllBtn} onClick={() => { setShowModal(true); setModalPage(1); }}>
          Voir tous
        </button>
      </div>

      {/* ── stats strip ── */}
      <div style={s.statsStrip}>
        <div style={s.bigRating}>
          <span style={s.bigRatingNum}>{avg}</span>
          <div>
            <StarRow rating={Math.round(avg)} size={16} />
            <span style={s.ratingLabel}>{reviews.length} évaluation{reviews.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div style={s.bars}>
          {distribution.map(({ star, count }) => (
            <RatingBar key={star} label={star} value={count} max={reviews.length} total={reviews.length} />
          ))}
        </div>

        <div style={s.topStat}>
          <FiAward size={20} style={{ color: '#10b981' }} />
          <div>
            <span style={s.topStatNum}>
              {((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100).toFixed(0)}%
            </span>
            <span style={s.topStatLabel}>clients satisfaits</span>
          </div>
        </div>
      </div>

      {/* ── carousel ── */}
      <div
        style={s.carouselOuter}
        ref={carouselRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* card */}
        <div style={s.card} key={current}>
          <div style={s.cardTop}>
            <Avatar name={rev.client?.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.clientName}>{rev.client?.name || 'Anonyme'}</div>
              <div style={s.reviewDate}>
                {rev.created_at
                  ? new Date(rev.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })
                  : ''}
              </div>
            </div>
            <StarRow rating={rev.rating} size={15} />
          </div>

          {rev.comment ? (
            <p style={s.comment}>
              <FiMessageSquare size={13} style={{ color: '#cbd5e1', marginRight: 6, flexShrink: 0, marginTop: 2 }} />
              {rev.comment}
            </p>
          ) : (
            <p style={s.noComment}>Aucun commentaire laissé.</p>
          )}

          <div style={s.ratingPill}>
            <FiStar size={12} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
            {rev.rating}/5
          </div>
        </div>

        {/* nav */}
        {reviews.length > 1 && (
          <>
            <button style={{ ...s.navBtn, left: 0 }} onClick={prev} aria-label="Précédent">
              <FiChevronLeft size={18} />
            </button>
            <button style={{ ...s.navBtn, right: 0 }} onClick={next} aria-label="Suivant">
              <FiChevronRight size={18} />
            </button>
          </>
        )}

        {/* dots */}
        {reviews.length > 1 && (
          <div style={s.dots}>
            {reviews.map((_, i) => (
              <button
                key={i}
                style={{ ...s.dot, ...(i === current ? s.dotActive : {}) }}
                onClick={() => goTo(i)}
                aria-label={`Avis ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* progress bar */}
        {reviews.length > 1 && !paused && (
          <div style={s.progressTrack}>
            <div
              key={current}
              style={{
                ...s.progressFill,
                animation: `reviewProgress ${AUTOPLAY_INTERVAL}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>

      {/* ─────────────────── MODAL ─────────────────── */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            {/* modal header */}
            <div style={s.modalHead}>
              <div>
                <h3 style={s.modalTitle}>Tous les avis</h3>
                <p style={s.modalSub}>{reviews.length} évaluation{reviews.length > 1 ? 's' : ''} • Moyenne {avg}/5</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <StarRow rating={Math.round(avg)} size={16} />
                <button style={s.closeBtn} onClick={() => setShowModal(false)} aria-label="Fermer">
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* modal stats */}
            <div style={s.modalStats}>
              <div style={s.modalAvg}>
                <span style={s.modalAvgNum}>{avg}</span>
                <StarRow rating={Math.round(avg)} size={18} />
              </div>
              <div style={{ flex: 1 }}>
                {distribution.map(({ star, count }) => (
                  <RatingBar key={star} label={star} value={count} max={reviews.length} total={reviews.length} />
                ))}
              </div>
            </div>

            {/* review list */}
            <div style={s.modalList}>
              {modalReviews.map((r, i) => (
                <div key={r.id || i} style={s.modalCard}>
                  <div style={s.cardTop}>
                    <Avatar name={r.client?.name} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={s.clientName}>{r.client?.name || 'Anonyme'}</div>
                      <div style={s.reviewDate}>
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: 'long', year: 'numeric',
                            })
                          : ''}
                      </div>
                    </div>
                    <div style={s.ratingPill}>
                      <FiStar size={11} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                      {r.rating}/5
                    </div>
                  </div>
                  {r.comment && <p style={s.modalComment}>{r.comment}</p>}
                </div>
              ))}
            </div>

            {/* pagination */}
            {totalPages > 1 && (
              <div style={s.pagination}>
                <button
                  style={{ ...s.pageBtn, opacity: modalPage === 1 ? 0.4 : 1 }}
                  disabled={modalPage === 1}
                  onClick={() => setModalPage((p) => p - 1)}
                >
                  <FiChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    style={{ ...s.pageBtn, ...(p === modalPage ? s.pageBtnActive : {}) }}
                    onClick={() => setModalPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  style={{ ...s.pageBtn, opacity: modalPage === totalPages ? 0.4 : 1 }}
                  disabled={modalPage === totalPages}
                  onClick={() => setModalPage((p) => p + 1)}
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes reviewProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── styles ────────────────────────────────────────────────────────────── */
const s = {
  section: {
    marginTop: '2rem',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
    flex: 1,
  },
  badge: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.25rem 0.75rem',
    borderRadius: 999,
  },
  seeAllBtn: {
    background: 'none',
    border: '1.5px solid #ef4444',
    color: '#ef4444',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '0.35rem 1rem',
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  statsStrip: {
    display: 'flex',
    gap: '1.5rem',
    padding: '1.25rem',
    backgroundColor: '#fff',
    borderRadius: '1rem',
    border: '1px solid #f1f5f9',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  bigRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    paddingRight: '1.5rem',
    borderRight: '1px solid #f1f5f9',
  },
  bigRatingNum: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#1e293b',
    lineHeight: 1,
  },
  ratingLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: 4,
    display: 'block',
  },
  bars: {
    flex: 1,
    minWidth: 160,
  },
  topStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    paddingLeft: '1.5rem',
    borderLeft: '1px solid #f1f5f9',
  },
  topStatNum: {
    display: 'block',
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#10b981',
  },
  topStatLabel: {
    display: 'block',
    fontSize: '0.72rem',
    color: '#64748b',
  },

  carouselOuter: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: '1rem',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  card: {
    padding: '1.5rem',
    animation: 'cardIn 0.4s ease',
    minHeight: 140,
  },
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.875rem',
    marginBottom: '1rem',
  },
  clientName: {
    fontWeight: 700,
    color: '#1e293b',
    fontSize: '0.95rem',
  },
  reviewDate: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: 2,
  },
  comment: {
    display: 'flex',
    alignItems: 'flex-start',
    color: '#475569',
    fontSize: '0.925rem',
    lineHeight: 1.7,
    margin: 0,
    fontStyle: 'italic',
  },
  noComment: {
    color: '#cbd5e1',
    fontSize: '0.85rem',
    fontStyle: 'italic',
    margin: 0,
  },
  ratingPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    color: '#b45309',
    fontSize: '0.78rem',
    fontWeight: 700,
    padding: '0.25rem 0.6rem',
    borderRadius: 999,
    border: '1px solid #fde68a',
    marginTop: '0.875rem',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '50%',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    zIndex: 2,
    transition: 'all 0.2s',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: '1rem',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#e2e8f0',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.2s',
  },
  dotActive: {
    backgroundColor: '#ef4444',
    width: 20,
    borderRadius: 3,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#f1f5f9',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    width: 0,
  },

  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '2.5rem',
    backgroundColor: '#fff',
    borderRadius: '1rem',
    border: '2px dashed #e2e8f0',
    textAlign: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontWeight: 600,
    margin: 0,
  },
  emptySubText: {
    color: '#cbd5e1',
    fontSize: '0.85rem',
    margin: 0,
  },
  skeleton: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '1rem',
    padding: '1.5rem',
    border: '1px solid #f1f5f9',
  },
  skeletonLine: {
    height: 14,
    backgroundColor: '#e2e8f0',
    borderRadius: 7,
    width: '80%',
    animation: 'pulse 1.5s ease-in-out infinite',
  },

  /* modal */
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1400,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '1.25rem',
    width: '100%',
    maxWidth: '680px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
  },
  modalHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '1.5rem',
    borderBottom: '1px solid #f1f5f9',
    gap: '1rem',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
  },
  modalSub: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginTop: 4,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: 4,
    borderRadius: 6,
    display: 'flex',
  },
  modalStats: {
    display: 'flex',
    gap: '1.5rem',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #f1f5f9',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalAvg: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  modalAvgNum: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#1e293b',
    lineHeight: 1,
  },
  modalList: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  modalCard: {
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.875rem',
    border: '1px solid #f1f5f9',
  },
  modalComment: {
    color: '#475569',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    margin: '0.75rem 0 0',
    fontStyle: 'italic',
    paddingLeft: '0.5rem',
    borderLeft: '3px solid #fee2e2',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    padding: '1rem',
    borderTop: '1px solid #f1f5f9',
    flexShrink: 0,
  },
  pageBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    color: '#475569',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
  pageBtnActive: {
    backgroundColor: '#ef4444',
    color: '#fff',
    borderColor: '#ef4444',
  },
};