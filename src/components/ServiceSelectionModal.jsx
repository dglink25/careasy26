import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiZap, FiClock, FiTag, FiChevronRight, FiCalendar } from 'react-icons/fi';
import { MdBusiness } from 'react-icons/md';

const PRIMARY   = '#c0392b';
const PRIMARY_L = '#e74c3c';
const GOLD      = '#d4a853';

export default function ServiceSelectionModal({ isOpen, onClose, entreprise }) {
  const navigate  = useNavigate();
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const overlayRef = useRef(null);

  /* ── Animation d'ouverture / fermeture ── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setVisible(true), 20);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  /* ── Fermeture au clic sur l'overlay ── */
  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  /* ── Sélection d'un service → redirect ── */
  function handleSelect(svc) {
    setSelected(svc.id);
    setTimeout(() => {
      onClose();
      navigate(`/rendez-vous/demande/${svc.id}`);
    }, 380);
  }

  if (!isOpen && !visible) return null;

  const services = entreprise?.services || [];

  return (
    <>
      <style>{CSS}</style>

      {/* ── Overlay ── */}
      <div
        ref={overlayRef}
        className="ssm-overlay"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleOverlayClick}
      >
        {/* ── Panneau ── */}
        <div
          className="ssm-panel"
          style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
        >
          {/* Grip bar */}
          <div className="ssm-grip" />

          {/* ── En-tête entreprise ── */}
          <div className="ssm-header">
            <div className="ssm-header-bg" />

            <div className="ssm-header-content">
              {/* Logo */}
              <div className="ssm-logo">
                {entreprise?.logo
                  ? <img src={entreprise.logo} alt={entreprise.name} className="ssm-logo-img" />
                  : <MdBusiness size={26} color={PRIMARY} />}
              </div>

              {/* Texte */}
              <div className="ssm-header-text">
                <p className="ssm-label">Choisir un service</p>
                <h2 className="ssm-ent-name">{entreprise?.name}</h2>
                <p className="ssm-ent-count">
                  {services.length} service{services.length > 1 ? 's' : ''} disponible{services.length > 1 ? 's' : ''}
                </p>
              </div>

              {/* Fermer */}
              <button className="ssm-close" onClick={onClose} aria-label="Fermer">
                <FiX size={18} />
              </button>
            </div>

            {/* Ligne dorée décorative */}
            <div className="ssm-gold-line" />
          </div>

          {/* ── Sous-titre ── */}
          <div className="ssm-subtitle">
            <FiCalendar size={13} style={{ flexShrink: 0, color: PRIMARY }} />
            <span>Sélectionnez le service pour lequel vous souhaitez prendre rendez-vous</span>
          </div>

          {/* ── Liste des services ── */}
          <div className="ssm-list">
            {services.length === 0 ? (
              <div className="ssm-empty">
                <FiZap size={32} color="#cbd5e1" />
                <p>Aucun service disponible</p>
              </div>
            ) : (
              services.map((svc, idx) => {
                const isHovered  = hovered === svc.id;
                const isSelected = selected === svc.id;
                const hasPromo   = svc.has_promo && svc.price_promo;
                const price      = hasPromo ? svc.price_promo : svc.price;

                return (
                  <button
                    key={svc.id}
                    className={`ssm-card ${isHovered ? 'ssm-card--hover' : ''} ${isSelected ? 'ssm-card--selected' : ''}`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    onMouseEnter={() => setHovered(svc.id)}
                    onMouseLeave={() => setHovered(null)}
                    onTouchStart={() => setHovered(svc.id)}
                    onTouchEnd={() => setHovered(null)}
                    onClick={() => handleSelect(svc)}
                  >
                    {/* Icône service */}
                    <div className={`ssm-svc-icon ${isHovered || isSelected ? 'ssm-svc-icon--active' : ''}`}>
                      <FiZap size={18} />
                    </div>

                    {/* Infos */}
                    <div className="ssm-svc-body">
                      <p className="ssm-svc-name">{svc.name}</p>

                      <div className="ssm-svc-meta">
                        {price != null && (
                          <span className="ssm-svc-price">
                            {hasPromo && (
                              <span className="ssm-svc-price-old">
                                {Number(svc.price).toLocaleString('fr-FR')} FCFA
                              </span>
                            )}
                            <span className={`ssm-svc-price-val ${hasPromo ? 'ssm-svc-price-promo' : ''}`}>
                              {Number(price).toLocaleString('fr-FR')} FCFA
                            </span>
                            {hasPromo && (
                              <span className="ssm-promo-badge">Promo</span>
                            )}
                          </span>
                        )}
                        {svc.is_price_on_request && (
                          <span className="ssm-svc-devis">Sur devis</span>
                        )}
                        {(svc.start_time && svc.end_time) && (
                          <span className="ssm-svc-time">
                            <FiClock size={10} />
                            {svc.start_time} – {svc.end_time}
                          </span>
                        )}
                      </div>

                      {svc.descriptions && (
                        <p className="ssm-svc-desc">{svc.descriptions}</p>
                      )}
                    </div>

                    {/* Flèche */}
                    <div className={`ssm-arrow ${isHovered || isSelected ? 'ssm-arrow--active' : ''}`}>
                      {isSelected
                        ? <div className="ssm-spinner" />
                        : <FiChevronRight size={18} />}
                    </div>

                    {/* Trait animé du bas */}
                    <div className="ssm-card-underline" />
                  </button>
                );
              })
            )}
          </div>

          {/* ── Bas de panneau ── */}
          <div className="ssm-footer">
            <p className="ssm-footer-note">
              Vous serez redirigé vers le formulaire de rendez-vous
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

  @keyframes ssm-fade-in      { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ssm-card-in      { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes ssm-spin         { to { transform: rotate(360deg); } }
  @keyframes ssm-pulse-ring   {
    0%   { transform: scale(.9); box-shadow: 0 0 0 0 rgba(192,57,43,.4); }
    70%  { transform: scale(1);  box-shadow: 0 0 0 8px rgba(192,57,43,0); }
    100% { transform: scale(.9); }
  }

  .ssm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(8, 8, 15, 0.72);
    backdrop-filter: blur(6px);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    transition: opacity .28s ease;
  }

  .ssm-panel {
    width: 100%;
    max-width: 560px;
    background: #fafaf8;
    border-radius: 28px 28px 0 0;
    box-shadow: 0 -24px 80px rgba(0,0,0,.32), 0 -4px 20px rgba(0,0,0,.12);
    max-height: 88vh;
    overflow-y: auto;
    overflow-x: hidden;
    transition: transform .38s cubic-bezier(.22,1,.36,1);
    font-family: 'DM Sans', system-ui, sans-serif;
    scrollbar-width: thin;
    scrollbar-color: #e2d6c8 transparent;
  }

  .ssm-grip {
    width: 44px;
    height: 5px;
    background: #d1c9be;
    border-radius: 3px;
    margin: 14px auto 0;
  }

  /* ── Header ── */
  .ssm-header {
    position: relative;
    overflow: hidden;
    padding: 0 20px 0;
    margin-top: 4px;
  }

  .ssm-header-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #1a0a08 0%, #2d0f0a 50%, #1a0a08 100%);
    opacity: .97;
  }

  .ssm-header-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 22px 0 18px;
  }

  .ssm-logo {
    width: 58px;
    height: 58px;
    border-radius: 16px;
    background: rgba(255,255,255,.1);
    border: 1.5px solid rgba(255,255,255,.18);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(0,0,0,.35);
  }

  .ssm-logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ssm-header-text {
    flex: 1;
    min-width: 0;
  }

  .ssm-label {
    margin: 0 0 3px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: ${GOLD};
  }

  .ssm-ent-name {
    margin: 0 0 4px;
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 19px;
    font-weight: 700;
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
    letter-spacing: -.01em;
  }

  .ssm-ent-count {
    margin: 0;
    font-size: 11px;
    color: rgba(255,255,255,.5);
  }

  .ssm-close {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    color: rgba(255,255,255,.75);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background .2s;
  }

  .ssm-close:hover {
    background: rgba(255,255,255,.22);
    color: #fff;
  }

  .ssm-gold-line {
    position: relative;
    z-index: 2;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${GOLD}, transparent);
    opacity: .7;
  }

  /* ── Sous-titre ── */
  .ssm-subtitle {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 14px 20px 10px;
    font-size: 12px;
    color: #6b5e50;
    font-weight: 500;
    border-bottom: 1px solid #ede8e1;
    background: #fafaf8;
  }

  /* ── Liste ── */
  .ssm-list {
    padding: 12px 16px 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #fafaf8;
  }

  .ssm-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 40px 20px;
    color: #94a3b8;
    font-size: 13px;
  }

  /* ── Carte service ── */
  .ssm-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: #fff;
    border: 1.5px solid #ede8e1;
    border-radius: 18px;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: border-color .22s, box-shadow .22s, transform .18s;
    overflow: hidden;
    animation: ssm-card-in .35s ease-out both;
  }

  .ssm-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, ${PRIMARY}, ${PRIMARY_L});
    border-radius: 0 2px 2px 0;
    opacity: 0;
    transition: opacity .22s;
  }

  .ssm-card--hover,
  .ssm-card:hover {
    border-color: ${PRIMARY}55;
    box-shadow: 0 4px 20px rgba(192,57,43,.12);
    transform: translateY(-1px);
  }

  .ssm-card--hover::before,
  .ssm-card:hover::before {
    opacity: 1;
  }

  .ssm-card--selected {
    border-color: ${PRIMARY};
    box-shadow: 0 4px 24px rgba(192,57,43,.22);
    background: #fff9f8;
  }

  .ssm-card--selected::before {
    opacity: 1;
  }

  .ssm-card-underline {
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: transparent;
  }

  /* ── Icône ── */
  .ssm-svc-icon {
    width: 44px;
    height: 44px;
    border-radius: 13px;
    background: rgba(192,57,43,.08);
    border: 1.5px solid rgba(192,57,43,.15);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: ${PRIMARY};
    transition: background .22s, border-color .22s, transform .22s;
  }

  .ssm-svc-icon--active {
    background: ${PRIMARY};
    border-color: ${PRIMARY};
    color: #fff;
    transform: scale(1.06);
  }

  /* ── Corps service ── */
  .ssm-svc-body {
    flex: 1;
    min-width: 0;
  }

  .ssm-svc-name {
    margin: 0 0 5px;
    font-size: 14px;
    font-weight: 700;
    color: #1a110a;
    line-height: 1.3;
  }

  .ssm-svc-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .ssm-svc-price {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  .ssm-svc-price-old {
    font-size: 11px;
    color: #94a3b8;
    text-decoration: line-through;
  }

  .ssm-svc-price-val {
    font-size: 13px;
    font-weight: 700;
    color: #1a110a;
  }

  .ssm-svc-price-promo {
    color: ${PRIMARY};
  }

  .ssm-promo-badge {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .05em;
    text-transform: uppercase;
    background: ${PRIMARY};
    color: #fff;
    padding: 2px 6px;
    border-radius: 10px;
  }

  .ssm-svc-devis {
    font-size: 12px;
    font-weight: 600;
    color: #6b5e50;
    background: #f5efe8;
    padding: 3px 9px;
    border-radius: 10px;
  }

  .ssm-svc-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
  }

  .ssm-svc-desc {
    margin: 0;
    font-size: 11.5px;
    color: #7a6e65;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ── Flèche ── */
  .ssm-arrow {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #c4b8ad;
    transition: color .22s, background .22s, transform .22s;
  }

  .ssm-arrow--active {
    background: ${PRIMARY};
    color: #fff;
    transform: scale(1.1);
  }

  .ssm-spinner {
    width: 16px;
    height: 16px;
    border: 2.5px solid rgba(255,255,255,.3);
    border-top: 2.5px solid #fff;
    border-radius: 50%;
    animation: ssm-spin .8s linear infinite;
  }

  /* ── Footer ── */
  .ssm-footer {
    padding: 10px 20px 28px;
    text-align: center;
    background: #fafaf8;
    border-top: 1px solid #ede8e1;
    margin-top: 4px;
  }

  .ssm-footer-note {
    margin: 0;
    font-size: 11px;
    color: #a89e95;
    font-weight: 500;
  }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .ssm-panel { max-height: 92vh; border-radius: 22px 22px 0 0; }
    .ssm-ent-name { font-size: 16px; }
    .ssm-card { padding: 12px 12px; }
    .ssm-svc-name { font-size: 13px; }
    .ssm-svc-icon { width: 40px; height: 40px; border-radius: 11px; }
  }
`;