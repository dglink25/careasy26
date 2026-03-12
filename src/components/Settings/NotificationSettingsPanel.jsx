// src/components/Settings/NotificationSettingsPanel.jsx
// À intégrer dans Settings.jsx — onglet "Notifications" (remplace l'actuel)
// et onglet "Confidentialité" (ajouter la section notifications push)

import { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  FiBell, FiVolume2, FiVolumeX, FiSmartphone, FiGlobe,
  FiCheckCircle, FiAlertTriangle, FiInfo, FiSliders,
} from 'react-icons/fi';
import { notificationSounds } from '../../services/notificationSounds';

export default function NotificationSettingsPanel({ colors: c, notifications, onNotificationChange }) {
  const {
    permission, swRegistered, pushSubscribed,
    prefs, updatePrefs,
    requestPermission, subscribeToPush, unsubscribeFromPush,
    notify, NOTIF_TYPES,
  } = useNotifications();

  const [requesting, setRequesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  /* ── Status badge ────────────────────────────────────────── */
  const statusInfo = (() => {
    if (permission === 'granted' && pushSubscribed)
      return { label: 'Push actif',       color: '#10b981', icon: '✅' };
    if (permission === 'granted')
      return { label: 'In-app seulement', color: '#3b82f6', icon: '💬' };
    if (permission === 'denied')
      return { label: 'Bloqué',           color: '#ef4444', icon: '🚫' };
    return       { label: 'Non configuré', color: '#f59e0b', icon: '⚙️' };
  })();

  /* ── Demander permission ─────────────────────────────────── */
  const handleRequestPermission = async () => {
    setRequesting(true);
    const result = await requestPermission();
    setRequesting(false);
    if (result.granted) {
      setTestResult({ type: 'success', msg: 'Notifications activées !' });
    } else if (result.reason === 'denied') {
      setTestResult({ type: 'error', msg: 'Bloqué. Modifiez les paramètres de votre navigateur.' });
    }
  };

  /* ── Tester ──────────────────────────────────────────────── */
  const handleTest = async (type) => {
    notificationSounds.play(type);
    await notify({
      title: 'Test CarEasy',
      body:  'Ceci est une notification de test.',
      type,
      url:   '/',
      showNative: true,
      showToast:  true,
    });
    setTestResult({ type: 'success', msg: 'Test envoyé !' });
    setTimeout(() => setTestResult(null), 3000);
  };

  const s = {
    section:   { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    title:     { fontSize: '1.5rem', fontWeight: 700, color: c?.text || 'var(--text-primary)', marginBottom: '.5rem' },
    card:      { backgroundColor: c?.bgSec || 'var(--bg-secondary)', borderRadius: '.875rem', padding: '1.25rem', border: `1px solid ${c?.border || 'var(--border-color)'}` },
    row:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' },
    label:     { fontSize: '.95rem', fontWeight: 600, color: c?.text || 'var(--text-primary)', marginBottom: '.2rem' },
    desc:      { fontSize: '.8rem', color: c?.textSec || 'var(--text-secondary)' },
    badge:     (color) => ({ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.3rem .8rem', borderRadius: 999, backgroundColor: `${color}20`, color, fontSize: '.8rem', fontWeight: 700 }),
    btn:       (color, bg) => ({ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.25rem', backgroundColor: bg || color, color: bg ? color : '#fff', border: bg ? `2px solid ${color}` : 'none', borderRadius: '.65rem', cursor: 'pointer', fontWeight: 600, fontSize: '.875rem', transition: 'all .2s', whiteSpace: 'nowrap' }),
    sliderWrap:{ display: 'flex', alignItems: 'center', gap: '1rem' },
    slider:    { flex: 1, accentColor: c?.brand || 'var(--brand-primary)', height: 4 },
    grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '.75rem' },
    testBtn:   (color) => ({ padding: '.6rem 1rem', backgroundColor: `${color}15`, color, border: `1.5px solid ${color}40`, borderRadius: '.5rem', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, transition: 'all .2s' }),
  };

  return (
    <div style={s.section}>
      <h2 style={s.title}>Préférences de notifications</h2>

      {/* ── Statut global ── */}
      <div style={{ ...s.card, borderLeft: `4px solid ${statusInfo.color}` }}>
        <div style={s.row}>
          <div>
            <div style={s.label}>Statut des notifications</div>
            <div style={s.desc}>État actuel de vos notifications push</div>
          </div>
          <span style={s.badge(statusInfo.color)}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>

        {permission !== 'granted' && (
          <button
            onClick={handleRequestPermission}
            disabled={requesting || permission === 'denied'}
            style={{ ...s.btn('#3b82f6'), marginTop: '1rem', opacity: permission === 'denied' ? .5 : 1 }}
          >
            <FiBell />
            {requesting ? 'Demande en cours...' :
             permission === 'denied' ? 'Bloqué par le navigateur' :
             'Activer les notifications push'}
          </button>
        )}

        {permission === 'denied' && (
          <p style={{ marginTop: '.75rem', fontSize: '.8rem', color: '#ef4444', padding: '.75rem', backgroundColor: '#fee2e2', borderRadius: '.5rem' }}>
            <FiAlertTriangle style={{ marginRight: '.4rem' }} />
            Pour débloquer : Paramètres navigateur → Confidentialité → Notifications → Autoriser pour ce site
          </p>
        )}

        {permission === 'granted' && !pushSubscribed && (
          <button onClick={subscribeToPush} style={{ ...s.btn('#10b981'), marginTop: '1rem' }}>
            <FiSmartphone /> Activer les push background
          </button>
        )}

        {permission === 'granted' && pushSubscribed && (
          <button onClick={unsubscribeFromPush} style={{ ...s.btn('#ef4444', '#fee2e2'), marginTop: '1rem' }}>
            <FiVolumeX /> Désactiver les push background
          </button>
        )}
      </div>

      {testResult && (
        <div style={{
          padding: '.875rem 1rem', borderRadius: '.65rem',
          backgroundColor: testResult.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: testResult.type === 'success' ? '#059669' : '#dc2626',
          fontWeight: 600, fontSize: '.875rem', display: 'flex', alignItems: 'center', gap: '.5rem'
        }}>
          {testResult.type === 'success' ? <FiCheckCircle /> : <FiAlertTriangle />}
          {testResult.msg}
        </div>
      )}

      {/* ── Canaux ── */}
      <div style={s.card}>
        <div style={{ ...s.label, marginBottom: '1rem' }}>Canaux de notification</div>
        {[
          { key: 'email', title: 'Email',    desc: 'Notifications par email',      icon: '📧' },
          { key: 'push',  title: 'Push App', desc: 'Notifications dans le navigateur', icon: '🔔' },
          { key: 'sms',   title: 'SMS',      desc: 'Notifications par SMS',        icon: '📱' },
        ].map(({ key, title, desc, icon }) => (
          <div key={key} style={{ ...s.row, paddingBottom: '.875rem', marginBottom: '.875rem', borderBottom: `1px solid ${c?.border || 'var(--border-color)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{icon}</span>
              <div>
                <div style={s.label}>{title}</div>
                <div style={s.desc}>{desc}</div>
              </div>
            </div>
            <Toggle checked={notifications[key]} onChange={v => onNotificationChange(key, v)} brand={c?.brand || 'var(--brand-primary)'} />
          </div>
        ))}
      </div>

      {/* ── Son ── */}
      <div style={s.card}>
        <div style={{ ...s.row, marginBottom: '1rem' }}>
          <div>
            <div style={s.label}>Sons de notification</div>
            <div style={s.desc}>Jouer un son à chaque notification</div>
          </div>
          <Toggle
            checked={prefs.sound !== false}
            onChange={v => updatePrefs({ sound: v })}
            brand={c?.brand || 'var(--brand-primary)'}
          />
        </div>

        {prefs.sound !== false && (
          <div style={s.sliderWrap}>
            <FiVolumeX size={18} color={c?.textSec || 'var(--text-secondary)'} />
            <input
              type="range" min="0" max="1" step="0.1"
              value={prefs.volume ?? 0.6}
              onChange={e => {
                const v = parseFloat(e.target.value);
                updatePrefs({ volume: v });
                notificationSounds.setVolume(v);
              }}
              style={s.slider}
            />
            <FiVolume2 size={18} color={c?.brand || 'var(--brand-primary)'} />
          </div>
        )}
      </div>

      {/* ── Tests ── */}
      <div style={s.card}>
        <div style={{ ...s.label, marginBottom: '.5rem' }}>
          <FiSliders style={{ marginRight: '.5rem' }} />Tester les sons & notifications
        </div>
        <div style={s.desc}>Cliquez pour prévisualiser chaque type</div>
        <div style={{ ...s.grid, marginTop: '1rem' }}>
          {[
            { type: 'message',             label: '💬 Message',    color: '#3b82f6' },
            { type: 'rdv_confirmed',       label: '✅ RDV confirmé', color: '#10b981' },
            { type: 'rdv_cancelled',       label: '❌ RDV annulé',  color: '#ef4444' },
            { type: 'entreprise_approved', label: '🏢 Validé',      color: '#10b981' },
            { type: 'entreprise_rejected', label: '⚠️ Rejeté',      color: '#ef4444' },
            { type: 'default',             label: '🔔 Défaut',      color: '#6b7280' },
          ].map(({ type, label, color }) => (
            <button key={type} onClick={() => handleTest(type)} style={s.testBtn(color)}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, brand }) {
  return (
    <button
      role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center',
        width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
        backgroundColor: checked ? brand : 'var(--switch-off, #d1d5db)',
        transition: 'background-color .3s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', left: checked ? 26 : 4,
        width: 20, height: 20, borderRadius: '50%',
        backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.3)',
        transition: 'left .3s',
      }} />
    </button>
  );
}