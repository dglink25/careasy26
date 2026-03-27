// src/components/Services/ServiceVisibilityToggle.jsx
// PATCH /services/{id}/toggle-visibility
// Props:
//   serviceId   – ID du service
//   isVisible   – valeur initiale (is_visibility)
//   onToggle    – callback(newValue: boolean)
//   compact     – si true, affiche juste l'icône (pour les cartes)

import { useState } from 'react';
import api from '../../api/axios';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function ServiceVisibilityToggle({ serviceId, isVisible, onToggle, compact = false }) {
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(Boolean(isVisible));

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setLoading(true);
      const { data } = await api.patch(`/services/${serviceId}/toggle-visibility`, {
        is_visibility: !visible,
      });
      const newVal = data.is_visibility;
      setVisible(newVal);
      onToggle?.(newVal);
    } catch (err) {
      console.error('Toggle visibility error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        title={visible ? 'Masquer le service' : 'Rendre visible'}
        style={{
          background: 'none', border: 'none',
          cursor: loading ? 'wait' : 'pointer',
          padding: '0.3rem', borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: visible ? '#10b981' : '#94a3b8',
          transition: 'all 0.2s', opacity: loading ? 0.5 : 1,
        }}
      >
        {visible ? <FiEye size={16} /> : <FiEyeOff size={16} />}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: visible ? '#f0fdf4' : '#f8fafc',
        border: `1.5px solid ${visible ? '#a7f3d0' : '#e2e8f0'}`,
        borderRadius: '999px', cursor: loading ? 'wait' : 'pointer',
        fontSize: '0.85rem', fontWeight: 600,
        color: visible ? '#059669' : '#64748b',
        transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
      }}
    >
      {visible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
      {loading ? 'Chargement...' : (visible ? 'Visible' : 'Masqué')}
    </button>
  );
}