import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Icônes (conservées identiques)
const IcClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="24" height="24">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

const IcZoomIn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="20" height="20">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="11" y1="8" x2="11" y2="14"/>
    <line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const IcZoomOut = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="20" height="20">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const IcDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="20" height="20">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IcPlay = () => (
  <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const IcPause = () => (
  <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>
);

const IcDelete = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="20" height="20">
    <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
  </svg>
);

// Modal pour visualiser les images
function ImageModal({ src, alt, onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = alt || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  return createPortal(
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.container} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.toolbar}>
          <button onClick={handleZoomOut} style={modalStyles.toolbarBtn} disabled={scale <= 0.5}>
            <IcZoomOut />
          </button>
          <span style={modalStyles.zoomText}>{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} style={modalStyles.toolbarBtn} disabled={scale >= 3}>
            <IcZoomIn />
          </button>
          <button onClick={handleDownload} style={modalStyles.toolbarBtn}>
            <IcDownload />
          </button>
          <button onClick={handleReset} style={modalStyles.toolbarBtn}>
            ↺
          </button>
          <button onClick={onClose} style={modalStyles.toolbarBtn}>
            <IcClose />
          </button>
        </div>
        <div 
          style={modalStyles.imageWrapper}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            style={{
              ...modalStyles.image,
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? 'grab' : 'default',
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

function AudioMessage({ src, duration, onDelete, isOwn }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const blobUrlRef = useRef(null);

  // Gérer les URLs blob
  useEffect(() => {
    // Si c'est une URL blob, on la garde en mémoire
    if (src?.startsWith('blob:')) {
      setAudioUrl(src);
      blobUrlRef.current = src;
    } else {
      setAudioUrl(src);
    }

    return () => {
      // Ne pas révoquer l'URL blob ici car elle pourrait être utilisée ailleurs
      // Le nettoyage sera fait dans le composant parent
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    
    const handleLoadedMetadata = () => {
      setTotalDuration(audio.duration);
      setIsLoaded(true);
      setError(false);
      console.log('Audio chargé, durée:', audio.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const handleError = (e) => {
      console.error('Erreur lecture audio:', e, 'src:', audioUrl);
      setError(true);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setIsLoaded(true);
      setError(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Recharger l'audio si nécessaire
    if (audioUrl && audio.readyState === 0) {
      audio.load();
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // S'assurer que l'audio est chargé
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setError(false);
          })
          .catch(e => {
            console.error('Erreur lecture audio:', e);
            setError(true);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * totalDuration;
    setCurrentTime(pos * totalDuration);
  };

  const handleLongPressStart = (e) => {
    e.preventDefault();
    if (!isOwn) return;
    
    const timer = setTimeout(() => {
      setShowDeleteConfirm(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    // Révoquer l'URL blob avant de supprimer
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    onDelete?.();
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Si erreur, afficher un message
  if (error) {
    return (
      <div style={audioStyles.errorContainer}>
        <span>❌ Audio non disponible</span>
        {isOwn && (
          <button onClick={handleDelete} style={audioStyles.errorDelete}>
            Supprimer
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      style={audioStyles.container}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
    >
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="auto"
      />
      
      <button 
        onClick={togglePlay} 
        style={audioStyles.playButton}
        disabled={!isLoaded}
      >
        {isPlaying ? <IcPause /> : <IcPlay />}
      </button>
      
      <div style={audioStyles.info}>
        <div style={audioStyles.waveform}>
          <div 
            ref={progressRef}
            style={audioStyles.progressBar}
            onClick={handleProgressClick}
          >
            <div 
              style={{
                ...audioStyles.progressFill,
                width: totalDuration ? `${(currentTime / totalDuration) * 100}%` : '0%'
              }}
            />
          </div>
          <div style={audioStyles.time}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div style={audioStyles.deleteConfirm}>
          <p>Supprimer ce message vocal ?</p>
          <div style={audioStyles.deleteActions}>
            <button onClick={() => setShowDeleteConfirm(false)}>Annuler</button>
            <button onClick={handleDelete} style={{ color: '#ef4444' }}>Supprimer</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Message vidéo
function VideoMessage({ src, poster, onDelete, isOwn }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const videoRef = useRef(null);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(e => console.error('Erreur lecture vidéo:', e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleFullScreen = () => {
    const video = videoRef.current;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  const handleLongPressStart = (e) => {
    e.preventDefault();
    if (!isOwn) return;
    
    const timer = setTimeout(() => {
      setShowDeleteConfirm(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  return (
    <div 
      style={videoStyles.container}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onTouchCancel={handleLongPressEnd}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        style={videoStyles.video}
        onClick={togglePlay}
        controls={false}
      />
      
      <div style={{ ...videoStyles.controls, opacity: showControls ? 1 : 0 }}>
        <button onClick={togglePlay} style={videoStyles.controlBtn}>
          {isPlaying ? <IcPause /> : <IcPlay />}
        </button>
        <button onClick={handleFullScreen} style={videoStyles.controlBtn}>
          ⛶
        </button>
      </div>

      {showDeleteConfirm && (
        <div style={videoStyles.deleteConfirm}>
          <p>Supprimer cette vidéo ?</p>
          <div style={videoStyles.deleteActions}>
            <button onClick={() => setShowDeleteConfirm(false)}>Annuler</button>
            <button onClick={handleDelete} style={{ color: '#ef4444' }}>Supprimer</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  toolbarBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'background 0.2s',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.1)'
    }
  },
  zoomText: {
    color: 'white',
    fontSize: '14px',
    padding: '0 8px',
  },
  imageWrapper: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    transition: 'transform 0.1s',
    userSelect: 'none',
  },
};

const audioStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f0f0f0',
    borderRadius: '18px',
    minWidth: '260px',
    position: 'relative',
  },
  playButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#DC2626',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    }
  },
  info: {
    flex: 1,
  },
  waveform: {
    width: '100%',
  },
  progressBar: {
    height: '4px',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: '2px',
    cursor: 'pointer',
    marginBottom: '6px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: '2px',
    transition: 'width 0.1s linear',
  },
  time: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem',
    color: '#666',
  },
  deleteConfirm: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    zIndex: 10,
  },
  deleteActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    justifyContent: 'flex-end',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#fee2e2',
    borderRadius: '18px',
    minWidth: '260px',
    color: '#ef4444',
    fontSize: '0.9rem',
  },
  errorDelete: {
    background: 'none',
    border: '1px solid #ef4444',
    borderRadius: '6px',
    padding: '4px 8px',
    color: '#ef4444',
    cursor: 'pointer',
  },
};

const videoStyles = {
  container: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    maxWidth: '280px',
  },
  video: {
    width: '100%',
    height: 'auto',
    display: 'block',
    backgroundColor: '#000',
  },
  controls: {
    position: 'absolute',
    bottom: '12px',
    left: '0',
    right: '0',
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    transition: 'opacity 0.2s',
  },
  controlBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirm: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    zIndex: 10,
  },
  deleteActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    justifyContent: 'flex-end',
  },
};

export { ImageModal, AudioMessage, VideoMessage };