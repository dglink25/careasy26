import { useState } from 'react';
import { FiX, FiCopy, FiCheck, FiTwitter, FiFacebook, FiMail } from 'react-icons/fi';
import { FaWhatsapp, FaTelegram, FaFacebookMessenger } from 'react-icons/fa';

export default function ShareModal({ isOpen, onClose, title, url, description = '' }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = url || window.location.href;
  const shareTitle = title || document.title;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback pour les navigateurs sans clipboard API
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Liens de partage pour chaque plateforme
  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp size={24} />,
      color: '#25D366',
      bg: '#e8fdf0',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n${shareUrl}`)}`,
    },
    {
      name: 'Telegram',
      icon: <FaTelegram size={24} />,
      color: '#0088cc',
      bg: '#e8f4fd',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: 'Facebook',
      icon: <FiFacebook size={24} />,
      color: '#1877F2',
      bg: '#e8f0fe',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Email',
      icon: <FiMail size={24} />,
      color: '#ea4335',
      bg: '#fce8e6',
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${description}\n\n${shareUrl}`)}`,
    },
    {
      name: 'Twitter / X',
      icon: <FiTwitter size={24} />,
      color: '#000000',
      bg: '#f0f0f0',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  const handleShareClick = (link) => {
    // Email s'ouvre dans le client mail, les autres dans un popup
    if (link.name === 'Email') {
      window.location.href = link.url;
    } else {
      window.open(link.url, '_blank', 'width=600,height=400,noopener,noreferrer');
    }
    onClose();
  };

  // Utiliser l'API native si disponible (mobile)
  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: shareTitle,
        text: description,
        url: shareUrl,
      });
      onClose();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erreur partage natif:', err);
      }
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>Partager</h3>
          <button onClick={onClose} style={styles.closeBtn}>
            <FiX size={20} />
          </button>
        </div>

        {/* Titre du contenu à partager */}
        <div style={styles.contentPreview}>
          <p style={styles.contentTitle}>{shareTitle}</p>
          <p style={styles.contentUrl}>{shareUrl}</p>
        </div>

        {/* Bouton partage natif sur mobile */}
        {navigator.share && (
          <button onClick={handleNativeShare} style={styles.nativeShareBtn}>
            <span>📱</span>
            <span>Partager via les applications du téléphone</span>
          </button>
        )}

        {/* Applications de partage */}
        <div style={styles.appsGrid}>
          {shareLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleShareClick(link)}
              style={styles.appBtn}
              className="share-app-btn"
            >
              <div style={{
                ...styles.appIcon,
                color: link.color,
                backgroundColor: link.bg,
              }}>
                {link.icon}
              </div>
              <span style={styles.appName}>{link.name}</span>
            </button>
          ))}
        </div>

        {/* Copier le lien */}
        <div style={styles.copySection}>
          <div style={styles.copyInput}>
            <span style={styles.copyText}>{shareUrl}</span>
          </div>
          <button
            onClick={handleCopy}
            style={{
              ...styles.copyBtn,
              backgroundColor: copied ? '#10b981' : '#dc2626',
            }}
          >
            {copied ? (
              <>
                <FiCheck size={16} />
                Copié !
              </>
            ) : (
              <>
                <FiCopy size={16} />
                Copier
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .share-app-btn {
          transition: all 0.2s ease;
        }
        .share-app-btn:hover {
          transform: translateY(-3px);
        }
        .share-app-btn:hover > div {
          filter: brightness(0.95);
        }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-end',    // ← s'ouvre par le bas comme sur mobile
    justifyContent: 'center',
    zIndex: 10000,
    padding: '0',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '20px 20px 0 0',  // ← arrondi en haut uniquement
    width: '100%',
    maxWidth: '520px',
    padding: '1.5rem',
    boxShadow: '0 -4px 30px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.3s ease-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  closeBtn: {
    background: '#f1f5f9',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b',
  },
  contentPreview: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '0.875rem 1rem',
    marginBottom: '1.25rem',
    border: '1px solid #e2e8f0',
  },
  contentTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 0.25rem 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  contentUrl: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  nativeShareBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.875rem',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    color: '#15803d',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '1.25rem',
  },
  appsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  appBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '12px',
  },
  appIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: '0.7rem',
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: '1.2',
  },
  copySection: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '0.5rem 0.5rem 0.5rem 1rem',
  },
  copyInput: {
    flex: 1,
    overflow: 'hidden',
  },
  copyText: {
    fontSize: '0.8rem',
    color: '#64748b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    color: '#fff',
    border: 'none',
    padding: '0.625rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.3s',
  },
};