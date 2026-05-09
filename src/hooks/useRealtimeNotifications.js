// src/hooks/useRealtimeNotifications.js
//
// ✅ VERSION CORRIGÉE — évite la double instance Pusher
// Vérifie window.__careasyPusher avant de créer une nouvelle instance
// N'utilise import('pusher-js') que si window.Pusher n'est pas déjà disponible
//
// UTILISATION : appeler UNE SEULE FOIS dans Layout.jsx

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const PUSHER_KEY     = import.meta.env.VITE_PUSHER_APP_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'eu';
const PUSHER_HOST    = import.meta.env.VITE_PUSHER_HOST;
const PUSHER_PORT    = import.meta.env.VITE_PUSHER_PORT;
const PUSHER_SCHEME  = import.meta.env.VITE_PUSHER_SCHEME || 'https';
const AUTH_ENDPOINT  = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/broadcasting/auth`
  : 'http://localhost:8000/api/broadcasting/auth';

export function useRealtimeNotifications() {
  const { user }                = useAuth();
  const { notify, NOTIF_TYPES } = useNotifications();
  const pusherRef               = useRef(null);
  const channelRef              = useRef(null);
  const retryTimerRef           = useRef(null);

  useEffect(() => {
    if (!user?.id || !PUSHER_KEY) {
      if (!PUSHER_KEY) {
        console.warn('[Notif] VITE_PUSHER_APP_KEY non défini — notifications temps réel désactivées');
      }
      return;
    }

    let isMounted = true;

    const initPusher = async () => {
      try {
        // ✅ CORRECTION : réutiliser l'instance existante si disponible
        // Évite de créer une 2e instance concurrente avec useWebSocket
        if (window.__careasyPusher) {
          console.log('[Notif] Réutilisation de window.__careasyPusher existante');
          pusherRef.current = window.__careasyPusher;
          subscribeToChannel(pusherRef.current, user, notify, NOTIF_TYPES, channelRef, isMounted);
          return;
        }

        // ✅ CORRECTION : préférer window.Pusher (déjà chargé via script) à import()
        // Évite deux bundles Pusher différents en mémoire
        let PusherLib;
        if (window.Pusher) {
          PusherLib = window.Pusher;
          console.log('[Notif] Utilisation de window.Pusher (SDK script déjà chargé)');
        } else {
          try {
            const mod = await import('pusher-js');
            PusherLib = mod.default || mod;
            console.log('[Notif] pusher-js chargé via import()');
          } catch {
            console.warn('[Notif] pusher-js non disponible');
            return;
          }
        }

        if (!isMounted) return;

        const token =
          localStorage.getItem('auth_token') ||
          localStorage.getItem('token')      ||
          sessionStorage.getItem('auth_token') ||
          sessionStorage.getItem('token')    ||
          '';

        // ✅ Vérifier une dernière fois (race condition entre les deux hooks)
        if (window.__careasyPusher) {
          console.log('[Notif] Instance créée entre-temps — réutilisation');
          pusherRef.current = window.__careasyPusher;
          subscribeToChannel(pusherRef.current, user, notify, NOTIF_TYPES, channelRef, isMounted);
          return;
        }

        const options = {
          cluster: PUSHER_CLUSTER,
          forceTLS: true,
          authEndpoint: AUTH_ENDPOINT,
          auth: {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept:        'application/json',
            },
          },
        };

        if (PUSHER_HOST) {
          options.wsHost            = PUSHER_HOST;
          options.wsPort            = PUSHER_PORT || 6001;
          options.wssPort           = PUSHER_PORT || 6001;
          options.forceTLS          = PUSHER_SCHEME === 'https';
          options.disableStats      = true;
          options.enabledTransports = ['ws', 'wss'];
        }

        pusherRef.current = new PusherLib(PUSHER_KEY, options);

        // ✅ Exposer immédiatement pour que useWebSocket le trouve
        window.__careasyPusher = pusherRef.current;

        if (import.meta.env.DEV) {
          pusherRef.current.connection.bind('connected', () =>
            console.log(`[Pusher] ✅ Connecté — user #${user.id}`)
          );
          pusherRef.current.connection.bind('error', (err) =>
            console.warn('[Pusher] ❌ Erreur connexion:', err)
          );
        }

        subscribeToChannel(pusherRef.current, user, notify, NOTIF_TYPES, channelRef, isMounted);

      } catch (err) {
        console.error('[Notif] Erreur init Pusher:', err);
        if (isMounted) {
          retryTimerRef.current = setTimeout(initPusher, 5000);
        }
      }
    };

    initPusher();

    return () => {
      isMounted = false;
      clearTimeout(retryTimerRef.current);

      if (channelRef.current && pusherRef.current) {
        const channelName = `private-user.${user.id}`;
        channelRef.current.unbind_all();
        // ✅ Ne pas unsubscribe si l'instance est partagée (useWebSocket l'utilise aussi)
        // Juste unbind les listeners de notifications
        channelRef.current = null;
      }
    };
  }, [user?.id, user?.role]);

  // Reconnecter quand le token change
  useEffect(() => {
    if (!pusherRef.current || !user?.id) return;

    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token')      ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('token') || '';

    if (pusherRef.current.config?.auth?.headers) {
      pusherRef.current.config.auth.headers.Authorization = `Bearer ${token}`;
    }
  }, [user?.id]);
}

