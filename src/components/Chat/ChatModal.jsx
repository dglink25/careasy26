// src/components/Chat/ChatModal.jsx — REPLY TO MESSAGE
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiX, FiSend, FiMapPin, FiLoader, FiCheck, FiCheckCircle,
  FiMic, FiStopCircle, FiPlay, FiPause, FiDownload,
  FiMaximize2, FiMessageCircle, FiExternalLink, FiFileText,
  FiUser, FiChevronLeft, FiLogIn, FiPaperclip, FiWifi, FiWifiOff,
  FiCornerUpLeft, FiCornerUpRight,
} from 'react-icons/fi';
import { messageApi }   from '../../api/messageApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth }      from '../../contexts/AuthContext';
import theme            from '../../config/theme';

// ── Carte localisation ────────────────────────────────────────────────────────
const LocationMap = ({ latitude, longitude }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={S.locBox}>
      <div style={S.locHeader}>
        <FiMapPin size={13} color={theme.colors.primary}/>
        <span style={{ fontSize:'0.8rem', fontWeight:600, flex:1 }}>📍 Localisation partagée</span>
        <button onClick={() => setExpanded(v=>!v)} style={S.iconBtn}><FiMaximize2 size={13}/></button>
      </div>
      <div style={{ height:expanded?250:140, overflow:'hidden', transition:'height .3s' }}>
        <iframe title="map"
          src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
          style={{ width:'100%', height:'100%', border:'none' }} loading="lazy"/>
      </div>
      <a href={`https://www.google.com/maps?q=${latitude},${longitude}`}
        target="_blank" rel="noopener noreferrer" style={S.mapLink}>
        <FiExternalLink size={11}/> Ouvrir dans Google Maps
      </a>
    </div>
  );
};

