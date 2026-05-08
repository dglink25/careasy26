import { useState } from 'react';
import {
  FiX, FiCopy, FiCheck, FiTwitter, FiFacebook, FiMail,
  FiMapPin, FiDollarSign, FiStar, FiShare2,
} from 'react-icons/fi';
import {
  MdBusiness, MdMiscellaneousServices,
} from 'react-icons/md';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';

/**
 * ShareModal
 * Props :
 *  - isOpen       : boolean
 *  - onClose      : () => void
 *  - title        : string  — nom du service ou de l'entreprise
 *  - url          : string  — lien à partager
 *  - description  : string  — description courte (optionnel)
 *  - type         : 'service' | 'entreprise'  (défaut : 'service')
 *  - price        : string  — prix affiché (optionnel, pour les services)
 *  - location     : string  — ville / adresse (optionnel)
 *  - rating       : number  — note moyenne (optionnel)
 */
export default function ShareModal({
  isOpen,
  onClose,
  title,
  url,
  description = '',
  type = 'service',
  price = '',
  location = '',
  rating = null,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl   = url   || window.location.href;
  const shareTitle = title || document.title;

  /* ── Message texte (pour WhatsApp, Telegram, Email, natif) ── */
  const buildMessage = () => {
    const descStr = description
      ? description.length > 120 ? description.slice(0, 117) + '...' : description
      : '';

    if (type === 'entreprise') {
      return [
        shareTitle,
        descStr       ? descStr                     : '',
        location      ? `Adresse : ${location}`     : '',
        rating        ? `Note : ${Number(rating).toFixed(1)} / 5` : '',
        '',
        'Découvrez cette entreprise sur notre plateforme :',
        shareUrl,
      ].filter(Boolean).join('\n');
    }

    return [
      shareTitle,
      descStr       ? descStr                        : '',
      price         ? `Prix : ${price}`              : '',
      location      ? `Localisation : ${location}`   : '',
      rating        ? `Note : ${Number(rating).toFixed(1)} / 5` : '',
      '',
      'Réservez ou contactez le prestataire ici :',
      shareUrl,
    ].filter(Boolean).join('\n');
  };

  const richMessage = buildMessage();

  /* ── Liens de partage ── */
  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp size={22} />,
      color: '#25D366',
      bg: '#e8fdf0',
      href: `https://wa.me/?text=${encodeURIComponent(richMessage)}`,
    },
    {
      name: 'Telegram',
      icon: <FaTelegram size={22} />,
      color: '#0088cc',
      bg: '#e8f4fd',
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(richMessage)}`,
    },
    {
      name: 'Facebook',
      icon: <FiFacebook size={22} />,
      color: '#1877F2',
      bg: '#e8f0fe',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Email',
      icon: <FiMail size={22} />,
      color: '#ea4335',
      bg: '#fce8e6',
      href: `mailto:?subject=${encodeURIComponent(
        type === 'entreprise'
          ? `Découvrez ${shareTitle} sur notre plateforme`
          : `Je vous recommande ce service : ${shareTitle}`
      )}&body=${encodeURIComponent(richMessage)}`,
    },
    {
      name: 'Twitter / X',
      icon: <FiTwitter size={22} />,
      color: '#000000',
      bg: '#f0f0f0',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        type === 'entreprise'
          ? `${shareTitle} — Découvrez cette entreprise ! ${shareUrl}`
          : `${shareTitle}${price ? ` — ${price}` : ''} ${shareUrl}`
      )}`,
    },
  ];

  const handleShareClick = (link) => {
    if (link.name === 'Email') {
      window.location.href = link.href;
    } else {
      window.open(link.href, '_blank', 'width=600,height=400,noopener,noreferrer');
    }
    onClose();
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: shareTitle, text: richMessage, url: shareUrl });
      onClose();
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Erreur partage natif :', err);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  const isEntreprise = type === 'entreprise';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIconWrap}>
              {isEntreprise
                ? <MdBusiness size={20} color="#dc2626" />
                : <MdMiscellaneousServices size={20} color="#dc2626" />
              }
            </div>
            <h3 style={styles.headerTitle}>
              {isEntreprise ? "Partager l'entreprise" : 'Partager le service'}
            </h3>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <FiX size={18} />
          </button>
        </div>

        {/* ── Aperçu de la fiche ── */}
        <div style={styles.preview}>
          <div style={styles.previewIcon}>
            {isEntreprise
              ? <MdBusiness size={26} color="#dc2626" />
              : <MdMiscellaneousServices size={26} color="#dc2626" />
            }
          </div>

          <div style={styles.previewBody}>
            <p style={styles.previewTitle}>{shareTitle}</p>

            {description ? (
              <p style={styles.previewDesc}>
                {description.length > 100 ? description.slice(0, 97) + '...' : description}
              </p>
            ) : null}

            {/* Badges métadonnées avec vraies icônes */}
            <div style={styles.metaRow}>
              {rating !== null && (
                <span style={styles.metaBadge}>
                  <FiStar size={11} />
                  {Number(rating).toFixed(1)}
                </span>
              )}
              {price && (
                <span style={styles.metaBadge}>
                  <FiDollarSign size={11} />
                  {price}
                </span>
              )}
              {location && (
                <span style={styles.metaBadge}>
                  <FiMapPin size={11} />
                  {location}
                </span>
              )}
            </div>

            <p style={styles.previewUrl}>{shareUrl}</p>
          </div>
        </div>

        {/* ── Bouton partage natif (mobile) ── */}
        {navigator.share && (
          <button onClick={handleNativeShare} style={styles.nativeBtn}>
            <FiShare2 size={16} />
            <span>Partager via les applications du téléphone</span>
          </button>
        )}

        {/* ── Grille des applications ── */}
        <p style={styles.sectionLabel}>Choisir une application</p>
        <div style={styles.appsGrid}>
          {shareLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleShareClick(link)}
              style={styles.appBtn}
              className="share-app-btn"
            >
              <div style={{ ...styles.appIcon, color: link.color, backgroundColor: link.bg }}>
                {link.icon}
              </div>
              <span style={styles.appName}>{link.name}</span>
            </button>
          ))}
        </div>

        {/* ── Copier le lien ── */}
        <div style={styles.copyRow}>
          <div style={styles.copyUrlBox}>
            <FiShare2 size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
            <span style={styles.copyUrlText}>{shareUrl}</span>
          </div>
          <button
            onClick={handleCopy}
            style={{ ...styles.copyBtn, backgroundColor: copied ? '#10b981' : '#dc2626' }}
          >
            {copied
              ? <><FiCheck size={14} /> Copié !</>
              : <><FiCopy size={14} /> Copier</>
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .share-app-btn { transition: transform 0.2s ease; }
        .share-app-btn:hover { transform: translateY(-3px); }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    zIndex: 10000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '24px 24px 0 0',
    width: '100%', maxWidth: '520px',
    padding: '1.5rem 1.5rem 2rem',
    boxShadow: '0 -6px 40px rgba(0,0,0,0.18)',
    animation: 'slideUp 0.3s ease-out',
  },

  /* Header */
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '1.25rem',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  headerIconWrap: {
    width: '36px', height: '36px', borderRadius: '10px',
    backgroundColor: '#fef2f2',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: '1.05rem', fontWeight: '700', color: '#1e293b', margin: 0 },
  closeBtn: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: '#f1f5f9', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#64748b',
  },

  /* Aperçu */
  preview: {
    display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
    backgroundColor: '#f8fafc', borderRadius: '14px',
    padding: '0.875rem 1rem', marginBottom: '1.25rem',
    border: '1px solid #e2e8f0',
  },
  previewIcon: {
    width: '48px', height: '48px', borderRadius: '12px',
    backgroundColor: '#fef2f2',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  previewBody: { flex: 1, minWidth: 0 },
  previewTitle: {
    fontSize: '0.95rem', fontWeight: '700', color: '#1e293b',
    margin: '0 0 0.3rem', overflow: 'hidden',
    whiteSpace: 'nowrap', textOverflow: 'ellipsis',
  },
  previewDesc: {
    fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.45rem', lineHeight: 1.45,
  },
  metaRow: { display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.45rem' },
  metaBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '0.72rem', fontWeight: '600',
    backgroundColor: '#fef2f2', color: '#dc2626',
    padding: '3px 8px', borderRadius: '20px',
  },
  previewUrl: {
    fontSize: '0.7rem', color: '#94a3b8', margin: 0,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },

  /* Bouton natif */
  nativeBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.6rem', width: '100%', padding: '0.8rem',
    backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: '12px', color: '#15803d',
    fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
    marginBottom: '1.25rem',
  },

  /* Label section */
  sectionLabel: {
    fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    margin: '0 0 0.75rem',
  },

  /* Grille apps */
  appsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '0.5rem', marginBottom: '1.25rem',
  },
  appBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.4rem', background: 'none', border: 'none',
    cursor: 'pointer', padding: '0.4rem', borderRadius: '12px',
  },
  appIcon: {
    width: '50px', height: '50px', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  appName: {
    fontSize: '0.68rem', color: '#475569', fontWeight: '500',
    textAlign: 'center', lineHeight: 1.2,
  },

  /* Copier */
  copyRow: {
    display: 'flex', gap: '0.75rem', alignItems: 'center',
    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: '12px', padding: '0.5rem 0.5rem 0.5rem 0.875rem',
  },
  copyUrlBox: {
    flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
  copyUrlText: {
    fontSize: '0.78rem', color: '#64748b',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  copyBtn: {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    color: '#fff', border: 'none',
    padding: '0.6rem 1rem', borderRadius: '8px',
    fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
    flexShrink: 0, transition: 'background-color 0.25s',
  },
};