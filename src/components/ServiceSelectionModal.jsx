import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiX, FiZap, FiClock, FiChevronRight, FiCalendar,
  FiSearch, FiCheckCircle,
} from 'react-icons/fi';
import { MdBusiness } from 'react-icons/md';

const PRIMARY   = '#c0392b';
const PRIMARY_L = '#e74c3c';
const GOLD      = '#d4a853';

export default function ServiceSelectionModal({ isOpen, onClose, entreprise }) {
  const navigate   = useNavigate();
  const [visible,  setVisible]  = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState('');
  const [hovered,  setHovered]  = useState(null);
  const overlayRef = useRef(null);

  /* ── Montage / démontage avec animation ── */
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setSelected(null);
      setSearch('');
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 380);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* ── Fermeture overlay ── */
  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) close();
  }

  function close() {
    setVisible(false);
    setTimeout(onClose, 320);
  }

  /* ── Sélection → redirect ── */
  function handleSelect(svc) {
    if (selected) return;
    setSelected(svc.id);
    setTimeout(() => {
      onClose();
      navigate(`/rendez-vous/demande/${svc.id}`);
    }, 420);
  }

  if (!mounted) return null;

  const services = entreprise?.services || [];
  const filtered = search
    ? services.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()))
    : services;

  return (
    <>
      <style>{CSS}</style>

      {/* ── Overlay ── */}
      <div
        ref={overlayRef}
        className="ssm-overlay"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-label="Sélection de service"
      >
        {/* ── Dialog ── */}
        <div
          className="ssm-dialog"
          style={{
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
            opacity:   visible ? 1 : 0,
          }}
        >
          {/* ── En-tête ── */}
          <div className="ssm-head">
            <div className="ssm-head-bg" />

            {/* Logo */}
            <div className="ssm-logo">
              {entreprise?.logo
                ? <img src={entreprise.logo} alt={entreprise.name} className="ssm-logo-img" />
                : <MdBusiness size={28} color={GOLD} />}
            </div>

            {/* Texte */}
            <div className="ssm-head-text">
              <p className="ssm-head-eyebrow">Prendre rendez-vous</p>
              <h2 className="ssm-head-name">{entreprise?.name}</h2>
              <p className="ssm-head-count">
                <FiCalendar size={11} />
                {services.length} service{services.length !== 1 ? 's' : ''} disponible{services.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Fermer */}
            <button className="ssm-close" onClick={close} aria-label="Fermer">
              <FiX size={17} />
            </button>

            {/* Ligne dorée */}
            <div className="ssm-gold-line" />
          </div>

          {/* ── Sous-titre / aide ── */}
          <p className="ssm-hint">
            Sélectionnez le service pour lequel vous souhaitez prendre rendez-vous
          </p>

          {/* ── Barre de recherche (si > 3 services) ── */}
          {services.length > 3 && (
            <div className="ssm-search-wrap">
              <FiSearch size={14} color="#94a3b8" />
              <input
                className="ssm-search"
                type="text"
                placeholder="Rechercher un service…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="ssm-search-clear" onClick={() => setSearch('')}>
                  <FiX size={12} />
                </button>
              )}
            </div>
          )}

          {/* ── Liste ── */}
          <div className="ssm-list">
            {filtered.length === 0 ? (
              <div className="ssm-empty">
                <FiZap size={28} color="#cbd5e1" />
                <p>Aucun service trouvé</p>
              </div>
            ) : (
              filtered.map((svc, idx) => {
                const isHov  = hovered  === svc.id;
                const isSel  = selected === svc.id;
                const hasPromo = svc.has_promo && svc.price_promo;
                const price    = hasPromo ? svc.price_promo : svc.price;

                return (
                  <button
                    key={svc.id}
                    className={`ssm-card ${isHov ? 'ssm-card--hov' : ''} ${isSel ? 'ssm-card--sel' : ''}`}
                    style={{ animationDelay: `${idx * 55}ms` }}
                    onMouseEnter={() => setHovered(svc.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleSelect(svc)}
                    disabled={!!selected}
                  >
                    {/* Accent gauche */}
                    <div className="ssm-card-accent" />

                    {/* Icône */}
                    <div className={`ssm-icon ${isHov || isSel ? 'ssm-icon--on' : ''}`}>
                      <FiZap size={16} />
                    </div>

                    {/* Corps */}
                    <div className="ssm-body">
                      <p className="ssm-name">{svc.name}</p>
                      <div className="ssm-meta">
                        {price != null && (
                          <span className="ssm-price-wrap">
                            {hasPromo && (
                              <span className="ssm-price-old">
                                {Number(svc.price).toLocaleString('fr-FR')} FCFA
                              </span>
                            )}
                            <span className={`ssm-price ${hasPromo ? 'ssm-price--promo' : ''}`}>
                              {Number(price).toLocaleString('fr-FR')} FCFA
                            </span>
                            {hasPromo && <span className="ssm-badge-promo">Promo</span>}
                          </span>
                        )}
                        {svc.is_price_on_request && (
                          <span className="ssm-devis">Sur devis</span>
                        )}
                        {svc.start_time && svc.end_time && (
                          <span className="ssm-time">
                            <FiClock size={9} />
                            {svc.start_time} – {svc.end_time}
                          </span>
                        )}
                      </div>
                      {svc.descriptions && (
                        <p className="ssm-desc">{svc.descriptions}</p>
                      )}
                    </div>

                    {/* Flèche / spinner / check */}
                    <div className={`ssm-arrow ${isHov || isSel ? 'ssm-arrow--on' : ''}`}>
                      {isSel
                        ? <div className="ssm-spinner" />
                        : isHov
                          ? <FiChevronRight size={17} />
                          : <FiChevronRight size={17} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* ── Footer ── */}
          <div className="ssm-foot">
            <p className="ssm-foot-note">
              Vous serez redirigé vers le formulaire de rendez-vous après sélection
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap');

  @keyframes ssm-card-in {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes ssm-spin { to { transform: rotate(360deg); } }

  /* ── Overlay ── */
  .ssm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(8, 10, 18, 0.68);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    transition: opacity 0.28s ease;
    box-sizing: border-box;
  }

  /* ── Dialog ── */
  .ssm-dialog {
    position: relative;
    width: 100%;
    max-width: 480px;
    background: #fafaf8;
    border-radius: 24px;
    box-shadow:
      0 32px 80px rgba(0,0,0,.28),
      0 8px 24px rgba(0,0,0,.16),
      0 0 0 1px rgba(255,255,255,.12);
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.36s cubic-bezier(0.22,1,0.36,1), opacity 0.32s ease;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  /* ── En-tête ── */
  .ssm-head {
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }

  .ssm-head-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #150604 0%, #2c0d09 50%, #150604 100%);
  }

  .ssm-head-content-row {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 22px 20px 18px;
  }

  /* trick: use flex on .ssm-head itself */
  .ssm-head {
    display: flex;
    flex-direction: column;
  }

  .ssm-logo {
    position: relative;
    z-index: 2;
    width: 56px;
    height: 56px;
    border-radius: 15px;
    background: rgba(255,255,255,.1);
    border: 1.5px solid rgba(255,255,255,.2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    margin: 22px 0 0 20px;
    box-shadow: 0 6px 20px rgba(0,0,0,.4);
  }

  .ssm-logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ssm-head-text {
    position: relative;
    z-index: 2;
    flex: 1;
    min-width: 0;
    margin-top: 22px;
  }

  .ssm-head-eyebrow {
    margin: 0 0 3px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: ${GOLD};
  }

  .ssm-head-name {
    margin: 0 0 5px;
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    line-height: 1.2;
    letter-spacing: -.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ssm-head-count {
    margin: 0;
    font-size: 11px;
    color: rgba(255,255,255,.5);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .ssm-close {
    position: relative;
    z-index: 2;
    margin: 18px 18px 0 auto;
    align-self: flex-start;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.2);
    color: rgba(255,255,255,.8);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background .2s, color .2s;
  }

  .ssm-close:hover {
    background: rgba(255,255,255,.22);
    color: #fff;
  }

  /* Layout the header row */
  .ssm-head {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    padding-bottom: 18px;
  }

  .ssm-gold-line {
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, ${GOLD} 40%, ${GOLD} 60%, transparent 100%);
    opacity: .65;
    flex-basis: 100%;
  }

  /* Fix: logo + text side by side, close top-right */
  .ssm-head {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;
    column-gap: 14px;
    row-gap: 0;
    padding: 0;
    align-items: start;
  }

  .ssm-head-bg {
    grid-column: 1/-1;
    grid-row: 1/-1;
  }

  .ssm-logo {
    grid-column: 1;
    grid-row: 1;
    margin: 22px 0 18px 20px;
  }

  .ssm-head-text {
    grid-column: 2;
    grid-row: 1;
    margin: 22px 0 18px 0;
  }

  .ssm-close {
    grid-column: 3;
    grid-row: 1;
    margin: 16px 16px 0 0;
  }

  .ssm-gold-line {
    grid-column: 1/-1;
    grid-row: 2;
  }

  /* ── Hint ── */
  .ssm-hint {
    margin: 0;
    padding: 13px 20px 0;
    font-size: 12px;
    color: #7a6e65;
    font-weight: 500;
    flex-shrink: 0;
    border-bottom: 1px solid #ede8e1;
    padding-bottom: 13px;
  }

  /* ── Recherche ── */
  .ssm-search-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 16px 0;
    background: #fff;
    border: 1.5px solid #e8e2da;
    border-radius: 12px;
    padding: 9px 12px;
    flex-shrink: 0;
    transition: border-color .2s;
  }

  .ssm-search-wrap:focus-within {
    border-color: ${PRIMARY}66;
  }

  .ssm-search {
    flex: 1;
    border: none;
    outline: none;
    font-size: 13px;
    color: #1a110a;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
  }

  .ssm-search-clear {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    padding: 0;
    color: #94a3b8;
  }

  /* ── Liste ── */
  .ssm-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 10px 14px 6px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    scrollbar-width: thin;
    scrollbar-color: #e2d6c8 transparent;
  }

  .ssm-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 36px 20px;
    color: #94a3b8;
    font-size: 13px;
  }

  /* ── Carte ── */
  .ssm-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 14px;
    background: #fff;
    border: 1.5px solid #ede8e1;
    border-radius: 16px;
    cursor: pointer;
    text-align: left;
    width: 100%;
    overflow: hidden;
    transition: border-color .22s, box-shadow .22s, transform .18s, background .2s;
    animation: ssm-card-in .32s ease-out both;
  }

  .ssm-card:disabled { cursor: not-allowed; }

  .ssm-card-accent {
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    background: linear-gradient(180deg, ${PRIMARY}, ${PRIMARY_L});
    border-radius: 0 3px 3px 0;
    opacity: 0;
    transition: opacity .22s, top .22s, bottom .22s;
  }

  .ssm-card--hov,
  .ssm-card:not(:disabled):hover {
    border-color: ${PRIMARY}55;
    box-shadow: 0 4px 18px rgba(192,57,43,.13);
    transform: translateY(-1px);
    background: #fffaf9;
  }

  .ssm-card--hov .ssm-card-accent,
  .ssm-card:not(:disabled):hover .ssm-card-accent {
    opacity: 1;
    top: 4px;
    bottom: 4px;
  }

  .ssm-card--sel {
    border-color: ${PRIMARY};
    box-shadow: 0 6px 24px rgba(192,57,43,.2);
    background: #fff9f8;
  }

  .ssm-card--sel .ssm-card-accent {
    opacity: 1;
    top: 0;
    bottom: 0;
    border-radius: 0;
  }

  /* ── Icône ── */
  .ssm-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(192,57,43,.08);
    border: 1.5px solid rgba(192,57,43,.15);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: ${PRIMARY};
    transition: background .22s, border-color .22s, color .22s, transform .2s;
  }

  .ssm-icon--on {
    background: ${PRIMARY};
    border-color: ${PRIMARY};
    color: #fff;
    transform: scale(1.08) rotate(-3deg);
  }

  /* ── Corps ── */
  .ssm-body { flex: 1; min-width: 0; }

  .ssm-name {
    margin: 0 0 5px;
    font-size: 14px;
    font-weight: 700;
    color: #1a110a;
    line-height: 1.3;
  }

  .ssm-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    margin-bottom: 4px;
  }

  .ssm-price-wrap { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }

  .ssm-price-old {
    font-size: 11px;
    color: #94a3b8;
    text-decoration: line-through;
  }

  .ssm-price {
    font-size: 13px;
    font-weight: 700;
    color: #1a110a;
  }

  .ssm-price--promo { color: ${PRIMARY}; }

  .ssm-badge-promo {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .05em;
    text-transform: uppercase;
    background: ${PRIMARY};
    color: #fff;
    padding: 2px 6px;
    border-radius: 10px;
  }

  .ssm-devis {
    font-size: 11.5px;
    font-weight: 600;
    color: #7a6e65;
    background: #f5efe8;
    padding: 3px 9px;
    border-radius: 10px;
  }

  .ssm-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
  }

  .ssm-desc {
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
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #c4b8ad;
    transition: background .22s, color .22s, transform .22s;
  }

  .ssm-arrow--on {
    background: ${PRIMARY};
    color: #fff;
    transform: scale(1.1);
  }

  .ssm-spinner {
    width: 15px;
    height: 15px;
    border: 2.5px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: ssm-spin .75s linear infinite;
  }

  /* ── Footer ── */
  .ssm-foot {
    padding: 10px 20px 18px;
    text-align: center;
    border-top: 1px solid #ede8e1;
    flex-shrink: 0;
  }

  .ssm-foot-note {
    margin: 0;
    font-size: 11px;
    color: #a89e95;
    font-weight: 500;
  }

  /* ── Responsive mobile ── */
  @media (max-width: 520px) {
    .ssm-overlay {
      align-items: flex-end;
      padding: 0;
    }

    .ssm-dialog {
      max-width: 100%;
      max-height: 88vh;
      border-radius: 24px 24px 0 0;
      transform: translateY(100%) !important;
    }

    .ssm-dialog[style*="translateY(0)"] {
      transform: translateY(0) !important;
    }
  }
`;