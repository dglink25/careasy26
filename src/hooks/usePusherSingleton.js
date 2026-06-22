// src/hooks/usePusherSingleton.js

let _pusher      = null;   // instance unique
let _initPromise = null;   // évite les appels concurrents pendant init
let _userId      = null;   // pour détecter changement d'utilisateur

// ── Config ────────────────────────────────────────────────────────────────────
const KEY     = import.meta.env.VITE_PUSHER_APP_KEY     || '';
const CLUSTER = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'eu';
const API_URL = (import.meta.env.VITE_API_URL           || 'http://localhost:8000/api').replace(/\/$/, '');
const AUTH_EP = `${API_URL}/broadcasting/auth`;

function getToken() {
  return (
    localStorage.getItem('token')           ||
    localStorage.getItem('auth_token')      ||
    sessionStorage.getItem('token')         ||
    sessionStorage.getItem('auth_token')    ||
    ''
  );
}

// ── Chargement du SDK pusher-js (une seule fois) ──────────────────────────────
let _sdkReady = !!(window.__careasyPusher);   // déjà là si rechargement à chaud

async function loadSdk() {
  if (typeof window.Pusher !== 'undefined') return;
  if (window.__careasyPusher)               return;

  // Essayer d'abord l'import ES module (Vite + pusher-js installé)
  try {
    const mod = await import('pusher-js');
    window.Pusher = mod.default ?? mod;
    return;
  } catch (_) { /* pas installé — fallback CDN */ }

  // Fallback : charger depuis CDN (ne pas créer de doublon de <script>)
  if (document.querySelector('script[data-pusher-cdn]')) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return;
  }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src              = 'https://js.pusher.com/8.2.0/pusher.min.js';
    s.async            = true;
    s.dataset.pusherCdn = 'true';
    s.onload  = resolve;
    s.onerror = () => reject(new Error('Impossible de charger pusher-js CDN'));
    document.head.appendChild(s);
  });
}

// ── Création de l'instance (appelée une seule fois) ──────────────────────────
function createPusherInstance(token) {
  const PusherLib = window.Pusher;
  if (!PusherLib) throw new Error('window.Pusher non disponible');

  const opts = {
    cluster   : CLUSTER,
    forceTLS  : true,
    authEndpoint: AUTH_EP,
    auth: {
      headers: {
        Authorization     : `Bearer ${token}`,
        Accept            : 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    },
    // Intercepter les erreurs d'auth pour diagnostic
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        const authToken = getToken();
        console.log(`[Pusher] Auth → ${channel.name} (socket: ${socketId.slice(0,8)}...)`);
        fetch(AUTH_EP, {
          method : 'POST',
          headers: {
            'Content-Type' : 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'Accept'       : 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({ channel_name: channel.name, socket_id: socketId }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const text = await res.text();
              console.error(`[Pusher] Auth ÉCHOUÉE ${res.status} pour ${channel.name}:`, text);
              callback(new Error(`Auth failed: ${res.status}`), null);
              return;
            }
            const data = await res.json();
            console.log(`[Pusher] Auth OK pour ${channel.name}`);
            callback(null, data);
          })
          .catch((err) => {
            console.error(`[Pusher] Auth erreur réseau pour ${channel.name}:`, err.message);
            callback(err, null);
          });
      },
    }),
  };

  // Si serveur Soketi/Reverb custom (ne pas activer pour le cloud Pusher officiel)
  const HOST   = import.meta.env.VITE_PUSHER_HOST;
  const PORT   = import.meta.env.VITE_PUSHER_PORT;
  const SCHEME = import.meta.env.VITE_PUSHER_SCHEME || 'https';
  // Activer le mode custom seulement si HOST est défini ET n'est pas un domaine Pusher officiel
  const isCustomServer = HOST && !HOST.includes('pusher.com') && !HOST.includes('pusherapp.com');
  if (isCustomServer) {
    Object.assign(opts, {
      wsHost           : HOST,
      wsPort           : PORT || 6001,
      wssPort          : PORT || 6001,
      forceTLS         : SCHEME === 'https',
      disableStats     : true,
      enabledTransports: ['ws', 'wss'],
    });
  }

  const p = new PusherLib(KEY, opts);

  // Logs toujours actifs — indispensable pour diagnostiquer en production
  p.connection.bind('connected',    ()  => console.log('[Pusher] Connecté'));
  p.connection.bind('disconnected', ()  => console.warn('[Pusher] Déconnecté'));
  p.connection.bind('error',        (e) => console.error('[Pusher] Erreur:', JSON.stringify(e)));
  p.connection.bind('state_change', (s) => console.log(`[Pusher] État: ${s.previous} → ${s.current}`));

  return p;
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Retourne (en créant si nécessaire) l'instance Pusher singleton.
 * Sûr à appeler depuis plusieurs hooks en parallèle.
 *
 * @param {string|number} userId - identifiant de l'utilisateur connecté
 * @returns {Promise<Pusher|null>}
 */
export async function getPusher(userId) {
  if (!KEY) {
    console.warn('[Pusher] VITE_PUSHER_APP_KEY manquant — temps réel désactivé');
    return null;
  }

  // Réinitialiser si l'utilisateur a changé
  if (_pusher && userId && _userId && String(userId) !== String(_userId)) {
    console.log('[Pusher] Utilisateur changé → réinitialisation');
    destroyPusher();
  }

  // Réutiliser si déjà prêt
  if (_pusher) {
    // Mettre à jour le token au cas où il aurait été rafraîchi
    const token = getToken();
    if (_pusher.config?.auth?.headers && token) {
      _pusher.config.auth.headers.Authorization = `Bearer ${token}`;
    }
    return _pusher;
  }

  // Réutiliser l'instance créée par un rechargement à chaud (HMR)
  if (window.__careasyPusher) {
    _pusher = window.__careasyPusher;
    _userId = userId ? String(userId) : _userId;
    return _pusher;
  }

  // Init en cours → attendre la même promesse
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      await loadSdk();
      const token = getToken();
      if (!token) {
        console.warn('[Pusher] Pas de token — connexion reportée');
        return null;
      }
      _pusher              = createPusherInstance(token);
      _userId              = userId ? String(userId) : null;
      window.__careasyPusher = _pusher;   // exposé pour compatibilité
      console.log(`[Pusher] Instance créée pour user #${userId}`);
      return _pusher;
    } catch (err) {
      console.error('[Pusher] Échec init:', err);
      return null;
    } finally {
      _initPromise = null;
    }
  })();

  return _initPromise;
}

/**
 * Détruit proprement l'instance singleton (déconnexion / logout).
 */
export function destroyPusher() {
  if (_pusher) {
    try { _pusher.disconnect(); } catch (_) {}
    _pusher = null;
    _userId = null;
    delete window.__careasyPusher;
    console.log('[Pusher] Instance détruite');
  }
}

/**
 * Retourne l'instance existante sans en créer une (utile pour du code synchrone).
 */
export function getPusherSync() {
  return _pusher || window.__careasyPusher || null;
}