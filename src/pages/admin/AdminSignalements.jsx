import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import theme from '../../config/theme';
import {
  FiSearch, FiRefreshCw, FiFlag, FiStar, FiEye,
  FiChevronDown, FiChevronUp, FiCheckCircle, FiAlertTriangle,
  FiUser, FiCalendar, FiMessageSquare
} from 'react-icons/fi';
import { MdOutlineReportProblem, MdOutlineVerified } from 'react-icons/md';

function Stars({ rating }) {
  return (
    <span style={{ display:'inline-flex', gap:1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize:14, color: s <= rating ? '#f59e0b' : '#e2e8f0' }}>★</span>
      ))}
    </span>
  );
}

function ModalSignalement({ item, onClose, onResolve }) {
  if (!item) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, backgroundColor:'rgba(15,23,42,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor:'#fff', borderRadius:16, maxWidth:560, width:'100%', maxHeight:'88vh', overflowY:'auto', boxShadow:'0 25px 50px rgba(0,0,0,.2)' }}>
        <div style={{ padding:'1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#0f172a', display:'flex', alignItems:'center', gap:8 }}>
            <FiFlag style={{ color:'#ef4444' }} /> Détails du signalement
          </h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:'1.5rem', lineHeight:1 }}>×</button>
        </div>

        <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          {/* Avis signalé */}
          <div style={{ backgroundColor:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:'1rem' }}>
            <div style={{ fontSize:'.75rem', fontWeight:600, color:'#c2410c', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Avis signalé</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <Stars rating={item.rating} />
              <span style={{ fontSize:'.8rem', color:'#64748b' }}>{item.rating}/5</span>
            </div>
            {item.comment && <p style={{ color:'#334155', fontSize:'.875rem', lineHeight:1.6, fontStyle:'italic', margin:0 }}>"{item.comment}"</p>}
          </div>

          {/* Motif signalement */}
          <div style={{ backgroundColor:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'1rem' }}>
            <div style={{ fontSize:'.75rem', fontWeight:600, color:'#991b1b', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Motif du signalement</div>
            <p style={{ color:'#7f1d1d', fontSize:'.9rem', lineHeight:1.5, margin:0 }}>{item.report_reason || 'Non précisé'}</p>
            {item.reported_at && <div style={{ fontSize:'.75rem', color:'#94a3b8', marginTop:6 }}>Signalé le {new Date(item.reported_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}</div>}
          </div>

          {/* Infos */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            {[
              { label:'Client', value: item.client?.name || '—' },
              { label:'Prestataire', value: item.prestataire?.name || '—' },
              { label:'Service', value: item.rendez_vous?.service?.name || '—' },
              { label:'Date RDV', value: item.rendez_vous?.date ? new Date(item.rendez_vous.date).toLocaleDateString('fr-FR') : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ backgroundColor:'#f8fafc', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontSize:'.7rem', color:'#64748b', marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:'.875rem', fontWeight:500, color:'#0f172a' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Statut résolution */}
          <div style={{ display:'flex', gap:'0.75rem', paddingTop:'0.5rem' }}>
            <button onClick={onClose} style={{ flex:1, padding:'.875rem', backgroundColor:'#f1f5f9', border:'none', borderRadius:10, color:'#334155', fontSize:'.875rem', fontWeight:500, cursor:'pointer' }}>
              Fermer
            </button>
            {!item.resolved && (
              <button onClick={() => onResolve(item)} style={{ flex:1, padding:'.875rem', backgroundColor:'#10b981', border:'none', borderRadius:10, color:'#fff', fontSize:'.875rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <FiCheckCircle size={14} /> Marquer comme traité
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSignalements() {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterNote, setFilterNote] = useState('all');
  const [sortKey, setSortKey] = useState('reported_at');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/signalements');
      setSignalements(res.data?.data || res.data || []);
    } catch (err) {
      console.warn('Endpoint /admin/signalements non disponible, utilisation de données mock');
      setSignalements([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleResolve = async (item) => {
    try {
      await api.patch(`/admin/signalements/${item.id}/resolve`);
      setSignalements(prev => prev.map(s => s.id === item.id ? { ...s, resolved: true } : s));
      setSelected(null);
    } catch { console.error('Erreur résolution'); }
  };

  const filtered = signalements.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.client?.name?.toLowerCase().includes(q) ||
      s.prestataire?.name?.toLowerCase().includes(q) ||
      s.report_reason?.toLowerCase().includes(q) ||
      s.comment?.toLowerCase().includes(q);
    const matchStatut = filterStatut === 'all' ||
      (filterStatut === 'pending'  && !s.resolved) ||
      (filterStatut === 'resolved' && s.resolved);
    const matchNote = filterNote === 'all' ||
      (filterNote === '1-2' && s.rating <= 2) ||
      (filterNote === '3'   && s.rating === 3) ||
      (filterNote === '4-5' && s.rating >= 4);
    return matchSearch && matchStatut && matchNote;
  }).sort((a, b) => {
    let va = a[sortKey] || '', vb = b[sortKey] || '';
    if (sortKey === 'rating') { va = a.rating; vb = b.rating; }
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === 'asc' ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />)
    : <FiChevronDown size={13} style={{ opacity:.3 }} />;

  const stats = {
    total:    signalements.length,
    pending:  signalements.filter(s => !s.resolved).length,
    resolved: signalements.filter(s => s.resolved).length,
    lowRating:signalements.filter(s => s.rating <= 2).length,
  };

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', padding:'2rem 0' }}>
      <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 1.5rem' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'2rem', fontWeight:700, color:'#0f172a', marginBottom:4, display:'flex', alignItems:'center', gap:10 }}>
              <MdOutlineReportProblem style={{ color:'#ef4444' }} /> Signalements
            </h1>
            <p style={{ color:'#64748b', fontSize:'.95rem' }}>Avis signalés par les clients à propos des prestataires</p>
          </div>
          <button onClick={fetchData} style={{ display:'flex', alignItems:'center', gap:6, padding:'.625rem 1.25rem', backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:10, color:'#475569', fontSize:'.875rem', fontWeight:500, cursor:'pointer' }}>
            <FiRefreshCw size={14} /> Rafraîchir
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {[
            { label:'Total signalements', val: stats.total,    color:'#3b82f6', bg:'#dbeafe', icon:<FiFlag /> },
            { label:'En attente',         val: stats.pending,  color:'#ef4444', bg:'#fee2e2', icon:<FiAlertTriangle /> },
            { label:'Traités',            val: stats.resolved, color:'#10b981', bg:'#d1fae5', icon:<FiCheckCircle /> },
            { label:'Notes basses (≤2)',  val: stats.lowRating,color:'#d97706', bg:'#fef3c7', icon:<FiStar /> },
          ].map(({ label, val, color, bg, icon }) => (
            <div key={label} style={{ backgroundColor:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:'1.25rem', display:'flex', alignItems:'center', gap:'1rem' }}>
              <div style={{ width:44, height:44, borderRadius:10, backgroundColor: bg, display:'flex', alignItems:'center', justifyContent:'center', color, fontSize:'1.1rem' }}>{icon}</div>
              <div>
                <div style={{ fontSize:'.65rem', color:'#64748b', textTransform:'uppercase', letterSpacing:.5, marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:'1.6rem', fontWeight:600, color:'#0f172a', lineHeight:1 }}>{val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ backgroundColor:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:'1.25rem', marginBottom:'1.5rem', display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:220 }}>
            <FiSearch style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher par client, prestataire, motif..." style={{ width:'100%', padding:'.625rem .75rem .625rem 2.5rem', border:'1px solid #e2e8f0', borderRadius:8, fontSize:'.875rem', outline:'none', boxSizing:'border-box' }} />
          </div>
          <select value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setPage(1); }} style={{ padding:'.625rem 1rem', border:'1px solid #e2e8f0', borderRadius:8, fontSize:'.875rem', color:'#334155', cursor:'pointer' }}>
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="resolved">Traités</option>
          </select>
          <select value={filterNote} onChange={e => { setFilterNote(e.target.value); setPage(1); }} style={{ padding:'.625rem 1rem', border:'1px solid #e2e8f0', borderRadius:8, fontSize:'.875rem', color:'#334155', cursor:'pointer' }}>
            <option value="all">Toutes les notes</option>
            <option value="1-2">Notes 1-2 ⭐</option>
            <option value="3">Note 3 ⭐</option>
            <option value="4-5">Notes 4-5 ⭐</option>
          </select>
          <span style={{ fontSize:'.875rem', color:'#64748b', whiteSpace:'nowrap' }}>{filtered.length} résultat(s)</span>
        </div>

        {/* Note si endpoint absent */}
        {signalements.length === 0 && !loading && (
          <div style={{ backgroundColor:'#fef3c7', border:'1px solid #fcd34d', borderRadius:12, padding:'1.25rem 1.5rem', marginBottom:'1.5rem', display:'flex', alignItems:'flex-start', gap:12 }}>
            <FiAlertTriangle style={{ color:'#d97706', flexShrink:0, marginTop:2 }} />
            <div>
              <p style={{ fontWeight:600, color:'#92400e', marginBottom:4 }}>Aucun signalement trouvé</p>
              <p style={{ color:'#78350f', fontSize:'.875rem', margin:0 }}>
                Les signalements apparaissent ici une fois que des clients ont signalé des avis inappropriés ou problématiques.
              </p>
            </div>
          </div>
        )}

        {/* Tableau */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'4rem', color:'#64748b' }}>
            <div style={{ width:40, height:40, border:`3px solid #e2e8f0`, borderTop:`3px solid ${theme.colors.primary}`, borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 1rem' }} />
            Chargement...
          </div>
        ) : (
          <div style={{ backgroundColor:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
            {paginated.length === 0 ? (
              <div style={{ padding:'4rem', textAlign:'center', color:'#94a3b8' }}>
                <FiFlag size={48} style={{ marginBottom:'1rem', opacity:.3 }} />
                <p style={{ fontWeight:500 }}>Aucun signalement trouvé</p>
                <p style={{ fontSize:'.875rem' }}>Les signalements apparaîtront ici une fois que des clients auront signalé des services.</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
                    <thead>
                      <tr style={{ backgroundColor:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                        {[
                          { label:'Client',         key:'client_name' },
                          { label:'Prestataire',    key:'prestataire_name' },
                          { label:'Service',        key:null },
                          { label:'Note',           key:'rating' },
                          { label:'Motif',          key:null },
                          { label:'Date signalement', key:'reported_at' },
                          { label:'Statut',         key:null },
                          { label:'',               key:null },
                        ].map(({ label, key }, i) => (
                          <th key={i} onClick={key ? () => handleSort(key) : undefined} style={{ padding:'12px 16px', textAlign:'left', fontSize:'.75rem', fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:.5, cursor: key ? 'pointer' : 'default', userSelect:'none', whiteSpace:'nowrap' }}>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>{label}{key && <SortIcon k={key} />}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((s, i) => (
                        <tr key={i} style={{ borderBottom:'1px solid #f1f5f9', backgroundColor: !s.resolved ? '#fff8f8' : 'transparent' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='#fafafa'} onMouseLeave={e => e.currentTarget.style.backgroundColor= !s.resolved ? '#fff8f8' : 'transparent'}>
                          <td style={{ padding:'12px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ width:30, height:30, borderRadius:'50%', backgroundColor:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.75rem', fontWeight:700, color:'#475569', flexShrink:0 }}>
                                {s.client?.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <span style={{ fontSize:'.875rem', fontWeight:500, color:'#0f172a' }}>{s.client?.name || '—'}</span>
                            </div>
                          </td>
                          <td style={{ padding:'12px 16px', fontSize:'.875rem', color:'#334155' }}>{s.prestataire?.name || '—'}</td>
                          <td style={{ padding:'12px 16px', fontSize:'.8rem', color:'#64748b', maxWidth:160 }}>
                            <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.rendez_vous?.service?.name || '—'}</span>
                          </td>
                          <td style={{ padding:'12px 16px' }}><Stars rating={s.rating} /></td>
                          <td style={{ padding:'12px 16px', maxWidth:200 }}>
                            <span style={{ fontSize:'.8rem', color:'#64748b', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.report_reason || '—'}</span>
                          </td>
                          <td style={{ padding:'12px 16px', fontSize:'.8rem', color:'#64748b', whiteSpace:'nowrap' }}>
                            {s.reported_at ? new Date(s.reported_at).toLocaleDateString('fr-FR') : '—'}
                          </td>
                          <td style={{ padding:'12px 16px' }}>
                            {s.resolved ? (
                              <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', backgroundColor:'#d1fae5', color:'#065f46', borderRadius:999, fontSize:'.75rem', fontWeight:600 }}>
                                <FiCheckCircle size={11} /> Traité
                              </span>
                            ) : (
                              <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', backgroundColor:'#fee2e2', color:'#991b1b', borderRadius:999, fontSize:'.75rem', fontWeight:600 }}>
                                <FiAlertTriangle size={11} /> En attente
                              </span>
                            )}
                          </td>
                          <td style={{ padding:'12px 16px' }}>
                            <button onClick={() => setSelected(s)} style={{ display:'flex', alignItems:'center', gap:5, padding:'.4rem .875rem', backgroundColor: theme.colors.primary, color:'#fff', border:'none', borderRadius:8, fontSize:'.8rem', fontWeight:500, cursor:'pointer' }}>
                              <FiEye size={13} /> Voir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pages > 1 && (
                  <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, padding:'1rem', borderTop:'1px solid #f1f5f9' }}>
                    <button disabled={page===1} onClick={() => setPage(p=>p-1)} style={{ padding:'.375rem .875rem', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', cursor:'pointer', color:'#475569', fontSize:'.875rem' }}>←</button>
                    <span style={{ fontSize:'.875rem', color:'#64748b' }}>Page {page} / {pages}</span>
                    <button disabled={page===pages} onClick={() => setPage(p=>p+1)} style={{ padding:'.375rem .875rem', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', cursor:'pointer', color:'#475569', fontSize:'.875rem' }}>→</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {selected && <ModalSignalement item={selected} onClose={() => setSelected(null)} onResolve={handleResolve} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}