import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiX, FiSend, FiMapPin, FiLoader, FiCheck, FiCheckCircle, 
  FiImage, FiVideo, FiMic, FiStopCircle, FiPlay, FiPause,
  FiDownload, FiMaximize2, FiMessageCircle, FiPhone, FiHeadphones,
  FiNavigation, FiExternalLink, FiFileText, FiUser,
  FiChevronLeft, FiLogIn, FiPaperclip, FiVideo as FiVideoIcon,
  FiMusic, FiFile, FiUpload, FiCalendar, FiClock
} from 'react-icons/fi';
import { messageApi } from '../../api/messageApi';
import { useAuth } from '../../contexts/AuthContext';
import theme from '../../config/theme';

// Composant pour la carte de localisation
const LocationMap = ({ latitude, longitude, address = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const mapSrc = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <div style={styles.locationContainer}>
      <div style={styles.locationHeader}>
        <FiMapPin style={styles.locationIcon} />
        <span style={styles.locationTitle}>📍 Localisation partagée</span>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          style={styles.expandButton}
          title={isExpanded ? "Réduire" : "Agrandir"}
        >
          <FiMaximize2 />
        </button>
      </div>
      
      <div 
        style={{
          ...styles.mapPreview,
          height: isExpanded ? '250px' : '150px'
        }}
      >
        <iframe
          title="Carte de localisation"
          src={mapSrc}
          style={styles.mapIframe}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      
      <div style={styles.mapActions}>
        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.mapLink}
        >
          <FiExternalLink style={styles.mapLinkIcon} />
          Ouvrir dans Google Maps
        </a>
      </div>
    </div>
  );
};

