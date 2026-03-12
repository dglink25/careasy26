/* ============================================================
   CarEasy — Service Worker v1.0
   Gère les Push Notifications même quand l'app est fermée
   ============================================================ */

const CACHE_NAME = 'careasy-v1';
const NOTIFICATION_SOUNDS = {
  default:    '/sounds/notification.mp3',
  message:    '/sounds/message.mp3',
  rdv:        '/sounds/rdv.mp3',
  entreprise: '/sounds/entreprise.mp3',
};

// ── Installation ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(clients.claim());
});

// ── Push Event (notification reçue quand app fermée) ─────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'CarEasy', body: event.data.text(), type: 'default' };
  }

  const {
    title = 'CarEasy',
    body = '',
    type = 'default',
    icon = '/logo192.png',
    badge = '/badge.png',
    url = '/',
    tag,
    data: extraData = {},
  } = data;

  const options = {
    body,
    icon,
    badge,
    tag: tag || type,
    data: { url, type, ...extraData },
    vibrate: getVibrationPattern(type),
    requireInteraction: type === 'entreprise_validation',
    actions: getActions(type),
    silent: false,
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Clic sur notification ─────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { url = '/', type } = event.notification.data || {};
  const action = event.action;

  let targetUrl = url;
  if (action === 'view') targetUrl = url;
  if (action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Chercher une fenêtre déjà ouverte
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', url: targetUrl, notifType: type });
          return client.focus();
        }
      }
      // Ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Fermeture notification ────────────────────────────────────
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée:', event.notification.tag);
});

// ── Helpers ───────────────────────────────────────────────────
function getVibrationPattern(type) {
  const patterns = {
    message:             [200, 100, 200],
    rdv_confirmed:       [300, 100, 300, 100, 300],
    rdv_cancelled:       [500, 200, 500],
    entreprise_approved: [200, 100, 200, 100, 500],
    entreprise_rejected: [500, 200, 200, 200, 200],
    default:             [200],
  };
  return patterns[type] || patterns.default;
}

function getActions(type) {
  const actionMap = {
    message: [
      { action: 'view',    title: '💬 Voir',      icon: '/icons/chat.png' },
      { action: 'dismiss', title: '✕ Ignorer' },
    ],
    rdv_confirmed: [
      { action: 'view',    title: '📅 Voir RDV',  icon: '/icons/calendar.png' },
      { action: 'dismiss', title: '✕ Fermer' },
    ],
    rdv_pending: [
      { action: 'view',    title: '✅ Gérer',     icon: '/icons/check.png' },
      { action: 'dismiss', title: '✕ Plus tard' },
    ],
    entreprise_approved: [
      { action: 'view',    title: '🏢 Mon espace', icon: '/icons/building.png' },
    ],
    default: [
      { action: 'view',    title: 'Voir', },
      { action: 'dismiss', title: 'Fermer' },
    ],
  };
  return actionMap[type] || actionMap.default;
}