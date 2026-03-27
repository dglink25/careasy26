// src/components/Settings/SessionsSecurityPanel.jsx
// Gère : sessions actives, historique connexions, QR Login
// Routes utilisées :
//   GET  /user/sessions
//   DELETE /user/sessions/{id}
//   POST /user/logout-all
//   GET  /user/login-history
//   POST /user/sessions/share-token
//   GET  /user/sessions/share-token/{token}/status

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';
import {
  FiMonitor, FiSmartphone, FiTablet, FiTrash2, FiLogOut,
  FiRefreshCw, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle,
  FiGrid,
} from 'react-icons/fi';
import { MdOutlineHistory, MdOutlineDevices } from 'react-icons/md';

/* ── Helpers ─────────────────────────────────────────────────────────── */
function deviceIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('android') || n.includes('iphone') || n.includes('ipad') || n.includes('mobile')) {
    return <FiSmartphone />;
  }
  if (n.includes('tablet')) return <FiTablet />;
  return <FiMonitor />;
}

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function methodLabel(m) {
  const map = { email: 'Email/Téléphone', google: 'Google', qr: 'QR Code', phone: 'Téléphone' };
  return map[m] || m;
}

/* ── Composant principal ─────────────────────────────────────────────── */
export default function SessionsSecurityPanel({ colors: c }) {
  const [sessions, setSessions]         = useState([]);
  const [history, setHistory]           = useState([]);
  const [loadingSessions, setLS]        = useState(false);
  const [loadingHistory, setLH]         = useState(false);
  const [revoking, setRevoking]         = useState(null);
  const [loggingOutAll, setLOA]         = useState(false);
  const [msg, setMsg]                   = useState(null);

  // QR Login
  const [qrToken, setQrToken]           = useState(null);
  const [qrStatus, setQrStatus]         = useState(null); // pending|used|expired
  const [qrSecondsLeft, setQrSL]        = useState(0);
  const [qrLoading, setQrLoading]       = useState(false);
  const qrPollRef                       = useRef(null);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  /* ── Fetch sessions ─────────────────────────────────────────────── */
  const fetchSessions = useCallback(async () => {
    try { setLS(true); const r = await api.get('/user/sessions'); setSessions(r.data || []); }
    catch {}
    finally { setLS(false); }
  }, []);

  const fetchHistory = useCallback(async () => {
    try { setLH(true); const r = await api.get('/user/login-history'); setHistory(r.data?.history || r.data || []); }
    catch {}
    finally { setLH(false); }
  }, []);

  useEffect(() => { fetchSessions(); fetchHistory(); }, []);

  /* ── Révoquer session ───────────────────────────────────────────── */
  const revokeSession = async (id) => {
    try {
      setRevoking(id);
      await api.delete(`/user/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      showMsg('Appareil déconnecté.');
    } catch { showMsg('Erreur lors de la révocation.', 'error'); }
    finally { setRevoking(null); }
  };

  /* ── Déconnecter tous ───────────────────────────────────────────── */
  const logoutAll = async () => {
    if (!window.confirm('Déconnecter tous les appareils sauf celui-ci ?')) return;
    try {
      setLOA(true);
      await api.post('/user/logout-all');
      await fetchSessions();
      showMsg('Tous les appareils ont été déconnectés.');
    } catch { showMsg('Erreur.', 'error'); }
    finally { setLOA(false); }
  };

  /* ── QR Login ───────────────────────────────────────────────────── */
  const generateQR = async () => {
    try {
      setQrLoading(true);
      setQrStatus(null);
      const r = await api.post('/user/sessions/share-token', { expires_in: 120 });
      setQrToken(r.data.share_token);
      setQrStatus('pending');
      setQrSL(r.data.expires_in || 120);
      startQrPolling(r.data.share_token);
    } catch (err) {
      showMsg(err.response?.data?.message || 'Impossible de générer le QR.', 'error');
    } finally {
      setQrLoading(false);
    }
  };

  const startQrPolling = (token) => {
    clearInterval(qrPollRef.current);
    qrPollRef.current = setInterval(async () => {
      try {
        const r = await api.get(`/user/sessions/share-token/${token}/status`);
        setQrStatus(r.data.status);
        setQrSL(r.data.seconds_left || 0);
        if (r.data.status !== 'pending') {
          clearInterval(qrPollRef.current);
          if (r.data.status === 'used') {
            showMsg('Connexion réussie depuis un nouvel appareil !');
            fetchSessions();
          }
        }
      } catch { clearInterval(qrPollRef.current); }
    }, 2500);
  };

  useEffect(() => () => clearInterval(qrPollRef.current), []);

  /* ── QR URL (via api.qrserver.com, no auth needed) ─────────────── */
  const qrUrl = qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrToken)}`
    : null;

  /* ── Styles ─────────────────────────────────────────────────────── */
  const s = {
    section:   { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    pageTitle: { fontSize: '1.5rem', fontWeight: 700, color: c?.text || 'var(--text-primary)', marginBottom: '.5rem' },
    card:      { backgroundColor: c?.bgSec || 'var(--bg-secondary)', borderRadius: '.875rem', padding: '1.25rem', border: `1px solid ${c?.border || 'var(--border-color)'}` },
    cardTitle: { display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '1rem', fontWeight: 700, color: c?.text || 'var(--text-primary)', marginBottom: '1rem' },
    row:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '.875rem 0', borderBottom: `1px solid ${c?.border || 'var(--border-color)'}` },
    deviceIcon:{ fontSize: '1.5rem', color: '#3b82f6', flexShrink: 0 },
    deviceName:{ fontSize: '.95rem', fontWeight: 600, color: c?.text || 'var(--text-primary)' },
    deviceMeta:{ fontSize: '.78rem', color: c?.textSec || 'var(--text-secondary)' },
    currentBadge:{ backgroundColor: '#d1fae5', color: '#065f46', padding: '.2rem .6rem', borderRadius: 999, fontSize: '.7rem', fontWeight: 700 },
    btn:       (color, bg) => ({ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.5rem 1rem', backgroundColor: bg || color, color: bg ? color : '#fff', border: bg ? `1.5px solid ${color}` : 'none', borderRadius: '.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '.8rem', transition: 'all .2s', whiteSpace: 'nowrap' }),
    historyItem: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '.75rem 0', borderBottom: `1px solid ${c?.border || 'var(--border-color)'}` },
    histIcon:  (ok) => ({ width: 32, height: 32, borderRadius: '50%', backgroundColor: ok ? '#d1fae5' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: ok ? '#059669' : '#dc2626' }),
    qrBox:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.5rem 0' },
    qrImg:     { width: 200, height: 200, borderRadius: '12px', border: '4px solid var(--border-color)' },
    qrTimer:   (ok) => ({ fontSize: '.9rem', fontWeight: 700, color: ok ? '#ef4444' : '#10b981' }),
    msgBox:    (t) => ({ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.875rem 1rem', borderRadius: '.5rem', backgroundColor: t === 'error' ? '#fee2e2' : '#d1fae5', color: t === 'error' ? '#dc2626' : '#059669', fontWeight: 600, fontSize: '.875rem' }),
  };

  return (
    <div style={s.section}>
      <h2 style={s.pageTitle}>Sessions & Sécurité</h2>

      {msg && (
        <div style={s.msgBox(msg.type)}>
          {msg.type === 'error' ? <FiXCircle /> : <FiCheckCircle />} {msg.text}
        </div>
      )}

      {/* ── Sessions actives ───────────────────────────────────────── */}
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={s.cardTitle}><MdOutlineDevices style={{ fontSize: '1.25rem', color: '#3b82f6' }} /> Appareils connectés</div>
          <button onClick={logoutAll} disabled={loggingOutAll} style={s.btn('#ef4444', '#fee2e2')}>
            <FiLogOut size={14} /> {loggingOutAll ? 'Déconnexion...' : 'Tout déconnecter'}
          </button>
        </div>

        {loadingSessions ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>Chargement...</div>
        ) : sessions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', textAlign: 'center', padding: '1rem' }}>Aucune session active</p>
        ) : (
          sessions.map((session, i) => (
            <div key={session.id || i} style={{ ...s.row, ...(i === sessions.length - 1 ? { borderBottom: 'none' } : {}) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={s.deviceIcon}>{deviceIcon(session.device || session.name || '')}</div>
                <div>
                  <div style={s.deviceName}>{session.device || session.name || 'Appareil inconnu'}</div>
                  <div style={s.deviceMeta}>
                    {session.ip_address || session.last_used_at
                      ? `${session.ip_address || ''} • Dernière utilisation : ${formatDate(session.last_used_at)}`
                      : formatDate(session.created_at)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                {session.is_current && <span style={s.currentBadge}>Cet appareil</span>}
                {!session.is_current && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    disabled={revoking === session.id}
                    style={s.btn('#ef4444', '#fee2e2')}
                  >
                    <FiTrash2 size={13} /> {revoking === session.id ? '...' : 'Révoquer'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        <div style={{ marginTop: '1rem' }}>
          <button onClick={fetchSessions} style={s.btn('#3b82f6', '#dbeafe')}>
            <FiRefreshCw size={13} /> Actualiser
          </button>
        </div>
      </div>

      {/* ── QR Login ───────────────────────────────────────────────── */}
      <div style={s.card}>
        <div style={s.cardTitle}><FiQrCode style={{ fontSize: '1.25rem', color: '#8b5cf6' }} /> Connexion par QR Code</div>
        <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Connectez un nouvel appareil sans saisir vos identifiants. Générez un QR Code et scannez-le depuis l'application mobile.
        </p>

        {!qrToken ? (
          <button onClick={generateQR} disabled={qrLoading} style={s.btn('#8b5cf6')}>
            <FiQrCode /> {qrLoading ? 'Génération...' : 'Générer un QR Code'}
          </button>
        ) : (
          <div style={s.qrBox}>
            {qrStatus === 'pending' && (
              <>
                <img src={qrUrl} alt="QR Login" style={s.qrImg} />
                <p style={s.qrTimer(qrSecondsLeft < 30)}>
                  {qrStatus === 'pending' && qrSecondsLeft > 0
                    ? `⏱ Expire dans ${qrSecondsLeft}s`
                    : '⏱ Expiration imminente'}
                </p>
                <p style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>
                  Scannez ce code depuis l'application CarEasy
                </p>
              </>
            )}
            {qrStatus === 'used' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
                <FiCheckCircle style={{ fontSize: '3rem', color: '#10b981' }} />
                <p style={{ fontWeight: 700, color: '#059669' }}>Connexion réussie !</p>
              </div>
            )}
            {qrStatus === 'expired' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
                <FiAlertCircle style={{ fontSize: '2.5rem', color: '#f59e0b' }} />
                <p style={{ color: '#b45309' }}>QR Code expiré</p>
                <button onClick={generateQR} style={s.btn('#8b5cf6')}>Nouveau QR Code</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Historique connexions ───────────────────────────────────── */}
      <div style={s.card}>
        <div style={s.cardTitle}><MdOutlineHistory style={{ fontSize: '1.25rem', color: '#10b981' }} /> Historique de connexions</div>

        {loadingHistory ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', padding: '.5rem 0' }}>Chargement...</p>
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', padding: '.5rem 0' }}>Aucun historique disponible</p>
        ) : (
          history.slice(0, 20).map((entry, i) => (
            <div key={i} style={{ ...s.historyItem, ...(i === Math.min(history.length, 20) - 1 ? { borderBottom: 'none' } : {}) }}>
              <div style={s.histIcon(entry.success)}>
                {entry.success ? <FiCheckCircle size={16} /> : <FiXCircle size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {entry.success ? 'Connexion réussie' : 'Échec de connexion'}
                  {entry.method && <span style={{ fontSize: '.75rem', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '.5rem' }}>via {methodLabel(entry.method)}</span>}
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: '.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.device || 'Appareil inconnu'} • {entry.ip_address || ''} • {formatDate(entry.created_at)}
                </div>
                {!entry.success && entry.fail_reason && (
                  <div style={{ fontSize: '.75rem', color: '#dc2626', marginTop: '.15rem' }}>{entry.fail_reason}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}