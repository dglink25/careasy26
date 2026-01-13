// src/components/Chat/ChatModal.jsx - VERSION COMPLÈTE
import { useState, useEffect, useRef } from 'react';
import { 
  FiX, FiSend, FiMapPin, FiLoader, FiCheck, FiCheckCircle, 
  FiImage, FiVideo, FiMic, FiStopCircle, FiPlay, FiPause,
  FiDownload, FiMaximize2
} from 'react-icons/fi';
import { messageApi } from '../../api/messageApi';
import { useAuth } from '../../contexts/AuthContext';
import theme from '../../config/theme';

export default function ChatModal({ 
  receiverId, 
  receiverName, 
  receiverPhone = null, // 👈 NOUVEAU
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
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const onlineCheckIntervalRef = useRef(null);
  const [showContactModal, setShowContactModal] = useState(false);

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
        // 👉 NOUVEAU : Si anonyme ET prestataire offline → Afficher modal contact
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
      
      if (selectedFile || audioBlob) {
        // Envoyer avec fichier
        const fileToSend = audioBlob || selectedFile;
        const fileType = audioBlob ? 'vocal' : (selectedFile.type.startsWith('image/') ? 'image' : 'video');
        
        sentMessage = await messageApi.sendMessage(
          conversation.id,
          newMessage.trim() || null,
          null,
          fileToSend,
          fileType
        );
      } else {
        // Message texte simple
        sentMessage = await messageApi.sendMessage(
          conversation.id,
          newMessage.trim()
        );
      }

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

    // Message avec fichier
    if (message.file_url) {
      const fileData = message.file_url;
      
      // Image
      if (message.type === 'image' || fileData.startsWith('data:image/')) {
        return (
          <div style={styles.mediaContainer}>
            {message.content && <div style={styles.messageContent}>{message.content}</div>}
            <img 
              src={fileData} 
              alt="Image" 
              style={styles.imageMessage}
              onClick={() => setMediaPreview({ type: 'image', src: fileData })}
            />
          </div>
        );
      }
      
      // Vidéo
      if (message.type === 'video' || fileData.startsWith('data:video/')) {
        return (
          <div style={styles.mediaContainer}>
            {message.content && <div style={styles.messageContent}>{message.content}</div>}
            <video 
              src={fileData} 
              controls 
              style={styles.videoMessage}
            />
          </div>
        );
      }
      
      // Audio
      if (message.type === 'vocal' || fileData.startsWith('data:audio/')) {
        return (
          <div style={styles.audioContainer}>
            <FiMic style={styles.audioIcon} />
            <audio src={fileData} controls style={styles.audioPlayer} />
          </div>
        );
      }
    }

    return <div style={styles.messageContent}>{message.content || '(Fichier)'}</div>;
  };

  return (
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
              <div style={styles.emptyIcon}>💬</div>
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
                      
                      {message.latitude && message.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${message.latitude},${message.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.locationLink}
                        >
                          <FiMapPin /> Voir sur la carte
                        </a>
                      )}
                      
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
              <video src={filePreview} controls style={styles.previewVideo} />
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
              <img src={mediaPreview.src} alt="Preview" style={styles.fullImage} />
            )}

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
      `}</style>
    </div>
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
    maxWidth: '75%',
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
  videoMessage: {
    maxWidth: '100%',
    maxHeight: '300px',
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
  locationLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.85rem',
    marginTop: '0.5rem',
    color: 'inherit',
    textDecoration: 'underline',
    opacity: 0.9,
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
  previewVideo: {
    width: '100px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: theme.borderRadius.md,
  },  audioPreview: {
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
    transition: 'all 0.2s',
  },
  mediaButtonHover: {
    opacity: 1,
    transform: 'scale(1.1)',
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
    transition: 'all 0.2s',
  },
  input: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.lg,
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputFocus: {
    borderColor: theme.colors.primary,
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
    transition: 'all 0.2s',
  },
  micButtonActive: {
    transform: 'scale(0.95)',
    backgroundColor: theme.colors.error,
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
    transition: 'all 0.2s',
  },
  sendButtonHover: {
    backgroundColor: '#dc2626',
    transform: 'scale(1.05)',
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
};