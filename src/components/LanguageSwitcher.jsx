// src/components/LanguageSwitcher.jsx
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const FLAG_FR = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="14" rx="2" fill="white"/>
    <rect width="6.67" height="14" fill="#002395"/>
    <rect x="13.33" width="6.67" height="14" fill="#ED2939"/>
  </svg>
);

const FLAG_EN = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="14" rx="2" fill="#012169"/>
    <path d="M0 0L20 14M20 0L0 14" stroke="white" strokeWidth="2.5"/>
    <path d="M0 0L20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.5"/>
    <path d="M10 0V14M0 7H20" stroke="white" strokeWidth="3.5"/>
    <path d="M10 0V14M0 7H20" stroke="#C8102E" strokeWidth="2"/>
  </svg>
);

const LANGS = [
  { code: 'fr', label: 'Français', Flag: FLAG_FR },
  { code: 'en', label: 'English',  Flag: FLAG_EN },
];

export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('careasy-lang', code);
    setOpen(false);
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bouton principal */}
      <button
        onClick={() => setOpen(p => !p)}
        title="Change language"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: compact ? '6px 8px' : '7px 12px',
          backgroundColor: open ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
          border: '2px solid var(--border-color)',
          borderRadius: '0.65rem',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontWeight: 600,
          fontSize: '0.875rem',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
      >
        <current.Flag />
        {!compact && (
          <span style={{ fontSize: '0.82rem' }}>{current.label}</span>
        )}
        {/* Chevron */}
        <svg
          width="10" height="10"
          viewBox="0 0 10 10"
          style={{
            transition: 'transform 0.25s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-muted)',
          }}
          fill="none" stroke="currentColor" strokeWidth="1.8"
        >
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          backgroundColor: 'var(--bg-card)',
          border: '2px solid var(--border-color)',
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          minWidth: 140,
          zIndex: 10000,
          animation: 'slideDown 0.2s ease',
        }}>
          {LANGS.map(({ code, label, Flag }) => {
            const isActive = code === i18n.language;
            return (
              <button
                key={code}
                onClick={() => changeLanguage(code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: isActive ? 'var(--brand-light)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: isActive ? 'var(--brand-primary)' : 'var(--text-primary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Flag />
                {label}
                {isActive && (
                  <span style={{ marginLeft: 'auto', color: 'var(--brand-primary)' }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}