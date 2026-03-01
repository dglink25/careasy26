import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ImageModal, AudioMessage, VideoMessage } from './MediaMessage';
import ServiceMap from './ServiceMap';

const IcRobot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM7.5 13a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm9 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" fill="currentColor"/>
  </svg>
);

const IcOnline = () => (
  <svg viewBox="0 0 24 24" width="12" height="12">
    <circle cx="12" cy="12" r="8" fill="#4ade80" stroke="white" strokeWidth="2"/>
  </svg>
);

const IcOffline = () => (
  <svg viewBox="0 0 24 24" width="12" height="12">
    <circle cx="12" cy="12" r="8" fill="#fbbf24" stroke="white" strokeWidth="2"/>
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

const IcAttach = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

const IcMic = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
  </svg>
);

const IcPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IcTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
  </svg>
);

const IcAudio = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </svg>
);

const WELCOME_MESSAGE = {
  id: 'welcome-message',
  role: 'assistant',
  thinking: false,
  content: `**Bonjour ! Je suis CarAI, votre assistant automobile**
**Comment puis-je vous aider ?**

**Diagnostic** - Décrivez votre panne
**Garages, Station d'essence, Lavage, etc** - Trouvez les professionnels près de chez vous
**Conseils** - Entretien, vidange, climatisation
**Contact** - Appel/WhatsApp direct
**Vocal** - Parlez-moi, je vous comprends

Disponible 24h/24 7j/7 - Posez votre question !`,
  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  urgency: null
};

