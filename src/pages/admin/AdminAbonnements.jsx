// src/pages/admin/AdminAbonnements.jsx
// Page d'administration des abonnements - affiche tous les abonnements de tous les prestataires

import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import theme from '../../config/theme';
import {
  FiSearch, FiRefreshCw, FiChevronDown, FiChevronUp,
  FiAward, FiGift, FiClock, FiCheckCircle, FiXCircle,
  FiAlertTriangle, FiUser, FiCalendar, FiDollarSign
} from 'react-icons/fi';
import { FaCrown, FaRocket } from 'react-icons/fa';

const STATUT_CONFIG = {
  actif:    { label: 'Actif',    bg: '#d1fae5', color: '#065f46', icon: <FiCheckCircle size={11}/> },
  expire:   { label: 'Expiré',  bg: '#fee2e2', color: '#991b1b', icon: <FiXCircle size={11}/> },
  expiré:   { label: 'Expiré',  bg: '#fee2e2', color: '#991b1b', icon: <FiXCircle size={11}/> },
  annule:   { label: 'Annulé',  bg: '#f1f5f9', color: '#475569', icon: <FiXCircle size={11}/> },
  suspendu: { label: 'Suspendu',bg: '#fef3c7', color: '#92400e', icon: <FiAlertTriangle size={11}/> },
};

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] || { label: statut, bg:'#f1f5f9', color:'#475569', icon: null };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', backgroundColor: cfg.bg, color: cfg.color, borderRadius:999, fontSize:'.75rem', fontWeight:600 }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function TypeBadge({ type, code }) {
  if (type === 'trial') return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', backgroundColor:'#fef3c7', color:'#92400e', borderRadius:999, fontSize:'.75rem', fontWeight:600 }}>
      <FiGift size={11} /> Essai gratuit
    </span>
  );
  const c = code || '';
  if (c.includes('VP3')) return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', backgroundColor:'#d1fae5', color:'#065f46', borderRadius:999, fontSize:'.75rem', fontWeight:600 }}><FaRocket size={11} />{c}</span>;
  if (c.includes('VP2')) return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', backgroundColor:'#ede9fe', color:'#5b21b6', borderRadius:999, fontSize:'.75rem', fontWeight:600 }}><FaCrown size={11} />{c}</span>;
  if (c.includes('VP1')) return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', backgroundColor:'#dbeafe', color:'#1e40af', borderRadius:999, fontSize:'.75rem', fontWeight:600 }}><FiAward size={11} />{c}</span>;
  return <span style={{ padding:'3px 10px', backgroundColor:'#f1f5f9', color:'#475569', borderRadius:999, fontSize:'.75rem', fontWeight:600 }}>{c || 'Standard'}</span>;
}