// ── Lecteur audio ─────────────────────────────────────────────────────────────
const AudioPlayer = ({ url, isMine }) => {
  const ref  = useRef(null);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current,  setCurrent]  = useState(0);
  const [err,      setErr]      = useState(false);
  useEffect(() => {
    const a = ref.current; if (!a) return;
    const on = (e,h) => a.addEventListener(e,h);
    on('timeupdate',     () => { setCurrent(a.currentTime); setProgress(a.duration?(a.currentTime/a.duration)*100:0); });
    on('loadedmetadata', () => setDuration(a.duration||0));
    on('play',           () => setPlaying(true));
    on('pause',          () => setPlaying(false));
    on('ended',          () => { setPlaying(false); setProgress(0); setCurrent(0); });
    on('error',          () => setErr(true));
  }, []);
  const fmt = s => (!s||isNaN(s)) ? '0:00' : `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  if (err) return <div style={{ padding:'8px 12px', fontSize:'0.8rem' }}>❌ Audio indisponible</div>;
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 12px',
      background:isMine?'rgba(255,255,255,.18)':'rgba(0,0,0,.06)',borderRadius:12,minWidth:210 }}>
      <audio ref={ref} src={url} preload="metadata" style={{ display:'none' }}/>
      <button onClick={() => playing?ref.current.pause():ref.current.play().catch(()=>setErr(true))}
        style={{ width:34,height:34,borderRadius:'50%',
          background:isMine?'rgba(255,255,255,.25)':theme.colors.primary,
          color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
        {playing?<FiPause size={14}/>:<FiPlay size={14}/>}
      </button>
      <div style={{ flex:1 }}>
        <div style={{ height:4,background:'rgba(255,255,255,.25)',borderRadius:2,cursor:'pointer',overflow:'hidden' }}
          onClick={e => { const r=e.currentTarget.getBoundingClientRect(); if(ref.current) ref.current.currentTime=(e.clientX-r.left)/r.width*duration; }}>
          <div style={{ height:'100%',width:`${progress}%`,background:isMine?'#fff':theme.colors.primary,transition:'width .1s' }}/>
        </div>
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:'0.65rem',opacity:.7,marginTop:3 }}>
          <span>{fmt(current)}</span><span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
};

const DateSep = ({ date }) => (
  <div style={{ display:'flex',alignItems:'center',gap:10,margin:'14px 0' }}>
    <div style={{ flex:1,height:1,background:'#e5e7eb' }}/>
    <span style={{ fontSize:'0.7rem',color:'#9ca3af',padding:'3px 10px',border:'1px solid #e5e7eb',borderRadius:10,whiteSpace:'nowrap' }}>{date}</span>
    <div style={{ flex:1,height:1,background:'#e5e7eb' }}/>
  </div>
);

const TypingBubble = ({ name }) => (
  <div style={{ display:'flex',alignItems:'flex-end',gap:8,marginBottom:10 }}>
    <div style={{ width:32,height:32,borderRadius:'50%',background:theme.colors.primary,color:'#fff',
      display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',fontWeight:700,flexShrink:0 }}>
      {name?.charAt(0).toUpperCase()||'?'}
    </div>
    <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 14px',
      background:'#fff',border:'1px solid #e5e7eb',borderRadius:'18px 18px 18px 4px' }}>
      <span style={{ fontSize:'0.75rem',color:'#9ca3af' }}>{name} écrit</span>
      <div style={{ display:'flex',gap:4 }}>
        {[0,0.2,0.4].map((d,i) => (
          <span key={i} style={{ width:7,height:7,borderRadius:'50%',background:'#9ca3af',
            display:'inline-block',animation:`typingDot 1.3s ${d}s infinite` }}/>
        ))}
      </div>
    </div>
  </div>
);

// ── Aperçu du message cité ────────────────────────────────────────────────────
const ReplyPreview = ({ message, isMine, onCancel }) => {
  if (!message) return null;
  const isMyMsg = isMine(message);
  const preview = message.type === 'image'    ? '🖼️ Image'
                : message.type === 'vocal'    ? '🎤 Message vocal'
                : message.type === 'video'    ? '🎥 Vidéo'
                : message.type === 'document' ? '📎 Document'
                : message.content || '';

  return (
    <div style={S.replyPreviewBar}>
      <div style={S.replyBarAccent}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700,
          color: isMyMsg ? theme.colors.primary : '#6b7280', marginBottom:2 }}>
          {isMyMsg ? 'Vous' : (message.sender?.name || 'Utilisateur')}
        </div>
        <div style={{ fontSize:'0.82rem', color:'#6b7280',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {preview.length > 60 ? preview.slice(0,60)+'…' : preview}
        </div>
      </div>
      {message.type === 'image' && (message.file_url || message.file_path) && (
        <img src={message.file_url || message.file_path} alt=""
          style={{ width:42, height:42, objectFit:'cover', borderRadius:8, flexShrink:0 }}/>
      )}
      <button onClick={onCancel} style={{ ...S.iconBtn, color:'#9ca3af' }}><FiX size={16}/></button>
    </div>
  );
};

// ── Bulle de message cité à l'intérieur d'un message ─────────────────────────
const QuotedMessage = ({ quoted, isMine, onScrollTo }) => {
  if (!quoted) return null;
  const preview = quoted.type === 'image'    ? '🖼️ Image'
                : quoted.type === 'vocal'    ? '🎤 Message vocal'
                : quoted.type === 'video'    ? '🎥 Vidéo'
                : quoted.type === 'document' ? '📎 Document'
                : quoted.content || '';

  return (
    <div onClick={onScrollTo} style={{
      ...S.quotedBox,
      background: isMine ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.05)',
      borderLeft: `3px solid ${isMine ? 'rgba(255,255,255,.6)' : theme.colors.primary}`,
      cursor: 'pointer',
    }}>
      <div style={{ fontSize:'0.68rem', fontWeight:700,
        color: isMine ? 'rgba(255,255,255,.85)' : theme.colors.primary, marginBottom:2 }}>
        {quoted.sender?.name || 'Utilisateur'}
      </div>
      <div style={{ fontSize:'0.78rem', opacity:.8,
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {preview.length > 50 ? preview.slice(0,50)+'…' : preview}
      </div>
      {quoted.type === 'image' && (quoted.file_url || quoted.file_path) && (
        <img src={quoted.file_url || quoted.file_path} alt=""
          style={{ width:36, height:36, objectFit:'cover', borderRadius:6, marginTop:4 }}/>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
export default function ChatModal({
  receiverId,
  receiverName,
  onClose,
  conversationId   = null,
  existingConversation = false,
}) {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [conversation,     setConversation]     = useState(null);
  const [messages,         setMessages]         = useState([]);
  const [newMessage,       setNewMessage]       = useState('');
  const [loading,          setLoading]          = useState(true);
  const [sending,          setSending]          = useState(false);
  const [error,            setError]            = useState('');
  const [showLoginPrompt,  setShowLoginPrompt]  = useState(false);
  const [selectedFile,     setSelectedFile]     = useState(null);
  const [filePreview,      setFilePreview]      = useState(null);
  const [isRecording,      setIsRecording]      = useState(false);
  const [recordingTime,    setRecordingTime]    = useState(0);
  const [audioBlob,        setAudioBlob]        = useState(null);
  const [isReceiverOnline, setIsReceiverOnline] = useState(false);
  const [lastSeen,         setLastSeen]         = useState(null);
  const [receiverTyping,   setReceiverTyping]   = useState(false);
  const [isTypingSent,     setIsTypingSent]     = useState(false);
  const [mediaPreview,     setMediaPreview]     = useState(null);
  const [locationSharing,  setLocationSharing]  = useState(false);
  const [windowWidth,      setWindowWidth]      = useState(window.innerWidth);

  // ✅ REPLY STATE
  const [replyTo,          setReplyTo]          = useState(null);   // message auquel on répond
  const [hoveredMsgId,     setHoveredMsgId]     = useState(null);   // message survolé
  const [swipedMsgId,      setSwipedMsgId]      = useState(null);   // animation swipe mobile
  const touchStartX        = useRef(null);

  const isMobile = windowWidth < 768;

  const messagesEndRef       = useRef(null);
  const mediaRecorderRef     = useRef(null);
  const audioChunksRef       = useRef([]);
  const recordingIntervalRef = useRef(null);
  const fileInputRef         = useRef(null);
  const inputRef             = useRef(null);
  const audioStreamRef       = useRef(null);
  const typingTimerRef       = useRef(null);
  const convIdRef            = useRef(null);
  const messageRefs          = useRef({});   // ref par id de message (pour scroll to quoted)

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const handleWsNewMessage = useCallback((data) => {
    const msg = data.message || data;
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      if (msg.temporary_id) {
        const i = prev.findIndex(m => m.id === `temp-${msg.temporary_id}` || m.id === msg.temporary_id);
        if (i !== -1) { const n=[...prev]; n[i]=msg; return n; }
      }
      return [...prev, msg];
    });
    if (convIdRef.current) messageApi.markAsRead(convIdRef.current).catch(()=>{});
  }, []);

  const handleWsTyping = useCallback((data) => {
    if (parseInt(data.user_id) === parseInt(user?.id)) return;
    setReceiverTyping(data.is_typing);
    if (data.is_typing) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setReceiverTyping(false), 4000);
    }
  }, [user?.id]);

  const handleWsMessagesRead = useCallback(() => {
    setMessages(prev => prev.map(m =>
      m.sender_id === user?.id && !m.read_at
        ? { ...m, read_at: new Date().toISOString() }
        : m
    ));
  }, [user?.id]);

  const handleWsUserStatus = useCallback((data) => {
    if (parseInt(data.user_id) === parseInt(receiverId)) {
      setIsReceiverOnline(data.is_online);
      if (!data.is_online) setLastSeen(data.last_seen);
    }
  }, [receiverId]);

  const { wsConnected } = useWebSocket({
    conversationId: conversation?.id ?? null,
    onNewMessage:   handleWsNewMessage,
    onTyping:       handleWsTyping,
    onMessagesRead: handleWsMessagesRead,
    onUserStatus:   handleWsUserStatus,
  });

  useEffect(() => {
    const h = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (!user && receiverId) setShowLoginPrompt(true);
  }, [user, receiverId]);

  const initConversation = useCallback(async () => {
    if (!user) return;
    if (receiverId && parseInt(receiverId) === parseInt(user.id)) {
      setError("Impossible d'ouvrir une conversation avec votre propre compte.");
      setLoading(false); return;
    }
    try {
      setLoading(true); setError('');
      let conv;
      if (conversationId && existingConversation) {
        const d = await messageApi.getMessages(conversationId);
        conv = d; setMessages(d.messages || []);
      } else if (receiverId) {
        conv = await messageApi.startConversation(receiverId);
        const d = await messageApi.getMessages(conv.id);
        setMessages(d.messages || []);
      }
      if (conv) { setConversation(conv); convIdRef.current = conv.id; }
      if (receiverId) {
        const s = await messageApi.checkOnlineStatus(receiverId);
        setIsReceiverOnline(s.is_online); setLastSeen(s.last_seen_at);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de démarrer la conversation');
    } finally { setLoading(false); }
  }, [user, receiverId, conversationId, existingConversation]);

  useEffect(() => { initConversation(); }, [initConversation]);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }), 80);
  }, [messages, receiverTyping]);

  // ── Scroll vers un message cité ────────────────────────────────────────────
  const scrollToMessage = useCallback((msgId) => {
    const el = messageRefs.current[msgId];
    if (!el) return;
    el.scrollIntoView({ behavior:'smooth', block:'center' });
    el.style.transition = 'background 0.3s';
    el.style.background = `${theme.colors.primary}22`;
    setTimeout(() => { el.style.background = ''; }, 1500);
  }, []);

  // ── Swipe mobile pour répondre ─────────────────────────────────────────────
  const handleTouchStart = (e, msg) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e, msg) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    // Swipe droite → répondre
    if (dx > 55) {
      setSwipedMsgId(msg.id);
      setTimeout(() => setSwipedMsgId(null), 400);
      setReplyTo(msg);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    touchStartX.current = null;
  };

  // ── Frappe ─────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!conversation) return;
    if (!isTypingSent) { setIsTypingSent(true); messageApi.sendTyping(conversation.id, true); }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTypingSent(false); messageApi.sendTyping(conversation.id, false);
    }, 2000);
  };
  const stopTyping = () => {
    clearTimeout(typingTimerRef.current);
    if (isTypingSent && conversation) {
      setIsTypingSent(false); messageApi.sendTyping(conversation.id, false);
    }
  };

  // ── Envoyer ─────────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e?.preventDefault();
    stopTyping();
    if (!user) { setShowLoginPrompt(true); return; }
    if ((!newMessage.trim() && !selectedFile && !audioBlob) || sending || !conversation) return;

    setSending(true); setError('');
    const tempId = `temp-${Date.now()}`;
    let msgType = 'text';
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/'))      msgType = 'image';
      else if (selectedFile.type.startsWith('video/')) msgType = 'video';
      else if (selectedFile.type.startsWith('audio/')) msgType = 'vocal';
      else                                              msgType = 'document';
    } else if (audioBlob) { msgType = 'vocal'; }

    // Message temporaire avec la réponse incluse
    const tempMsg = {
      id: tempId, conversation_id: conversation.id,
      sender_id: user.id, sender: user, type: msgType,
      content: newMessage.trim() || (selectedFile ? selectedFile.name : '🎤 Vocal'),
      created_at: new Date().toISOString(), temporary: true,
      reply_to: replyTo ? {
        id:       replyTo.id,
        content:  replyTo.content,
        type:     replyTo.type,
        sender:   replyTo.sender,
        file_url: replyTo.file_url || replyTo.file_path,
      } : null,
    };
    setMessages(prev => [...prev, tempMsg]);

    const txt       = newMessage.trim();
    const curFile   = selectedFile;
    const curAudio  = audioBlob;
    const curReply  = replyTo;
    setNewMessage(''); setSelectedFile(null); setFilePreview(null);
    setAudioBlob(null); setReplyTo(null);   // ← reset reply

    try {
      let sent;
      if (curFile || curAudio) {
        const fd = new FormData();
        if (curAudio) {
          fd.append('file', new File([curAudio], `vocal_${Date.now()}.webm`, { type:'audio/webm' }));
          fd.append('type', 'vocal');
        } else { fd.append('file', curFile); fd.append('type', msgType); }
        if (txt) fd.append('content', txt);
        fd.append('temporary_id', tempId);
        if (curReply) fd.append('reply_to_id', curReply.id);
        sent = await messageApi.sendMessage(conversation.id, fd);
      } else {
        sent = await messageApi.sendMessage(conversation.id, {
          type: 'text', content: txt, temporary_id: tempId,
          reply_to_id: curReply?.id || null,
        });
      }
      setMessages(prev => prev.map(m => m.id === tempId ? sent : m));
    } catch {
      setError("Impossible d'envoyer le message");
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // ── Audio ───────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (!user) { setShowLoginPrompt(true); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      audioStreamRef.current = stream;
      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec; audioChunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size>0) audioChunksRef.current.push(e.data); };
      rec.onstop = () => {
        setAudioBlob(new Blob(audioChunksRef.current, { type:'audio/webm' }));
        stream.getTracks().forEach(t => t.stop()); audioStreamRef.current = null;
      };
      rec.start(); setIsRecording(true); setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t+1), 1000);
    } catch { alert("Impossible d'accéder au microphone"); }
  };
  const stopRecording   = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); clearInterval(recordingIntervalRef.current); };
  const cancelRecording = () => { stopRecording(); setAudioBlob(null); setRecordingTime(0); audioStreamRef.current?.getTracks().forEach(t=>t.stop()); };

  const handleFileSelect = (e) => {
    if (!user) { setShowLoginPrompt(true); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10*1024*1024) { alert('Fichier trop volumineux (max 10 MB)'); return; }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const r = new FileReader(); r.onloadend = () => setFilePreview(r.result); r.readAsDataURL(file);
    }
  };

  const handleShareLocation = () => {
    if (!conversation) return;
    setLocationSharing(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const msg = await messageApi.sendMessage(conversation.id, {
            type:'text', content:'📍 Ma position actuelle',
            latitude: coords.latitude, longitude: coords.longitude,
          });
          setMessages(prev => [...prev, msg]);
        } catch { alert("Impossible d'envoyer la localisation"); }
        finally { setLocationSharing(false); }
      },
      () => { alert('Accès à la position refusé'); setLocationSharing(false); }
    );
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fmtTime = ts => ts ? new Date(ts).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '';
  const fmtDate = ts => {
    if (!ts) return '';
    const d=new Date(ts), t=new Date(), y=new Date(t); y.setDate(y.getDate()-1);
    if (d.toDateString()===t.toDateString()) return "Aujourd'hui";
    if (d.toDateString()===y.toDateString()) return "Hier";
    return d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
  };
  const fmtRec  = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const fmtSeen = ls => {
    if (!ls) return 'Jamais en ligne';
    const diff = Math.floor((Date.now()-new Date(ls))/60000);
    if (diff<1) return "À l'instant"; if (diff<60) return `Il y a ${diff} min`;
    if (diff<1440) return `Il y a ${Math.floor(diff/60)}h`;
    return new Date(ls).toLocaleDateString('fr-FR');
  };
  const isMine = msg => user && parseInt(msg.sender_id) === parseInt(user.id);

  const renderContent = (msg) => {
    if (msg.latitude && msg.longitude) return (
      <div>
        {msg.content && msg.content !== '📍 Ma position actuelle' && <div style={S.msgText}>{msg.content}</div>}
        <LocationMap latitude={msg.latitude} longitude={msg.longitude}/>
      </div>
    );
    if (!msg.type || msg.type==='text') return <div style={S.msgText}>{msg.content}</div>;
    const url = msg.file_url || msg.file_path;
    const mine = isMine(msg);
    switch (msg.type) {
      case 'image':    return <img src={url} alt="" style={S.imgMsg} onClick={() => setMediaPreview(url)}/>;
      case 'video':    return <video src={url} controls style={S.videoMsg}/>;
      case 'vocal':    return <AudioPlayer url={url} isMine={mine}/>;
      case 'document': return (
        <div style={S.docBox}><FiFileText size={22}/>
          <div>
            <div style={{ fontSize:'0.85rem',fontWeight:500 }}>{msg.content||'Document'}</div>
            <a href={url} download style={{ fontSize:'0.72rem',color:'currentColor',opacity:.8 }}>
              <FiDownload size={11}/> Télécharger
            </a>
          </div>
        </div>
      );
      default: return <div style={S.msgText}>{msg.content}</div>;
    }
  };

  const grouped = messages.reduce((acc, m) => {
    const d = fmtDate(m.created_at); (acc[d]=acc[d]||[]).push(m); return acc;
  }, {});

  if (showLoginPrompt) return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, width:340, height:'auto', borderRadius:20, padding:'2rem', textAlign:'center' }}>
        <FiUser size={48} color={theme.colors.primary}/>
        <h3 style={{ fontWeight:700, color:'#111827', margin:'1rem 0 .5rem' }}>Connexion requise</h3>
        <p style={{ color:'#6b7280', fontSize:'.9rem' }}>Vous devez être connecté pour discuter.</p>
        <div style={{ display:'flex', gap:10, marginTop:'1.5rem' }}>
          <button onClick={onClose} style={S.btnSec}><FiChevronLeft/> Retour</button>
          <button onClick={() => { onClose(); navigate('/login',{state:{from:'chat',receiverId,receiverName}}); }} style={S.btnPri}>
            <FiLogIn/> Se connecter
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div style={S.overlay}>
        <div style={{ ...S.modal, width:isMobile?'100%':500, height:isMobile?'100vh':'90vh', borderRadius:isMobile?0:20 }}>

          {/* HEADER */}
          <div style={S.header}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
              {isMobile && <button onClick={onClose} style={S.iconBtn}><FiChevronLeft size={22}/></button>}
              <div style={{ position:'relative' }}>
                <div style={S.avatar}>{receiverName?.charAt(0).toUpperCase()||'U'}</div>
                {isReceiverOnline && <div style={S.onlineDot}/>}
              </div>
              <div>
                <div style={{ fontSize:'1rem', fontWeight:700, color:'#111827' }}>{receiverName||'Utilisateur'}</div>
                <div style={{ fontSize:'0.72rem', minHeight:16 }}>
                  {receiverTyping ? (
                    <span style={{ color:'#10b981', fontStyle:'italic' }}>est en train d'écrire…</span>
                  ) : isReceiverOnline ? (
                    <span style={{ color:'#10b981' }}>● En ligne</span>
                  ) : (
                    <span style={{ color:'#9ca3af' }}>{lastSeen?`Vu ${fmtSeen(lastSeen)}`:'Hors ligne'}</span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={handleShareLocation} disabled={locationSharing||!conversation} style={S.iconBtn}>
                {locationSharing ? <FiLoader size={16} style={{ animation:'spin 1s linear infinite' }}/> : <FiMapPin size={17}/>}
              </button>
              {!isMobile && <button onClick={onClose} style={S.iconBtn}><FiX size={20}/></button>}
            </div>
          </div>

          {/* MESSAGES */}
          <div style={S.msgArea}>
            {loading ? (
              <div style={S.centered}>
                <FiLoader size={32} style={{ animation:'spin 1s linear infinite', color:theme.colors.primary }}/>
                <p style={{ color:'#9ca3af' }}>Chargement…</p>
              </div>
            ) : error ? (
              <div style={S.centered}>
                <p style={{ color:'#ef4444', textAlign:'center' }}>{error}</p>
                <button onClick={initConversation} style={S.btnPri}>Réessayer</button>
              </div>
            ) : messages.length === 0 ? (
              <div style={S.centered}>
                <FiMessageCircle size={52} color="#e5e7eb"/>
                <p style={{ color:'#9ca3af', fontWeight:600 }}>Aucun message</p>
                <p style={{ color:'#d1d5db', fontSize:'.85rem' }}>Envoyez votre premier message</p>
              </div>
            ) : (
              <>
                {Object.entries(grouped).map(([date, msgs]) => (
                  <div key={date}>
                    <DateSep date={date}/>
                    {msgs.map(msg => {
                      const mine   = isMine(msg);
                      const isHovered = hoveredMsgId === msg.id;
                      const isSwiped  = swipedMsgId  === msg.id;

                      return (
                        <div
                          key={msg.id}
                          ref={el => { if (el) messageRefs.current[msg.id] = el; }}
                          style={{
                            display:'flex',
                            justifyContent: mine ? 'flex-end' : 'flex-start',
                            marginBottom:8,
                            position:'relative',
                            transform: isSwiped ? 'translateX(12px)' : 'translateX(0)',
                            transition:'transform .25s ease',
                          }}
                          onMouseEnter={() => !isMobile && setHoveredMsgId(msg.id)}
                          onMouseLeave={() => !isMobile && setHoveredMsgId(null)}
                          onTouchStart={e => handleTouchStart(e, msg)}
                          onTouchEnd={e => handleTouchEnd(e, msg)}
                        >
                          {/* ✅ Bouton répondre desktop — côté gauche pour mes msgs, droit pour les autres */}
                          {!isMobile && isHovered && !msg.temporary && (
                            <button
                              onClick={() => { setReplyTo(msg); setTimeout(() => inputRef.current?.focus(), 80); }}
                              title="Répondre"
                              style={{
                                ...S.replyBtn,
                                order: mine ? -1 : 1,
                                marginRight: mine ? 8 : 0,
                                marginLeft:  mine ? 0 : 8,
                              }}
                            >
                              <FiCornerUpLeft size={15}/>
                            </button>
                          )}

                          <div style={{
                            ...S.bubble,
                            ...(mine ? S.bubbleMine : S.bubbleTheirs),
                            opacity: msg.temporary ? 0.6 : 1,
                            maxWidth: isMobile ? '86%' : '72%',
                          }}>
                            {!mine && msg.sender?.name && (
                              <div style={{ fontSize:'0.7rem',fontWeight:700,color:theme.colors.primary,marginBottom:4 }}>
                                {msg.sender.name}
                              </div>
                            )}

                            {/* ✅ Message cité à l'intérieur de la bulle */}
                            {msg.reply_to && (
                              <QuotedMessage
                                quoted={msg.reply_to}
                                isMine={mine}
                                onScrollTo={() => scrollToMessage(msg.reply_to.id)}
                              />
                            )}

                            {renderContent(msg)}

                            <div style={{ display:'flex',alignItems:'center',justifyContent:'flex-end',gap:5,marginTop:5 }}>
                              <span style={{ fontSize:'0.62rem', opacity:.65 }}>{fmtTime(msg.created_at)}</span>
                              {mine && (
                                msg.temporary
                                  ? <FiLoader size={10} style={{ opacity:.5 }}/>
                                  : msg.read_at
                                    ? <FiCheckCircle size={12} color="#34d399" title="Lu"/>
                                    : <FiCheck size={12} style={{ opacity:.6 }} title="Envoyé"/>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {receiverTyping && <TypingBubble name={receiverName}/>}
                <div ref={messagesEndRef}/>
              </>
            )}
          </div>

          {/* APERÇU RÉPONSE */}
          {replyTo && (
            <ReplyPreview
              message={replyTo}
              isMine={isMine}
              onCancel={() => setReplyTo(null)}
            />
          )}

          {/* PREVIEW FICHIER */}
          {(filePreview || audioBlob) && !isRecording && (
            <div style={{ borderTop:'1px solid #e5e7eb',background:'#f3f4f6',padding:'8px 14px' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                <span style={{ fontSize:'.8rem',fontWeight:600 }}>
                  {audioBlob?'🎤 Vocal':selectedFile?.type?.startsWith('image/')?'🖼️ Image':'📎 Fichier'}
                </span>
                <button onClick={() => { setSelectedFile(null); setFilePreview(null); setAudioBlob(null); }}
                  style={{ background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:'1.2rem' }}>×</button>
              </div>
              {filePreview && selectedFile?.type?.startsWith('image/') &&
                <img src={filePreview} alt="" style={{ maxHeight:100,borderRadius:8,objectFit:'contain' }}/>}
              {audioBlob && <span style={{ fontSize:'.8rem',color:'#6b7280' }}>Prêt ({fmtRec(recordingTime)})</span>}
            </div>
          )}

          {/* ENREGISTREMENT */}
          {isRecording && (
            <div style={{ background:'#fef2f2',borderTop:'1px solid #fecaca',padding:'10px 14px' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <span style={{ width:10,height:10,borderRadius:'50%',background:'#ef4444',animation:'pulse 1s infinite',display:'inline-block' }}/>
                  <span style={{ color:'#991b1b',fontWeight:600,fontSize:'.85rem' }}>Enregistrement…</span>
                </div>
                <span style={{ fontWeight:700,color:'#dc2626' }}>{fmtRec(recordingTime)}</span>
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={cancelRecording} style={S.btnCancel}>✕ Annuler</button>
                <button onClick={stopRecording}   style={S.btnStop}><FiStopCircle size={14}/> Terminer</button>
              </div>
            </div>
          )}

          {/* INPUT */}
          {!isRecording && (
            <form onSubmit={handleSend} style={S.inputBar}>
              <input ref={fileInputRef} type="file" onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" style={{ display:'none' }}/>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={S.iconBtn}><FiPaperclip size={18}/></button>
              <button type="button" onClick={startRecording} style={S.iconBtn}><FiMic size={18}/></button>
              <input ref={inputRef} type="text" value={newMessage}
                onChange={handleInputChange} onBlur={stopTyping}
                onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();} }}
                placeholder={replyTo ? "Écrire une réponse…" : "Écrivez votre message…"}
                style={{ ...S.textInput, ...(replyTo && { borderColor: theme.colors.primary }) }}
                disabled={sending||!conversation}/>
              <button type="submit"
                disabled={(!newMessage.trim()&&!selectedFile&&!audioBlob)||sending||!conversation}
                style={{ ...S.sendBtn, opacity:(!newMessage.trim()&&!selectedFile&&!audioBlob)||sending?.4:1 }}>
                {sending?<FiLoader size={16} style={{ animation:'spin 1s linear infinite' }}/>:<FiSend size={16}/>}
              </button>
            </form>
          )}
        </div>
      </div>

      {mediaPreview && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.95)',display:'flex',
          alignItems:'center',justifyContent:'center',zIndex:10000 }}
          onClick={() => setMediaPreview(null)}>
          <img src={mediaPreview} alt="" style={{ maxWidth:'90vw',maxHeight:'90vh',objectFit:'contain',borderRadius:8 }}/>
          <button onClick={() => setMediaPreview(null)} style={{ position:'absolute',top:20,right:20,
            background:'rgba(255,255,255,.15)',border:'none',color:'#fff',padding:10,borderRadius:'50%',cursor:'pointer' }}>
            <FiX size={20}/>
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes fadeIn    { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typingDot { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
      `}</style>
    </>
  );
}

