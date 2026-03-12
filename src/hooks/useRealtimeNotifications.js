// src/hooks/useRealtimeNotifications.js
//
// ✅ VERSION AUTONOME — initialise Pusher directement ici
//    Sans dépendance à useWebSocket ni à window.__careasyPusher
//
// UTILISATION : appeler UNE SEULE FOIS dans Layout.jsx
//   import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
//   // dans le composant Layout :
//   useRealtimeNotifications();

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

// ── Config Pusher depuis les variables d'environnement Vite ─────────
const PUSHER_KEY     = import.meta.env.VITE_PUSHER_APP_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'eu';
const PUSHER_HOST    = import.meta.env.VITE_PUSHER_HOST;
const PUSHER_PORT    = import.meta.env.VITE_PUSHER_PORT;
const PUSHER_SCHEME  = import.meta.env.VITE_PUSHER_SCHEME || 'https';
const AUTH_ENDPOINT  = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/broadcasting/auth`
  : 'http://localhost:8000/api/broadcasting/auth';

export function useRealtimeNotifications() {
  const { user }                     = useAuth();
  const { notify, NOTIF_TYPES }      = useNotifications();
  const pusherRef                    = useRef(null);
  const channelRef                   = useRef(null);
  const retryTimerRef                = useRef(null);

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
        // Charger Pusher dynamiquement (évite l'import statique qui peut échouer)
        let PusherLib;
        try {
          const mod = await import('pusher-js');
          PusherLib = mod.default || mod;
        } catch {
          console.warn('[Notif] pusher-js non disponible');
          return;
        }

        if (!isMounted) return;

        // Récupérer le token d'auth depuis localStorage / sessionStorage
        const token =
          localStorage.getItem('auth_token') ||
          localStorage.getItem('token') ||
          sessionStorage.getItem('auth_token') ||
          sessionStorage.getItem('token') ||
          '';

        // ── Initialiser (ou réutiliser) l'instance Pusher ────────────
        if (!pusherRef.current) {
          const options = {
            cluster: PUSHER_CLUSTER,
            forceTLS: true,
            authEndpoint: AUTH_ENDPOINT,
            auth: {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            },
          };

          // Soketi / serveur custom
          if (PUSHER_HOST) {
            options.wsHost       = PUSHER_HOST;
            options.wsPort       = PUSHER_PORT || 6001;
            options.wssPort      = PUSHER_PORT || 6001;
            options.forceTLS     = PUSHER_SCHEME === 'https';
            options.disableStats = true;
            options.enabledTransports = ['ws', 'wss'];
          }

          pusherRef.current = new PusherLib(PUSHER_KEY, options);

          // Exposer globalement pour useWebSocket (rétrocompatibilité)
          window.__careasyPusher = pusherRef.current;

          // Logs de connexion (dev uniquement)
          if (import.meta.env.DEV) {
            pusherRef.current.connection.bind('connected', () =>
              console.log(`[Pusher] ✅ Connecté — user #${user.id}`)
            );
            pusherRef.current.connection.bind('error', (err) =>
              console.warn('[Pusher] ❌ Erreur connexion:', err)
            );
          }
        }

        // ── S'abonner au canal privé ─────────────────────────────────
        const channelName = `private-user.${user.id}`;

        // Désabonner d'abord si un canal existait
        if (channelRef.current) {
          pusherRef.current.unsubscribe(channelName);
        }

        channelRef.current = pusherRef.current.subscribe(channelName);

        channelRef.current.bind('pusher:subscription_error', (status) => {
          console.warn('[Pusher] Auth échouée sur', channelName, status);
        });

        channelRef.current.bind('pusher:subscription_succeeded', () => {
          if (import.meta.env.DEV) {
            console.log(`[Pusher] 🔔 Abonné à ${channelName}`);
          }
        });

        // ── Debug : logger TOUS les events reçus (dev uniquement) ───
        if (import.meta.env.DEV) {
          pusherRef.current.bind_global((eventName, data) => {
            if (!eventName.startsWith('pusher:')) {
              console.log(`[Pusher] 📩 Event reçu: "${eventName}"`, data);
            }
          });
        }

        // ── Bindings événements ──────────────────────────────────────
        bindEvents(channelRef.current, user, notify, NOTIF_TYPES);

      } catch (err) {
        console.error('[Notif] Erreur init Pusher:', err);
        // Retry dans 5s
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
        pusherRef.current.unsubscribe(channelName);
        channelRef.current = null;
      }
      // Ne pas déconnecter Pusher ici — Layout se remonte parfois
    };
  }, [user?.id, user?.role]);

  // Reconnecter quand le token change (ex: refresh)
  useEffect(() => {
    if (!pusherRef.current || !user?.id) return;

    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('token') || '';

    if (pusherRef.current.config?.auth?.headers) {
      pusherRef.current.config.auth.headers.Authorization = `Bearer ${token}`;
    }
  }, [user?.id]);
}

// ── Tous les bindings d'événements ──────────────────────────────────
function bindEvents(channel, user, notify, NOTIF_TYPES) {
  // ── Messages ─────────────────────────────────────────────────
  channel.bind('new-message', (data) => {
    if (data.sender_id === user.id) return; // ignorer ses propres messages
    notify({
      title: `💬 ${data.sender_name || 'Nouveau message'}`,
      body:  data.message?.content?.substring(0, 80) || 'Vous avez un nouveau message',
      type:  NOTIF_TYPES.MESSAGE,
      url:   '/messages',
      tag:   `message-${data.conversation_id}`,
    });
  });

  // ── Rendez-vous ───────────────────────────────────────────────
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

  // ── Entreprises (prestataire) ─────────────────────────────────
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

  // ── Admin uniquement ──────────────────────────────────────────
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

  // ── Canal générique Laravel Notifications ────────────────
  // Quand une Notification Laravel utilise 'broadcast' dans via(),
  // Laravel envoie l'event sous 2 noms possibles :
  //   1. Le nom retourné par broadcastAs()  → 'entreprise-approved' etc.
  //   2. Le nom générique Laravel ci-dessous (fallback)
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

  // Nom complet (Laravel < 11)
  channel.bind('Illuminate\\Notifications\\Events\\BroadcastNotificationCreated', laravelNotifHandler);
  // Nom court (Laravel 11+)
  channel.bind('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated', laravelNotifHandler);
}

// Mapper les types Laravel → NOTIF_TYPES frontend
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