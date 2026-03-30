// src/components/Services/StarRating.jsx
// Composant réutilisable pour afficher la note étoilée d'un service
// Utilise les champs retournés par le backend : average_rating, total_reviews

import React from 'react';

/**
 * @param {number|null} rating   — ex: 4.3
 * @param {number}      total    — ex: 12
 * @param {boolean}     compact  — si true, format compact "★ 4.3 (12)"
 */
export default function StarRating({ rating, total = 0, compact = false }) {
  if (!rating || total === 0) {
    return compact ? null : (
      <div style={styles.noRating}>
        <span style={styles.noRatingText}>Pas encore noté</span>
      </div>
    );
  }

  const rounded = Math.round(rating * 10) / 10; // ex: 4.3

  if (compact) {
    return (
      <div style={styles.compact}>
        <span style={styles.starIcon}>★</span>
        <span style={styles.ratingValue}>{rounded}</span>
        <span style={styles.totalCompact}>({total})</span>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.min(1, Math.max(0, rating - (star - 1)));
          return (
            <span key={star} style={{ position: 'relative', display: 'inline-block', fontSize: '1rem', lineHeight: 1 }}>
              {/* étoile vide (grise) */}
              <span style={{ color: '#e2e8f0' }}>★</span>
              {/* étoile remplie (partiellement) */}
              {fill > 0 && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  overflow: 'hidden',
                  width: `${fill * 100}%`,
                  color: '#f59e0b',
                }}>★</span>
              )}
            </span>
          );
        })}
      </div>
      <span style={styles.ratingText}>{rounded}</span>
      <span style={styles.totalText}>({total} avis)</span>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  stars: {
    display: 'flex',
    gap: '1px',
  },
  ratingText: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#f59e0b',
  },
  totalText: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  compact: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '999px',
    padding: '2px 8px',
  },
  starIcon: {
    color: '#f59e0b',
    fontSize: '0.85rem',
    lineHeight: 1,
  },
  ratingValue: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#92400e',
  },
  totalCompact: {
    fontSize: '0.72rem',
    color: '#b45309',
  },
  noRating: {
    display: 'flex',
    alignItems: 'center',
  },
  noRatingText: {
    fontSize: '0.72rem',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
};