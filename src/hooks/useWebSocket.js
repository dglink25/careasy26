// src/hooks/useWebSocket.js — V3
// Fix : authEndpoint absolu + gestion body vide + reconnexion propre
// Ajout : window.__careasyPusher exposé globalement pour useRealtimeNotifications
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

let pusherInstance  = null;
let currentUserId   = null;

function destroyPusher() {
  if (pusherInstance) {
    try { pusherInstance.disconnect(); } catch (_) {}
    pusherInstance = null;
    currentUserId  = null;
    // ← AJOUT : Nettoyer également la référence globale
    if (window.__careasyPusher) {
      delete window.__careasyPusher;
    }
  }
}

function buildPusher(token) {
  if (!window.Pusher) return null;

  const key    = import.meta.env.VITE_PUSHER_APP_KEY    || '';
  const cluster= import.meta.env.VITE_PUSHER_APP_CLUSTER || 'eu';

  // ✅ authEndpoint ABSOLU vers Laravel (jamais relatif vers Vite)
  const apiUrl      = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
  const laravelBase = apiUrl.replace(/\/api$/, '');
  const authEndpoint = `${laravelBase}/api/broadcasting/auth`;

  console.log('[WS] Build Pusher → authEndpoint:', authEndpoint);

  const instance = new window.Pusher(key, {
    cluster,
    encrypted:    true,
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

  // ← AJOUT : Exposer l'instance globalement pour les autres hooks (notifications)
  window.__careasyPusher = instance;
  console.log('[WS] ✅ Instance Pusher exposée globalement sur window.__careasyPusher');

  return instance;
}

function loadSDK() {
  return new Promise((resolve) => {
    if (window.Pusher) { resolve(); return; }
    const s    = document.createElement('script');
    s.src      = 'https://js.pusher.com/8.2.0/pusher.min.js';
    s.async    = true;
    s.onload   = () => { 
      console.log('[WS] SDK chargé'); 
      resolve(); 
    };
    s.onerror  = () => console.error('[WS] Impossible de charger le SDK');
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
  const cbRef     = useRef({});            // refs stables pour les callbacks
  const [wsConnected, setWsConnected] = useState(false);
  const [sdkReady,    setSdkReady]    = useState(!!window.Pusher);

  // Garder les callbacks à jour sans re-déclencher les effects
  cbRef.current = { onNewMessage, onTyping, onMessagesRead, onUserStatus };

  // ── 1. Charger le SDK ───────────────────────────────────────────────────
  useEffect(() => {
    loadSDK().then(() => setSdkReady(true));
  }, []);

  // ── 2. Canal utilisateur global ─────────────────────────────────────────
  useEffect(() => {
    if (!sdkReady || !user?.id) return;

    const token = localStorage.getItem('token');
    if (!token) { console.warn('[WS] Pas de token'); return; }

    // Recréer Pusher si l'utilisateur a changé
    if (currentUserId !== user.id) destroyPusher();

    if (!pusherInstance) {
      pusherInstance = buildPusher(token);
      currentUserId  = user.id;
    }
    if (!pusherInstance) return;

    const name = `private-user.${user.id}`;
    if (channels.current[name]) return; // déjà abonné

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

    // ── Événements globaux ──
    ch.bind('new-message',      (d) => { console.log('[WS] 📩', d); cbRef.current.onNewMessage?.(d); });
    ch.bind('messages-read',    (d) => cbRef.current.onMessagesRead?.(d));
    ch.bind('user-status',      (d) => cbRef.current.onUserStatus?.(d));
    ch.bind('typing-indicator', (d) => {
      if (d.user_id !== user.id) cbRef.current.onTyping?.(d);
    });

    return () => {
      if (pusherInstance) pusherInstance.unsubscribe(name);
      delete channels.current[name];
      setWsConnected(false);
    };
  }, [sdkReady, user?.id]);

  // ── 3. Canal conversation active ─────────────────────────────────────────
  useEffect(() => {
    if (!sdkReady || !conversationId || !user?.id || !pusherInstance) return;

    const name = `private-conversation.${conversationId}`;

    // Déjà abonné → juste rebinder
    if (channels.current[name]) {
      const ch = channels.current[name];
      ch.unbind('message-sent');
      ch.unbind('typing-indicator');
      ch.bind('message-sent',     (d) => { if (d.sender_id !== user.id) cbRef.current.onNewMessage?.(d); });
      ch.bind('typing-indicator', (d) => { if (d.user_id   !== user.id) cbRef.current.onTyping?.(d); });
      return;
    }

    console.log(`[WS] Subscribe conversation → ${name}`);
    const ch = pusherInstance.subscribe(name);
    channels.current[name] = ch;

    ch.bind('pusher:subscription_succeeded', () => console.log(`[WS] ✅ conv.${conversationId} actif`));
    ch.bind('pusher:subscription_error',     (s) => console.error(`[WS] ❌ conv.${conversationId}`, s));
    ch.bind('message-sent',     (d) => { if (d.sender_id !== user.id) cbRef.current.onNewMessage?.(d); });
    ch.bind('typing-indicator', (d) => { if (d.user_id   !== user.id) cbRef.current.onTyping?.(d); });

    return () => {
      if (pusherInstance) pusherInstance.unsubscribe(name);
      delete channels.current[name];
    };
  }, [sdkReady, conversationId, user?.id]);

  // ── 4. Nettoyage global ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pusherInstance) {
        Object.keys(channels.current).forEach(n => pusherInstance.unsubscribe(n));
      }
      channels.current = {};
      
      // ← AJOUT : Ne pas détruire pusherInstance ici car d'autres hooks peuvent en avoir besoin
      // La destruction n'aura lieu que lors du changement d'utilisateur ou du démontage complet
    };
  }, []);

  return { wsConnected };
}

// ← AJOUT : Export de l'instance pour utilisation directe si nécessaire
export function getPusherInstance() {
  return pusherInstance;
}