export default function AdminAbonnements() {
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Utilise l'endpoint admin dédié aux abonnements
      const res = await api.get('/admin/abonnements');
      const data = res.data?.data || [];
      setAbonnements(data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des abonnements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = abonnements.filter(ab => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      ab.prestataire_name?.toLowerCase().includes(q) ||
      ab.prestataire_email?.toLowerCase().includes(q) ||
      ab.entreprise_name?.toLowerCase().includes(q) ||
      ab.reference?.toLowerCase().includes(q) ||
      ab.plan?.name?.toLowerCase().includes(q);
    const matchStatut = filterStatut === 'all' || ab.statut === filterStatut ||
      (filterStatut === 'expire' && (ab.statut === 'expire' || ab.statut === 'expiré'));
    const matchType = filterType === 'all' ||
      (filterType === 'trial' && ab.type === 'trial') ||
      (filterType === 'paid'  && ab.type !== 'trial');
    return matchSearch && matchStatut && matchType;
  }).sort((a, b) => {
    let va = a[sortKey] || '', vb = b[sortKey] || '';
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === 'asc' ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />)
    : <FiChevronDown size={13} style={{ opacity: .3 }} />;

  const stats = {
    total:  abonnements.length,
    actifs: abonnements.filter(a => a.statut === 'actif').length,
    trial:  abonnements.filter(a => a.type === 'trial').length,
    paid:   abonnements.filter(a => a.type !== 'trial' && a.statut === 'actif').length,
    expire: abonnements.filter(a => ['expire', 'expiré'].includes(a.statut)).length,
  };

  // Formatage de date lisible depuis format dd/mm/yyyy ou ISO
  const fmtDate = (d) => {
    if (!d) return '—';
    // Déjà formaté dd/mm/yyyy ?
    if (/^\d{2}\/\d{2}\/\d{4}/.test(d)) return d.substring(0, 10);
    try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem 0' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiAward style={{ color: theme.colors.primary }} /> Abonnements
            </h1>
            <p style={{ color: '#64748b', fontSize: '.95rem' }}>Tous les abonnements des prestataires sur la plateforme</p>
          </div>
          <button onClick={fetchData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '.625rem 1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#475569', fontSize: '.875rem', fontWeight: 500, cursor: 'pointer' }}>
            <FiRefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Rafraîchir
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total',          val: stats.total,  color: '#3b82f6', bg: '#dbeafe', icon: <FiAward /> },
            { label: 'Actifs',         val: stats.actifs, color: '#10b981', bg: '#d1fae5', icon: <FiCheckCircle /> },
            { label: 'Essais gratuits',val: stats.trial,  color: '#d97706', bg: '#fef3c7', icon: <FiGift /> },
            { label: 'Payants actifs', val: stats.paid,   color: '#8b5cf6', bg: '#ede9fe', icon: <FaCrown /> },
            { label: 'Expirés',        val: stats.expire, color: '#ef4444', bg: '#fee2e2', icon: <FiAlertTriangle /> },
          ].map(({ label, val, color, bg, icon }) => (
            <div key={label} style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: '1rem' }}>{icon}</div>
              <div>
                <div style={{ fontSize: '.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>{val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Note si 0 abonnements mais pas d'erreur */}
        {!loading && !error && abonnements.length === 0 && (
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <FiAlertTriangle style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 600, color: '#92400e', marginBottom: 4 }}>Aucun abonnement trouvé</p>
              <p style={{ color: '#78350f', fontSize: '.875rem', margin: 0 }}>
                Les abonnements apparaissent ici une fois que les entreprises sont validées et que les prestataires souscrivent à un plan.
              </p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Prestataire, entreprise, référence, plan..." style={{ width: '100%', padding: '.625rem .75rem .625rem 2.5rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '.875rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setPage(1); }} style={{ padding: '.625rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '.875rem', color: '#334155', cursor: 'pointer' }}>
            <option value="all">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="expire">Expirés</option>
            <option value="annule">Annulés</option>
          </select>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} style={{ padding: '.625rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '.875rem', color: '#334155', cursor: 'pointer' }}>
            <option value="all">Tous les types</option>
            <option value="trial">Essai gratuit</option>
            <option value="paid">Payant</option>
          </select>
          <span style={{ fontSize: '.875rem', color: '#64748b', whiteSpace: 'nowrap' }}>{filtered.length} résultat(s)</span>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', color: '#991b1b' }}>
            {error} — <button onClick={fetchData} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', textDecoration: 'underline' }}>Réessayer</button>
          </div>
        )}

        {/* Tableau */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <div style={{ width: 40, height: 40, border: `3px solid #e2e8f0`, borderTop: `3px solid ${theme.colors.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            Chargement des abonnements...
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {[
                      { label: 'Référence',    key: 'reference' },
                      { label: 'Prestataire',  key: 'prestataire_name' },
                      { label: 'Entreprise',   key: 'entreprise_name' },
                      { label: 'Plan',         key: null },
                      { label: 'Statut',       key: 'statut' },
                      { label: 'Début',        key: 'date_debut' },
                      { label: 'Fin',          key: 'date_fin' },
                      { label: 'J. restants',  key: 'jours_restants' },
                      { label: 'Montant',      key: null },
                    ].map(({ label, key }, i) => (
                      <th key={i} onClick={key ? () => handleSort(key) : undefined} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: .5, cursor: key ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{label}{key && <SortIcon k={key} />}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Aucun abonnement trouvé</td></tr>
                  ) : paginated.map((ab, i) => {
                    const isExpiringSoon = ab.statut === 'actif' && ab.jours_restants !== undefined && ab.jours_restants <= 7 && ab.jours_restants >= 0;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isExpiringSoon ? '#fffbeb' : 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = isExpiringSoon ? '#fffbeb' : 'transparent'}>
                        <td style={{ padding: '12px 16px' }}>
                          <code style={{ fontSize: '.75rem', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#475569' }}>{ab.reference || '—'}</code>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '.875rem', fontWeight: 500, color: '#0f172a' }}>{ab.prestataire_name || '—'}</div>
                          <div style={{ fontSize: '.75rem', color: '#64748b' }}>{ab.prestataire_email || ''}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '.875rem', color: '#334155' }}>{ab.entreprise_name || '—'}</td>
                        <td style={{ padding: '12px 16px' }}><TypeBadge type={ab.type} code={ab.plan?.code} /></td>
                        <td style={{ padding: '12px 16px' }}><StatutBadge statut={ab.statut} /></td>
                        <td style={{ padding: '12px 16px', fontSize: '.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(ab.date_debut)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(ab.date_fin)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {ab.statut === 'actif' ? (
                            <span style={{ fontSize: '.85rem', fontWeight: 600, color: isExpiringSoon ? '#d97706' : '#059669' }}>
                              {isExpiringSoon && '⚠ '}{ab.jours_restants ?? '—'} j
                            </span>
                          ) : <span style={{ color: '#94a3b8', fontSize: '.8rem' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '.8rem', color: ab.type === 'trial' ? '#059669' : '#334155', fontWeight: ab.type === 'trial' ? 600 : 400 }}>
                          {ab.type === 'trial' ? 'Gratuit' : (ab.montant || ab.paiement?.montant || '—')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '.375rem .875rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#475569', fontSize: '.875rem' }}>←</button>
                <span style={{ fontSize: '.875rem', color: '#64748b' }}>Page {page} / {pages}</span>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} style={{ padding: '.375rem .875rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: page === pages ? 'not-allowed' : 'pointer', color: '#475569', fontSize: '.875rem' }}>→</button>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}