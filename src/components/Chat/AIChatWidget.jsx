import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const IcRobot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM7.5 13a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm9 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" fill="currentColor"/>
  </svg>
);

const IcClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

const IcSend = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const IcTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
  </svg>
);

const IcPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// ─── URL de base Laravel API ──────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL; // ex: https://careasy26.alwaysdata.net/api

const WELCOME_MESSAGE = {
  id: 'welcome-message',
  role: 'assistant',
  thinking: false,
  content: `**Bonjour ! Je suis CarAI, votre assistant automobile**\n**Comment puis-je vous aider ?**\n\n**Diagnostic** - Décrivez votre panne\n**Garages, Station d'essence, Lavage, etc** - Trouvez les professionnels près de vous\n**Conseils** - Entretien, vidange, climatisation\n**Contact** - Appel/WhatsApp direct\n\nDisponible 24h/24 7j/7 - Posez votre question !`,
  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
};

// ─── Composant bulle de message ───────────────────────────────────────────────
function MessageBubble({ msg, isNew, userLocation }) {
  const isUser = msg.role === 'user';
  const isThinking = msg.thinking;
  const isWelcome = msg.id === 'welcome-message';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '8px',
      marginBottom: '20px',
      animation: isNew && !isWelcome ? 'bubbleIn 0.3s ease both' : 'none',
    }}>
      {!isUser && (
        <div style={{
          width: '36px', height: '36px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #DC2626, #991b1b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: '0 4px 10px rgba(220,38,38,0.3)',
          border: '2px solid rgba(255,255,255,0.2)'
        }}>
          <IcRobot />
        </div>
      )}
      <div style={{
        maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: '4px',
        alignItems: isUser ? 'flex-end' : 'flex-start'
      }}>
        {msg.content && (
          <div style={{
            padding: '12px 18px',
            borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
            background: isUser ? '#DC2626' : '#1a1a2e',
            color: '#fff', fontSize: '0.9rem', lineHeight: '1.6',
            boxShadow: isUser ? '0 4px 15px rgba(220,38,38,0.3)' : '0 4px 15px rgba(0,0,0,0.2)',
            border: isWelcome ? '2px solid rgba(220,38,38,0.5)' : 'none',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {isThinking ? (
              <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>CarAI réfléchit</span>
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#fff', display: 'inline-block',
                    animation: `dotPulse 1.2s ${d}s infinite`
                  }} />
                ))}
              </span>
            ) : (
              <span dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fbbf24">$1</strong>')
                  .replace(/\n/g, '<br/>')
              }} />
            )}
          </div>
        )}

        {/* Services trouvés */}
        {msg.services && msg.services.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            {msg.services.slice(0, 3).map((svc, i) => {
              const e = svc.entreprise || {};
              return (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                  padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '0.78rem', color: '#e0e0e0',
                }}>
                  <div style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '3px' }}>
                    {e.name || svc.name || 'Prestataire'}
                  </div>
                  {svc.distance_km != null && (
                    <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>
                      📍 {svc.distance_km} km
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px', flexWrap: 'wrap' }}>
                    {e.call_phone && (
                      <a href={`tel:${e.call_phone}`} style={{
                        color: '#4ade80', textDecoration: 'none', fontSize: '0.72rem'
                      }}>📞 {e.call_phone}</a>
                    )}
                    {e.whatsapp_phone && (
                      <a href={`https://wa.me/${e.whatsapp_phone.replace(/\D/g, '')}`}
                        target="_blank" rel="noreferrer"
                        style={{ color: '#4ade80', textDecoration: 'none', fontSize: '0.72rem' }}>
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Itinéraire */}
        {msg.itinerary && (
          <a href={msg.itinerary.maps_url} target="_blank" rel="noreferrer" style={{
            display: 'inline-block', marginTop: '4px',
            padding: '6px 14px', borderRadius: '20px',
            background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
            color: '#93c5fd', fontSize: '0.75rem', textDecoration: 'none',
          }}>
            🗺 Itinéraire — {msg.itinerary.distance} (~{msg.itinerary.duration})
          </a>
        )}

        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', padding: '0 4px' }}>
          {msg.time}
        </span>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AIChatWidget() {
  const location = useLocation();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [newMsgIdx, setNewMsgIdx] = useState(null);
  const [pulse, setPulse] = useState(true);
  const [welcomeShown, setWelcomeShown] = useState(false);

  // FIX: conversationId doit être persisté dans le state
  const [conversationId, setConversationId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const getTime = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // ─── Démarrer la conversation CarAI au premier message ────────────────
  const initConversation = async () => {
    if (conversationId) return conversationId;
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const res = await fetch(`${API_BASE}/carai/conversations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const newId = data.conversation_id;
      setConversationId(newId);
      return newId;
    } catch {
      return null;
    }
  };

  // ─── Vérification statut (simple ping Laravel) ────────────────────────
  useEffect(() => {
    // Pas besoin de checker le service Python séparément — Laravel fait le relais
  }, []);

  // ─── Scroll automatique ───────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Message de bienvenue ─────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !welcomeShown && messages.length === 0) {
      setMessages([{
        ...WELCOME_MESSAGE,
        time: getTime()
      }]);
      setWelcomeShown(true);
      setNewMsgIdx(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    setPulse(false);
  }, [isOpen, welcomeShown, messages.length]);

  // ─── Géolocalisation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLabel('');
      },
      () => setLocationLabel(''),
      { timeout: 5000, enableHighAccuracy: true }
    );
  }, []);

  // ─── Pages à exclure ─────────────────────────────────────────────────
  if (['/login', '/register'].includes(location.pathname)) return null;

  // ─── Envoi de message — VERSION CORRIGÉE ─────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    // Récupérer le token d'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        thinking: false,
        time: getTime(),
        content: 'Vous devez être connecté pour utiliser CarAI. Veuillez vous connecter.',
      }]);
      return;
    }

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      time: getTime(),
    };
    const thinkingMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      thinking: true,
      content: '',
      time: getTime(),
    };

    setMessages(prev => {
      const next = [...prev, userMsg, thinkingMsg];
      setNewMsgIdx(next.length - 2);
      return next;
    });
    setInput('');
    setIsLoading(true);

    try {
      // FIX 1: Initialiser la conversation si nécessaire
      let convId = conversationId;
      if (!convId) {
        convId = await initConversation();
        if (!convId) {
          throw new Error('Impossible de démarrer la conversation');
        }
      }

      // FIX 2: Envoyer en JSON (pas FormData) vers le bon endpoint Laravel
      const payload = {
        message: text,
        conversation_id: convId,           // requis par CarAIController
        latitude: userLocation?.lat || null,
        longitude: userLocation?.lng || null,
        language: 'fr',
      };

      const response = await fetch(`${API_BASE}/carai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.reply || errData.message || `Erreur ${response.status}`);
      }

      const result = await response.json();

      // FIX 3: Lire les bons champs de la réponse CarAIController
      const aiMsg = {
        id: Date.now() + 2,
        role: 'assistant',
        thinking: false,
        content: result.reply || 'Désolé, je n\'ai pas pu vous répondre.',
        time: getTime(),
        services: result.services || [],
        itinerary: result.itinerary || null,
        intent: result.intent || null,
        suggestions: result.suggestions || [],
      };

      setMessages(prev => {
        const filtered = prev.filter(m => !m.thinking);
        setNewMsgIdx(filtered.length);
        return [...filtered, aiMsg];
      });

    } catch (err) {
      if (err.name === 'AbortError') return;

      console.error('[CarAI] Erreur:', err.message);
      setMessages(prev => [
        ...prev.filter(m => !m.thinking),
        {
          id: Date.now() + 2,
          role: 'assistant',
          thinking: false,
          time: getTime(),
          content: err.message === 'Impossible de démarrer la conversation'
            ? 'Connexion impossible. Vérifiez que vous êtes connecté.'
            : `Connexion impossible.\n\n${err.message || 'Vérifiez votre connexion internet.'}`,
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
    setWelcomeShown(false);
    setConversationId(null);
  };

  const SUGGESTIONS = [
    { text: 'Panne moteur', query: 'Mon moteur fait un bruit bizarre' },
    { text: 'Garage proche', query: 'Trouver un garage près de moi' },
    { text: 'Station essence', query: 'Stations essence les plus proches ?' },
    { text: 'Climatisation', query: 'Climatisation ne refroidit plus' },
    { text: 'Mécanicien', query: 'Je cherche un mécanicien proche' },
    { text: 'Lavage auto', query: 'Je cherche un lavage auto' },
    { text: 'Moto / Zem', query: 'Réparation moto zémidjan' },
    { text: 'Auto-école', query: 'Je veux une auto école de conduite' },
  ];

  return (
    <>
      <style>{`
        @keyframes bubbleIn { from { opacity:0; transform:scale(0.8) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes dotPulse { 0%,80%,100% { transform:scale(0.6); opacity:0.4; } 40% { transform:scale(1); opacity:1; } }
        @keyframes chatOpen { from { opacity:0; transform:scale(0.9) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes fabPulse { 0% { box-shadow:0 0 0 0 rgba(220,38,38,0.7); } 70% { box-shadow:0 0 0 15px rgba(220,38,38,0); } 100% { box-shadow:0 0 0 0 rgba(220,38,38,0); } }
        .ai-scroll::-webkit-scrollbar { width:4px; }
        .ai-scroll::-webkit-scrollbar-thumb { background:rgba(220,38,38,0.3); border-radius:4px; }
        .ai-scroll::-webkit-scrollbar-track { background:transparent; }
        .ai-ta:focus { outline:none; border-color:#DC2626 !important; box-shadow:0 0 0 3px rgba(220,38,38,0.2) !important; }
        .ai-fab:hover { transform:scale(1.1) !important; }
        .ai-chip:hover { background:rgba(220,38,38,0.2) !important; border-color:#DC2626 !important; transform:translateY(-2px); }
        .ai-iconbtn:hover { background:rgba(255,255,255,0.2) !important; }
        .ai-send:not(:disabled):hover { transform:scale(1.1); }
      `}</style>

      {/* FAB */}
      {!isOpen && (
        <button className="ai-fab" onClick={() => setIsOpen(true)} style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '64px', height: '64px', borderRadius: '50%', border: 'none',
          background: 'linear-gradient(135deg, #DC2626, #991b1b)',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 25px rgba(220,38,38,0.4)',
          transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          animation: pulse ? 'fabPulse 2s infinite' : 'none',
        }}>
          <span style={{
            position: 'absolute', top: '6px', right: '6px',
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#4ade80', border: '2px solid #991b1b',
          }} />
          <IcRobot />
        </button>
      )}

      {/* FENÊTRE CHAT */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
          width: '400px', maxWidth: 'calc(100vw - 40px)',
          height: '600px', maxHeight: 'calc(100vh - 40px)',
          borderRadius: '24px',
          background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(220,38,38,0.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'chatOpen 0.3s ease',
        }}>
          {/* HEADER */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(90deg, #DC2626, #991b1b)',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.2)',
            }}>
              <IcRobot />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>CarAI Assistant</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                <span>En ligne</span>
              </div>
            </div>
            <button onClick={clearChat} className="ai-iconbtn" style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px',
              color: '#fff', cursor: 'pointer', padding: '8px', display: 'flex',
            }} title="Nouvelle conversation">
              <IcTrash />
            </button>
            <button onClick={() => setIsOpen(false)} className="ai-iconbtn" style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px',
              color: '#fff', cursor: 'pointer', padding: '8px', display: 'flex',
            }} title="Fermer">
              <IcClose />
            </button>
          </div>

          {/* SUGGESTIONS (affiché seulement au début) */}
          {messages.length <= 1 && (
            <div style={{
              padding: '10px 14px', display: 'flex', gap: '6px', flexWrap: 'wrap',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="ai-chip"
                  onClick={() => setInput(s.query)}
                  style={{
                    fontSize: '0.7rem', padding: '5px 10px', borderRadius: '20px',
                    border: '1px solid rgba(220,38,38,0.3)',
                    background: 'rgba(220,38,38,0.1)', color: '#fca5a5',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  {s.text}
                </button>
              ))}
            </div>
          )}

          {/* MESSAGES */}
          <div className="ai-scroll" style={{
            flex: 1, overflowY: 'auto', padding: '20px 16px',
            display: 'flex', flexDirection: 'column',
          }}>
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isNew={idx === newMsgIdx && msg.id !== 'welcome-message'}
                userLocation={userLocation}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* BARRE LOCALISATION */}
          {locationLabel && (
            <div style={{
              padding: '4px 16px', fontSize: '0.65rem', color: '#4ade80',
              background: 'rgba(74,222,128,0.1)', borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <IcPin /><span>{locationLabel}</span>
            </div>
          )}

          {/* INPUT */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)', display: 'flex', gap: '8px', alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              className="ai-ta"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={user ? 'Écrivez votre message...' : 'Connectez-vous pour utiliser CarAI...'}
              disabled={!user}
              rows={1}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                color: '#f0f0f0', fontSize: '0.85rem', fontFamily: 'inherit',
                padding: '10px 14px', resize: 'none', lineHeight: '1.5',
                maxHeight: '100px', overflowY: 'auto', transition: 'all 0.2s',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
            />
            <button
              className="ai-send"
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !user}
              style={{
                width: '42px', height: '42px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #DC2626, #991b1b)',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(220,38,38,0.3)', transition: 'all 0.2s',
                opacity: isLoading || !input.trim() || !user ? 0.5 : 1,
              }}
            >
              <IcSend />
            </button>
          </div>

          {/* FOOTER */}
          <div style={{
            textAlign: 'center', fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)',
            padding: '6px', borderTop: '1px solid rgba(255,255,255,0.02)',
          }}>
            CarAI · CarEasy Bénin · Assistance 24/7
          </div>
        </div>
      )}
    </>
  );
}