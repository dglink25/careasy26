import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  FiBell, FiTrash2, FiCheckSquare, FiRefreshCw, FiArrowLeft, FiCheck,
  FiMessageSquare, FiCalendar, FiCheckCircle, FiXCircle, FiAward,
  FiAlertTriangle, FiAlertCircle, FiZap,
} from 'react-icons/fi';
import { MdOutlineBusiness } from 'react-icons/md';

const NOTIF_ICONS = {
  message:                { Icon: FiMessageSquare, color: '#3b82f6' },
  rdv_pending:            { Icon: FiCalendar,      color: '#f59e0b' },
  rdv_confirmed:          { Icon: FiCheckCircle,   color: '#10b981' },
  rdv_cancelled:          { Icon: FiXCircle,       color: '#ef4444' },
  rdv_completed:          { Icon: FiAward,         color: '#8b5cf6' },
  entreprise_approved:    { Icon: MdOutlineBusiness, color: '#10b981' },
  entreprise_rejected:    { Icon: FiAlertTriangle, color: '#ef4444' },
  new_entreprise_pending: { Icon: FiAlertCircle,   color: '#f59e0b' },
  trial_started:          { Icon: FiZap,           color: '#10b981' },
  default:                { Icon: FiBell,          color: '#6b7280' },
};

const FILTERS = [
  { key: 'all',        label: 'Toutes',       FilterIcon: null },
  { key: 'unread',     label: 'Non lues',     FilterIcon: null },
  { key: 'message',    label: 'Messages',     FilterIcon: FiMessageSquare },
  { key: 'rdv',        label: 'RDV',          FilterIcon: FiCalendar },
  { key: 'entreprise', label: 'Entreprises',  FilterIcon: MdOutlineBusiness },
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d   = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)     return 'À l\'instant';
  if (diff < 3600)   return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400)  return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
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

function resolveNotifUrl(data, notif) {
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

  
  if (type === 'rdv_pending' || type === 'rdv_confirmed' || type === 'rdv_cancelled' || type === 'rdv_completed') {
    const rdvId = data?.rdv_id;
    if (rdvId) {
      return { path: `/rendez-vous/${rdvId}`, state: null };
    }
   
    if (url && url !== '/') return { path: url, state: null };
    return { path: '/mes-rendez-vous', state: null };
  }

  
  if (type === 'entreprise_approved' || type === 'entreprise_rejected') {
    const entrepriseId = data?.entreprise_id;
    if (type === 'entreprise_approved') {
      return { path: '/mes-entreprises', state: null };
    }
    return { path: '/entreprises/creer', state: null };
  }

  if (type === 'new_entreprise_pending') {
    const entrepriseId = data?.entreprise_id;
    if (entrepriseId) return { path: `/admin/entreprises/${entrepriseId}`, state: null };
    return { path: '/admin/entreprises', state: null };
  }

  if (type === 'trial_started') {
    return { path: '/mes-entreprises', state: null };
  }

 
  if (url && url !== '/' && url.startsWith('/')) {
    return { path: url, state: null };
  }

  return null; 
}

