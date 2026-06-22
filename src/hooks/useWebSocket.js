// src/hooks/useWebSocket.js — V5
// Utilise usePusherSingleton : une seule connexion WebSocket, partagée avec
// useRealtimeNotifications. Fin des NS_ERROR_WEBSOCKET_CONNECTION_REFUSED.
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPusher } from './usePusherSingleton';

/**
 * useWebSocket
 *
 * S'abonne à :
 *   - private-user.{userId}          → new-message, messages-read, user-status,
 *                                       typing-indicator, recording-indicator
 *   - private-conversation.{convId}  → message-sent, typing-indicator,
 *                                       recording-indicator  (si conversationId fourni)
 *
 * @param {object}   opts
 * @param {number|null} opts.conversationId
 * @param {function} opts.onNewMessage
 * @param {function} opts.onTyping           — { user_id, is_typing, conversation_id }
 * @param {function} opts.onRecording        — { user_id, is_recording, conversation_id }
 * @param {function} opts.onMessagesRead
 * @param {function} opts.onUserStatus
 */
export function useWebSocket({
  conversationId = null,
  onNewMessage,
  onTyping,
  onRecording,
  onMessagesRead,
  onUserStatus,
} = {}) {
  const { user } = useAuth();

  // Callbacks dans une ref → pas besoin de re-subscribe quand ils changent
  const cbRef = useRef({});
  cbRef.current = { onNewMessage, onTyping, onRecording, onMessagesRead, onUserStatus };

  const [wsConnected, setWsConnected] = useState(false);

  // Refs des canaux en cours
  const userChanRef = useRef(null);
  const convChanRef = useRef(null);
  const pusherRef   = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const bindUserChannel = useCallback((ch, userId) => {
    ch.bind('new-message', (d) => {
      if (import.meta.env.DEV) console.log('[WS] 📩 new-message', d);
      cbRef.current.onNewMessage?.(d);
    });

    ch.bind('messages-read', (d) => {
      cbRef.current.onMessagesRead?.(d);
    });

    ch.bind('user-status', (d) => {
      cbRef.current.onUserStatus?.(d);
    });

    ch.bind('typing-indicator', (d) => {
      // Ignorer ses propres events
      if (String(d.user_id) === String(userId)) return;
      cbRef.current.onTyping?.(d);
    });

    ch.bind('recording-indicator', (d) => {
      if (String(d.user_id) === String(userId)) return;
      cbRef.current.onRecording?.(d);
    });
  }, []);

  const bindConvChannel = useCallback((ch, userId) => {
    ch.bind('message-sent', (d) => {
      // Ne pas filtrer l'émetteur ici : il a besoin de confirmer son message temporaire
      // La déduplication par ID dans handleWsNewMessage empêche les doublons
      cbRef.current.onNewMessage?.(d);
    });

    ch.bind('typing-indicator', (d) => {
      if (String(d.user_id) === String(userId)) return;
      cbRef.current.onTyping?.(d);
    });

    ch.bind('recording-indicator', (d) => {
      if (String(d.user_id) === String(userId)) return;
      cbRef.current.onRecording?.(d);
    });
  }, []);

  // ── Canal utilisateur global ───────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    (async () => {
      const pusher = await getPusher(user.id);
      if (!pusher || cancelled) return;

      pusherRef.current = pusher;

      const name = `private-user.${user.id}`;

      // Réutiliser le canal s'il existe déjà (partagé avec useRealtimeNotifications)
      let ch = pusher.channel(name);
      if (!ch) {
        console.log(`[WS] Subscribe → ${name}`);
        ch = pusher.subscribe(name);

        ch.bind('pusher:subscription_succeeded', () => {
          setWsConnected(true);
          if (import.meta.env.DEV) console.log(`[WS] ✅ ${name} actif`);
        });

        ch.bind('pusher:subscription_error', (s) => {
          console.error(`[WS] ❌ ${name}`, s);
        });
      } else {
        // Canal déjà ouvert par useRealtimeNotifications
        console.log(`[WS] ♻️ Réutilisation canal ${name}`);
        setWsConnected(true);
      }

      userChanRef.current = ch;
      bindUserChannel(ch, user.id);
    })();

    return () => {
      cancelled = true;
      // Ne pas unsubscribe ici : useRealtimeNotifications gère le cycle de vie
      // du canal utilisateur. On unbind seulement nos propres listeners.
      if (userChanRef.current) {
        userChanRef.current.unbind('new-message');
        userChanRef.current.unbind('messages-read');
        userChanRef.current.unbind('user-status');
        userChanRef.current.unbind('typing-indicator');
        userChanRef.current.unbind('recording-indicator');
        userChanRef.current = null;
      }
      setWsConnected(false);
    };
  }, [user?.id, bindUserChannel]);

  // ── Canal conversation active ──────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    let cancelled = false;

    (async () => {
      const pusher = await getPusher(user.id);
      if (!pusher || cancelled) return;

      const name = `private-conversation.${conversationId}`;

      // Désabonner l'ancien canal conversation si on en change
      if (convChanRef.current) {
        const old = convChanRef.current;
        old.unbind('message-sent');
        old.unbind('typing-indicator');
        old.unbind('recording-indicator');
        // unsubscribe du canal conversation (il n'est pas partagé)
        const prevName = `private-conversation.${old.__convId}`;
        if (prevName !== name) {
          pusher.unsubscribe(prevName);
        }
        convChanRef.current = null;
      }

      console.log(`[WS] Subscribe conversation → ${name}`);
      const ch = pusher.subscribe(name);
      ch.__convId = conversationId;   // tag pour cleanup

      ch.bind('pusher:subscription_succeeded', () => {
        if (import.meta.env.DEV) console.log(`[WS] ✅ conv.${conversationId} actif`);
      });

      ch.bind('pusher:subscription_error', (s) => {
        console.error(`[WS] ❌ conv.${conversationId}`, s);
      });

      convChanRef.current = ch;
      bindConvChannel(ch, user.id);
    })();

    return () => {
      cancelled = true;
      if (convChanRef.current) {
        const ch = convChanRef.current;
        ch.unbind('message-sent');
        ch.unbind('typing-indicator');
        ch.unbind('recording-indicator');
        const p = pusherRef.current;
        if (p) p.unsubscribe(`private-conversation.${ch.__convId}`);
        convChanRef.current = null;
      }
    };
  }, [conversationId, user?.id, bindConvChannel]);

  return { wsConnected };
}

// Ré-exporté pour compatibilité avec l'ancien code
export function getPusherInstance() {
  const { getPusherSync } = require('./usePusherSingleton');
  return getPusherSync();
}