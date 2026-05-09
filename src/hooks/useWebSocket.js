// src/hooks/useWebSocket.js — V4
// Fix : réutilise window.__careasyPusher si déjà créé par useRealtimeNotifications
// Évite les doubles instances qui causent NS_ERROR_WEBSOCKET_CONNECTION_REFUSED
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

let pusherInstance = null;
let currentUserId  = null;

function destroyPusher() {
  if (pusherInstance) {
    try { pusherInstance.disconnect(); } catch (_) {}
    pusherInstance = null;
    currentUserId  = null;
    if (window.__careasyPusher === pusherInstance) {
      delete window.__careasyPusher;
    }
  }
}

function buildPusher(token) {
  // ✅ Réutiliser l'instance créée par useRealtimeNotifications si elle existe
  if (window.__careasyPusher) {
    console.log('[WS] Réutilisation de window.__careasyPusher (évite double instance)');
    return window.__careasyPusher;
  }

  if (!window.Pusher) return null;

  const key     = import.meta.env.VITE_PUSHER_APP_KEY    || '';
  const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'eu';
  const apiUrl  = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
  const authEndpoint = `${apiUrl.replace(/\/api$/, '')}/api/broadcasting/auth`;

  console.log('[WS] Build Pusher → authEndpoint:', authEndpoint);

  const instance = new window.Pusher(key, {
    cluster,
    encrypted: true,
    authEndpoint,
    auth: {
      headers: {
        Authorization:      `Bearer ${token}`,
        Accept:             'application/json',
        'Content-Type':     'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
    },
  });

  instance.connection.bind('connected',    () => console.log('[WS] ✅ Connecté'));
  instance.connection.bind('disconnected', () => console.warn('[WS] ⚠️ Déconnecté'));
  instance.connection.bind('error',        (e) => console.error('[WS] ❌', e));

  window.__careasyPusher = instance;
  console.log('[WS] ✅ Instance Pusher créée et exposée sur window.__careasyPusher');

  return instance;
}

function loadSDK() {
  return new Promise((resolve) => {
    // ✅ Si une instance Pusher existe déjà, pas besoin de charger le SDK
    if (window.__careasyPusher) { resolve(); return; }
    if (window.Pusher) { resolve(); return; }

    const s   = document.createElement('script');
    s.src     = 'https://js.pusher.com/8.2.0/pusher.min.js';
    s.async   = true;
    s.onload  = () => {
      console.log('[WS] SDK chargé');
      resolve();
    };
    s.onerror = () => console.error('[WS] Impossible de charger le SDK');
    document.head.appendChild(s);
  });
}

/**
 * useWebSocket
 * @param {object} opts
 * @param {number|null} opts.conversationId  — écouter un canal conversation précis
 * @param {function}    opts.onNewMessage
 * @param {function}    opts.onTyping        — { user_id, is_typing, conversation_id }
 * @param {function}    opts.onMessagesRead
 * @param {function}    opts.onUserStatus
 */
export function useWebSocket({
  conversationId = null,
  onNewMessage,
  onTyping,
  onMessagesRead,
  onUserStatus,
} = {}) {
  const { user }  = useAuth();
  const channels  = useRef({});
  const cbRef     = useRef({});
  const [wsConnected, setWsConnected] = useState(false);
  const [sdkReady,    setSdkReady]    = useState(!!(window.Pusher || window.__careasyPusher));

  cbRef.current = { onNewMessage, onTyping, onMessagesRead, onUserStatus };

  // ── 1. Charger le SDK (ou détecter instance existante) ─────────────────────
  useEffect(() => {
    // ✅ Si useRealtimeNotifications a déjà créé l'instance, on est prêts
    if (window.__careasyPusher) {
      setSdkReady(true);
      return;
    }
    loadSDK().then(() => setSdkReady(true));
  }, []);

  // ✅ Écouter quand __careasyPusher devient disponible (cas race condition)
  useEffect(() => {
    if (sdkReady) return;
    const interval = setInterval(() => {
      if (window.__careasyPusher || window.Pusher) {
        setSdkReady(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [sdkReady]);

  // ── 2. Canal utilisateur global ─────────────────────────────────────────────
  useEffect(() => {
    if (!sdkReady || !user?.id) return;

    const token = localStorage.getItem('token');
    if (!token) { console.warn('[WS] Pas de token'); return; }

    // Recréer Pusher si l'utilisateur a changé
    if (currentUserId !== user.id && !window.__careasyPusher) {
      destroyPusher();
    }

    if (!pusherInstance) {
      pusherInstance = buildPusher(token);
      currentUserId  = user.id;
    }
    if (!pusherInstance) return;

    const name = `private-user.${user.id}`;
    if (channels.current[name]) return;

    console.log(`[WS] Subscribe → ${name}`);
    const ch = pusherInstance.subscribe(name);
    channels.current[name] = ch;

    ch.bind('pusher:subscription_succeeded', () => {
      setWsConnected(true);
      console.log(`[WS] ✅ ${name} actif`);
    });
    ch.bind('pusher:subscription_error', (s) =>
      console.error(`[WS] ❌ ${name}`, s)
    );

    ch.bind('new-message',      (d) => { console.log('[WS] 📩', d); cbRef.current.onNewMessage?.(d); });
    ch.bind('messages-read',    (d) => cbRef.current.onMessagesRead?.(d));
    ch.bind('user-status',      (d) => cbRef.current.onUserStatus?.(d));
    ch.bind('typing-indicator', (d) => {
      if (d.user_id !== user.id) cbRef.current.onTyping?.(d);
    });

    return () => {
      // ✅ Ne pas unsubscribe si l'instance est partagée avec useRealtimeNotifications
      // car ce hook gère aussi les notifs globales sur ce canal
      if (pusherInstance && pusherInstance !== window.__careasyPusher) {
        pusherInstance.unsubscribe(name);
        delete channels.current[name];
        setWsConnected(false);
      }
    };
  }, [sdkReady, user?.id]);

  // ── 3. Canal conversation active ─────────────────────────────────────────────
  useEffect(() => {
    if (!sdkReady || !conversationId || !user?.id) return;

    // ✅ Utiliser l'instance globale si disponible
    const activePusher = pusherInstance || window.__careasyPusher;
    if (!activePusher) return;

    const name = `private-conversation.${conversationId}`;

    if (channels.current[name]) {
      const ch = channels.current[name];
      ch.unbind('message-sent');
      ch.unbind('typing-indicator');
      ch.bind('message-sent',     (d) => { if (d.sender_id !== user.id) cbRef.current.onNewMessage?.(d); });
      ch.bind('typing-indicator', (d) => { if (d.user_id   !== user.id) cbRef.current.onTyping?.(d); });
      return;
    }

    console.log(`[WS] Subscribe conversation → ${name}`);
    const ch = activePusher.subscribe(name);
    channels.current[name] = ch;

    ch.bind('pusher:subscription_succeeded', () => console.log(`[WS] ✅ conv.${conversationId} actif`));
    ch.bind('pusher:subscription_error',     (s) => console.error(`[WS] ❌ conv.${conversationId}`, s));
    ch.bind('message-sent',     (d) => { if (d.sender_id !== user.id) cbRef.current.onNewMessage?.(d); });
    ch.bind('typing-indicator', (d) => { if (d.user_id   !== user.id) cbRef.current.onTyping?.(d); });

    return () => {
      if (activePusher) activePusher.unsubscribe(name);
      delete channels.current[name];
    };
  }, [sdkReady, conversationId, user?.id]);

  // ── 4. Nettoyage global ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // ✅ Ne détruire que les canaux conversation, pas les canaux globaux
      // (les canaux globaux sont gérés par useRealtimeNotifications)
      Object.keys(channels.current)
        .filter(n => n.startsWith('private-conversation.'))
        .forEach(n => {
          const p = pusherInstance || window.__careasyPusher;
          if (p) p.unsubscribe(n);
        });
      channels.current = {};
    };
  }, []);

  return { wsConnected };
}

export function getPusherInstance() {
  return pusherInstance || window.__careasyPusher;
}