const S = {
  overlay:       { position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999 },
  modal:         { background:'#fff',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,.35)' },
  header:        { display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 18px',background:'#fff',borderBottom:'1px solid #e5e7eb',minHeight:66 },
  avatar:        { width:44,height:44,borderRadius:'50%',background:theme.colors.primary,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',fontWeight:700 },
  onlineDot:     { position:'absolute',bottom:1,right:1,width:12,height:12,borderRadius:'50%',background:'#10b981',border:'2px solid #fff' },
  iconBtn:       { background:'transparent',border:'none',color:'#6b7280',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:7,borderRadius:9 },
  msgArea:       { flex:1,overflowY:'auto',padding:'12px 14px',background:'#f9fafb',display:'flex',flexDirection:'column' },
  centered:      { flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:'3rem',height:'100%' },
  bubble:        { padding:'9px 14px',borderRadius:18,wordBreak:'break-word',boxShadow:'0 1px 3px rgba(0,0,0,.07)',transition:'opacity .2s' },
  bubbleMine:    { background:theme.colors.primary,color:'#fff',borderBottomRightRadius:4 },
  bubbleTheirs:  { background:'#fff',color:'#111827',borderBottomLeftRadius:4,border:'1px solid #e5e7eb' },
  msgText:       { fontSize:'0.9rem',lineHeight:1.5,whiteSpace:'pre-wrap' },
  imgMsg:        { maxWidth:'100%',maxHeight:250,borderRadius:10,cursor:'pointer',objectFit:'cover',display:'block' },
  videoMsg:      { width:'100%',maxHeight:250,borderRadius:10 },
  docBox:        { display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'rgba(255,255,255,.15)',borderRadius:10 },
  locBox:        { borderRadius:12,overflow:'hidden',border:'1px solid #e5e7eb',background:'#fff',maxWidth:280,marginTop:6 },
  locHeader:     { display:'flex',alignItems:'center',gap:6,padding:'7px 10px',background:'#f9fafb',borderBottom:'1px solid #e5e7eb' },
  mapLink:       { display:'flex',alignItems:'center',justifyContent:'center',gap:5,background:theme.colors.primary,color:'#fff',textDecoration:'none',fontSize:'.7rem',fontWeight:600,padding:'6px 12px' },
  inputBar:      { display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#fff',borderTop:'1px solid #e5e7eb' },
  textInput:     { flex:1,padding:'9px 16px',border:'2px solid #e5e7eb',borderRadius:24,fontSize:'0.875rem',outline:'none',background:'#f9fafb',transition:'border-color .2s' },
  sendBtn:       { width:42,height:42,borderRadius:'50%',background:theme.colors.primary,color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s',flexShrink:0,boxShadow:'0 4px 12px rgba(239,68,68,.25)' },
  btnPri:        { flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,background:theme.colors.primary,color:'#fff',border:'none',padding:'.75rem 1.25rem',borderRadius:10,fontSize:'.875rem',fontWeight:600,cursor:'pointer' },
  btnSec:        { flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,background:'#f3f4f6',color:'#4b5563',border:'1px solid #e5e7eb',padding:'.75rem 1.25rem',borderRadius:10,fontSize:'.875rem',fontWeight:600,cursor:'pointer' },
  btnCancel:     { flex:1,padding:'7px',borderRadius:8,border:'1px solid #fecaca',background:'transparent',color:'#dc2626',cursor:'pointer',fontSize:'.8rem' },
  btnStop:       { flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'7px',borderRadius:8,border:'none',background:'#dc2626',color:'#fff',cursor:'pointer',fontSize:'.8rem',fontWeight:600 },
  // ✅ REPLY STYLES
  replyPreviewBar: {
    display:'flex',alignItems:'center',gap:10,padding:'8px 14px 8px 16px',
    background:'#f0f9ff',borderTop:'1px solid #bae6fd',
    animation:'fadeIn .15s ease',
  },
  replyBarAccent: {
    width:3,height:'100%',minHeight:36,borderRadius:2,
    background:theme.colors.primary,flexShrink:0,
  },
  quotedBox: {
    borderRadius:8,padding:'6px 10px',marginBottom:6,
    maxWidth:'100%',overflow:'hidden',
  },
  replyBtn: {
    display:'flex',alignItems:'center',justifyContent:'center',
    width:30,height:30,borderRadius:'50%',border:'none',
    background:'#f3f4f6',color:'#6b7280',cursor:'pointer',
    flexShrink:0,transition:'all .15s',
    boxShadow:'0 1px 3px rgba(0,0,0,.12)',
    alignSelf:'center',
  },
};