export default function Notifications() {
  const navigate = useNavigate();

  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=100');
      setNotifs(res.data?.notifications || res.data || []);
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
 const filtered = notifs.filter(n => {
    const data = parseNotifData(n);
    const type = data?.type || '';
    if (filter === 'unread')     return !n.read_at;
    if (filter === 'message')    return type === 'message';
    if (filter === 'rdv')        return type.startsWith('rdv');
    if (filter === 'entreprise') return type.includes('entreprise') || type === 'trial_started';
    return true;
  });

  const unreadCount = notifs.filter(n => !n.read_at).length;

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark-read`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch {}
  };

  const deleteOne = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifs(prev => prev.filter(n => n.id !== id));
      setSelected(prev => prev.filter(s => s !== id));
    } catch {}
  };

  const deleteSelected = async () => {
    await Promise.all(selected.map(id => api.delete(`/notifications/${id}`).catch(() => {})));
    setNotifs(prev => prev.filter(n => !selected.includes(n.id)));
    setSelected([]);
  };

  const handleClick = async (notif) => {
    if (!notif.read_at) {
      markRead(notif.id); 
    }

    const data       = parseNotifData(notif);
    const destination = resolveNotifUrl(data, notif);

    if (!destination) return;

    if (destination.state) {
      navigate(destination.path, { state: destination.state });
    } else {
      navigate(destination.path);
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const getMeta = (notif) => {
    const type = parseNotifData(notif)?.type || 'default';
    return NOTIF_ICONS[type] || NOTIF_ICONS.default;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary, #f8fafc)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--text-primary, #1e293b)', fontWeight: 500 }}
          >
            <FiArrowLeft /> Retour
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FiBell style={{ color: 'var(--brand-primary, #3b82f6)' }} />
              Notifications
              {unreadCount > 0 && (
                <span style={{ backgroundColor: '#ef4444', color: '#fff', borderRadius: 999, padding: '0.2rem 0.65rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={load} style={iconBtn} title="Actualiser">
              <FiRefreshCw />
            </button>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ ...iconBtn, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-primary, #3b82f6)' }}>
                <FiCheckSquare /> Tout lire
              </button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.5rem 1rem', borderRadius: 999, border: '1.5px solid',
                borderColor: filter === f.key ? 'var(--brand-primary, #3b82f6)' : 'var(--border-color, #e2e8f0)',
                backgroundColor: filter === f.key ? 'var(--brand-primary, #3b82f6)' : 'transparent',
                color: filter === f.key ? '#fff' : 'var(--text-secondary, #64748b)',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              {f.FilterIcon && <f.FilterIcon size={13} />}
              {f.label}
              {f.key === 'unread' && unreadCount > 0 && (
                <span style={{ marginLeft: '0.2rem', backgroundColor: filter === 'unread' ? 'rgba(255,255,255,0.3)' : '#ef4444', color: '#fff', borderRadius: 999, padding: '0.1rem 0.4rem', fontSize: '0.72rem' }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Barre d'actions sélection */}
        {selected.length > 0 && (
          <div style={{ backgroundColor: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#1e40af', fontWeight: 600, fontSize: '0.9rem' }}>
              {selected.length} sélectionnée(s)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={deleteSelected} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                <FiTrash2 /> Supprimer
              </button>
              <button onClick={() => setSelected([])} style={{ backgroundColor: 'transparent', border: '1px solid #93c5fd', borderRadius: '0.5rem', padding: '0.4rem 0.875rem', cursor: 'pointer', color: '#1e40af', fontSize: '0.85rem', fontWeight: 600 }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Liste */}
        <div style={{ backgroundColor: 'var(--bg-card, #fff)', borderRadius: '1rem', border: '1px solid var(--border-color, #e2e8f0)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, border: '3px solid var(--border-color, #e2e8f0)', borderTop: '3px solid var(--brand-primary, #3b82f6)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-secondary, #64748b)' }}>Chargement...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔔</div>
              <p style={{ color: 'var(--text-secondary, #64748b)', fontWeight: 600, fontSize: '1.1rem' }}>
                {filter === 'unread' ? 'Tout est lu !' : 'Aucune notification'}
              </p>
              <p style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                {filter === 'unread' ? 'Vous êtes à jour 🎉' : 'Revenez plus tard'}
              </p>
            </div>
          ) : (
            filtered.map((notif, idx) => {
              const meta   = getMeta(notif);
              const { Icon: NotifIcon } = meta;
              const data   = parseNotifData(notif);
              const isRead = !!notif.read_at;
              const title  = data?.title || data?.message || 'Notification';
              const body   = data?.body  || data?.admin_note || data?.reason || '';
              const isSel  = selected.includes(notif.id);

              
              const destination = resolveNotifUrl(data, notif);
              const isClickable = !!destination;

              return (
                <div
                  key={notif.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                    padding: '1rem 1.25rem',
                    backgroundColor: isSel ? '#eff6ff' : isRead ? 'transparent' : `${meta.color}06`,
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-color, #f1f5f9)' : 'none',
                    transition: 'background 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = 'var(--bg-secondary, #f8fafc)'; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.backgroundColor = isRead ? 'transparent' : `${meta.color}06`; }}
                >
                  {/* Checkbox sélection */}
                  <div
                    onClick={(e) => { e.stopPropagation(); toggleSelect(notif.id); }}
                    style={{
                      width: 20, height: 20, borderRadius: '0.3rem', flexShrink: 0,
                      border: `2px solid ${isSel ? 'var(--brand-primary, #3b82f6)' : 'var(--border-color, #cbd5e1)'}`,
                      backgroundColor: isSel ? 'var(--brand-primary, #3b82f6)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s', marginTop: '0.2rem', cursor: 'pointer',
                    }}
                  >
                    {isSel && <FiCheck size={12} color="#fff" />}
                  </div>

                  {/* Point non-lu */}
                  {!isRead ? (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: meta.color, marginTop: '0.5rem', boxShadow: `0 0 6px ${meta.color}80` }} />
                  ) : (
                    <div style={{ width: 8, flexShrink: 0 }} />
                  )}

                  {/* ✅ Icône React (pas emoji) — cliquable */}
                  <div
                    onClick={() => isClickable && handleClick(notif)}
                    style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: `${meta.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: isClickable ? 'pointer' : 'default',
                    }}
                  >
                    <NotifIcon size={20} color={meta.color} />
                  </div>

                  {/* Contenu — cliquable */}
                  <div
                    style={{ flex: 1, minWidth: 0, cursor: isClickable ? 'pointer' : 'default' }}
                    onClick={() => isClickable && handleClick(notif)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: isRead ? 500 : 700, color: 'var(--text-primary, #1e293b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {formatDate(notif.created_at)}
                      </div>
                    </div>

                    {body && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.25rem', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {body}
                      </div>
                    )}

                    {/* ✅ Badge de destination avec icône React */}
                    {isClickable && (
                      <div style={{ fontSize: '0.72rem', color: meta.color, marginTop: '0.3rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <NotifIcon size={11} />
                        {data?.type === 'message'           && 'Ouvrir la conversation'}
                        {data?.type?.startsWith('rdv')      && 'Voir le rendez-vous'}
                        {data?.type?.includes('entreprise') && "Voir l'entreprise"}
                        {data?.type === 'trial_started'     && 'Mon espace prestataire'}
                        {!['message'].includes(data?.type) && !data?.type?.startsWith('rdv') && !data?.type?.includes('entreprise') && data?.type !== 'trial_started' && 'Voir'}
                        <span style={{ marginLeft: 1 }}>→</span>
                      </div>
                    )}
                  </div>

                  {/* Boutons actions */}
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {!isRead && (
                      <button
                        onClick={() => markRead(notif.id)}
                        title="Marquer comme lu"
                        style={{ ...iconBtn, color: meta.color }}
                      >
                        <FiCheck size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteOne(notif.id)}
                      title="Supprimer"
                      style={{ ...iconBtn, color: '#ef4444' }}
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer stats */}
        {!loading && notifs.length > 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.82rem', marginTop: '1.25rem' }}>
            {notifs.length} notification(s) au total · {unreadCount} non lue(s)
          </p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const iconBtn = {
  background: 'none',
  border: '1px solid var(--border-color, #e2e8f0)',
  borderRadius: '0.4rem',
  padding: '0.35rem',
  cursor: 'pointer',
  color: 'var(--text-secondary, #64748b)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.2s',
};