// ── Abonnement au canal et binding des events ─────────────────────────────────
function subscribeToChannel(pusher, user, notify, NOTIF_TYPES, channelRef, isMounted) {
  if (!isMounted) return;

  const channelName = `private-user.${user.id}`;

  // ✅ Si déjà abonné sur ce canal (par useWebSocket), récupérer le canal existant
  const existingChannel = pusher.channel(channelName);
  if (existingChannel) {
    console.log(`[Notif] Canal ${channelName} déjà abonné — bind notifs dessus`);
    channelRef.current = existingChannel;
    bindNotifEvents(existingChannel, user, notify, NOTIF_TYPES);
    return;
  }

  channelRef.current = pusher.subscribe(channelName);

  channelRef.current.bind('pusher:subscription_error', (status) => {
    console.warn('[Pusher] Auth échouée sur', channelName, status);
  });

  channelRef.current.bind('pusher:subscription_succeeded', () => {
    if (import.meta.env.DEV) {
      console.log(`[Pusher] 🔔 Abonné à ${channelName}`);
    }
  });

  if (import.meta.env.DEV) {
    pusher.bind_global((eventName, data) => {
      if (!eventName.startsWith('pusher:')) {
        console.log(`[Pusher] 📩 Event reçu: "${eventName}"`, data);
      }
    });
  }

  bindNotifEvents(channelRef.current, user, notify, NOTIF_TYPES);
}

// ── Tous les bindings d'événements de notification ───────────────────────────
function bindNotifEvents(channel, user, notify, NOTIF_TYPES) {
  channel.bind('new-message', (data) => {
    if (data.sender_id === user.id) return;
    notify({
      title: `💬 ${data.sender_name || 'Nouveau message'}`,
      body:  data.message?.content?.substring(0, 80) || 'Vous avez un nouveau message',
      type:  NOTIF_TYPES.MESSAGE,
      url:   '/messages',
      tag:   `message-${data.conversation_id}`,
    });
  });

  channel.bind('rdv-confirmed', (data) => {
    notify({
      title: '✅ Rendez-vous confirmé',
      body:  `Votre RDV du ${data.date || ''} à ${data.time || ''} a été confirmé`,
      type:  NOTIF_TYPES.RDV_CONFIRMED,
      url:   `/rendez-vous/${data.id || ''}`,
    });
  });

  channel.bind('rdv-cancelled', (data) => {
    notify({
      title: '❌ Rendez-vous annulé',
      body:  data.reason || 'Un rendez-vous a été annulé',
      type:  NOTIF_TYPES.RDV_CANCELLED,
      url:   `/rendez-vous/${data.id || ''}`,
    });
  });

  channel.bind('rdv-pending', (data) => {
    notify({
      title: '📅 Nouvelle demande de RDV',
      body:  `${data.client_name || 'Un client'} demande un RDV le ${data.date || ''}`,
      type:  NOTIF_TYPES.RDV_PENDING,
      url:   '/rendez-vous/gestion',
    });
  });

  channel.bind('entreprise-approved', (data) => {
    notify({
      title: '🏢 Entreprise validée !',
      body:  `"${data.entreprise_name || 'Votre entreprise'}" a été approuvée ! Période d'essai de 30 jours activée.`,
      type:  NOTIF_TYPES.ENTREPRISE_APPROVED,
      url:   '/mes-entreprises',
      tag:   `entreprise-${data.entreprise_id}`,
    });
  });

  channel.bind('entreprise-rejected', (data) => {
    notify({
      title: '⚠️ Entreprise refusée',
      body:  data.reason || `"${data.entreprise_name || 'Votre entreprise'}" n'a pas été approuvée.`,
      type:  NOTIF_TYPES.ENTREPRISE_REJECTED,
      url:   '/mes-entreprises',
      tag:   `entreprise-${data.entreprise_id}`,
    });
  });

  if (user.role === 'admin') {
    channel.bind('new-entreprise-pending', (data) => {
      notify({
        title: '🔔 Nouvelle demande entreprise',
        body:  `"${data.entreprise_name || 'Une entreprise'}" soumise par ${data.prestataire_name || 'un prestataire'} — en attente de validation`,
        type:  NOTIF_TYPES.ENTREPRISE_PENDING,
        url:   `/admin/entreprises/${data.entreprise_id || ''}`,
        tag:   `admin-entreprise-${data.entreprise_id}`,
      });
    });
  }

  const laravelNotifHandler = (data) => {
    if (import.meta.env.DEV) {
      console.log('[Pusher] 📨 Laravel Notification reçue:', data);
    }
    const type = data.type || 'default';
    notify({
      title: data.title || 'Notification',
      body:  data.body  || data.message || '',
      type:  mapLaravelType(type),
      url:   data.url   || '/',
      tag:   `notif-${data.id || Date.now()}`,
    });
  };

  channel.bind('Illuminate\\Notifications\\Events\\BroadcastNotificationCreated', laravelNotifHandler);
  channel.bind('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated', laravelNotifHandler);
}

function mapLaravelType(laravelType) {
  const map = {
    'new_entreprise_pending': 'entreprise_pending',
    'entreprise_approved':    'entreprise_approved',
    'entreprise_rejected':    'entreprise_rejected',
    'message':                'message',
    'rdv_confirmed':          'rdv_confirmed',
    'rdv_cancelled':          'rdv_cancelled',
    'rdv_pending':            'rdv_pending',
    'trial_started':          'entreprise_approved',
  };
  return map[laravelType] || 'default';
}