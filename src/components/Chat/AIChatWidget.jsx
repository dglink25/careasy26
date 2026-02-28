// src/components/Chat/AIChatWidget.jsx
// ✅ CORRIGÉ : hooks AVANT le return conditionnel (règle React)
// Widget flottant IA — s'affiche sur TOUTES les pages SAUF la page d'accueil "/"

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { aiApi } from '../../api/aiApi';

// ─────────────────────────────────────────────────────────────────────────────
// ICÔNES SVG INLINE
// ─────────────────────────────────────────────────────────────────────────────

const IconBot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
    <rect x="3" y="8" width="18" height="12" rx="3"/>
    <path d="M9 8V6a3 3 0 0 1 6 0v2"/>
    <circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none"/>
    <path d="M7 20v2M17 20v2"/>
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconAttach = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
    <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// BULLE DE MESSAGE
// ─────────────────────────────────────────────────────────────────────────────

function MessageBubble({ msg, isNew }) {
  const isUser    = msg.role === 'user';
  const isThinking = msg.thinking;

  const urgencyColors = {
    critical:  '#ef4444',
    important: '#f59e0b',
    minor:     '#10b981',
  };
  const urgencyColor = urgencyColors[msg.urgency] || null;

  const urgencyLabel = {
    critical:  '🔴 URGENT',
    important: '🟡 ATTENTION',
    minor:     '🟢 OK',
  }[msg.urgency] || null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '8px',
      marginBottom: '14px',
      animation: isNew ? 'bubbleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
    }}>
      {/* Avatar IA */}
      {!isUser && (
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #DC2626, #7f1d1d)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: '0 2px 8px rgba(220,38,38,0.4)',
        }}>
          <IconBot />
        </div>
      )}

      <div style={{
        maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: '4px',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
        {/* Image jointe */}
        {msg.imagePreview && (
          <img
            src={msg.imagePreview} alt="Jointe"
            style={{ maxWidth: '170px', borderRadius: '10px', border: '2px solid rgba(220,38,38,0.25)' }}
          />
        )}

        {/* Bulle texte */}
        <div style={{
          padding: '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser
            ? 'linear-gradient(135deg, #DC2626, #991b1b)'
            : 'rgba(255,255,255,0.96)',
          color: isUser ? '#fff' : '#1a1a2e',
          fontSize: '0.875rem',
          lineHeight: '1.6',
          boxShadow: isUser
            ? '0 4px 14px rgba(220,38,38,0.3)'
            : '0 2px 12px rgba(0,0,0,0.1)',
          border: isUser ? 'none' : '1px solid rgba(220,38,38,0.1)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {isThinking ? (
            <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#999' }}>CarAI réfléchit</span>
              {[0, 0.2, 0.4].map((delay, i) => (
                <span key={i} style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: '#DC2626', display: 'inline-block',
                  animation: `dotPulse 1.2s ${delay}s infinite ease-in-out`,
                }} />
              ))}
            </span>
          ) : msg.content}
        </div>

        {/* Badge urgence */}
        {urgencyColor && urgencyLabel && (
          <span style={{
            fontSize: '0.7rem', fontWeight: '600', color: urgencyColor,
            background: urgencyColor + '18', padding: '2px 8px',
            borderRadius: '20px', border: `1px solid ${urgencyColor}35`,
          }}>
            {urgencyLabel}
          </span>
        )}

        {/* Heure */}
        <span style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.3)', paddingLeft: '2px' }}>
          {msg.time}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WIDGET PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function AIChatWidget() {
  const location = useLocation();

  // ── TOUS LES HOOKS ICI — AVANT TOUT return conditionnel ──────────────────
  const [isOpen,        setIsOpen]        = useState(false);
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [isLoading,     setIsLoading]     = useState(false);
  const [imageFile,     setImageFile]     = useState(null);
  const [imagePreview,  setImagePreview]  = useState(null);
  const [userLocation,  setUserLocation]  = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [aiOnline,      setAiOnline]      = useState(true);
  const [newMsgIdx,     setNewMsgIdx]     = useState(null);
  const [pulse,         setPulse]         = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const fileInputRef   = useRef(null);

  // Message de bienvenue à la 1ère ouverture
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = {
        id: Date.now(), role: 'assistant', thinking: false,
        content: '👋 Bonjour ! Je suis **CarAI**, votre assistant automobile au Bénin 🇧🇯\n\nJe peux vous aider à :\n• 🔧 Diagnostiquer vos problèmes mécaniques\n• 📍 Trouver des garages et services près de vous\n• 💡 Répondre à toutes vos questions auto\n\nComment puis-je vous aider ?',
        time: getTime(), urgency: null,
      };
      setMessages([welcome]);
      setNewMsgIdx(0);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll auto vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 320);
      setPulse(false);
    }
  }, [isOpen]);

  // Vérification statut serveur AI
  useEffect(() => {
    aiApi.checkStatus().then(online => setAiOnline(online)).catch(() => setAiOnline(false));
  }, []);

  // Géolocalisation silencieuse
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLabel('📍 Position GPS détectée');
      },
      () => setLocationLabel(''),
      { timeout: 6000, enableHighAccuracy: false },
    );
  }, []);

  // ── Fin des hooks ─────────────────────────────────────────────────────────

  // ⚠️ Ce return conditionnel DOIT être après tous les hooks
  const isHomePage = location.pathname === '/';
  if (isHomePage) return null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getTime = () =>
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const getHistory = () =>
    messages
      .filter(m => !m.thinking)
      .slice(-8)
      .map(m => ({ role: m.role, content: m.content }));

  const handleImageChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !imageFile) return;
    if (isLoading) return;

    const userMsg = {
      id: Date.now(), role: 'user', thinking: false,
      content: text || '📷 Photo envoyée',
      time: getTime(), imagePreview,
    };
    const thinkMsg = {
      id: Date.now() + 1, role: 'assistant', thinking: true,
      content: '', time: getTime(),
    };

    setMessages(prev => {
      const next = [...prev, userMsg, thinkMsg];
      setNewMsgIdx(next.length - 2);
      return next;
    });
    setInput('');
    setIsLoading(true);

    const savedImgFile    = imageFile;
    const savedImgPreview = imagePreview;
    removeImage();

    try {
      const result = await aiApi.chat({
        message:  text,
        history:  getHistory(),
        lat:      userLocation?.lat || 0,
        lng:      userLocation?.lng || 0,
        imageFile: savedImgFile,
      });

      const aiMsg = {
        id:      Date.now() + 2,
        role:    'assistant',
        thinking: false,
        content: result.answer,
        urgency: result.urgency !== 'unknown' ? result.urgency : null,
        time:    getTime(),
      };

      setMessages(prev => {
        const clean = prev.filter(m => !m.thinking);
        setNewMsgIdx(clean.length);
        return [...clean, aiMsg];
      });

    } catch (err) {
      const errMsg = {
        id:      Date.now() + 2,
        role:    'assistant',
        thinking: false,
        content: '⚠️ Je ne peux pas me connecter au serveur IA.\n\nAssurez-vous que Flask est lancé :\n```\npython3 app.py\n```\nOu vérifiez VITE_AI_URL dans votre .env',
        time:    getTime(),
        urgency: null,
      };
      setMessages(prev => [...prev.filter(m => !m.thinking), errMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    removeImage();
    setInput('');
  };

  const CHIPS = [
    { label: '🔧 Panne moteur',        text: 'Mon moteur fait un bruit bizarre, que faire ?' },
    { label: '📍 Garage proche',        text: 'Trouver un garage près de moi' },
    { label: '🛢️ Vidange huile',        text: 'Comment faire une vidange d\'huile ?' },
    { label: '❄️ Climatisation',        text: 'Ma climatisation ne refroidit plus' },
  ];

  // ── RENDU ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── CSS animations ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes bubbleIn {
          from { opacity:0; transform:scale(0.65) translateY(12px); }
          to   { opacity:1; transform:scale(1)    translateY(0); }
        }
        @keyframes dotPulse {
          0%,80%,100% { transform:scale(0.5); opacity:0.3; }
          40%         { transform:scale(1);   opacity:1; }
        }
        @keyframes chatOpen {
          from { opacity:0; transform:scale(0.82) translateY(24px); transform-origin:bottom right; }
          to   { opacity:1; transform:scale(1)    translateY(0);    transform-origin:bottom right; }
        }
        @keyframes fabPulse {
          0%,100% { box-shadow:0 0 0 0   rgba(220,38,38,0.55); }
          60%     { box-shadow:0 0 0 16px rgba(220,38,38,0); }
        }
        .ai-scroll::-webkit-scrollbar      { width:4px; }
        .ai-scroll::-webkit-scrollbar-track { background:transparent; }
        .ai-scroll::-webkit-scrollbar-thumb { background:rgba(220,38,38,0.35); border-radius:4px; }
        .ai-textarea:focus { outline:none; border-color:#DC2626 !important; box-shadow:0 0 0 3px rgba(220,38,38,0.18) !important; }
        .ai-send:hover:not(:disabled) { transform:scale(1.1); }
        .ai-send:disabled             { opacity:0.4; cursor:not-allowed; }
        .ai-fab:hover                 { transform:scale(1.12) !important; }
        .ai-chip:hover                { background:rgba(220,38,38,0.18) !important; border-color:#DC2626 !important; color:#fff !important; }
        .ai-icon-btn:hover            { background:rgba(255,255,255,0.28) !important; }
      `}</style>

      {/* ── FAB — bouton flottant ─────────────────────────────────────────── */}
      {!isOpen && (
        <button
          className="ai-fab"
          onClick={() => setIsOpen(true)}
          title="Parler à CarAI"
          style={{
            position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
            width: '62px', height: '62px', borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.15)',
            background: 'linear-gradient(135deg, #DC2626 0%, #7f1d1d 100%)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(220,38,38,0.5)',
            transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            animation: pulse ? 'fabPulse 2.4s infinite' : 'none',
          }}
        >
          {/* Pastille statut */}
          <span style={{
            position: 'absolute', top: '5px', right: '5px',
            width: '13px', height: '13px', borderRadius: '50%',
            background: aiOnline ? '#22c55e' : '#f59e0b',
            border: '2.5px solid #7f1d1d',
          }} />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
            <rect x="3" y="8" width="18" height="12" rx="3"/>
            <path d="M9 8V6a3 3 0 0 1 6 0v2"/>
            <circle cx="9" cy="14" r="1.5" fill="white" stroke="none"/>
            <circle cx="15" cy="14" r="1.5" fill="white" stroke="none"/>
          </svg>
        </button>
      )}

      {/* ── Fenêtre de chat ──────────────────────────────────────────────── */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '390px', maxWidth: 'calc(100vw - 32px)',
          height: '590px', maxHeight: 'calc(100vh - 48px)',
          borderRadius: '22px',
          background: 'linear-gradient(160deg, #0d0d20 0%, #1a1030 100%)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(220,38,38,0.25)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'chatOpen 0.42s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #DC2626 0%, #7f1d1d 100%)',
            display: 'flex', alignItems: 'center', gap: '10px',
            flexShrink: 0,
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0,
            }}>
              <IconBot />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.97rem', letterSpacing: '0.3px' }}>
                CarAI
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.72)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: aiOnline ? '#4ade80' : '#fbbf24', display: 'inline-block',
                }} />
                {aiOnline ? 'En ligne · CareEasy Bénin 🇧🇯' : 'Hors ligne'}
              </div>
            </div>

            <button className="ai-icon-btn" onClick={clearChat} title="Effacer la conversation"
              style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px',
                color:'#fff', cursor:'pointer', padding:'7px', display:'flex',
                alignItems:'center', justifyContent:'center', transition:'background 0.2s' }}>
              <IconTrash />
            </button>
            <button className="ai-icon-btn" onClick={() => setIsOpen(false)} title="Fermer"
              style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px',
                color:'#fff', cursor:'pointer', padding:'7px', display:'flex',
                alignItems:'center', justifyContent:'center', transition:'background 0.2s' }}>
              <IconClose />
            </button>
          </div>

          {/* ── Chips suggestions ─────────────────────────────────────────── */}
          {messages.length <= 1 && (
            <div style={{
              padding: '8px 12px', display: 'flex', gap: '6px', flexWrap: 'wrap',
              borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
              background: 'rgba(255,255,255,0.025)',
            }}>
              {CHIPS.map(chip => (
                <button key={chip.label} className="ai-chip"
                  onClick={() => setInput(chip.text)}
                  style={{
                    fontSize: '0.71rem', padding: '5px 10px', borderRadius: '20px',
                    border: '1px solid rgba(220,38,38,0.35)',
                    background: 'rgba(220,38,38,0.1)', color: '#fca5a5',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.2s', fontFamily: 'inherit',
                  }}>
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Messages ──────────────────────────────────────────────────── */}
          <div className="ai-scroll" style={{
            flex: 1, overflowY: 'auto', padding: '14px 12px',
            display: 'flex', flexDirection: 'column',
          }}>
            {messages.map((msg, idx) => (
              <MessageBubble key={msg.id} msg={msg} isNew={idx === newMsgIdx} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Bandeau GPS ───────────────────────────────────────────────── */}
          {locationLabel && (
            <div style={{
              padding: '4px 12px', fontSize: '0.67rem', color: '#6ee7b7',
              background: 'rgba(16,185,129,0.08)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
            }}>
              <IconPin /> {locationLabel}
            </div>
          )}

          {/* ── Préview image ─────────────────────────────────────────────── */}
          {imagePreview && (
            <div style={{
              padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.03)', flexShrink: 0,
            }}>
              <img src={imagePreview} alt="preview" style={{
                width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px',
                border: '2px solid rgba(220,38,38,0.4)',
              }} />
              <span style={{ fontSize: '0.78rem', color: '#bbb', flex: 1 }}>
                {imageFile?.name?.slice(0, 30)}
              </span>
              <button onClick={removeImage} style={{
                background: 'none', border: 'none', color: '#ef4444',
                cursor: 'pointer', fontSize: '1.1rem', padding: '2px 6px',
              }}>×</button>
            </div>
          )}

          {/* ── Zone saisie ───────────────────────────────────────────────── */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid rgba(255,255,255,0.09)',
            background: 'rgba(0,0,0,0.22)',
            display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0,
          }}>
            {/* Input fichier caché */}
            <input ref={fileInputRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handleImageChange} />

            {/* Bouton joindre image */}
            <button className="ai-icon-btn" onClick={() => fileInputRef.current?.click()} title="Joindre une photo"
              style={{
                background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: '10px', color: '#aaa', cursor: 'pointer', padding: '9px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s',
              }}>
              <IconAttach />
            </button>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              className="ai-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Décrivez votre problème…"
              rows={1}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: '12px', color: '#f0f0f0',
                fontSize: '0.875rem', fontFamily: 'inherit',
                padding: '9px 13px', resize: 'none',
                lineHeight: '1.5', maxHeight: '88px', overflowY: 'auto',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 88) + 'px';
              }}
            />

            {/* Bouton envoyer */}
            <button
              className="ai-send"
              onClick={sendMessage}
              disabled={isLoading || (!input.trim() && !imageFile)}
              title="Envoyer (Entrée)"
              style={{
                width: '40px', height: '40px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #DC2626, #991b1b)',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 4px 14px rgba(220,38,38,0.45)',
                transition: 'transform 0.2s',
              }}>
              <IconSend />
            </button>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.18)',
            padding: '5px', flexShrink: 0,
          }}>
            CarAI · CareEasy Bénin 🇧🇯 · Propulsé par Ollama
          </div>
        </div>
      )}
    </>
  );
}
