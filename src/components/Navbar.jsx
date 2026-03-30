import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { entrepriseApi } from '../api/entrepriseApi';
import { publicApi } from '../api/publicApi';
import api from '../api/axios';
import Logo from './Logo';
import {
  FaHome, FaBuilding, FaTools, FaSearch, FaUser,
  FaSignOutAlt, FaBars, FaTimes, FaChevronDown
} from 'react-icons/fa';
import {
  FiMessageSquare, FiSettings, FiUser, FiLock,
  FiBell, FiMoon, FiShield, FiShoppingBag, FiHeart, FiCalendar, FiAward,
  FiChevronDown as FiChevronDownIcon, FiClock, FiTrash2, FiCheckSquare
} from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';

const NOTIF_ICONS = {
  message:                { icon: '💬', color: '#3b82f6' },
  rdv_pending:            { icon: '📅', color: '#f59e0b' },
  rdv_confirmed:          { icon: '✅', color: '#10b981' },
  rdv_cancelled:          { icon: '❌', color: '#ef4444' },
  rdv_completed:          { icon: '🎉', color: '#8b5cf6' },
  entreprise_approved:    { icon: '🏢', color: '#10b981' },
  entreprise_rejected:    { icon: '⚠️', color: '#ef4444' },
  new_entreprise_pending: { icon: '🔔', color: '#f59e0b' },
  trial_started:          { icon: '🚀', color: '#10b981' },
  default:                { icon: '🔔', color: '#6b7280' },
};

const navLinkStyle = {
  textDecoration: 'none', padding: '0.5rem 1rem',
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  whiteSpace: 'nowrap', borderRadius: '0.5rem',
  fontSize: '0.95rem', transition: 'all 0.2s',
};

function parseNotifData(notif) {
  let data = notif?.data;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { data = {}; }
  }
  if (data?.data && typeof data.data === 'object' && !data.url && !data.title) {
    data = { ...data, ...data.data };
  }
  return data || {};
}


function resolveNotifUrl(data) {
  const type = data?.type || '';
  let url = data?.url || data?.link || data?.action_url || '';

  if (type === 'message' || url.startsWith('/messages/')) {
    const conversationId = data?.conversation_id
      || url.replace('/messages/', '').replace('/messages', '').trim();
    if (conversationId && conversationId !== '' && conversationId !== '/') {
      return { path: '/messages', state: { conversationId: parseInt(conversationId) || conversationId } };
    }
    return { path: '/messages', state: null };
  }

  if (type.startsWith('rdv_')) {
    const rdvId = data?.rdv_id;
    if (rdvId) return { path: `/rendez-vous/${rdvId}`, state: null };
    return { path: '/mes-rendez-vous', state: null };
  }

  if (type === 'entreprise_approved' || type === 'trial_started') {
    return { path: '/mes-entreprises', state: null };
  }
  if (type === 'entreprise_rejected') {
    return { path: '/entreprises/creer', state: null };
  }
  if (type === 'new_entreprise_pending') {
    const id = data?.entreprise_id;
    return { path: id ? `/admin/entreprises/${id}` : '/admin/entreprises', state: null };
  }

  if (url && url !== '/' && url.startsWith('/')) {
    return { path: url, state: null };
  }

  return null;
}

function getNotifMeta(notif) {
  const type = parseNotifData(notif)?.type || 'default';
  return NOTIF_ICONS[type] || NOTIF_ICONS.default;
}

