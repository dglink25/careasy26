// src/pages/messages/MessagesPage.jsx — VERSION FINALE
// Fix : le dernier message s'affiche et ne repart plus
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiMessageSquare, FiSearch, FiLoader,
  FiRefreshCw, FiPlus, FiX, FiBell,
} from 'react-icons/fi';
import { messageApi }   from '../../api/messageApi';
import { publicApi }    from '../../api/publicApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth }      from '../../contexts/AuthContext';
import ChatModal        from '../../components/Chat/ChatModal';
import theme            from '../../config/theme';

export default function MessagesPage() {
  const { user } = useAuth();

  const [conversations,    setConversations]    = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [searchTerm,       setSearchTerm]       = useState('');
  const [selectedConv,     setSelectedConv]     = useState(null);
  const [error,            setError]            = useState('');
  const [flashConvId,      setFlashConvId]      = useState(null);
  const [showNewModal,     setShowNewModal]     = useState(false);
  const [providers,        setProviders]        = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerSearch,   setProviderSearch]   = useState('');

  // ── Ref pour savoir si un fetch est en cours (éviter les race conditions) ──
  const fetchingRef    = useRef(false);
  const selectedConvRef = useRef(null);
  selectedConvRef.current = selectedConv;

  // ── Charger conversations ──────────────────────────────────────────────────
  // ✅ merge=true : ne remplace que les champs froids, garde last_message local
  const fetchConversations = useCallback(async (silent = false, merge = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      if (!silent) setLoading(true);
      setError('');
      const fresh = await messageApi.getMyConversations();

      setConversations(prev => {
        if (!merge || prev.length === 0) return fresh;

        // Fusionner : garder le last_message local si plus récent
        return fresh.map(freshConv => {
          const local = prev.find(p => p.id === freshConv.id);
          if (!local) return freshConv;

          const localMsg  = local.messages?.[local.messages.length - 1];
          const freshMsg  = freshConv.messages?.[0];

          const localDate = localMsg  ? new Date(localMsg.created_at).getTime()  : 0;
          const freshDate = freshMsg  ? new Date(freshMsg.created_at).getTime()  : 0;

          return {
            ...freshConv,
            // Garder le message local s'il est plus récent
            messages: localDate > freshDate
              ? local.messages
              : freshConv.messages,
            // Garder l'unread_count local si la conv est ouverte
            unread_count: selectedConvRef.current?.id === freshConv.id
              ? 0
              : freshConv.unread_count,
          };
        });
      });

    } catch {
      setError('Impossible de charger les conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchingRef.current = false;
    }
  }, []);

  // Premier chargement + polling (avec merge pour ne pas écraser le state local)
  useEffect(() => {
    fetchConversations(false, false);
    const t = setInterval(() => fetchConversations(true, true), 30000);
    return () => clearInterval(t);
  }, [fetchConversations]);

  // ── WebSocket : mise à jour immédiate du dernier message ───────────────────
  const handleWsNewMessage = useCallback((data) => {
    const msg    = data.message || data;
    const convId = data.conversation_id || msg?.conversation_id;
    if (!convId) return;

    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === convId);

      // Conversation inconnue → recharger (avec merge)
      if (idx === -1) {
        fetchConversations(true, true);
        return prev;
      }

      const updated = [...prev];
      const conv    = { ...updated[idx] };

      // ✅ Remplacer messages par [msg] — c'est le DERNIER message reçu
      // Le tri par date dans getLastMessage s'occupera du reste
      const existingMsgs = conv.messages || [];
      const alreadyHere  = existingMsgs.some(m => m.id === msg.id);
      if (!alreadyHere) {
        conv.messages = [...existingMsgs, msg];
      }

      conv.updated_at = msg.created_at || new Date().toISOString();

      // Incrémenter non-lus seulement si la conv n'est pas ouverte
      if (selectedConvRef.current?.id !== convId) {
        conv.unread_count = (conv.unread_count || 0) + 1;
      }

      // Remonter en haut de la liste
      updated.splice(idx, 1);
      updated.unshift(conv);
      return updated;
    });

    setFlashConvId(convId);
    setTimeout(() => setFlashConvId(null), 1800);
  }, [fetchConversations]);

  const handleWsMessagesRead = useCallback((data) => {
    setConversations(prev =>
      prev.map(c => c.id === data.conversation_id ? { ...c, unread_count: 0 } : c)
    );
  }, []);

  useWebSocket({ onNewMessage: handleWsNewMessage, onMessagesRead: handleWsMessagesRead });

  // ── Charger prestataires ───────────────────────────────────────────────────
  const fetchProviders = async () => {
    setLoadingProviders(true);
    try {
      const entreprises = await publicApi.getEntreprises();
      const map = new Map();
      entreprises.forEach(e => {
        if (e.prestataire_id && e.status === 'validated') {
          if (!map.has(e.prestataire_id)) {
            map.set(e.prestataire_id, {
              id: e.prestataire_id,
              name: e.pdg_full_name || 'Prestataire',
              companies: [],
            });
          }
          map.get(e.prestataire_id).companies.push({ id: e.id, name: e.name, logo: e.logo });
        }
      });
      setProviders([...map.values()].sort((a,b) => b.companies.length - a.companies.length));
    } catch {
      setError('Impossible de charger les prestataires');
    } finally {
      setLoadingProviders(false);
    }
  };

  // ── Ouvrir conversation ────────────────────────────────────────────────────
  const handleConvClick = (conv) => {
    const otherUserId = conv.user_one_id === user?.id
      ? conv.user_two_id
      : conv.user_one_id;

    if (!otherUserId || parseInt(otherUserId) === parseInt(user?.id)) return;

    setSelectedConv({
      id:            conv.id,
      other_user_id: otherUserId,
      other_user:    conv.other_user || { id: otherUserId, name: 'Utilisateur' },
    });
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
    );
  };

  const handleStartWithProvider = (provider) => {
    if (!provider.id || parseInt(provider.id) === parseInt(user?.id)) return;
    setSelectedConv({
      id:            null,
      other_user_id: provider.id,
      other_user:    { id: provider.id, name: provider.name || 'Prestataire' },
    });
    setShowNewModal(false);
  };

  // ✅ Ne PAS recharger toutes les convs à la fermeture — ça écrase le state local
  const handleCloseChat = () => {
    setSelectedConv(null);
    // Recharger en mode merge pour garder les messages locaux
    fetchConversations(true, true);
  };

  // ── ✅ getLastMessage : prend le message avec la date la plus récente ───────
  const getLastMessage = (conv) => {
    if (!conv.messages?.length) return 'Aucun message';

    const last = [...conv.messages].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )[0];

    const content = last.type === 'image'    ? '🖼️ Image'
                  : last.type === 'video'    ? '🎥 Vidéo'
                  : last.type === 'vocal'    ? '🎤 Message vocal'
                  : last.type === 'document' ? '📎 Document'
                  : last.content || '';

    return content.length > 55 ? content.slice(0, 55) + '…' : content;
  };

  const fmtDate = (ds) => {
    if (!ds) return '';
    const d = new Date(ds), now = new Date(), diff = now - d;
    if (diff < 60000)     return "À l'instant";
    if (diff < 3600000)   return `Il y a ${Math.floor(diff/60000)} min`;
    if (diff < 86400000)  return `Il y a ${Math.floor(diff/3600000)}h`;
    if (diff < 604800000) return `Il y a ${Math.floor(diff/86400000)}j`;
    return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
  };

  const totalUnread = conversations.reduce((s,c) => s+(c.unread_count||0), 0);

  const filtered = conversations.filter(c => {
    const name = c.other_user?.name || '';
    const last = getLastMessage(c);
    return name.toLowerCase().includes(searchTerm.toLowerCase())
        || last.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(providerSearch.toLowerCase()) ||
    p.companies.some(c => c.name?.toLowerCase().includes(providerSearch.toLowerCase()))
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={s.page}>
      <div style={s.centered}>
        <FiLoader style={{ fontSize:'2.5rem', color:theme.colors.primary, animation:'spin 1s linear infinite' }}/>
        <p style={{ color:'#64748b' }}>Chargement de vos messages…</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.content}>

        <div style={s.header}>
          <div>
            <h1 style={s.title}>
              <FiMessageSquare style={{ color:theme.colors.primary, fontSize:'2rem' }}/>
              Messages
              {totalUnread > 0 && <span style={s.globalBadge}>{totalUnread}</span>}
            </h1>
            <p style={{ color:'#64748b', fontSize:'1rem' }}>Conversations en temps réel</p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={() => { setShowNewModal(true); fetchProviders(); }} style={s.btnNew}>
              <FiPlus/> Nouvelle conversation
            </button>
            <button onClick={() => { setRefreshing(true); fetchConversations(false, false); }} disabled={refreshing} style={s.btnRefresh}>
              <FiRefreshCw style={refreshing?{animation:'spin 1s linear infinite'}:{}}/>
              {refreshing ? 'Actualisation…' : 'Actualiser'}
            </button>
          </div>
        </div>

        <div style={s.stats}>
          {[
            { icon:<FiMessageSquare/>, value:conversations.length, label:'Conversations' },
            { icon:<FiBell/>,          value:totalUnread,           label:'Non lus' },
          ].map((st,i) => (
            <div key={i} style={s.statCard}>
              <span style={{ fontSize:'1.75rem', color:theme.colors.primary }}>{st.icon}</span>
              <div>
                <div style={{ fontSize:'1.75rem', fontWeight:800, color:'#1e293b' }}>{st.value}</div>
                <div style={{ fontSize:'0.8rem', color:'#64748b' }}>{st.label}</div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={s.errorBanner}>
            {error}
            <button onClick={() => fetchConversations(false, false)} style={s.btnRetry}>Réessayer</button>
          </div>
        )}

        <div style={{ position:'relative', marginBottom:'1.5rem' }}>
          <FiSearch style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input type="text" placeholder="Rechercher une conversation…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={s.searchInput}/>
        </div>

        {filtered.length === 0 ? (
          <div style={s.empty}>
            <FiMessageSquare size={56} color="#d1d5db"/>
            <h3 style={{ fontSize:'1.25rem', fontWeight:700, color:'#1e293b' }}>
              {conversations.length === 0 ? 'Aucune conversation' : 'Aucun résultat'}
            </h3>
            <p style={{ color:'#64748b' }}>
              {conversations.length === 0
                ? 'Vos conversations apparaîtront ici.'
                : `Aucune correspondance pour "${searchTerm}"`}
            </p>
            {conversations.length === 0 && (
              <button onClick={() => { setShowNewModal(true); fetchProviders(); }} style={s.btnNew}>
                <FiPlus/> Démarrer une conversation
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(conv => {
              const hasUnread = (conv.unread_count||0) > 0;
              const isFlash   = flashConvId === conv.id;
              return (
                <div key={conv.id} onClick={() => handleConvClick(conv)}
                  style={{ ...s.convCard, ...(hasUnread&&s.convCardUnread), ...(isFlash&&s.convCardFlash) }}
                  className="conv-card">
                  <div style={{ ...s.convAvatar, ...(hasUnread&&{background:theme.colors.primary,color:'#fff'}) }}>
                    {conv.other_user?.name?.charAt(0).toUpperCase()||'U'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:'1rem', fontWeight:hasUnread?700:600,
                        color:hasUnread?theme.colors.primary:'#1e293b' }}>
                        {conv.other_user?.name||'Utilisateur'}
                      </span>
                      <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{fmtDate(conv.updated_at)}</span>
                    </div>
                    <p style={{ margin:0, fontSize:'0.875rem',
                      color:hasUnread?'#475569':'#64748b',
                      fontWeight:hasUnread?500:400,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {getLastMessage(conv)}
                    </p>
                  </div>
                  {hasUnread && <div style={s.unreadBadge}>{conv.unread_count}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNewModal && (
        <div style={s.modalOverlay} onClick={() => setShowNewModal(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={{ fontSize:'1.3rem', fontWeight:700, color:'#1e293b', margin:0 }}>
                Nouvelle conversation
              </h2>
              <button onClick={() => setShowNewModal(false)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', fontSize:'1.4rem' }}>
                <FiX/>
              </button>
            </div>
            <div style={{ padding:'1rem 1.5rem 1.5rem' }}>
              <div style={{ position:'relative', marginBottom:'1rem' }}>
                <FiSearch style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
                <input type="text" placeholder="Rechercher un prestataire…"
                  value={providerSearch} onChange={e => setProviderSearch(e.target.value)}
                  style={s.searchInput}/>
              </div>
              {loadingProviders ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'2rem' }}>
                  <FiLoader style={{ animation:'spin 1s linear infinite', fontSize:'2rem', color:theme.colors.primary }}/>
                </div>
              ) : filteredProviders.length === 0 ? (
                <p style={{ color:'#94a3b8', textAlign:'center', padding:'2rem 0' }}>Aucun prestataire disponible</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:360, overflowY:'auto' }}>
                  {filteredProviders.map(p => (
                    <div key={p.id} onClick={() => handleStartWithProvider(p)}
                      style={s.providerCard} className="provider-card">
                      <div style={s.convAvatar}>
                        {p.companies?.[0]?.logo
                          ? <img src={p.companies[0].logo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>
                          : p.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, color:'#1e293b' }}>{p.name}</div>
                        <div style={{ fontSize:'0.8rem', color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {p.companies?.map(c => c.name).join(', ')||'Aucune entreprise'}
                        </div>
                      </div>
                      <FiMessageSquare color={theme.colors.primary}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedConv && (
        <ChatModal
          conversationId={selectedConv.id}
          receiverId={selectedConv.other_user_id || selectedConv.other_user?.id}
          receiverName={selectedConv.other_user?.name || 'Utilisateur'}
          onClose={handleCloseChat}
          existingConversation={selectedConv.id !== null}
        />
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes flashIn { 0%{background:#fef3c7} 100%{background:#fff} }
        .conv-card { transition: all 0.25s ease; cursor: pointer; }
        .conv-card:hover { transform: translateX(6px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
        .provider-card { transition: all 0.2s ease; cursor: pointer; }
        .provider-card:hover { background: #fef2f2; border-color: ${theme.colors.primary}; }
      `}</style>
    </div>
  );
}

const s = {
  page:           { minHeight:'100vh', background:'#f8fafc', padding:'2rem 0 4rem' },
  content:        { maxWidth:960, margin:'0 auto', padding:'0 1.5rem' },
  centered:       { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16 },
  header:         { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.75rem', flexWrap:'wrap', gap:14 },
  title:          { display:'flex', alignItems:'center', gap:12, fontSize:'2rem', fontWeight:800, color:'#1e293b', marginBottom:6 },
  globalBadge:    { background:theme.colors.primary, color:'#fff', fontSize:'0.9rem', fontWeight:700, padding:'2px 10px', borderRadius:20, boxShadow:'0 2px 8px rgba(239,68,68,0.3)' },
  stats:          { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:16, marginBottom:'1.75rem' },
  statCard:       { background:'#fff', padding:'1.25rem', borderRadius:16, border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:14 },
  errorBanner:    { background:'#fee2e2', border:'1px solid #fecaca', borderRadius:12, padding:'0.875rem 1rem', marginBottom:'1.5rem', color:'#dc2626', display:'flex', justifyContent:'space-between', alignItems:'center' },
  searchInput:    { width:'100%', padding:'0.75rem 1rem 0.75rem 2.75rem', border:'2px solid #e2e8f0', borderRadius:12, fontSize:'0.9rem', outline:'none', background:'#fff', boxSizing:'border-box' },
  convCard:       { background:'#fff', padding:'1.25rem 1.5rem', borderRadius:16, border:'1px solid #e2e8f0', display:'flex', gap:14, alignItems:'center', position:'relative' },
  convCardUnread: { borderColor:theme.colors.primary, background:'#fef2f2', boxShadow:`0 0 0 1px ${theme.colors.primary}20` },
  convCardFlash:  { animation:'flashIn 1.8s ease' },
  convAvatar:     { width:50, height:50, borderRadius:'50%', background:`${theme.colors.primary}20`, color:theme.colors.primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', fontWeight:700, flexShrink:0, overflow:'hidden' },
  unreadBadge:    { background:theme.colors.primary, color:'#fff', width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, flexShrink:0, boxShadow:'0 2px 8px rgba(239,68,68,0.3)' },
  empty:          { background:'#fff', padding:'4rem 2rem', borderRadius:16, border:'2px dashed #e2e8f0', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14 },
  btnNew:         { display:'flex', alignItems:'center', gap:8, background:theme.colors.primary, color:'#fff', border:'none', padding:'0.7rem 1.4rem', borderRadius:12, fontSize:'0.875rem', fontWeight:600, cursor:'pointer', boxShadow:'0 2px 8px rgba(239,68,68,0.2)' },
  btnRefresh:     { display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #e2e8f0', padding:'0.7rem 1.4rem', borderRadius:12, fontSize:'0.875rem', fontWeight:500, color:'#475569', cursor:'pointer' },
  btnRetry:       { background:'#dc2626', color:'#fff', border:'none', padding:'0.4rem 1rem', borderRadius:8, cursor:'pointer', fontSize:'0.8rem' },
  modalOverlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' },
  modalBox:       { background:'#fff', borderRadius:20, width:'100%', maxWidth:560, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden' },
  modalHeader:    { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.25rem 1.5rem', borderBottom:'1px solid #e2e8f0' },
  providerCard:   { display:'flex', alignItems:'center', gap:12, padding:'0.875rem 1rem', borderRadius:12, border:'1px solid #e2e8f0', transition:'all 0.2s' },
};