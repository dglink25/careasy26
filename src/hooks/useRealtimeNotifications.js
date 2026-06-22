// src/hooks/useRealtimeNotifications.js — V3
// Utilise usePusherSingleton : partage la connexion avec useWebSocket.
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getPusher } from './usePusherSingleton';

export function useRealtimeNotifications() {
  const { user }                = useAuth();
  const { notify, NOTIF_TYPES } = useNotifications();

  const channelRef    = useRef(null);
  const retryTimerRef = useRef(null);
  const mountedRef    = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!user?.id) return;

    const init = async () => {
      try {
        const pusher = await getPusher(user.id);
        if (!pusher || !mountedRef.current) return;

        const name = `private-user.${user.id}`;

        // Réutiliser le canal s'il existe déjà (partagé avec useWebSocket)
        let ch = pusher.channel(name);
        if (!ch) {
          console.log(`[Notif] Subscribe → ${name}`);
          ch = pusher.subscribe(name);

          ch.bind('pusher:subscription_error', (status) => {
            console.warn(`[Notif] Auth échouée sur ${name}:`, status);
          });

          ch.bind('pusher:subscription_succeeded', () => {
            if (import.meta.env.DEV) console.log(`[Notif] ✅ ${name} abonné`);
          });
        } else {
          console.log(`[Notif] ♻️ Réutilisation canal ${name}`);
        }

        channelRef.current = ch;
        bindNotifEvents(ch, user, notify, NOTIF_TYPES);

      } catch (err) {
        console.error('[Notif] Erreur init:', err);
        if (mountedRef.current) {
          retryTimerRef.current = setTimeout(init, 5000);
        }
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      clearTimeout(retryTimerRef.current);

      // Unbind uniquement nos listeners de notifications — ne pas unsubscribe
      // le canal (useWebSocket en a peut-être besoin aussi)
      if (channelRef.current) {
        unbindNotifEvents(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, user?.role, notify, NOTIF_TYPES]);
}

// ── Binding ───────────────────────────────────────────────────────────────────

function bindNotifEvents(channel, user, notify, NOTIF_TYPES) {
  // D'abord unbind au cas où on rebind après un HMR
  unbindNotifEvents(channel);

  channel.bind('new-message', (data) => {
    if (String(data.sender_id) === String(user.id)) return;
    notify({
      title: `💬 ${data.sender_name || 'Nouveau message'}`,
      body : data.message?.content?.substring(0, 80) || 'Vous avez un nouveau message',
      type : NOTIF_TYPES?.MESSAGE || 'message',
      url  : '/messages',
      tag  : `message-${data.conversation_id}`,
    });
  });

  channel.bind('rdv-confirmed', (data) => {
    notify({
      title: '✅ Rendez-vous confirmé',
      body : `Votre RDV du ${data.date || ''} à ${data.time || ''} a été confirmé`,
      type : NOTIF_TYPES?.RDV_CONFIRMED || 'rdv_confirmed',
      url  : `/rendez-vous/${data.id || ''}`,
    });
  });

  channel.bind('rdv-cancelled', (data) => {
    notify({
      title: '❌ Rendez-vous annulé',
      body : data.reason || 'Un rendez-vous a été annulé',
      type : NOTIF_TYPES?.RDV_CANCELLED || 'rdv_cancelled',
      url  : `/rendez-vous/${data.id || ''}`,
    });
  });

  channel.bind('rdv-pending', (data) => {
    notify({
      title: '📅 Nouvelle demande de RDV',
      body : `${data.client_name || 'Un client'} demande un RDV le ${data.date || ''}`,
      type : NOTIF_TYPES?.RDV_PENDING || 'rdv_pending',
      url  : '/rendez-vous/gestion',
    });
  });

  channel.bind('entreprise-approved', (data) => {
    notify({
      title: ' Entreprise validée !',
      body : `"${data.entreprise_name || 'Votre entreprise'}" a été approuvée ! 30 jours d'essai activés.`,
      type : NOTIF_TYPES?.ENTREPRISE_APPROVED || 'entreprise_approved',
      url  : '/mes-entreprises',
      tag  : `entreprise-${data.entreprise_id}`,
    });
  });

  channel.bind('entreprise-rejected', (data) => {
    notify({
      title: ' Entreprise refusée',
      body : data.reason || `"${data.entreprise_name || 'Votre entreprise'}" n'a pas été approuvée.`,
      type : NOTIF_TYPES?.ENTREPRISE_REJECTED || 'entreprise_rejected',
      url  : '/mes-entreprises',
      tag  : `entreprise-${data.entreprise_id}`,
    });
  });

  if (user.role === 'admin') {
    channel.bind('new-entreprise-pending', (data) => {
      notify({
        title: ' Nouvelle demande entreprise',
        body : `"${data.entreprise_name || 'Une entreprise'}" soumise par ${data.prestataire_name || 'un prestataire'}`,
        type : NOTIF_TYPES?.ENTREPRISE_PENDING || 'entreprise_pending',
        url  : `/admin/entreprises/${data.entreprise_id || ''}`,
        tag  : `admin-entreprise-${data.entreprise_id}`,
      });
    });
  }

  // Notifications Laravel broadcast (Illuminate\Notifications)
  const laravelHandler = (data) => {
    console.log('[Notif]  Laravel broadcast reçu:', data);
    notify({
      title: data.title   || 'Notification',
      body : data.body    || data.message || '',
      type : mapLaravelType(data.type || ''),
      url  : data.url     || '/',
      tag  : `notif-${data.id || Date.now()}`,
    });
  };

  channel.bind('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated', laravelHandler);
  channel.bind('Illuminate\\Notifications\\Events\\BroadcastNotificationCreated',  laravelHandler);

  // bind_global pour déboguer tous les événements reçus (toujours actif)
  if (channel.pusher?.bind_global) {
    channel.pusher.bind_global((eventName, data) => {
      if (!eventName.startsWith('pusher:')) {
        console.log(`[Pusher]  Event global: "${eventName}"`, data);
      }
    });
  }
}

function unbindNotifEvents(channel) {
  if (!channel) return;
  const events = [
    'new-message', 'rdv-confirmed', 'rdv-cancelled', 'rdv-pending',
    'entreprise-approved', 'entreprise-rejected', 'new-entreprise-pending',
    '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated',
    'Illuminate\\Notifications\\Events\\BroadcastNotificationCreated',
  ];
  events.forEach(e => channel.unbind(e));
}

// ── Mapping type Laravel → type interne ──────────────────────────────────────
function mapLaravelType(t) {
  const map = {
    new_entreprise_pending: 'entreprise_pending',
    entreprise_approved   : 'entreprise_approved',
    entreprise_rejected   : 'entreprise_rejected',
    message               : 'message',
    rdv_confirmed         : 'rdv_confirmed',
    rdv_cancelled         : 'rdv_cancelled',
    rdv_pending           : 'rdv_pending',
    trial_started         : 'entreprise_approved',
  };
  return map[t] || 'default';
}