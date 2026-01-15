// src/components/Chat/ChatModal.jsx - VERSION CORRIGÉE
import { useState, useEffect, useRef } from 'react';
import { 
  FiX, FiSend, FiMapPin, FiLoader, FiCheck, FiCheckCircle, 
  FiImage, FiVideo, FiMic, FiStopCircle, FiPlay, FiPause,
  FiDownload, FiMaximize2, FiMessageCircle, FiPhone
} from 'react-icons/fi';
import { messageApi } from '../../api/messageApi';
import { useAuth } from '../../contexts/AuthContext';
import theme from '../../config/theme';

// Composant pour la carte de localisation
const LocationMap = ({ latitude, longitude }) => {
  return (
    <div style={styles.mapContainer}>
      <div style={styles.mapHeader}>
        <FiMapPin style={styles.mapIcon} />
        <span style={styles.mapTitle}>📍 Position partagée</span>
      </div>
      <div style={styles.mapFrame}>
        <iframe
          title="Carte de localisation"
          src={`https://www.google.com/maps/embed/v1/view?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || 'YOUR_API_KEY'}&center=${latitude},${longitude}&zoom=15&maptype=roadmap`}
          style={styles.mapIframe}
          allowFullScreen
          loading="lazy"
        />
      </div>
      <a
        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.mapLink}
      >
        <FiMaximize2 style={styles.mapLinkIcon} />
        Ouvrir dans Google Maps
      </a>
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
  
  // États pour le statut en ligne
  const [isReceiverOnline, setIsReceiverOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  
  // États pour la prévisualisation des médias
  const [mediaPreview, setMediaPreview] = useState(null);
  
  // État pour le modal de contact
  const [showContactModal, setShowContactModal] = useState(false);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const onlineCheckIntervalRef = useRef(null);

  useEffect(() => {
    initConversation();
    
    // Vérifier le statut en ligne toutes les 30 secondes
    if (receiverId) {
      checkOnlineStatus();
      onlineCheckIntervalRef.current = setInterval(checkOnlineStatus, 30000);
    }
    
    // Mettre à jour mon propre statut en ligne
    const updateMyStatus = setInterval(() => {
      if (user) {
        messageApi.updateOnlineStatus();
      }
    }, 60000); // Toutes les minutes
    
    return () => {
      if (onlineCheckIntervalRef.current) {
        clearInterval(onlineCheckIntervalRef.current);
      }
      clearInterval(updateMyStatus);
      stopRecording();
    };
  }, [receiverId, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkOnlineStatus = async () => {
    if (!receiverId) return;
    try {
      const status = await messageApi.checkOnlineStatus(receiverId);
      setIsReceiverOnline(status.is_online);
      setLastSeen(status.last_seen_at);
    } catch (err) {
      console.error('Erreur vérification statut:', err);
    }
  };

  const initConversation = async () => {
    try {
      setLoading(true);
      setError('');
      
      let conv;
      
      if (conversationId && existingConversation) {
        conv = { id: conversationId };
        setConversation(conv);
        
        const convData = await messageApi.getMessages(conversationId);
        setMessages(convData.messages || []);
        
        // Récupérer le statut en ligne depuis la conversation
        if (convData.other_user_online !== undefined) {
          setIsReceiverOnline(convData.other_user_online);
          setLastSeen(convData.other_user_last_seen);
        }
      } else {
        if (!receiverId && user) {
          setError('Erreur: Destinataire non défini');
          return;
        }
        
        conv = await messageApi.startConversation(receiverId);
        setConversation(conv);
        
        const convData = await messageApi.getMessages(conv.id);
        setMessages(convData.messages || []);
        
        // Récupérer le statut en ligne
        if (conv.other_user_online !== undefined) {
          setIsReceiverOnline(conv.other_user_online);
          setLastSeen(conv.other_user_last_seen);
        }
        
        // Si anonyme ET prestataire offline → Afficher modal contact
        if (!user && !conv.other_user_online && receiverPhone) {
          setShowContactModal(true);
        }
      }
    } catch (err) {
      console.error('Erreur initialisation conversation:', err);
      setError('Impossible de démarrer la conversation. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile && !audioBlob) || sending || !conversation) return;

    try {
      setSending(true);
      setError('');

      let sentMessage;
      
      // Préparer les données pour l'envoi
      const formData = new FormData();
      formData.append('conversation_id', conversation.id);
      
      if (newMessage.trim()) {
        formData.append('content', newMessage.trim());
      }
      
      if (selectedFile) {
        formData.append('file', selectedFile);
        formData.append('file_type', selectedFile.type.startsWith('image/') ? 'image' : 'video');
      }
      
      if (audioBlob) {
        const audioFile = new File([audioBlob], 'audio_message.webm', { 
          type: 'audio/webm' 
        });
        formData.append('file', audioFile);
        formData.append('file_type', 'vocal');
      }
      
      // Envoyer au backend qui gérera l'upload
      sentMessage = await messageApi.sendMessageWithFile(formData);
      
      // Mettre à jour les messages
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      setAudioBlob(null);
      
    } catch (err) {
      console.error('Erreur envoi message:', err);
      setError('Impossible d\'envoyer le message. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  // 🎤 ENREGISTREMENT AUDIO
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Erreur enregistrement audio:', err);
      alert('Impossible d\'accéder au microphone');
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
  };

  // 📷 SÉLECTION DE FICHIERS
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 10MB)');
      return;
    }

    setSelectedFile(file);
    
    // Créer une prévisualisation
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleShareLocation = async () => {
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
            
            const locationMessage = await messageApi.sendMessage(
              conversation.id,
              `📍 Ma position actuelle`,
              { latitude, longitude }
            );

            setMessages(prev => [...prev, locationMessage]);
            setLocationSharing(false);
          } catch (err) {
            console.error('Erreur envoi localisation:', err);
            alert('Impossible d\'envoyer la localisation');
            setLocationSharing(false);
          }
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
          alert('Impossible d\'accéder à votre position');
          setLocationSharing(false);
        }
      );
    } catch (err) {
      console.error('Erreur partage localisation:', err);
      setLocationSharing(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatLastSeen = (lastSeenAt) => {
    if (!lastSeenAt) return '';
    const date = new Date(lastSeenAt);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  const isMyMessage = (message) => {
    if (user) {
      return message.sender_id === user.id;
    }
    return message.sender_id === null;
  };

  const renderMessageContent = (message) => {
    // Message texte
    if (message.type === 'text' || !message.type) {
      return <div style={styles.messageContent}>{message.content}</div>;
    }

    // Message avec localisation
    if (message.latitude && message.longitude) {
      return (
        <div style={styles.messageContent}>
          {message.content && <div style={styles.messageContent}>{message.content}</div>}
          <LocationMap latitude={message.latitude} longitude={message.longitude} />
        </div>
      );
    }

    // Message avec fichier
    if (message.file_url) {
      // Image
      if (message.type === 'image') {
        return (
          <div style={styles.mediaContainer}>
            {message.content && <div style={styles.messageContent}>{message.content}</div>}
            <img 
              src={message.file_url} 
              alt="Image envoyée" 
              style={styles.imageMessage}
              onClick={() => setMediaPreview({ 
                type: 'image', 
                src: message.file_url,
                alt: 'Image envoyée' 
              })}
              onError={(e) => {
                e.target.src = '/placeholder-image.png';
              }}
            />
          </div>
        );
      }
      
      // Vidéo - CORRECTION : Utilisation de la balise video avec src
      if (message.type === 'video') {
        return (
          <div style={styles.mediaContainer}>
            {message.content && <div style={styles.messageContent}>{message.content}</div>}
            <div style={styles.videoContainer}>
              <video 
                src={message.file_url} 
                controls 
                style={styles.videoMessage}
                preload="metadata"
                onError={(e) => {
                  console.error('Erreur chargement vidéo:', e);
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div style={styles.videoFallback}>
                <FiVideo style={styles.videoFallbackIcon} />
                <span>Vidéo non disponible</span>
                <a 
                  href={message.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.downloadLink}
                >
                  <FiDownload /> Télécharger
                </a>
              </div>
            </div>
          </div>
        );
      }
      
      // Audio
      if (message.type === 'vocal') {
        return (
          <div style={styles.audioContainer}>
            <FiMic style={styles.audioIcon} />
            <audio 
              src={message.file_url} 
              controls 
              style={styles.audioPlayer}
              preload="metadata"
            />
          </div>
        );
      }
    }

    return <div style={styles.messageContent}>{message.content || '(Fichier)'}</div>;
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerInfo}>
              <div style={styles.avatar}>
                {receiverName.charAt(0).toUpperCase()}
                {isReceiverOnline && <div style={styles.onlineIndicator} />}
              </div>
              <div>
                <h3 style={styles.headerTitle}>
                  {receiverName}
                </h3>
                <div style={styles.headerStatus}>
                  {isReceiverOnline ? (
                    <span style={styles.statusOnline}>● En ligne</span>
                  ) : (
                    <span style={styles.statusOffline}>
                      {lastSeen ? `Vu ${formatLastSeen(lastSeen)}` : 'Hors ligne'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={styles.closeButton}>
              <FiX />
            </button>
          </div>

          {/* Messages */}
          <div style={styles.messagesContainer}>
            {loading ? (
              <div style={styles.loadingContainer}>
                <FiLoader style={styles.spinner} />
                <p>Chargement de la conversation...</p>
              </div>
            ) : error ? (
              <div style={styles.errorState}>
                <div style={styles.errorIcon}>❌</div>
                <p style={styles.errorText}>{error}</p>
                <button onClick={initConversation} style={styles.retryButton}>
                  Réessayer
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <FiMessageCircle />
                </div>
                <p style={styles.emptyText}>
                  Envoyez votre premier message pour démarrer la conversation
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isMine = isMyMessage(message);
                  return (
                    <div
                      key={message.id}
                      style={{
                        ...styles.messageWrapper,
                        justifyContent: isMine ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          ...styles.messageBubble,
                          ...(isMine 
                            ? styles.myMessage 
                            : styles.theirMessage
                          )
                        }}
                      >
                        {!isMine && message.sender?.name && (
                          <div style={styles.senderName}>{message.sender.name}</div>
                        )}
                        
                        {renderMessageContent(message)}
                        
                        <div style={styles.messageFooter}>
                          <span style={styles.messageTime}>
                            {formatTime(message.created_at)}
                          </span>
                          
                          {isMine && (
                            <span style={styles.readStatus}>
                              {message.read_at ? (
                                <FiCheckCircle style={styles.readIcon} title="Lu" />
                              ) : (
                                <FiCheck style={styles.sentIcon} title="Envoyé" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Prévisualisation fichier sélectionné */}
          {(filePreview || audioBlob) && (
            <div style={styles.filePreview}>
              {filePreview && selectedFile?.type.startsWith('image/') && (
                <img src={filePreview} alt="Preview" style={styles.previewImage} />
              )}
              {filePreview && selectedFile?.type.startsWith('video/') && (
                <div style={styles.videoPreview}>
                  <video src={filePreview} controls style={styles.previewVideo} />
                </div>
              )}
              {audioBlob && (
                <div style={styles.audioPreview}>
                  <FiMic style={styles.audioPreviewIcon} />
                  <span>Message vocal ({formatRecordingTime(recordingTime)})</span>
                </div>
              )}
              <button 
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                  setAudioBlob(null);
                }}
                style={styles.cancelPreviewButton}
              >
                <FiX /> Annuler
              </button>
            </div>
          )}

          {/* Error banner */}
          {error && !loading && (
            <div style={styles.errorBanner}>
              {error}
            </div>
          )}

          {/* Input */}
          {isRecording ? (
            <div style={styles.recordingContainer}>
              <button onClick={cancelRecording} style={styles.cancelRecordButton}>
                <FiX />
              </button>
              <div style={styles.recordingIndicator}>
                <FiMic style={styles.recordingIcon} />
                <span style={styles.recordingTime}>{formatRecordingTime(recordingTime)}</span>
              </div>
              <button onClick={stopRecording} style={styles.stopRecordButton}>
                <FiStopCircle />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} style={styles.inputContainer}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                style={{ display: 'none' }}
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || !conversation}
                style={styles.mediaButton}
                title="Ajouter une image ou vidéo"
              >
                <FiImage />
              </button>
              
              <button
                type="button"
                onClick={handleShareLocation}
                disabled={locationSharing || !conversation}
                style={styles.locationButton}
                title="Partager ma position"
              >
                {locationSharing ? <FiLoader style={styles.spinner} /> : <FiMapPin />}
              </button>
              
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                style={styles.input}
                disabled={sending || !conversation}
              />
              
              {!newMessage.trim() && !selectedFile && !audioBlob ? (
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={sending || !conversation}
                  style={styles.micButton}
                  title="Maintenir pour enregistrer un audio"
                >
                  <FiMic />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile && !audioBlob) || sending || !conversation}
                  style={{
                    ...styles.sendButton,
                    ...((!newMessage.trim() && !selectedFile && !audioBlob) || sending || !conversation) && styles.sendButtonDisabled
                  }}
                >
                  {sending ? <FiLoader style={styles.spinner} /> : <FiSend />}
                </button>
              )}
            </form>
          )}

          {!user && (
            <div style={styles.infoFooter}>
              💡 Connectez-vous pour suivre vos conversations
            </div>
          )}
        </div>
      </div>

      {/* Prévisualisation plein écran des médias */}
      {mediaPreview && (
        <div style={styles.mediaPreviewOverlay} onClick={() => setMediaPreview(null)}>
          <div style={styles.mediaPreviewContainer} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setMediaPreview(null)}
              style={styles.closePreviewButton}
            >
              <FiX />
            </button>
            {mediaPreview.type === 'image' && (
              <img src={mediaPreview.src} alt={mediaPreview.alt} style={styles.fullImage} />
            )}
            {mediaPreview.type === 'video' && (
              <video src={mediaPreview.src} controls autoPlay style={styles.fullVideo} />
            )}
          </div>
        </div>
      )}

      {/* Modal de contact (si utilisateur anonyme et prestataire hors ligne) */}
      {showContactModal && (
        <div style={styles.contactModalOverlay} onClick={() => setShowContactModal(false)}>
          <div style={styles.contactModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.contactModalHeader}>
              <FiPhone style={styles.contactModalIcon} />
              <h3 style={styles.contactModalTitle}>Prestataire hors ligne</h3>
              <button 
                onClick={() => setShowContactModal(false)}
                style={styles.contactModalClose}
              >
                <FiX />
              </button>
            </div>
            
            <div style={styles.contactModalBody}>
              <p style={styles.contactModalText}>
                Le prestataire <strong>{receiverName}</strong> est actuellement hors ligne.
              </p>
              
              {receiverPhone && (
                <div style={styles.contactOptions}>
                  <div style={styles.contactOption}>
                    <FiMessageCircle style={styles.optionIcon} />
                    <div>
                      <div style={styles.optionTitle}>Envoyer un SMS</div>
                      <a 
                        href={`sms:${receiverPhone}`}
                        style={styles.optionLink}
                      >
                        {receiverPhone}
                      </a>
                    </div>
                  </div>
                  
                  <div style={styles.contactOption}>
                    <FiPhone style={styles.optionIcon} />
                    <div>
                      <div style={styles.optionTitle}>Appeler</div>
                      <a 
                        href={`tel:${receiverPhone}`}
                        style={styles.optionLink}
                      >
                        {receiverPhone}
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              <p style={styles.contactModalNote}>
                💡 Vous pouvez laisser un message ici, il le verra à son retour.
              </p>
            </div>
            
            <div style={styles.contactModalFooter}>
              <button 
                onClick={() => setShowContactModal(false)}
                style={styles.contactModalButton}
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem',
    borderBottom: `2px solid ${theme.colors.primaryLight}`,
    backgroundColor: theme.colors.secondary,
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: theme.colors.primary,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '12px',
    height: '12px',
    backgroundColor: '#10b981',
    border: '2px solid #fff',
    borderRadius: '50%',
  },
  headerTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: theme.colors.text.primary,
    margin: 0,
  },
  headerStatus: {
    fontSize: '0.8rem',
    marginTop: '0.25rem',
  },
  statusOnline: {
    color: '#10b981',
    fontWeight: '500',
  },
  statusOffline: {
    color: theme.colors.text.secondary,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: theme.colors.text.secondary,
    fontSize: '1.75rem',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '1rem',
    color: theme.colors.text.secondary,
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    fontSize: '1.5rem',
  },
  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '1rem',
    padding: '2rem',
  },
  errorIcon: {
    fontSize: '3rem',
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontWeight: '600',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '2rem',
  },
  emptyIcon: {
    fontSize: '4rem',
    color: theme.colors.primaryLight,
    marginBottom: '1rem',
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: '0.95rem',
  },
  messageWrapper: {
    display: 'flex',
    marginBottom: '0.5rem',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: '0.875rem 1rem',
    borderRadius: theme.borderRadius.lg,
    wordWrap: 'break-word',
  },
  myMessage: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    borderBottomRightRadius: '4px',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
  },
  theirMessage: {
    backgroundColor: '#fff',
    color: theme.colors.text.primary,
    border: `2px solid ${theme.colors.primaryLight}`,
    borderBottomLeftRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  senderName: {
    fontSize: '0.75rem',
    fontWeight: '600',
    marginBottom: '0.375rem',
    opacity: 0.8,
    color: theme.colors.primary,
  },
  messageContent: {
    fontSize: '0.95rem',
    lineHeight: '1.5',
  },
  mediaContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  imageMessage: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    objectFit: 'cover',
  },
  videoContainer: {
    position: 'relative',
  },
  videoMessage: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#000',
  },
  videoFallback: {
    display: 'none',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '1rem',
    backgroundColor: '#f3f4f6',
    borderRadius: theme.borderRadius.md,
    color: theme.colors.text.secondary,
  },
  videoFallbackIcon: {
    fontSize: '2rem',
  },
  downloadLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: theme.colors.primary,
    textDecoration: 'none',
    fontSize: '0.875rem',
    padding: '0.5rem',
    backgroundColor: '#fef2f2',
    borderRadius: theme.borderRadius.md,
  },
  audioContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  audioIcon: {
    fontSize: '1.25rem',
  },
  audioPlayer: {
    flex: 1,
    maxWidth: '200px',
  },
  // Styles pour la carte de localisation
  mapContainer: {
    width: '100%',
    maxWidth: '300px',
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  mapHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e5e7eb',
  },
  mapIcon: {
    color: theme.colors.primary,
  },
  mapTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  mapFrame: {
    width: '100%',
    height: '200px',
  },
  mapIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  mapLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#f0f9ff',
    color: theme.colors.primary,
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    borderTop: '1px solid #e0f2fe',
  },
  mapLinkIcon: {
    fontSize: '0.875rem',
  },
  messageFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '0.375rem',
    gap: '0.5rem',
  },
  messageTime: {
    fontSize: '0.7rem',
    opacity: 0.7,
  },
  readStatus: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
  },
  readIcon: {
    color: '#10b981',
    fontSize: '0.875rem',
  },
  sentIcon: {
    color: 'currentColor',
    opacity: 0.6,
    fontSize: '0.875rem',
  },
  filePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f1f5f9',
    borderTop: '1px solid #e2e8f0',
  },
  previewImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: theme.borderRadius.md,
  },
  videoPreview: {
    width: '100px',
    height: '60px',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: theme.borderRadius.md,
  },
  audioPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.md,
    flex: 1,
  },
  audioPreviewIcon: {
    fontSize: '1.25rem',
    color: theme.colors.primary,
  },
  cancelPreviewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    backgroundColor: theme.colors.error,
    color: '#fff',
    border: 'none',
    padding: '0.5rem 0.75rem',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    color: theme.colors.error,
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    textAlign: 'center',
    borderTop: `1px solid ${theme.colors.error}40`,
  },
  recordingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    backgroundColor: '#fff',
    borderTop: '1px solid #e2e8f0',
  },
  cancelRecordButton: {
    backgroundColor: theme.colors.error,
    color: '#fff',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.25rem',
  },
  recordingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: theme.colors.error,
    animation: 'pulse 1.5s infinite',
  },
  recordingIcon: {
    fontSize: '1.5rem',
  },
  recordingTime: {
    fontWeight: '600',
    fontSize: '1rem',
  },
  stopRecordButton: {
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.5rem',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#fff',
    borderTop: '1px solid #e2e8f0',
  },
  mediaButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: theme.colors.primary,
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  locationButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#10b981',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  input: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.lg,
    fontSize: '0.95rem',
    outline: 'none',
  },
  micButton: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.25rem',
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.25rem',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  infoFooter: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '0.75rem',
    textAlign: 'center',
    fontSize: '0.85rem',
    borderTop: '1px solid #fbbf24',
  },
  mediaPreviewOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  mediaPreviewContainer: {
    position: 'relative',
    maxWidth: '90vw',
    maxHeight: '90vh',
  },
  closePreviewButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.5rem',
    zIndex: 1,
  },
  fullImage: {
    maxWidth: '100%',
    maxHeight: '90vh',
    objectFit: 'contain',
    borderRadius: theme.borderRadius.md,
  },
  fullVideo: {
    maxWidth: '100%',
    maxHeight: '90vh',
    borderRadius: theme.borderRadius.md,
  },
  // Styles pour le modal de contact
  contactModalOverlay: {
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
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  contactModalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.5rem',
    backgroundColor: theme.colors.secondary,
    position: 'relative',
  },
  contactModalIcon: {
    fontSize: '1.5rem',
    color: theme.colors.primary,
  },
  contactModalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: theme.colors.text.primary,
    margin: 0,
    flex: 1,
  },
  contactModalClose: {
    backgroundColor: 'transparent',
    border: 'none',
    color: theme.colors.text.secondary,
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.25rem',
  },
  contactModalBody: {
    padding: '1.5rem',
  },
  contactModalText: {
    color: theme.colors.text.primary,
    fontSize: '1rem',
    lineHeight: '1.6',
    marginBottom: '1.5rem',
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
    backgroundColor: '#f8fafc',
    borderRadius: theme.borderRadius.md,
    border: '1px solid #e2e8f0',
  },
  optionIcon: {
    fontSize: '1.25rem',
    color: theme.colors.primary,
  },
  optionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: '0.25rem',
  },
  optionLink: {
    fontSize: '1rem',
    fontWeight: '500',
    color: theme.colors.primary,
    textDecoration: 'none',
  },
  contactModalNote: {
    fontSize: '0.875rem',
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#fef3c7',
    borderRadius: theme.borderRadius.md,
  },
  contactModalFooter: {
    padding: '1rem 1.5rem',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    textAlign: 'right',
  },
  contactModalButton: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
};