function formatNotifDate(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'À l\'instant';
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function badgeStyle(color) {
  return { backgroundColor: color, color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 };
}

function NotificationPanel({ dbNotifs, unreadCount, loadingNotifs, onNotifClick, onDeleteNotif, onMarkAllRead, onViewAll }) {
  return (
    <div style={{
      width: 380, maxHeight: '80vh',
      backgroundColor: 'var(--bg-card)',
      borderRadius: '1rem',
      boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      border: '2px solid var(--border-color)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      animation: 'slideDown 0.25s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiBell style={{ color: 'var(--brand-primary)', fontSize: '1.2rem' }} />
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ backgroundColor: 'var(--brand-primary)', color: '#fff', borderRadius: 999, padding: '0.15rem 0.55rem', fontSize: '0.72rem', fontWeight: 700 }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onMarkAllRead(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-primary)', fontSize: '0.8rem', fontWeight: 600, padding: '0.3rem 0.6rem', borderRadius: '0.4rem' }}
          >
            <FiCheckSquare size={14} /> Tout lire
          </button>
        )}
      </div>

      {/* Liste */}
      <div style={{ overflowY: 'auto', flex: 1, maxHeight: 420 }}>
        {loadingNotifs ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ width: 30, height: 30, border: '3px solid var(--border-color)', borderTop: '3px solid var(--brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Chargement...</p>
          </div>
        ) : dbNotifs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔔</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Aucune notification</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Vous êtes à jour !</p>
          </div>
        ) : (
          dbNotifs.map((notif) => {
            const meta   = getNotifMeta(notif);
            const data   = parseNotifData(notif);
            const isRead = !!notif.read_at;
            const title  = data?.title || data?.message || 'Notification';
            const body   = data?.body  || data?.admin_note || data?.reason || '';

            return (
              <div
                key={notif.id}
                onMouseDown={(e) => {
                  // Si le clic vient du bouton supprimer, ne pas déclencher onNotifClick
                  if (e.target.closest('[data-delete-btn]')) return;
                  onNotifClick(notif);
                }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.9rem 1.1rem', cursor: 'pointer', backgroundColor: isRead ? 'transparent' : `${meta.color}08`, borderBottom: '1px solid var(--border-color)', transition: 'background .2s', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = isRead ? 'transparent' : `${meta.color}08`; }}
              >
                {!isRead && (
                  <div style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', width: 7, height: 7, borderRadius: '50%', backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.color}80` }} />
                )}
                <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, backgroundColor: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: isRead ? 500 : 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {title}
                  </div>
                  {body && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {body}
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    {formatNotifDate(notif.created_at)}
                  </div>
                </div>
                {/* ✅ data-delete-btn pour identifier ce bouton depuis le parent */}
                <button
                  data-delete-btn="true"
                  onMouseDown={(e) => { e.stopPropagation(); onDeleteNotif(notif.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: '0.3rem', fontSize: '0.9rem', flexShrink: 0, opacity: 0.6 }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  title="Supprimer"
                >
                  <FiTrash2 />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {dbNotifs.length > 0 && (
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', textAlign: 'center' }}>
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onViewAll(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.875rem' }}
          >
            Voir toutes les notifications →
          </button>
        </div>
      )}
    </div>
  );
}

function BellButton({ unreadCount, showPanel, onToggle, onClose, dbNotifs, loadingNotifs, onNotifClick, onDeleteNotif, onMarkAllRead, onViewAll }) {
  const btnRef   = useRef(null);
  const panelRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (showPanel && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        position: 'fixed',
        top:   rect.bottom + 8,
        right: window.innerWidth - rect.right,
        zIndex: 99999,
        maxWidth: 'min(380px, 96vw)',
      });
    }
  }, [showPanel]);

  useEffect(() => {
    if (!showPanel) return;

    const handleOutside = (e) => {
      const inBtn   = btnRef.current?.contains(e.target);
      const inPanel = panelRef.current?.contains(e.target);
      if (!inBtn && !inPanel) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [showPanel, onClose]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={onToggle}
        className="bell-btn"
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 42, height: 42,
          backgroundColor: showPanel ? 'var(--brand-primary)' : 'var(--bg-secondary)',
          border: '2px solid var(--border-color)', borderRadius: '0.75rem',
          cursor: 'pointer', transition: 'all 0.2s',
          color: showPanel ? '#fff' : 'var(--text-primary)'
        }}
        title="Notifications"
      >
        <FiBell style={{ fontSize: '1.1rem' }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            backgroundColor: '#ef4444', color: '#fff', borderRadius: 999,
            minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 800,
            border: '2px solid var(--bg-primary)', padding: '0 3px',
            animation: 'badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Portal — PAS de stopPropagation ici, les boutons internes gèrent eux-mêmes */}
      {showPanel && pos && createPortal(
        <div ref={panelRef} style={pos}>
          <NotificationPanel
            unreadCount={unreadCount}
            dbNotifs={dbNotifs}
            loadingNotifs={loadingNotifs}
            onNotifClick={onNotifClick}
            onDeleteNotif={onDeleteNotif}
            onMarkAllRead={onMarkAllRead}
            onViewAll={onViewAll}
          />
        </div>,
        document.body
      )}
    </>
  );
}
export default function Navbar() {
  const { user, logout } = useAuth();
  const { toasts, notify } = useNotifications();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [scrolled,             setScrolled]             = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showNotifPanel,       setShowNotifPanel]       = useState(false);
  const [mobileMenuOpen,       setMobileMenuOpen]       = useState(false);
  const [isProvider,           setIsProvider]           = useState(false);
  const [hasPendingEntreprise, setHasPendingEntreprise] = useState(false);
  const [profilePhotoUrl,      setProfilePhotoUrl]      = useState(null);
  const [domaines,             setDomaines]             = useState([]);
  const [loadingDomaines,      setLoadingDomaines]      = useState(true);
  const [dbNotifs,             setDbNotifs]             = useState([]);
  const [unreadCount,          setUnreadCount]          = useState(0);
  const [loadingNotifs,        setLoadingNotifs]        = useState(false);

  const settingsRef = useRef(null);

  // ── Fetch notifications ──────────────────────────────────
  const prevNotifsRef = useRef([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      const res    = await api.get('/notifications');
      const raw    = res.data?.notifications || res.data?.data || res.data || [];
      const notifs = Array.isArray(raw) ? raw : [];

      const prevIds = new Set(prevNotifsRef.current.map(n => n.id));
      const newUnread = notifs.filter(n => !n.read_at && !prevIds.has(n.id));
      if (newUnread.length > 0 && prevNotifsRef.current.length > 0) {
        const latest = newUnread[0];
        const data   = parseNotifData(latest);
        notify({
          title:      data.title || 'Nouvelle notification',
          body:       data.body  || '',
          type:       data.type  || 'default',
          url:        data.url   || '/',
          showToast:  false,
          playSound:  true,
          showNative: true,
        });
      }
      prevNotifsRef.current = notifs;
      setDbNotifs(notifs);
      setUnreadCount(notifs.filter(n => !n.read_at).length);
    } catch { /* silencieux */ }
    finally { setLoadingNotifs(false); }
  }, [user, notify]);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  useEffect(() => {
    if (toasts.length > 0) {
      const t = setTimeout(fetchNotifications, 1500);
      return () => clearTimeout(t);
    }
  }, [toasts.length, fetchNotifications]);

  // ── Handlers notifications ──
  const handleNotifClick = useCallback((notif) => {
    setShowNotifPanel(false);

    const data        = parseNotifData(notif);
    const destination = resolveNotifUrl(data);

    if (destination) {
      if (destination.state) {
        navigate(destination.path, { state: destination.state });
      } else {
        navigate(destination.path);
      }
    }

    // Marquer comme lu en arrière-plan
    if (!notif.read_at) {
      api.post(`/notifications/${notif.id}/mark-read`)
        .then(() => {
          setDbNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n));
          setUnreadCount(p => Math.max(0, p - 1));
        })
        .catch(() => {});
    }
  }, [navigate]);

  const handleDeleteNotif = useCallback((notifId) => {
    setDbNotifs(prev => {
      const was = prev.find(n => n.id === notifId && !n.read_at);
      if (was) setUnreadCount(c => Math.max(0, c - 1));
      return prev.filter(n => n.id !== notifId);
    });
    api.delete(`/notifications/${notifId}`).catch(() => {});
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setDbNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch {}
  }, []);

  const handleViewAll = useCallback(() => {
    setShowNotifPanel(false);
    navigate('/notifications');
  }, [navigate]);

  const handleToggleNotif = useCallback(() => {
    setShowNotifPanel(p => !p);
    setShowSettingsDropdown(false);
  }, []);

  const handleCloseNotif = useCallback(() => {
    setShowNotifPanel(false);
  }, []);

  // ── Fermer settings dropdown au clic extérieur ─────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // ── Scroll ───────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // ── User data ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setProfilePhotoUrl(user.profile_photo_url || null);
    entrepriseApi.getMesEntreprises()
      .then(list => {
        const v = (list || []).filter(e => e.status === 'validated');
        const p = (list || []).filter(e => e.status === 'pending');
        setIsProvider(v.length > 0);
        setHasPendingEntreprise(p.length > 0 && v.length === 0);
      })
      .catch(() => { setIsProvider(false); setHasPendingEntreprise(false); });
  }, [user]);

  useEffect(() => {
    publicApi.getDomaines()
      .then(d => setDomaines(d || []))
      .catch(() => setDomaines([]))
      .finally(() => setLoadingDomaines(false));
  }, []);

  const handleLogout = async () => { await logout(); navigate('/'); setMobileMenuOpen(false); };
  const isActive = (p) => location.pathname === p;

  const settingsSections = [
  { id: 'profile',       label: 'Profil',         icon: FiUser,   description: 'Gérer vos informations',       color: '#3b82f6' },
  { id: 'security',      label: 'Sécurité',        icon: FiLock,   description: 'Mot de passe',                 color: '#ef4444' },
  { id: 'sessions',      label: 'Appareils',       icon: FiShield, description: 'Sessions & appareils connectés', color: '#8b5cf6' },
  { id: 'notifications', label: 'Notifications',   icon: FiBell,   description: 'Préférences de notifications', color: '#f59e0b' },
  { id: 'appearance',    label: 'Apparence',        icon: FiMoon,   description: 'Thème et affichage',           color: '#8b5cf6' },
  { id: 'privacy',       label: 'Confidentialité', icon: FiShield, description: 'Vie privée',                   color: '#10b981' },
];

  const providerLinks = [
    { to: '/dashboard',       icon: MdDashboard,     label: 'Tableau de bord' },
    { to: '/mes-entreprises', icon: FaBuilding,      label: 'Entreprises'     },
    { to: '/mes-services',    icon: FaTools,         label: 'Services'        },
    { to: '/messages',        icon: FiMessageSquare, label: 'Messages'        },
    { to: '/mes-rendez-vous', icon: FiCalendar,      label: 'Rendez-vous'     },
    { to: '/abonnements',     icon: FiAward,         label: 'Abonnements'     },
  ];

  const clientLinks = [
    { to: '/dashboard',       icon: FiShoppingBag,   label: 'Espace Client'   },
    { to: '/mes-rendez-vous', icon: FiCalendar,      label: 'Mes Rendez-vous' },
    { to: '/messages',        icon: FiMessageSquare, label: 'Messages'        },
    { to: '/services',        icon: FaSearch,        label: 'Explorer'        },
  ];

  const UserAvatar = ({ size = 35 }) => {
    const ok = profilePhotoUrl && !profilePhotoUrl.includes('ui-avatars');
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: ok ? '2px solid var(--brand-light)' : 'none' }}>
        {ok
          ? <img src={profilePhotoUrl} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setProfilePhotoUrl(null)} />
          : <span style={{ color: '#fff', fontWeight: 'bold', fontSize: size * 0.4 }}>{user?.name?.charAt(0).toUpperCase()}</span>
        }
      </div>
    );
  };

  // Props communs pour BellButton
  const bellProps = {
    unreadCount,
    showPanel: showNotifPanel,
    onToggle: handleToggleNotif,
    onClose: handleCloseNotif,
    dbNotifs,
    loadingNotifs,
    onNotifClick: handleNotifClick,
    onDeleteNotif: handleDeleteNotif,
    onMarkAllRead: handleMarkAllRead,
    onViewAll: handleViewAll,
  };

  return (
    <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%', backgroundColor: 'var(--nav-bg)', backdropFilter: 'blur(12px)', padding: scrolled ? '0.75rem 0' : '1rem 0', borderBottom: '3px solid var(--brand-primary)', boxShadow: scrolled ? 'var(--shadow-lg)' : 'none', transition: 'all 0.3s ease' }}>
        <div style={{ width: '100%', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <Logo size="md" showText={true} />

          {/* Desktop */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'nowrap' }} className="desktop-nav">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  [
                    { to: '/admin/dashboard',   icon: FaUser,          label: 'Dashboard'   },
                    { to: '/admin/entreprises', icon: FaBuilding,      label: 'Entreprises' },
                    { to: '/messages',          icon: FiMessageSquare, label: 'Messages'    },
                    { to: '/admin/plans',       icon: FiAward,         label: 'Plans'       },
                  ].map(({ to, icon: Icon, label }) => (
                    <Link key={to} to={to} className="nav-link" style={{ ...navLinkStyle, color: isActive(to) ? 'var(--brand-primary)' : 'var(--text-primary)', fontWeight: isActive(to) ? 700 : 500 }}>
                      <Icon style={{ fontSize: '1rem' }} />{label}
                    </Link>
                  ))
                ) : (
                  <>
                    {(isProvider ? providerLinks : clientLinks).map(({ to, icon: Icon, label }) => (
                      <Link key={to} to={to} className="nav-link" style={{ ...navLinkStyle, color: isActive(to) ? 'var(--brand-primary)' : 'var(--text-primary)', fontWeight: isActive(to) ? 700 : 500 }}>
                        <Icon style={{ fontSize: '1rem' }} />{label}
                      </Link>
                    ))}
                    {hasPendingEntreprise && !isProvider && (
                      <Link to="/dashboard" className="nav-link" style={{ ...navLinkStyle, color: '#f59e0b', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', fontWeight: 600 }}>
                        <FiClock style={{ fontSize: '1rem' }} />Validation en cours
                      </Link>
                    )}
                  </>
                )}

                <BellButton {...bellProps} />

                {/* User dropdown */}
                <div ref={settingsRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => { setShowSettingsDropdown(p => !p); setShowNotifPanel(false); }}
                    className="settings-trigger"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem', border: '2px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.3s', whiteSpace: 'nowrap' }}
                  >
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <UserAvatar size={35} />
                      <div style={{ position: 'absolute', bottom: 0, right: -2, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid var(--bg-primary)', animation: 'pulse 2s ease-in-out infinite' }} />
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{user.name.split(' ')[0]}</span>
                    {user.role === 'admin'               && <span style={badgeStyle('#3b82f6')}>ADMIN</span>}
                    {isProvider                          && <span style={badgeStyle('#10b981')}>PRESTATAIRE</span>}
                    {hasPendingEntreprise && !isProvider && <span style={badgeStyle('#f59e0b')}>EN VALIDATION</span>}
                    <FiChevronDownIcon style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', transition: 'transform 0.3s', transform: showSettingsDropdown ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </button>

                  {showSettingsDropdown && (
                    <div className="settings-dropdown-menu" style={{ position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0, backgroundColor: 'var(--bg-card)', borderRadius: '1rem', boxShadow: 'var(--shadow-lg)', border: '2px solid var(--border-color)', minWidth: 380, maxHeight: '70vh', overflow: 'auto', zIndex: 1001 }}>
                      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-secondary)', borderRadius: '1rem 1rem 0 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ flexShrink: 0, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--brand-primary)' }}><UserAvatar size={52} /></div>
                          <div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '0.25rem' }}>{user.name}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</p>
                            {isProvider              && <span style={{ ...badgeStyle('#10b981'), display: 'inline-block', marginTop: '0.25rem' }}>Prestataire</span>}
                            {hasPendingEntreprise && !isProvider && <span style={{ ...badgeStyle('#f59e0b'), display: 'inline-block', marginTop: '0.25rem' }}>⏳ Validation en cours</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '0.75rem' }}>
                        {settingsSections.map(({ id, label, icon: Icon, description, color }) => (
                          <button key={id} onClick={() => { navigate(`/settings?tab=${id}`); setShowSettingsDropdown(false); }} className="settings-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', width: '100%', backgroundColor: 'transparent', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', marginBottom: '0.25rem', transition: 'all 0.2s', color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '0.5rem', backgroundColor: `${color}20`, color, fontSize: '1.125rem', flexShrink: 0 }}><Icon /></div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                              <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.1rem' }}>{label}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{description}</div>
                            </div>
                            <FiChevronDownIcon style={{ fontSize: '0.875rem', color: 'var(--text-muted)', transform: 'rotate(-90deg)' }} />
                          </button>
                        ))}
                      </div>
                      <div style={{ padding: '0.75rem 1.5rem 1.25rem', borderTop: '1px solid var(--border-color)' }}>
                        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                          <FaSignOutAlt />Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {[{ to: '/', icon: FaHome, label: 'Accueil' }, { to: '/entreprises', icon: FaBuilding, label: 'Entreprises' }].map(({ to, icon: Icon, label }) => (
                  <Link key={to} to={to} className="nav-link" style={{ ...navLinkStyle, color: isActive(to) ? 'var(--brand-primary)' : 'var(--text-primary)', fontWeight: isActive(to) ? 700 : 500 }}>
                    <Icon style={{ fontSize: '1rem' }} />{label}
                  </Link>
                ))}
                <div style={{ position: 'relative' }} onMouseEnter={() => setShowServicesDropdown(true)} onMouseLeave={() => setShowServicesDropdown(false)}>
                  <Link to="/services" className="nav-link" style={{ ...navLinkStyle, color: isActive('/services') ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    <FaTools style={{ fontSize: '1rem' }} />Services<FaChevronDown style={{ fontSize: '0.75rem' }} />
                  </Link>
                  {showServicesDropdown && (
                    <div className="mega-dropdown" style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: '1rem', boxShadow: 'var(--shadow-lg)', border: '2px solid var(--border-color)', minWidth: 600, maxWidth: 700, maxHeight: '70vh', overflow: 'auto' }}>
                      <div style={{ padding: '1.5rem', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-secondary)', borderRadius: '1rem 1rem 0 0' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--brand-primary)', marginBottom: '0.25rem' }}>Nos Services</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{loadingDomaines ? 'Chargement...' : `${domaines.length} domaines disponibles`}</p>
                      </div>
                      {loadingDomaines ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div style={{ width: 30, height: 30, border: '3px solid var(--border-color)', borderTop: '3px solid var(--brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>
                      ) : domaines.length > 0 ? (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', padding: '1rem' }}>
                            {domaines.map(d => (
                              <button key={d.id} onClick={() => { navigate(`/services?type=${d.id}`); setShowServicesDropdown(false); }} className="service-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '2px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-primary)', transition: 'all 0.3s' }}>
                                <FaTools style={{ fontSize: '1.25rem', color: 'var(--brand-primary)', flexShrink: 0 }} />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', textAlign: 'left' }}>{d.name}</span>
                              </button>
                            ))}
                          </div>
                          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                            <Link to="/services" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600 }} onClick={() => setShowServicesDropdown(false)}>Voir tous les services →</Link>
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '3rem', textAlign: 'center' }}><p style={{ color: 'var(--text-secondary)' }}>Aucun service disponible</p></div>
                      )}
                    </div>
                  )}
                </div>
                <Link to="/login" style={{ backgroundColor: 'transparent', color: 'var(--brand-primary)', border: '2px solid var(--brand-primary)', padding: '0.625rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem', transition: 'all 0.3s', whiteSpace: 'nowrap' }}>Connexion</Link>
                <Link to="/register" style={{ backgroundColor: 'var(--brand-primary)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem', boxShadow: 'var(--shadow-md)', transition: 'all 0.3s', whiteSpace: 'nowrap' }}>Inscription</Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user && (
              <div className="mobile-bell" style={{ display: 'none' }}>
                <BellButton {...bellProps} />
              </div>
            )}
            <button onClick={() => setMobileMenuOpen(p => !p)} className="mobile-menu-btn" style={{ display: 'none', backgroundColor: 'transparent', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', flexShrink: 0 }}>
              {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', zIndex: 999, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-card)', width: '80%', maxWidth: 400, height: '100%', padding: '2rem 1.5rem', overflowY: 'auto', boxShadow: '-4px 0 20px rgba(0,0,0,0.3)', animation: 'slideInRight 0.3s ease' }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <UserAvatar size={50} />
                  <div style={{ position: 'absolute', bottom: 0, right: -2, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid var(--bg-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{user.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                  {isProvider && <span style={{ ...badgeStyle('#10b981'), display: 'inline-block', marginTop: '0.25rem' }}>Prestataire</span>}
                </div>
                {unreadCount > 0 && <span style={{ backgroundColor: '#ef4444', color: '#fff', borderRadius: 999, minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {user ? (
                <>
                  {user.role === 'admin' ? (
                    <>
                      <MobileLink to="/admin/dashboard"   icon={FaUser}          label="Dashboard Admin" onClick={() => setMobileMenuOpen(false)} />
                      <MobileLink to="/admin/entreprises" icon={FaBuilding}      label="Entreprises"     onClick={() => setMobileMenuOpen(false)} />
                      <MobileLink to="/messages"          icon={FiMessageSquare} label="Messages"        onClick={() => setMobileMenuOpen(false)} />
                      <MobileLink to="/admin/plans"       icon={FiAward}         label="Plans"           onClick={() => setMobileMenuOpen(false)} />
                    </>
                  ) : (
                    <>
                      {(isProvider ? providerLinks : clientLinks).map(({ to, icon: Icon, label }) => (
                        <MobileLink key={to} to={to} icon={Icon} label={label} onClick={() => setMobileMenuOpen(false)} />
                      ))}
                      {hasPendingEntreprise && !isProvider && <MobileLink to="/dashboard" icon={FiClock} label="⏳ Suivi de validation" onClick={() => setMobileMenuOpen(false)} />}
                    </>
                  )}
                  <MobileLink to="/settings" icon={FiSettings} label="Paramètres" onClick={() => setMobileMenuOpen(false)} />
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', border: '1px solid var(--border-color)' }}
                    onClick={() => { setMobileMenuOpen(false); navigate('/notifications'); }}
                  >
                    <FiBell style={{ color: 'var(--brand-primary)', fontSize: '1.1rem' }} />
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Notifications</span>
                    {unreadCount > 0 && <span style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: '#fff', borderRadius: 999, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{unreadCount}</span>}
                  </div>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '1rem', marginTop: '1rem', backgroundColor: 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
                    <FaSignOutAlt />Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <MobileLink to="/"            icon={FaHome}     label="Accueil"     onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink to="/entreprises" icon={FaBuilding}  label="Entreprises" onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink to="/services"    icon={FaTools}    label="Services"    onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink to="/login"       icon={FaUser}     label="Connexion"   onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink to="/register"    icon={FaUser}     label="Inscription" onClick={() => setMobileMenuOpen(false)} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .desktop-nav { display: flex; }
        .mobile-menu-btn { display: none !important; }
        .mobile-bell { display: none !important; }
        @media (max-width: 1200px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .mobile-bell { display: flex !important; }
        }
        .nav-link { text-decoration:none; padding:0.5rem 1rem; display:flex; align-items:center; gap:0.5rem; white-space:nowrap; border-radius:0.5rem; font-size:0.95rem; position:relative; transition:all 0.2s ease; }
        .nav-link::after { content:''; position:absolute; bottom:-5px; left:50%; transform:translateX(-50%) scaleX(0); width:80%; height:3px; background:var(--brand-primary); border-radius:2px; transition:transform 0.3s ease; }
        .nav-link:hover::after { transform:translateX(-50%) scaleX(1); }
        .settings-trigger:hover { background-color:var(--bg-tertiary) !important; }
        .settings-item:hover { background-color:var(--bg-secondary) !important; transform:translateX(4px); }
        .service-item:hover { transform:translateY(-3px); box-shadow:var(--shadow-md); background-color:var(--bg-tertiary) !important; }
        .bell-btn:hover { background-color:var(--brand-primary) !important; color:#fff !important; border-color:var(--brand-primary) !important; }
        .mega-dropdown, .settings-dropdown-menu { animation:slideDown 0.25s ease; }
        @keyframes slideDown    { from{opacity:0;transform:translateY(-8px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes slideInRight { from{transform:translateX(100%)}            to{transform:translateX(0)} }
        @keyframes spin         { to{transform:rotate(360deg)} }
        @keyframes pulse        { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.15)} }
        @keyframes badgePop     { 0%{transform:scale(0)} 80%{transform:scale(1.2)} 100%{transform:scale(1)} }
      `}</style>
    </>
  );
}

function MobileLink({ to, icon: Icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', color: 'var(--text-primary)', textDecoration: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 500 }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <Icon style={{ color: 'var(--brand-primary)' }} />{label}
    </Link>
  );
}