// ==================== COMPOSANT BULLE DE MESSAGE ====================
function MessageBubble({ msg, isNew, onDeleteMedia, userLocation }) {
  const isUser = msg.role === 'user';
  const isThinking = msg.thinking;
  const [showImageModal, setShowImageModal] = useState(false);
  const isWelcomeMessage = msg.id === 'welcome-message';

  const urgencyColors = {
    critical: '#ef4444',
    important: '#f59e0b',
    minor: '#22c55e',
    unknown: '#6b7280'
  };

  const urgencyBadges = {
    critical: '🚨 URGENT',
    important: '⚠️ ATTENTION',
    minor: '✅ OK',
    unknown: 'ℹ️ INFO'
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end', 
      gap: '8px', 
      marginBottom: '20px',
      animation: isNew && !isWelcomeMessage ? 'bubbleIn 0.3s ease both' : 'none',
      opacity: isThinking ? 0.8 : 1
    }}>
      {/* Avatar */}
      {!isUser && (
        <div style={{ 
          width: '36px', 
          height: '36px', 
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #DC2626, #991b1b)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 10px rgba(220,38,38,0.3)',
          border: '2px solid rgba(255,255,255,0.2)'
        }}>
          <IcRobot/>
        </div>
      )}
      
      <div style={{ 
        maxWidth: '75%', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '4px',
        alignItems: isUser ? 'flex-end' : 'flex-start' 
      }}>
        
        {/* Image */}
        {(msg.imagePreview || msg.imageUrl) && (
          <div 
            style={{
              maxWidth: '260px',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '2px solid rgba(220,38,38,0.2)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onClick={() => setShowImageModal(true)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img 
              src={msg.imagePreview || msg.imageUrl} 
              alt="" 
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}>
              <span style={{
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: '600',
                background: 'rgba(0,0,0,0.6)',
                padding: '6px 12px',
                borderRadius: '20px',
                backdropFilter: 'blur(4px)'
              }}>🔍 Agrandir</span>
            </div>
          </div>
        )}
        
        {/* Audio */}
        {msg.audioUrl && (
          <AudioMessage
            src={msg.audioUrl}
            duration={msg.audioDuration}
            isOwn={isUser}
            onDelete={() => onDeleteMedia?.(msg.id, 'audio')}
          />
        )}
        
        {/* Message texte */}
        {msg.content && (
          <div style={{
            padding: '12px 18px',
            borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
            background: isUser ? '#DC2626' : '#1a1a2e',
            color: '#fff',
            fontSize: '0.9rem', 
            lineHeight: '1.6',
            boxShadow: isUser 
              ? '0 4px 15px rgba(220,38,38,0.3)' 
              : '0 4px 15px rgba(0,0,0,0.2)',
            border: isWelcomeMessage ? '2px solid rgba(220,38,38,0.5)' : 'none',
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            maxWidth: '100%',
          }}>
            {isThinking ? (
              <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <span>CarAI réfléchit</span>
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%',
                    background: '#fff', 
                    display: 'inline-block',
                    animation: `dotPulse 1.2s ${d}s infinite` 
                  }}/>
                ))}
              </span>
            ) : (
              <span dangerouslySetInnerHTML={{ 
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fbbf24;">$1</strong>')
                  .replace(/\n/g, '<br/>') 
              }} />
            )}
          </div>
        )}

        {/* Services */}
        {msg.services && msg.services.length > 0 && (
          <ServiceMap services={msg.services} userLocation={userLocation} />
        )}

        {/* Timestamp et urgence */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '4px',
          padding: '0 4px'
        }}>
          {msg.urgency && msg.urgency !== 'unknown' && (
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: '600', 
              color: urgencyColors[msg.urgency],
              background: urgencyColors[msg.urgency] + '15',
              padding: '4px 10px', 
              borderRadius: '20px',
              border: '1px solid ' + urgencyColors[msg.urgency] + '30',
              letterSpacing: '0.3px'
            }}>
              {urgencyBadges[msg.urgency]}
            </span>
          )}
          <span style={{
            fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.3)',
            fontWeight: '400'
          }}>
            {msg.time}
          </span>
        </div>
      </div>

      {/* Modal image */}
      {showImageModal && (
        <ImageModal
          src={msg.imagePreview || msg.imageUrl}
          alt="Image"
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
}

// ==================== COMPOSANT PRINCIPAL ====================
export default function AIChatWidget() {
  const location = useLocation();

  // États
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [aiOnline, setAiOnline] = useState(true);
  const [newMsgIdx, setNewMsgIdx] = useState(null);
  const [pulse, setPulse] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [returnAudio, setReturnAudio] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const streamRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Vérification statut AI
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/status', {
          signal: AbortSignal.timeout(3000)
        });
        setAiOnline(response.ok);
      } catch {
        setAiOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Message de bienvenue
  useEffect(() => {
    if (isOpen && !welcomeShown && messages.length === 0) {
      setMessages([{
        ...WELCOME_MESSAGE,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }]);
      setWelcomeShown(true);
      setNewMsgIdx(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    setPulse(false);
  }, [isOpen, welcomeShown, messages.length]);

  // Géolocalisation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setLocationLabel('📍 Position détectée');
      },
      () => setLocationLabel(''),
      { timeout: 5000, enableHighAccuracy: true }
    );
  }, []);

  // Pages à exclure
  if (['/login', '/register'].includes(location.pathname)) return null;

  // Utilitaires
  const getTime = () => new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const formatTime = (s) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // ========== ENREGISTREMENT AUDIO ==========
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000
        }
      });
      
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      mediaRecRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        streamRef.current?.getTracks().forEach(t => t.stop());
      };

      mediaRecRef.current.start(100);
      setIsRecording(true);
      setRecordTime(0);
      recordTimerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
    } catch {
      alert('🎤 Microphone inaccessible. Vérifiez les permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecRef.current && isRecording) {
      mediaRecRef.current.stop();
      setIsRecording(false);
      clearInterval(recordTimerRef.current);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordTime(0);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  // ========== GESTION DES FICHIERS ==========
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('📸 L\'image ne doit pas dépasser 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ========== ENVOI DE MESSAGE ==========
  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !imageFile && !audioBlob) || isLoading) return;

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Créer l'aperçu audio
    let audioPreviewUrl = null;
    if (audioBlob) {
      audioPreviewUrl = URL.createObjectURL(audioBlob);
    }

    // Message utilisateur
    const userContent = audioBlob ? '' : (text || '');
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: userContent,
      time: getTime(),
      imagePreview: imagePreview,
      audioUrl: audioPreviewUrl,
      audioDuration: recordTime
    };

    // Message "réflexion"
    const thinkingMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      thinking: true,
      content: '',
      time: getTime()
    };

    setMessages(prev => {
      const newMessages = [...prev, userMsg, thinkingMsg];
      setNewMsgIdx(newMessages.length - 2);
      return newMessages;
    });

    setInput('');
    setIsLoading(true);

    const savedImg = imageFile;
    const savedAudio = audioBlob;
    const savedAudioUrl = audioPreviewUrl;

    removeImage();
    setAudioBlob(null);
    setRecordTime(0);

    try {
      const formData = new FormData();

      if (text) formData.append('message', text);
      if (savedImg) formData.append('file', savedImg);
      if (savedAudio) {
        const audioFile = new File([savedAudio], 'voice.webm', { type: 'audio/webm' });
        formData.append('file', audioFile);
      }
      if (userLocation) {
        formData.append('lat', userLocation.lat);
        formData.append('lng', userLocation.lng);
      }
      formData.append('return_audio', returnAudio ? 'true' : 'false');
      formData.append('lang', 'fr');

      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();

      // URL audio IA
      const aiAudioUrl = result.audio_url
        ? (result.audio_url.startsWith('http') ? result.audio_url : `http://localhost:5000${result.audio_url}`)
        : null;

      // Message IA
      const aiMsg = {
        id: Date.now() + 2,
        role: 'assistant',
        thinking: false,
        content: result.answer || 'Désolé, je n\'ai pas compris.',
        urgency: result.urgency !== 'unknown' ? result.urgency : null,
        time: getTime(),
        audioUrl: aiAudioUrl,
        services: result.services_proches || [],
      };

      setMessages(prev => {
        const filtered = prev.filter(m => !m.thinking);
        setNewMsgIdx(filtered.length);
        return [...filtered, aiMsg];
      });

      // Auto-play audio
      if (aiAudioUrl && returnAudio) {
        setTimeout(() => {
          new Audio(aiAudioUrl).play().catch(() => {});
        }, 300);
      }

    } catch (err) {
      if (err.name === 'AbortError') return;
      
      console.error('Erreur:', err);
      setMessages(prev => [
        ...prev.filter(m => !m.thinking),
        {
          id: Date.now() + 2,
          role: 'assistant',
          thinking: false,
          time: getTime(),
          content: '**Connexion impossible**\n\nVérifiez que le serveur Flask est lancé sur le port 5000.',
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // ========== GESTION DES ÉVÉNEMENTS ==========
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    removeImage();
    setAudioBlob(null);
    setInput('');
    setWelcomeShown(false);
  };

  // Suggestions
  const SUGGESTIONS = [
    { emoji: '', text: 'Panne moteur', query: 'Mon moteur fait un bruit bizarre' },
    { emoji: '', text: 'Garage proche', query: 'Trouver un garage près de chez moi' },
    { emoji: '', text: 'Station', query: 'Quelles sont les stations les plus proche ?' },
    { emoji: '', text: 'Climatisation Auto', query: 'Climatisation ne refroidit plus' },
    { emoji: '', text: 'Mécanique', query: 'Je cherche un mecanicien proche?' },
    { emoji: '', text: 'Révision', query: 'Je veux faire révision générale à ma moto ?' },
    { emoji: '', text: 'Lavage', query: 'Je cherche lavage auto ?' },
    { emoji: '', text: 'Auto Ecole', query: 'Je veux une auto ecole de conduite ?' },
    { emoji: '', text: 'Maintenance poid lourd', query: 'Maintenance poid lourd' },
    { emoji: '', text: 'Assurance Automobile', query: 'Assurance Automobile ?' },
  ];

  return (
    <>
      <style>{`
        @keyframes bubbleIn {
          from { opacity: 0; transform: scale(0.8) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes chatOpen {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fabPulse {
          0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.7); }
          70% { box-shadow: 0 0 0 15px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
        @keyframes recordingPulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .ai-scroll::-webkit-scrollbar { width: 4px; }
        .ai-scroll::-webkit-scrollbar-thumb {
          background: rgba(220,38,38,0.3);
          border-radius: 4px;
        }
        .ai-scroll::-webkit-scrollbar-track { background: transparent; }
        .ai-ta:focus {
          outline: none;
          border-color: #DC2626 !important;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.2) !important;
        }
        .ai-fab:hover { transform: scale(1.1) !important; }
        .ai-chip:hover {
          background: rgba(220,38,38,0.2) !important;
          border-color: #DC2626 !important;
          transform: translateY(-2px);
        }
        .ai-iconbtn:hover { background: rgba(255,255,255,0.2) !important; }
        .ai-send:not(:disabled):hover { transform: scale(1.1); }
      `}</style>

      {/* FAB */}
      {!isOpen && (
        <button
          className="ai-fab"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #DC2626, #991b1b)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(220,38,38,0.4)',
            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            animation: pulse && aiOnline ? 'fabPulse 2s infinite' : 'none',
          }}
        >
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: aiOnline ? '#4ade80' : '#fbbf24',
            border: '2px solid #991b1b',
          }}/>
          <IcRobot />
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          width: '400px',
          maxWidth: 'calc(100vw - 40px)',
          height: '600px',
          maxHeight: 'calc(100vh - 40px)',
          borderRadius: '24px',
          background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(220,38,38,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatOpen 0.3s ease',
        }}>
          {/* HEADER */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(90deg, #DC2626, #991b1b)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.2)',
            }}>
              <IcRobot />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                CarAI Assistant
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                {aiOnline ? <IcOnline /> : <IcOffline />}
                <span>{aiOnline ? 'En ligne' : 'Hors ligne'}</span>
              </div>
            </div>

            <button
              onClick={() => setReturnAudio(v => !v)}
              style={{
                background: returnAudio ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                transition: 'background 0.2s',
              }}
              title={returnAudio ? 'Désactiver le mode vocal' : 'Activer le mode vocal'}
            >
              <IcAudio />
            </button>

            <button
              onClick={clearChat}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                transition: 'background 0.2s',
              }}
              title="Nouvelle conversation"
            >
              <IcTrash />
            </button>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                transition: 'background 0.2s',
              }}
              title="Fermer"
            >
              <IcClose />
            </button>
          </div>

          {/* SUGGESTIONS */}
          {messages.length <= 1 && (
            <div style={{
              padding: '12px 16px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="ai-chip"
                  onClick={() => setInput(s.query)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(220,38,38,0.3)',
                    background: 'rgba(220,38,38,0.1)',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{s.emoji}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* MESSAGES */}
          <div className="ai-scroll" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isNew={idx === newMsgIdx && msg.id !== 'welcome-message'}
                userLocation={userLocation}
                onDeleteMedia={() => {}}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* LOCATION BAR */}
          {locationLabel && (
            <div style={{
              padding: '4px 16px',
              fontSize: '0.65rem',
              color: '#4ade80',
              background: 'rgba(74,222,128,0.1)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <IcPin />
              <span>{locationLabel}</span>
            </div>
          )}

          {/* AUDIO MODE BADGE */}
          {returnAudio && (
            <div style={{
              padding: '4px 16px',
              fontSize: '0.65rem',
              color: '#fbbf24',
              background: 'rgba(251,191,36,0.1)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>Mode vocal activé - Les réponses seront lues</span>
            </div>
          )}

          {/* IMAGE PREVIEW */}
          {imagePreview && (
            <div style={{
              padding: '8px 16px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(0,0,0,0.3)',
            }}>
              <img
                src={imagePreview}
                alt=""
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '2px solid #DC2626',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#aaa', flex: 1 }}>
                {imageFile?.name?.slice(0, 30)}
              </span>
              <button
                onClick={removeImage}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '4px 8px',
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* AUDIO PREVIEW */}
          {audioBlob && !isRecording && (
            <div style={{
              padding: '8px 16px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(220,38,38,0.1)',
            }}>
              <IcMic />
              <span style={{ fontSize: '0.75rem', color: '#fca5a5', flex: 1 }}>
                Message vocal prêt ({formatTime(recordTime)})
              </span>
              <button
                onClick={() => setAudioBlob(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* RECORDING UI */}
          {isRecording && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(220,38,38,0.3)',
              background: 'rgba(220,38,38,0.15)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'recordingPulse 1s infinite',
                  }} />
                  <span style={{ fontSize: '0.8rem', color: '#fca5a5', fontWeight: 600 }}>
                    Enregistrement...
                  </span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ef4444' }}>
                  {formatTime(recordTime)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={cancelRecording}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: '1px solid rgba(220,38,38,0.3)',
                    background: 'transparent',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={stopRecording}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#DC2626',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Terminer
                </button>
              </div>
            </div>
          )}

          {/* INPUT AREA */}
          {!isRecording && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
            }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />

              <button
                className="ai-iconbtn"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#aaa',
                  cursor: 'pointer',
                  padding: '10px',
                  display: 'flex',
                  transition: 'all 0.2s',
                }}
                title="Joindre une photo"
              >
                <IcAttach />
              </button>

              <button
                className="ai-iconbtn"
                onClick={startRecording}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#aaa',
                  cursor: 'pointer',
                  padding: '10px',
                  display: 'flex',
                  transition: 'all 0.2s',
                }}
                title="Message vocal"
              >
                <IcMic />
              </button>

              <textarea
                ref={inputRef}
                className="ai-ta"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Écrivez votre message..."
                rows={1}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#f0f0f0',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  padding: '10px 14px',
                  resize: 'none',
                  lineHeight: '1.5',
                  maxHeight: '100px',
                  overflowY: 'auto',
                  transition: 'all 0.2s',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
              />

              <button
                className="ai-send"
                onClick={sendMessage}
                disabled={isLoading || (!input.trim() && !imageFile && !audioBlob)}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #DC2626, #991b1b)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
                  transition: 'all 0.2s',
                  opacity: isLoading || (!input.trim() && !imageFile && !audioBlob) ? 0.5 : 1,
                }}
              >
                <IcSend />
              </button>
            </div>
          )}

          {/* FOOTER */}
          <div style={{
            textAlign: 'center',
            fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.2)',
            padding: '6px',
            borderTop: '1px solid rgba(255,255,255,0.02)',
          }}>
            CarAI · CareEasy Bénin · Assistance 24/7
          </div>
        </div>
      )}
    </>
  );
}