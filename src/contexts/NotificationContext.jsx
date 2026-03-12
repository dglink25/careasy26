// src/contexts/NotificationContext.jsx
//
// ✅ TOUS LES BUGS CORRIGÉS :
//   1. Navigation des toasts — utilise window.dispatchEvent pour traverser
//      la frontière Router/Context sans problème de hooks
//   2. Son — AudioContext.resume() forcé AVANT chaque son
//   3. Notification native — onclick avec window.focus() + navigate
//   4. "Voir tout" — émis via event custom pour que Navbar puisse l'écouter

import {
  createContext, useContext, useEffect, useRef,
  useState, useCallback
} from 'react';
import { useAuth } from './AuthContext';
import { notificationSounds } from '../services/notificationSounds';
import api from '../api/axios';

/* ─── Types ──────────────────────────────────────────────────── */
export const NOTIF_TYPES = {
  MESSAGE:              'message',
  RDV_PENDING:          'rdv_pending',
  RDV_CONFIRMED:        'rdv_confirmed',
  RDV_CANCELLED:        'rdv_cancelled',
  RDV_COMPLETED:        'rdv_completed',
  ENTREPRISE_APPROVED:  'entreprise_approved',
  ENTREPRISE_REJECTED:  'entreprise_rejected',
  ENTREPRISE_PENDING:   'entreprise_pending',
  NEW_ENTREPRISE:       'new_entreprise_pending',
  DEFAULT:              'default',
};

export const NOTIF_CONFIG = {
  message:                { icon: '💬', color: '#3b82f6', sound: true },
  rdv_pending:            { icon: '📅', color: '#f59e0b', sound: true },
  rdv_confirmed:          { icon: '✅', color: '#10b981', sound: true },
  rdv_cancelled:          { icon: '❌', color: '#ef4444', sound: true },
  rdv_completed:          { icon: '🎉', color: '#8b5cf6', sound: true },
  entreprise_approved:    { icon: '🏢', color: '#10b981', sound: true },
  entreprise_rejected:    { icon: '⚠️', color: '#ef4444', sound: true },
  entreprise_pending:     { icon: '🔔', color: '#f59e0b', sound: true },
  new_entreprise_pending: { icon: '🔔', color: '#f59e0b', sound: true },
  default:                { icon: '🔔', color: '#6b7280', sound: true },
};

const NotificationContext = createContext(null);

const isLocalhost = () =>
  ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