// Composant pour les messages audio
const AudioMessage = ({ audioUrl, duration = null }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [durationState, setDurationState] = useState(duration || 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const handleLoadedMetadata = () => {
      setDurationState(audio.duration || duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
    };

    const handleError = () => {
      console.error('Erreur de chargement audio');
      setError(true);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
    };
  }, [duration]);

  const togglePlay = () => {
    if (!audioRef.current || error) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Erreur lecture audio:', err);
        setError(true);
      });
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div style={styles.audioErrorContainer}>
        <div style={styles.audioErrorIcon}>⚠️</div>
        <div style={styles.audioErrorInfo}>
          <span style={styles.audioErrorText}>Impossible de lire l'audio</span>
          <a 
            href={audioUrl}
            download
            style={styles.audioErrorDownload}
          >
            <FiDownload /> Télécharger
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.audioMessageContainer}>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="metadata" 
        style={{ display: 'none' }}
        crossOrigin="anonymous"
      />
      
      <button 
        onClick={togglePlay}
        style={styles.audioPlayButton}
        title={isPlaying ? "Pause" : "Lecture"}
      >
        {isPlaying ? <FiPause /> : <FiPlay />}
      </button>
      
      <div style={styles.audioInfo}>
        <div style={styles.audioHeader}>
          <FiHeadphones style={styles.audioIcon} />
          <span style={styles.audioLabel}>Message vocal</span>
        </div>
        
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${progress}%`
            }}
          />
        </div>
        
        <div style={styles.audioTime}>
          <span style={styles.currentTime}>{formatTime(currentTime)}</span>
          <span style={styles.duration}>{formatTime(durationState)}</span>
        </div>
      </div>
      
      <a 
        href={audioUrl}
        download
        style={styles.downloadAudioButton}
        title="Télécharger"
      >
        <FiDownload />
      </a>
    </div>
  );
};

// Composant pour le séparateur de date
const DateSeparator = ({ date }) => {
  return (
    <div style={styles.dateSeparator}>
      <div style={styles.dateLine} />
      <span style={styles.dateText}>{date}</span>
      <div style={styles.dateLine} />
    </div>
  );
};

export default function ChatModal({ 
  receiverId, 
  receiverName, 
  receiverPhone = null,
  onClose, 
  conversationId = null,
  existingConversation = false
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [locationSharing, setLocationSharing] = useState(false);
  
  // États pour l'enregistrement audio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  
  // États pour les fichiers
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  
  // États pour le statut en ligne
  const [isReceiverOnline, setIsReceiverOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  
  // États pour la prévisualisation des médias
  const [mediaPreview, setMediaPreview] = useState(null);
  
  // État pour le modal de contact
  const [showContactModal, setShowContactModal] = useState(false);
  
  // État pour la redirection login
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const onlineCheckIntervalRef = useRef(null);
  const inputRef = useRef(null);
  const audioStreamRef = useRef(null);

  // Gestion responsive
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Rediriger vers login si utilisateur non connecté
  useEffect(() => {
    if (!user && receiverId) {
      setShowLoginPrompt(true);
    }
  }, [user, receiverId]);

  const handleLoginRedirect = () => {
    onClose();
    navigate('/login', { 
      state: { 
        from: 'chat',
        receiverId,
        receiverName,
        receiverPhone
      } 
    });
  };

  const initConversation = useCallback(async () => {
    if (!user && receiverId) {
      setError('Veuillez vous connecter pour envoyer des messages');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      let conv;
      
      if (conversationId && existingConversation) {
        // Charger une conversation existante
        const convData = await messageApi.getMessages(conversationId);
        setConversation(convData);
        setMessages(convData.messages || []);
        
        // Vérifier le statut du destinataire
        if (convData.user_one_id === user?.id) {
          checkOnlineStatus(convData.user_two_id);
        } else if (convData.user_two_id === user?.id) {
          checkOnlineStatus(convData.user_one_id);
        }
      } else if (receiverId) {
        // Démarrer une nouvelle conversation
        conv = await messageApi.startConversation(receiverId);
        setConversation(conv);
        
        const convData = await messageApi.getMessages(conv.id);
        setMessages(convData.messages || []);
        
        // Vérifier le statut en ligne
        checkOnlineStatus(receiverId);
        
        // Afficher modal contact si prestataire hors ligne
        if (!isReceiverOnline && receiverPhone) {
          setTimeout(() => setShowContactModal(true), 1000);
        }
      }
    } catch (err) {
      console.error('Erreur initialisation conversation:', err);
      setError('Impossible de démarrer la conversation. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [user, receiverId, conversationId, existingConversation, receiverPhone, isReceiverOnline]);

  useEffect(() => {
    if (user || (!user && conversationId)) {
      initConversation();
      
      // Vérifier le statut en ligne toutes les 30 secondes
      if (receiverId) {
        checkOnlineStatus(receiverId);
        onlineCheckIntervalRef.current = setInterval(() => {
          checkOnlineStatus(receiverId);
        }, 30000);
      }
      
      // Mettre à jour mon statut en ligne
      const updateMyStatusInterval = setInterval(() => {
        if (user) {
          messageApi.updateOnlineStatus();
        }
      }, 60000);
      
      return () => {
        if (onlineCheckIntervalRef.current) {
          clearInterval(onlineCheckIntervalRef.current);
        }
        clearInterval(updateMyStatusInterval);
        stopRecording();
      };
    }
  }, [user, receiverId, conversationId, initConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const checkOnlineStatus = async (userId) => {
    if (!userId) return;
    try {
      const status = await messageApi.checkOnlineStatus(userId);
      setIsReceiverOnline(status.is_online);
      setLastSeen(status.last_seen_at);
    } catch (err) {
      console.error('Erreur vérification statut:', err);
      // Ne pas afficher d'erreur à l'utilisateur, juste log
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    if ((!newMessage.trim() && !selectedFile && !audioBlob) || sending || !conversation) return;

    try {
      setSending(true);
      setError('');

      let sentMessage;
      
      // Préparer les données à envoyer
      if (selectedFile || audioBlob) {
        // Cas avec fichier (image, vidéo, audio)
        const formData = new FormData();
        const fileToSend = audioBlob || selectedFile;
        
        // Déterminer le type
        let fileTypeValue;
        if (audioBlob) {
          fileTypeValue = 'vocal';
          // Créer un fichier à partir du blob audio
          const audioFile = new File([audioBlob], `audio_message_${Date.now()}.webm`, {
            type: 'audio/webm'
          });
          formData.append('file', audioFile);
        } else {
          if (selectedFile.type.startsWith('image/')) {
            fileTypeValue = 'image';
          } else if (selectedFile.type.startsWith('video/')) {
            fileTypeValue = 'video';
          } else {
            fileTypeValue = 'document';
          }
          formData.append('file', selectedFile);
        }
        
        formData.append('type', fileTypeValue);
        
        // Ajouter le contenu texte si présent
        if (newMessage.trim()) {
          formData.append('content', newMessage.trim());
        }
        
        // Envoyer avec FormData
        sentMessage = await messageApi.sendMessage(conversation.id, formData);
      } else {
        // Cas message texte simple
        sentMessage = await messageApi.sendMessage(conversation.id, {
          type: 'text',
          content: newMessage.trim()
        });
      }

      // Ajouter le message à la liste avec les bonnes propriétés
      const newMessageObj = {
        id: sentMessage.id || Date.now(),
        conversation_id: conversation.id,
        sender_id: user.id,
        sender: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        type: sentMessage.type || 'text',
        content: sentMessage.content || newMessage.trim(),
        file_path: sentMessage.file_path,
        file_url: sentMessage.file_url || sentMessage.file_path,
        latitude: sentMessage.latitude,
        longitude: sentMessage.longitude,
        read_at: null,
        created_at: sentMessage.created_at || new Date().toISOString(),
        updated_at: sentMessage.updated_at || new Date().toISOString()
      };

      setMessages(prev => [...prev, newMessageObj]);
      
      // Réinitialiser l'état
      setNewMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      setAudioBlob(null);
      setFileType(null);
      
      // Focus sur l'input après envoi
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
    } catch (err) {
      console.error('Erreur envoi message:', err);
      setError('Impossible d\'envoyer le message. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  // 🎤 ENREGISTREMENT AUDIO
  const startRecording = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      audioStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        setAudioBlob(audioBlob);
        
        // Arrêter le stream audio
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
          audioStreamRef.current = null;
        }
      };

      mediaRecorderRef.current.start(100); // Collecter les données par chunks de 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erreur enregistrement audio:', err);
      alert('Impossible d\'accéder au microphone. Veuillez vérifier les permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
    
    // Arrêter le stream audio si toujours actif
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  };

  // 📷 SÉLECTION DE FICHIERS
  const handleFileSelect = (e) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Fichier trop volumineux (maximum 10MB)');
      return;
    }

    setSelectedFile(file);
    
    // Déterminer le type de fichier
    if (file.type.startsWith('image/')) {
      setFileType('image');
    } else if (file.type.startsWith('video/')) {
      setFileType('video');
    } else if (file.type.startsWith('audio/')) {
      setFileType('vocal');
    } else {
      setFileType('document');
    }

    // Créer une prévisualisation pour les images et vidéos
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const videoUrl = URL.createObjectURL(file);
      setFilePreview(videoUrl);
    } else {
      setFilePreview(null);
    }
  };

  const handleShareLocation = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    if (!conversation) return;

    try {
      setLocationSharing(true);
      
      if (!navigator.geolocation) {
        alert('La géolocalisation n\'est pas supportée par votre navigateur');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Envoyer le message avec localisation
            const locationMessage = await messageApi.sendMessage(
              conversation.id,
              {
                type: 'text',
                content: '📍 Ma position actuelle',
                latitude: latitude,
                longitude: longitude
              }
            );

            // Ajouter le message à la liste
            const newLocationMessage = {
              id: locationMessage.id || Date.now(),
              conversation_id: conversation.id,
              sender_id: user.id,
              sender: user,
              type: 'text',
              content: '📍 Ma position actuelle',
              latitude: latitude,
              longitude: longitude,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            setMessages(prev => [...prev, newLocationMessage]);
            setLocationSharing(false);
          } catch (err) {
            console.error('Erreur envoi localisation:', err);
            alert('Impossible d\'envoyer la localisation');
            setLocationSharing(false);
          }
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
          alert('Impossible d\'accéder à votre position. Veuillez vérifier les permissions.');
          setLocationSharing(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (err) {
      console.error('Erreur partage localisation:', err);
      setLocationSharing(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier";
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatLastSeen = (lastSeenAt) => {
    if (!lastSeenAt) return 'Jamais en ligne';
    try {
      const date = new Date(lastSeenAt);
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / 60000);
      
      if (diffMinutes < 1) return 'À l\'instant';
      if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
      if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)}h`;
      return date.toLocaleDateString('fr-FR');
    } catch (err) {
      return 'Inconnu';
    }
  };

  const isMyMessage = (message) => {
    return user && message.sender_id === user.id;
  };

  const renderMessageContent = (message) => {
    // Vérifier si c'est un message de localisation
    if (message.latitude && message.longitude) {
      return (
        <div style={styles.messageContent}>
          {message.content && message.content !== '📍 Ma position actuelle' && (
            <div style={styles.messageText}>{message.content}</div>
          )}
          <LocationMap 
            latitude={message.latitude} 
            longitude={message.longitude} 
          />
        </div>
      );
    }

    // Message texte simple
    if (message.type === 'text' || !message.type) {
      return <div style={styles.messageText}>{message.content}</div>;
    }

    // Message avec fichier
    if (message.file_url || message.file_path) {
      const fileUrl = message.file_url || message.file_path;
      
      switch (message.type) {
        case 'image':
          return (
            <div style={styles.mediaContainer}>
              {message.content && message.content !== '🖼️ Image' && (
                <div style={styles.messageCaption}>{message.content}</div>
              )}
              <img 
                src={fileUrl} 
                alt="Image envoyée" 
                style={styles.imageMessage}
                onClick={() => setMediaPreview({ 
                  type: 'image', 
                  src: fileUrl,
                  alt: message.content || 'Image envoyée' 
                })}
                loading="lazy"
                onError={(e) => {
                  e.target.src = '/placeholder-image.png';
                }}
              />
            </div>
          );
          
        case 'video':
          return (
            <div style={styles.mediaContainer}>
              {message.content && message.content !== '🎥 Vidéo' && (
                <div style={styles.messageCaption}>{message.content}</div>
              )}
              <div style={styles.videoContainer}>
                <video 
                  src={fileUrl} 
                  controls 
                  style={styles.videoMessage}
                  preload="metadata"
                  poster="/video-thumbnail.png"
                >
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
              </div>
            </div>
          );
          
        case 'vocal':
          return (
            <div style={styles.audioContainer}>
              {message.content && message.content !== '🎤 Message vocal' && (
                <div style={styles.messageCaption}>{message.content}</div>
              )}
              <AudioMessage audioUrl={fileUrl} />
            </div>
          );
          
        case 'document':
          return (
            <div style={styles.documentContainer}>
              <div style={styles.documentIcon}>
                <FiFileText />
              </div>
              <div style={styles.documentInfo}>
                <div style={styles.documentName}>
                  {message.content || 'Document'}
                </div>
                <a 
                  href={fileUrl}
                  download
                  style={styles.downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiDownload /> Télécharger
                </a>
              </div>
            </div>
          );
          
        default:
          return <div style={styles.messageText}>{message.content || '(Fichier)'}</div>;
      }
    }

    return <div style={styles.messageText}>{message.content || '(Message)'}</div>;
  };

  // Regrouper les messages par date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Rendu du prompt de connexion
  if (showLoginPrompt) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.loginPrompt}>
            <div style={styles.loginHeader}>
              <FiUser style={styles.loginIcon} />
              <h3 style={styles.loginTitle}>Connexion requise</h3>
            </div>
            
            <div style={styles.loginBody}>
              <p style={styles.loginMessage}>
                Vous devez être connecté pour accéder au chat et envoyer des messages.
              </p>
            </div>
            
            <div style={styles.loginActions}>
              <button 
                onClick={onClose}
                style={styles.cancelLoginButton}
              >
                <FiChevronLeft style={styles.backIcon} />
                Retour
              </button>
              <button 
                onClick={handleLoginRedirect}
                style={styles.loginButton}
              >
                <FiLogIn style={styles.loginButtonIcon} />
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.overlay}>
        <div style={{
          ...styles.modal,
          width: isMobile ? '100%' : '500px',
          height: isMobile ? '100vh' : '90vh',
          maxWidth: isMobile ? '100%' : '500px',
          borderRadius: isMobile ? 0 : '20px',
          margin: isMobile ? 0 : 'auto'
        }}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              {isMobile && (
                <button 
                  onClick={onClose}
                  style={styles.mobileBackButton}
                >
                  <FiChevronLeft size={24} />
                </button>
              )}
              
              <div style={styles.avatarContainer}>
                <div style={styles.avatar}>
                  {receiverName?.charAt(0).toUpperCase() || 'U'}
                </div>
                {isReceiverOnline && (
                  <div style={styles.onlineIndicator} title="En ligne" />
                )}
              </div>
              
              <div style={styles.userInfo}>
                <h3 style={styles.headerTitle}>
                  {receiverName || 'Utilisateur'}
                  {isReceiverOnline && (
                    <span style={styles.onlineBadge}>● En ligne</span>
                  )}
                </h3>
                <div style={styles.headerStatus}>
                  {isReceiverOnline ? (
                    <span style={styles.statusTextActive}>En ligne</span>
                  ) : (
                    <span style={styles.statusText}>
                      {lastSeen ? `Vu ${formatLastSeen(lastSeen)}` : 'Hors ligne'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div style={styles.headerRight}>
              <button 
                onClick={handleShareLocation}
                disabled={locationSharing || !conversation}
                style={styles.actionButton}
                title="Partager ma position"
              >
                {locationSharing ? <FiLoader style={styles.spinner} /> : <FiMapPin />}
              </button>
              
              {!isMobile && (
                <button 
                  onClick={onClose}
                  style={styles.closeButton}
                  title="Fermer"
                >
                  <FiX size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Messages container */}
          <div style={styles.messagesContainer}>
            {loading ? (
              <div style={styles.loadingContainer}>
                <FiLoader style={styles.spinnerLarge} />
                <p style={styles.loadingText}>Chargement de la conversation...</p>
              </div>
            ) : error ? (
              <div style={styles.errorState}>
                <div style={styles.errorIcon}>❌</div>
                <p style={styles.errorText}>{error}</p>
                <button 
                  onClick={initConversation}
                  style={styles.retryButton}
                >
                  Réessayer
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <FiMessageCircle size={48} />
                </div>
                <h4 style={styles.emptyTitle}>Aucun message</h4>
                <p style={styles.emptyText}>
                  Envoyez votre premier message pour démarrer la conversation
                </p>
              </div>
            ) : (
              <>
                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                  <div key={date}>
                    <DateSeparator date={date} />
                    
                    {dateMessages.map((message) => {
                      const isMine = isMyMessage(message);
                      return (
                        <div
                          key={message.id || `msg-${message.created_at}-${Math.random()}`}
                          style={{
                            ...styles.messageWrapper,
                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              ...styles.messageBubble,
                              ...(isMine ? styles.myMessage : styles.theirMessage),
                              maxWidth: isMobile ? '85%' : '70%',
                            }}
                          >
                            {!isMine && message.sender?.name && (
                              <div style={styles.senderName}>
                                {message.sender.name}
                              </div>
                            )}
                            
                            {renderMessageContent(message)}
                            
                            <div style={styles.messageFooter}>
                              <span style={styles.messageTime}>
                                {formatTime(message.created_at)}
                              </span>
                              
                              {isMine && (
                                <span style={styles.readStatus}>
                                  {message.read_at ? (
                                    <FiCheckCircle 
                                      style={styles.readIcon} 
                                      title="Lu par le destinataire" 
                                    />
                                  ) : (
                                    <FiCheck 
                                      style={styles.sentIcon} 
                                      title="Envoyé" 
                                    />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Prévisualisation fichier */}
          {(filePreview || audioBlob) && (
            <div style={styles.previewContainer}>
              <div style={styles.previewHeader}>
                <span style={styles.previewTitle}>
                  {selectedFile?.type?.startsWith('image/') ? 'Image' : 
                   selectedFile?.type?.startsWith('video/') ? 'Vidéo' : 
                   audioBlob ? 'Message vocal' : 'Fichier'}
                </span>
                <button 
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                    setAudioBlob(null);
                    setFileType(null);
                  }}
                  style={styles.previewCancel}
                >
                  <FiX /> Annuler
                </button>
              </div>
              
              <div style={styles.previewContent}>
                {filePreview && selectedFile?.type?.startsWith('image/') && (
                  <img src={filePreview} alt="Preview" style={styles.previewImage} />
                )}
                {filePreview && selectedFile?.type?.startsWith('video/') && (
                  <video src={filePreview} controls style={styles.previewVideo} />
                )}
                {audioBlob && (
                  <div style={styles.audioPreview}>
                    <FiMic style={styles.audioPreviewIcon} />
                    <span>Message vocal ({formatRecordingTime(recordingTime)})</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enregistrement audio en cours */}
          {isRecording && (
            <div style={styles.recordingContainer}>
              <div style={styles.recordingHeader}>
                <div style={styles.recordingIndicator}>
                  <div style={styles.recordingDot} />
                  <span style={styles.recordingText}>Enregistrement en cours...</span>
                </div>
                <span style={styles.recordingTimer}>
                  {formatRecordingTime(recordingTime)}
                </span>
              </div>
              
              <div style={styles.recordingActions}>
                <button 
                  onClick={cancelRecording}
                  style={styles.cancelRecordingButton}
                >
                  <FiX /> Annuler
                </button>
                <button 
                  onClick={stopRecording}
                  style={styles.stopRecordingButton}
                >
                  <FiStopCircle /> Terminer
                </button>
              </div>
            </div>
          )}

          {/* Zone de saisie */}
          {!isRecording && (
            <form onSubmit={handleSendMessage} style={styles.inputContainer}>
              <div style={styles.inputActions}>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || !conversation}
                  style={styles.attachmentButton}
                  title="Joindre un fichier"
                >
                  <FiPaperclip />
                </button>
                
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={sending || !conversation}
                  style={styles.recordButton}
                  title="Enregistrer un message vocal"
                >
                  <FiMic />
                </button>
              </div>
              
              <div style={styles.inputWrapper}>
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  style={styles.messageInput}
                  disabled={sending || !conversation}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile && !audioBlob) || sending || !conversation}
                  style={{
                    ...styles.sendButton,
                    ...((!newMessage.trim() && !selectedFile && !audioBlob) || sending || !conversation) && styles.sendButtonDisabled
                  }}
                  title="Envoyer"
                >
                  {sending ? <FiLoader style={styles.spinner} /> : <FiSend />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Prévisualisation plein écran */}
      {mediaPreview && (
        <div 
          style={styles.fullscreenOverlay}
          onClick={() => setMediaPreview(null)}
        >
          <div style={styles.fullscreenContainer}>
            <div style={styles.fullscreenHeader}>
              <button 
                onClick={() => setMediaPreview(null)}
                style={styles.fullscreenClose}
              >
                <FiX />
              </button>
              {mediaPreview.type === 'image' && (
                <a 
                  href={mediaPreview.src}
                  download
                  style={styles.fullscreenDownload}
                  title="Télécharger"
                >
                  <FiDownload />
                </a>
              )}
            </div>
            
            <div style={styles.fullscreenContent}>
              {mediaPreview.type === 'image' && (
                <img 
                  src={mediaPreview.src} 
                  alt={mediaPreview.alt}
                  style={styles.fullscreenImage}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de contact */}
      {showContactModal && (
        <div style={styles.contactOverlay}>
          <div style={styles.contactModal}>
            <div style={styles.contactHeader}>
              <div style={styles.contactIconContainer}>
                <FiPhone style={styles.contactIcon} />
              </div>
              <h3 style={styles.contactTitle}>Prestataire hors ligne</h3>
              <button 
                onClick={() => setShowContactModal(false)}
                style={styles.contactClose}
              >
                <FiX />
              </button>
            </div>
            
            <div style={styles.contactBody}>
              <p style={styles.contactMessage}>
                <strong>{receiverName}</strong> est actuellement hors ligne.
              </p>
              
              {receiverPhone && (
                <div style={styles.contactOptions}>
                  <a 
                    href={`sms:${receiverPhone}`}
                    style={styles.contactOption}
                  >
                    <FiMessageCircle style={styles.optionIcon} />
                    <div style={styles.optionContent}>
                      <h4 style={styles.optionTitle}>Envoyer un SMS</h4>
                      <span style={styles.optionLink}>{receiverPhone}</span>
                    </div>
                  </a>
                  
                  <a 
                    href={`tel:${receiverPhone}`}
                    style={styles.contactOption}
                  >
                    <FiPhone style={styles.optionIcon} />
                    <div style={styles.optionContent}>
                      <h4 style={styles.optionTitle}>Appeler directement</h4>
                      <span style={styles.optionLink}>{receiverPhone}</span>
                    </div>
                  </a>
                </div>
              )}
            </div>
            
            <div style={styles.contactFooter}>
              <button 
                onClick={() => setShowContactModal(false)}
                style={styles.contactButton}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 768px) {
          .chat-modal {
            margin: 0 !important;
            border-radius: 0 !important;
            max-height: 100vh !important;
            height: 100vh !important;
          }
        }
      `}</style>
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  
  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    minHeight: '72px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  mobileBackButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: theme.colors.primary || '#3b82f6',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '12px',
    height: '12px',
    backgroundColor: '#10b981',
    border: '2px solid #ffffff',
    borderRadius: '50%',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 0.25rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  onlineBadge: {
    fontSize: '0.75rem',
    color: '#10b981',
    fontWeight: '500',
  },
  headerStatus: {
    fontSize: '0.875rem',
  },
  statusTextActive: {
    color: '#10b981',
    fontWeight: '500',
  },
  statusText: {
    color: '#6b7280',
  },
  actionButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6b7280',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6b7280',
    fontSize: '1.25rem',
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  
  // Messages container
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  
  // Date separator
  dateSeparator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '1rem 0',
    gap: '1rem',
  },
  dateLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e5e7eb',
  },
  dateText: {
    backgroundColor: '#f9fafb',
    padding: '0.375rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  
  // Message styles
  messageWrapper: {
    display: 'flex',
    marginBottom: '0.75rem',
  },
  messageBubble: {
    padding: '0.75rem 1rem',
    borderRadius: '18px',
    wordBreak: 'break-word',
    maxWidth: '70%',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  myMessage: {
    backgroundColor: theme.colors.primary || '#3b82f6',
    color: '#ffffff',
    borderBottomRightRadius: '4px',
  },
  theirMessage: {
    backgroundColor: '#ffffff',
    color: '#111827',
    borderBottomLeftRadius: '4px',
    border: '1px solid #e5e7eb',
  },
  senderName: {
    fontSize: '0.75rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
    color: theme.colors.primary || '#3b82f6',
    opacity: 0.9,
  },
  messageText: {
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  messageCaption: {
    fontSize: '0.875rem',
    color: 'inherit',
    opacity: 0.9,
    marginBottom: '0.5rem',
  },
  
  // Media styles
  mediaContainer: {
    margin: '-0.25rem -0.5rem',
  },
  imageMessage: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '8px',
    cursor: 'pointer',
    objectFit: 'cover',
    backgroundColor: '#f3f4f6',
  },
  videoContainer: {
    position: 'relative',
    backgroundColor: '#000000',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  videoMessage: {
    width: '100%',
    maxHeight: '300px',
    backgroundColor: '#000000',
    display: 'block',
  },
  audioContainer: {
    minWidth: '200px',
  },
  audioMessageContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    marginTop: '0.5rem',
  },
  audioPlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1rem',
    flexShrink: 0,
  },
  audioInfo: {
    flex: 1,
    minWidth: 0,
  },
  audioHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  audioIcon: {
    fontSize: '0.875rem',
    color: 'currentColor',
  },
  audioLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    opacity: 0.9,
  },
  progressBar: {
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '0.25rem',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '2px',
    transition: 'width 0.1s linear',
  },
  audioTime: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    opacity: 0.8,
  },
  currentTime: {
    fontWeight: '500',
  },
  duration: {
    opacity: 0.7,
  },
  downloadAudioButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '0.875rem',
    textDecoration: 'none',
    flexShrink: 0,
  },
  
  // Audio error styles
  audioErrorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    border: '1px solid #f59e0b',
  },
  audioErrorIcon: {
    fontSize: '1.5rem',
  },
  audioErrorInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  audioErrorText: {
    fontSize: '0.875rem',
    color: '#92400e',
    fontWeight: '500',
  },
  audioErrorDownload: {
    fontSize: '0.75rem',
    color: '#3b82f6',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  
  // Document styles
  documentContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    marginTop: '0.5rem',
  },
  documentIcon: {
    fontSize: '2rem',
    color: 'currentColor',
    flexShrink: 0,
  },
  documentInfo: {
    flex: 1,
    minWidth: 0,
  },
  documentName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.5rem',
    wordBreak: 'break-word',
  },
  downloadLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: 'currentColor',
    textDecoration: 'none',
    padding: '0.25rem 0.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
  },
  
  // Location styles
  locationContainer: {
    width: '100%',
    maxWidth: '300px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginTop: '0.5rem',
  },
  locationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  locationIcon: {
    color: theme.colors.primary || '#3b82f6',
    fontSize: '1rem',
  },
  locationTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  expandButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6b7280',
    fontSize: '0.875rem',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPreview: {
    width: '100%',
    transition: 'height 0.3s ease',
    overflow: 'hidden',
  },
  mapIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  mapActions: {
    padding: '0.75rem 1rem',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
  },
  mapLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: theme.colors.primary || '#3b82f6',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '0.75rem',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
  },
  mapLinkIcon: {
    fontSize: '0.75rem',
  },
  
  // Message footer
  messageFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: '0.5rem',
    gap: '0.5rem',
  },
  messageTime: {
    fontSize: '0.7rem',
    opacity: 0.7,
  },
  readStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  readIcon: {
    color: '#34d399',
    fontSize: '0.875rem',
  },
  sentIcon: {
    color: 'currentColor',
    opacity: 0.6,
    fontSize: '0.875rem',
  },
  
  // Loading states
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '1rem',
    padding: '3rem',
  },
  spinnerLarge: {
    animation: 'spin 1s linear infinite',
    fontSize: '2rem',
    color: theme.colors.primary || '#3b82f6',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: '1rem',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  
  // Error state
  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '1rem',
    padding: '3rem',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: '3rem',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: '0.95rem',
  },
  retryButton: {
    backgroundColor: theme.colors.primary || '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '3rem',
  },
  emptyIcon: {
    fontSize: '4rem',
    color: theme.colors.primaryLight || '#93c5fd',
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 0.5rem 0',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: '0.95rem',
    maxWidth: '300px',
  },
  
  // Preview container
  previewContainer: {
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    animation: 'fadeIn 0.3s ease-out',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
  },
  previewTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#111827',
  },
  previewCancel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    padding: '0.375rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  previewContent: {
    padding: '1rem',
  },
  previewImage: {
    width: '100%',
    maxHeight: '150px',
    objectFit: 'contain',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
  },
  previewVideo: {
    width: '100%',
    maxHeight: '150px',
    borderRadius: '8px',
    backgroundColor: '#000000',
  },
  audioPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  audioPreviewIcon: {
    fontSize: '1.25rem',
    color: theme.colors.primary || '#3b82f6',
  },
  
  // Recording container
  recordingContainer: {
    backgroundColor: '#fef2f2',
    borderTop: '1px solid #fecaca',
    padding: '1rem',
  },
  recordingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  recordingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  recordingDot: {
    width: '12px',
    height: '12px',
    backgroundColor: '#dc2626',
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite',
  },
  recordingText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#991b1b',
  },
  recordingTimer: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#991b1b',
  },
  recordingActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  cancelRecordingButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: '#ffffff',
    color: '#dc2626',
    border: '2px solid #fecaca',
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  stopRecordingButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  
  // Input container
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
  },
  inputActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  attachmentButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6b7280',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
    transition: 'opacity 0.2s',
  },
  recordButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6b7280',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
    transition: 'opacity 0.2s',
  },
  inputWrapper: {
    display: 'flex',
    flex: 1,
    gap: '0.75rem',
  },
  messageInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '24px',
    fontSize: '0.9375rem',
    outline: 'none',
    backgroundColor: '#f9fafb',
    transition: 'border-color 0.2s',
  },
  messageInputFocus: {
    borderColor: theme.colors.primary || '#3b82f6',
  },
  sendButton: {
    backgroundColor: theme.colors.primary || '#3b82f6',
    color: '#ffffff',
    border: 'none',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    fontSize: '1.25rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  
  // Login prompt
  loginPrompt: {
    padding: '2rem',
    textAlign: 'center',
  },
  loginHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
  },
  loginIcon: {
    fontSize: '3rem',
    color: theme.colors.primary || '#3b82f6',
    backgroundColor: '#eff6ff',
    padding: '1rem',
    borderRadius: '50%',
  },
  loginTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },
  loginBody: {
    marginBottom: '2rem',
  },
  loginMessage: {
    color: '#6b7280',
    fontSize: '1rem',
    lineHeight: '1.6',
    marginBottom: '1.5rem',
  },
  loginBenefits: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  benefitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.9rem',
    color: '#4b5563',
  },
  benefitIcon: {
    color: '#10b981',
    fontSize: '1rem',
  },
  loginActions: {
    display: 'flex',
    gap: '1rem',
  },
  cancelLoginButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    border: '1px solid #e5e7eb',
    padding: '0.875rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  loginButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: theme.colors.primary || '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '0.875rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
  },
  loginButtonIcon: {
    fontSize: '1.125rem',
  },
  backIcon: {
    fontSize: '1.125rem',
  },
  
  // Fullscreen overlay
  fullscreenOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  fullscreenContainer: {
    position: 'relative',
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  fullscreenHeader: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    display: 'flex',
    gap: '0.5rem',
    zIndex: 10,
  },
  fullscreenClose: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#ffffff',
    border: 'none',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.5rem',
  },
  fullscreenDownload: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#ffffff',
    border: 'none',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.25rem',
    textDecoration: 'none',
  },
  fullscreenContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  fullscreenImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: '8px',
  },
  
  // Contact modal
  contactOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001,
    padding: '1rem',
  },
  contactModal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  contactHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    position: 'relative',
  },
  contactIconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: theme.colors.primary || '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactIcon: {
    fontSize: '1.5rem',
    color: '#ffffff',
  },
  contactTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    flex: 1,
  },
  contactClose: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6b7280',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.25rem',
  },
  contactBody: {
    padding: '1.5rem',
  },
  contactMessage: {
    color: '#374151',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  contactOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  contactOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background-color 0.2s',
  },
  optionIcon: {
    fontSize: '1.25rem',
    color: theme.colors.primary || '#3b82f6',
    flexShrink: 0,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#6b7280',
    margin: '0 0 0.25rem 0',
  },
  optionLink: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#111827',
    display: 'block',
  },
  contactFooter: {
    padding: '1rem 1.5rem',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
  },
  contactButton: {
    backgroundColor: theme.colors.primary || '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '0.875rem 2rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
};