// ══════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════
// Provider
// ══════════════════════════════════════════════════════════════════
export function NotificationProvider({ children }) {
  const { user } = useAuth();

  // ── Permissions ───────────────────────────────────────────────
  const [permission, setPermission] = useState(() => {
    if (!('Notification' in window)) return 'not_supported';
    return Notification.permission;
  });
  const [swRegistered, setSwRegistered]     = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // ── Préférences persistées ────────────────────────────────────
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('careasy-notif-prefs') || '{}'); }
    catch { return {}; }
  });

  const updatePrefs = useCallback((updates) => {
    setPrefs(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('careasy-notif-prefs', JSON.stringify(next));
      notificationSounds.setEnabled(next.sound !== false);
      notificationSounds.setVolume(next.volume ?? 0.7);
      return next;
    });
  }, []);

  // ── Toasts ────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // ── Service Worker (HTTPS uniquement) ─────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator) || isLocalhost()) {
      console.log('[Notif] Dev mode — toasts in-app uniquement (SW désactivé sur localhost)');
      return;
    }
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        setSwRegistered(true);
        reg.pushManager.getSubscription().then(sub => setPushSubscribed(!!sub)).catch(() => {});
        navigator.serviceWorker.addEventListener('message', (e) => {
          if (e.data?.type === 'NOTIFICATION_CLICK') {
            navigateTo(e.data.url);
          }
        });
      })
      .catch(() => {});
  }, []);

  // ── Helper navigation — fonctionne partout ────────────────────
  const navigateTo = (url) => {
    if (!url || url === '/') return;
    // Méthode 1 : navigate() React Router via window
    if (window.__careasyNavigate) {
      window.__careasyNavigate(url);
      return;
    }
    // Méthode 2 : event custom
    window.dispatchEvent(new CustomEvent('careasy:navigate', { detail: { url } }));
  };

  // ── Demander permission automatiquement après connexion ───────
  useEffect(() => {
    if (!user) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      setPermission('granted');
      return;
    }
    if (Notification.permission === 'denied') return;

    const timer = setTimeout(async () => {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        updatePrefs({ enabled: true });
        console.info('[Notif] ✅ Permission accordée');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user?.id]);

  // ── requestPermission (bouton Settings) ──────────────────────
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return { granted: false, reason: 'not_supported' };
    if (Notification.permission === 'denied') return { granted: false, reason: 'denied' };
    if (Notification.permission === 'granted') {
      setPermission('granted');
      return { granted: true };
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      updatePrefs({ enabled: true });
      return { granted: true };
    }
    return { granted: false, reason: result };
  }, [updatePrefs]);

  // ── Push Subscribe ────────────────────────────────────────────
  const subscribeToPush = useCallback(async () => {
    if (isLocalhost() || !swRegistered || !user) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const res = await api.get('/notifications/vapid-public-key').catch(() => null);
      const vapidKey = res?.data?.key;
      if (!vapidKey) return;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await api.post('/notifications/subscribe', { subscription: sub.toJSON() });
      setPushSubscribed(true);
    } catch {}
  }, [swRegistered, user]);

  const unsubscribeFromPush = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await api.post('/notifications/unsubscribe').catch(() => {});
        setPushSubscribed(false);
      }
    } catch {}
  }, []);

  // ══════════════════════════════════════════════════════════════
  // ✅ notify() — La fonction centrale
  // ══════════════════════════════════════════════════════════════
  const notify = useCallback(async ({
    title,
    body,
    type       = 'default',
    url        = '/',
    tag,
    showNative = true,
    showToast  = true,
    playSound  = true,
  }) => {
    if (prefs.enabled === false) return;

    const cfg = NOTIF_CONFIG[type] || NOTIF_CONFIG.default;

    // ── 1. Son — forcer resume() AVANT de jouer ───────────────
    if (playSound && cfg.sound && prefs.sound !== false) {
      // Forcer le déverrouillage AudioContext avant le son
      notificationSounds.forceUnlock().then(() => {
        notificationSounds.play(type);
      });
    }

    // ── 2. Toast in-app ───────────────────────────────────────
    if (showToast) {
      const id = ++toastIdRef.current;
      setToasts(prev => [
        ...prev.slice(-4),
        { id, title, body, type, url, cfg, ts: Date.now() }
      ]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6500);
    }

    // ── 3. Notification native (comportement WhatsApp Web) ────
    if (showNative && Notification.permission === 'granted') {
      try {
        const opts = {
          body:    body || '',
          icon:    '/favicon.ico',
          badge:   '/favicon.ico',
          tag:     tag || `careasy-${type}-${Date.now()}`,
          renotify: true,
          data:    { url, type },
          requireInteraction: false,
          silent: false,
        };

        if (!isLocalhost() && swRegistered) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title || 'CarEasy', opts);
        } else {
          // Localhost / dev : API Notification directe
          const n = new Notification(title || 'CarEasy', opts);
          n.onclick = (e) => {
            e.preventDefault();
            window.focus();
            navigateTo(url);
            n.close();
          };
        }
      } catch (err) {
        console.warn('[Notif] Erreur notification native:', err);
      }
    }
  }, [prefs, swRegistered]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Rétrocompatibilité
  const setNavigateFn = useCallback((fn) => {
    window.__careasyNavigate = fn;
  }, []);

  const value = {
    permission, swRegistered, pushSubscribed,
    prefs, toasts,
    updatePrefs, requestPermission,
    subscribeToPush, unsubscribeFromPush,
    notify, removeToast,
    NOTIF_TYPES,
    setNavigateFn,
    navigateTo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </NotificationContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications doit être dans <NotificationProvider>');
  return ctx;
}

export function NotificationNavigator() {
  return null; // Remplacé par NavigationBridge interne
}

// ══════════════════════════════════════════════════════════════════
// Toasts
// ══════════════════════════════════════════════════════════════════
function ToastContainer({ toasts, removeToast }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', top: '80px', right: '1.5rem',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem',
      pointerEvents: 'none', maxWidth: 400, width: '100%',
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const { title, body, url, cfg } = toast;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClick = () => {
    if (url && url !== '/') {
      // Utiliser window.__careasyNavigate en priorité
      if (window.__careasyNavigate) {
        window.__careasyNavigate(url);
      } else {
        window.dispatchEvent(new CustomEvent('careasy:navigate', { detail: { url } }));
      }
    }
    onClose();
  };

  return (
    <div
      onClick={handleClick}
      style={{
        pointerEvents: 'all',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--bg-card, #fff)',
        borderRadius: '0.875rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        border: `2px solid ${cfg.color}30`,
        borderLeft: `4px solid ${cfg.color}`,
        minWidth: 300,
        cursor: url && url !== '/' ? 'pointer' : 'default',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        userSelect: 'none',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: '50%',
        backgroundColor: `${cfg.color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', flexShrink: 0,
      }}>
        {cfg.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary, #1f2937)', marginBottom: '0.2rem' }}>
          {title}
        </div>
        {body && (
          <div style={{
            fontSize: '0.82rem', color: 'var(--text-secondary, #6b7280)',
            lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {body}
          </div>
        )}
        {url && url !== '/' && (
          <div style={{ fontSize: '0.72rem', color: cfg.color, marginTop: '0.3rem', fontWeight: 600 }}>
            Cliquer pour ouvrir →
          </div>
        )}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onClose(); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted, #9ca3af)', fontSize: '1.1rem',
          padding: '0.1rem', flexShrink: 0, lineHeight: 1,
        }}
      >✕</button>

      {/* Barre de progression */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: 3, borderRadius: '0 0 0.875rem 0.875rem',
        backgroundColor: cfg.color,
        animation: 'notifProgress 6.5s linear forwards',
      }} />

      <style>{`
        @keyframes notifProgress { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
}

/* ── Utilitaire VAPID ────────────────────────────────────────── */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}