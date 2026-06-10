import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import theme from '../../config/theme';
import {
  FiSearch, FiFilter, FiEye, FiRefreshCw, FiUser, FiMail,
  FiPhone, FiCalendar, FiChevronDown, FiChevronUp, FiX,
  FiCheckCircle, FiXCircle, FiClock, FiGift, FiAward,
  FiBriefcase, FiStar, FiAlertTriangle, FiDownload
} from 'react-icons/fi';
import { MdOutlineBusinessCenter, MdVerified } from 'react-icons/md';
import { FaCrown, FaRocket, FaRegGem } from 'react-icons/fa';

const PLAN_LABELS = {
  TRIAL: { label: 'Essai gratuit', color: '#d97706', bg: '#fef3c7', icon: <FiGift /> },
  VP1:   { label: 'Plan VP1',     color: '#3b82f6', bg: '#dbeafe', icon: <FiAward /> },
  VP2:   { label: 'Plan VP2',     color: '#8b5cf6', bg: '#ede9fe', icon: <FaCrown style={{ fontSize: 13 }} /> },
  VP3:   { label: 'Plan VP3',     color: '#10b981', bg: '#d1fae5', icon: <FaRocket style={{ fontSize: 13 }} /> },
  NONE:  { label: 'Aucun plan',   color: '#6b7280', bg: '#f3f4f6', icon: <FiX /> },
};

function getPlanInfo(abonnements) {
  if (!abonnements || abonnements.length === 0) return PLAN_LABELS.NONE;
  const actif = abonnements.find(a => a.statut === 'actif');
  if (!actif) return PLAN_LABELS.NONE;
  const code = actif.plan?.code || '';
  if (code === 'TRIAL') return PLAN_LABELS.TRIAL;
  if (code.includes('VP3')) return PLAN_LABELS.VP3;
  if (code.includes('VP2')) return PLAN_LABELS.VP2;
  if (code.includes('VP1')) return PLAN_LABELS.VP1;
  return { label: code || 'Abonné', color: '#3b82f6', bg: '#dbeafe', icon: <FiAward /> };
}

function StatutBadge({ statut }) {
  if (statut === 'validated') return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', backgroundColor:'#d1fae5', color:'#065f46', borderRadius:999, fontSize:'.75rem', fontWeight:600 }}>
      <FiCheckCircle size={11} /> Validé
    </span>
  );
  if (statut === 'pending') return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', backgroundColor:'#fef3c7', color:'#92400e', borderRadius:999, fontSize:'.75rem', fontWeight:600 }}>
      <FiClock size={11} /> En attente
    </span>
  );
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', backgroundColor:'#fee2e2', color:'#991b1b', borderRadius:999, fontSize:'.75rem', fontWeight:600 }}>
      <FiXCircle size={11} /> Rejeté
    </span>
  );
}

function PlanBadge({ abonnements }) {
  const info = getPlanInfo(abonnements);
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', backgroundColor: info.bg, color: info.color, borderRadius:999, fontSize:'.75rem', fontWeight:600 }}>
      {info.icon} {info.label}
    </span>
  );
}

function ModalPrestataire({ prestataire, onClose }) {
  if (!prestataire) return null;
  const entreprises = prestataire.entreprises || [];
  const planInfo = getPlanInfo(prestataire.abonnements);
  const abonnementActif = (prestataire.abonnements || []).find(a => a.statut === 'actif');

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, backgroundColor:'rgba(15,23,42,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor:'#fff', borderRadius:16, maxWidth:640, width:'100%', maxHeight:'88vh', overflowY:'auto', boxShadow:'0 25px 50px rgba(0,0,0,.2)' }}>
        {/* Header */}
        <div style={{ padding:'1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', backgroundColor:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', fontWeight:700, color:'#1e40af', flexShrink:0 }}>
              {prestataire.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize:'1.2rem', fontWeight:700, color:'#0f172a', marginBottom:4 }}>{prestataire.name}</h2>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:'.8rem', color:'#64748b' }}>{prestataire.email}</span>
                <PlanBadge abonnements={prestataire.abonnements} />
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:'1.5rem', lineHeight:1 }}>×</button>
        </div>

        <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          {/* Infos personnelles */}
          <Section title="Informations personnelles" icon={<FiUser />}>
            <Grid2>
              <InfoItem label="Téléphone" value={prestataire.phone || 'Non renseigné'} icon={<FiPhone size={13} />} />
              <InfoItem label="Membre depuis" value={new Date(prestataire.created_at).toLocaleDateString('fr-FR')} icon={<FiCalendar size={13} />} />
              <InfoItem label="Rôle" value={prestataire.role} icon={<FiUser size={13} />} />
              <InfoItem label="Dernière connexion" value={prestataire.last_seen_at ? new Date(prestataire.last_seen_at).toLocaleDateString('fr-FR') : 'Inconnu'} icon={<FiClock size={13} />} />
            </Grid2>
          </Section>

          {/* Abonnement actif */}
          <Section title="Abonnement actif" icon={<FiAward />}>
            {abonnementActif ? (
              <div style={{ backgroundColor: planInfo.bg, borderRadius:10, padding:'1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontWeight:600, color: planInfo.color, fontSize:'.95rem' }}>{abonnementActif.plan?.name || planInfo.label}</span>
                  <PlanBadge abonnements={prestataire.abonnements} />
                </div>
                <Grid2>
                  <InfoItem label="Début" value={abonnementActif.date_debut || '—'} />
                  <InfoItem label="Fin" value={abonnementActif.date_fin || '—'} />
                  <InfoItem label="Jours restants" value={abonnementActif.jours_restants !== undefined ? `${abonnementActif.jours_restants} j` : '—'} />
                  <InfoItem label="Référence" value={abonnementActif.reference || '—'} />
                </Grid2>
              </div>
            ) : (
              <p style={{ color:'#94a3b8', fontSize:'.875rem', margin:0 }}>Aucun abonnement actif</p>
            )}
          </Section>

          {/* Historique abonnements */}
          {prestataire.abonnements?.length > 0 && (
            <Section title={`Historique abonnements (${prestataire.abonnements.length})`} icon={<FiClock />}>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {prestataire.abonnements.map((ab, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', backgroundColor:'#f8fafc', borderRadius:8, fontSize:'.8rem' }}>
                    <span style={{ color:'#334155', fontWeight:500 }}>{ab.plan?.name || ab.type || '—'}</span>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ color:'#64748b' }}>{ab.date_debut} → {ab.date_fin}</span>
                      <span style={{ padding:'2px 8px', borderRadius:999, fontSize:'.7rem', fontWeight:600, backgroundColor: ab.statut === 'actif' ? '#d1fae5' : '#f1f5f9', color: ab.statut === 'actif' ? '#065f46' : '#475569' }}>
                        {ab.statut}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Entreprises */}
          <Section title={`Entreprises (${entreprises.length})`} icon={<MdOutlineBusinessCenter />}>
            {entreprises.length === 0 ? (
              <p style={{ color:'#94a3b8', fontSize:'.875rem', margin:0 }}>Aucune entreprise</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {entreprises.map((e, i) => (
                  <div key={i} style={{ padding:'10px 12px', backgroundColor:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontWeight:600, color:'#0f172a', fontSize:'.9rem' }}>{e.name}</span>
                      <StatutBadge statut={e.status} />
                    </div>
                    <div style={{ display:'flex', gap:12, fontSize:'.75rem', color:'#64748b', flexWrap:'wrap' }}>
                      <span>IFU: {e.ifu_number || '—'}</span>
                      <span>RCCM: {e.rccm_number || '—'}</span>
                      {e.services_count !== undefined && <span>{e.services_count} service(s)</span>}
                      {e.isInTrialPeriod && <span style={{ color:'#d97706' }}>⬡ En essai ({e.trial_days_remaining}j restants)</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <h3 style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.85rem', fontWeight:600, color:'#334155', textTransform:'uppercase', letterSpacing:.3, marginBottom:'.875rem' }}>
        <span style={{ color: theme.colors.primary }}>{icon}</span>{title}
      </h3>
      {children}
    </div>
  );
}

function Grid2({ children }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>{children}</div>;
}

function InfoItem({ label, value, icon }) {
  return (
    <div style={{ backgroundColor:'#f8fafc', borderRadius:8, padding:'8px 10px' }}>
      <div style={{ fontSize:'.7rem', color:'#64748b', marginBottom:2, display:'flex', alignItems:'center', gap:4 }}>
        {icon}{label}
      </div>
      <div style={{ fontSize:'.875rem', fontWeight:500, color:'#0f172a' }}>{value}</div>
    </div>
  );
}

export default function AdminPrestataires() {
  const navigate = useNavigate();
  const [prestataires, setPrestataires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/entreprises');
      const entreprises = res.data?.data || [];
      const byUser = {};
      entreprises.forEach(e => {
        const u = e.prestataire;
        if (!u) return;
        if (!byUser[u.id]) {
          byUser[u.id] = { ...u, entreprises: [], abonnements: [] };
        }
        byUser[u.id].entreprises.push(e);
        if (e.abonnements) byUser[u.id].abonnements.push(...e.abonnements);
      });
      setPrestataires(Object.values(byUser));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = prestataires.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q);
    const planInfo = getPlanInfo(p.abonnements);
    const matchPlan =
      filterPlan === 'all' ? true :
      filterPlan === 'trial' ? planInfo.label === 'Essai gratuit' :
      filterPlan === 'paid'  ? !['Aucun plan','Essai gratuit'].includes(planInfo.label) :
      filterPlan === 'none'  ? planInfo.label === 'Aucun plan' : true;
    const hasValidated = p.entreprises?.some(e => e.status === 'validated');
    const hasPending   = p.entreprises?.some(e => e.status === 'pending');
    const matchStatut =
      filterStatut === 'all'       ? true :
      filterStatut === 'validated' ? hasValidated :
      filterStatut === 'pending'   ? hasPending :
      filterStatut === 'rejected'  ? !hasValidated && !hasPending : true;
    return matchSearch && matchPlan && matchStatut;
  }).sort((a, b) => {
    let va = a[sortKey] || '', vb = b[sortKey] || '';
    if (sortKey === 'entreprises') { va = a.entreprises?.length || 0; vb = b.entreprises?.length || 0; }
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const stats = {
    total:   prestataires.length,
    trial:   prestataires.filter(p => getPlanInfo(p.abonnements).label === 'Essai gratuit').length,
    paid:    prestataires.filter(p => !['Aucun plan','Essai gratuit'].includes(getPlanInfo(p.abonnements).label)).length,
    none:    prestataires.filter(p => getPlanInfo(p.abonnements).label === 'Aucun plan').length,
  };

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === 'asc' ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />)
    : <FiChevronDown size={13} style={{ opacity:.3 }} />;

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', padding:'2rem 0' }}>
      <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 1.5rem' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'2rem', fontWeight:700, color:'#0f172a', marginBottom:4, display:'flex', alignItems:'center', gap:10 }}>
              <FiUser style={{ color: theme.colors.primary }} /> Prestataires
            </h1>
            <p style={{ color:'#64748b', fontSize:'.95rem' }}>Vue globale de tous les prestataires inscrits</p>
          </div>
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button onClick={fetchData} style={{ display:'flex', alignItems:'center', gap:6, padding:'.625rem 1.25rem', backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:10, color:'#475569', fontSize:'.875rem', fontWeight:500, cursor:'pointer' }}>
              <FiRefreshCw size={14} /> Rafraîchir
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {[
            { label:'Total prestataires', val: stats.total,  icon:<FiUser />,         color:'#3b82f6', bg:'#dbeafe' },
            { label:'En essai gratuit',   val: stats.trial,  icon:<FiGift />,          color:'#d97706', bg:'#fef3c7' },
            { label:'Abonnés (payant)',   val: stats.paid,   icon:<FiAward />,          color:'#10b981', bg:'#d1fae5' },
            { label:'Sans abonnement',   val: stats.none,   icon:<FiAlertTriangle />, color:'#ef4444', bg:'#fee2e2' },
          ].map(({ label, val, icon, color, bg }) => (
            <div key={label} style={{ backgroundColor:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:'1.25rem', display:'flex', alignItems:'center', gap:'1rem' }}>
              <div style={{ width:44, height:44, borderRadius:10, backgroundColor: bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', color }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize:'.7rem', color:'#64748b', textTransform:'uppercase', letterSpacing:.5, marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:'1.6rem', fontWeight:600, color:'#0f172a', lineHeight:1 }}>{val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ backgroundColor:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:'1.25rem', marginBottom:'1.5rem', display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:220 }}>
            <FiSearch style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher par nom, email, téléphone..." style={{ width:'100%', padding:'.625rem .75rem .625rem 2.5rem', border:'1px solid #e2e8f0', borderRadius:8, fontSize:'.875rem', outline:'none', boxSizing:'border-box' }} />
          </div>
          <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(1); }} style={{ padding:'.625rem 1rem', border:'1px solid #e2e8f0', borderRadius:8, fontSize:'.875rem', color:'#334155', cursor:'pointer' }}>
            <option value="all">Tous les plans</option>
            <option value="none">Sans abonnement</option>
            <option value="trial">Essai gratuit</option>
            <option value="paid">Abonné (payant)</option>
          </select>
          <select value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setPage(1); }} style={{ padding:'.625rem 1rem', border:'1px solid #e2e8f0', borderRadius:8, fontSize:'.875rem', color:'#334155', cursor:'pointer' }}>
            <option value="all">Tous les statuts</option>
            <option value="validated">Entreprise validée</option>
            <option value="pending">En attente</option>
            <option value="rejected">Rejeté</option>
          </select>
          <span style={{ fontSize:'.875rem', color:'#64748b', whiteSpace:'nowrap' }}>{filtered.length} résultat(s)</span>
        </div>

        {/* Tableau */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'4rem', color:'#64748b' }}>
            <div style={{ width:40, height:40, border:`3px solid #e2e8f0`, borderTop:`3px solid ${theme.colors.primary}`, borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 1rem' }} />
            Chargement...
          </div>
        ) : (
          <div style={{ backgroundColor:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
                <thead>
                  <tr style={{ backgroundColor:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                    {[
                      { label:'Prestataire', key:'name' },
                      { label:'Contact', key:'email' },
                      { label:'Plan actuel', key:null },
                      { label:'Entreprises', key:'entreprises' },
                      { label:'Inscription', key:'created_at' },
                      { label:'Statut', key:null },
                      { label:'', key:null },
                    ].map(({ label, key }, i) => (
                      <th key={i} onClick={key ? () => handleSort(key) : undefined} style={{ padding:'12px 16px', textAlign:'left', fontSize:'.75rem', fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:.5, cursor: key ? 'pointer' : 'default', userSelect:'none', whiteSpace:'nowrap' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>{label}{key && <SortIcon k={key} />}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>Aucun prestataire trouvé</td></tr>
                  ) : paginated.map(p => {
                    const hasValidated = p.entreprises?.some(e => e.status === 'validated');
                    const hasPending   = p.entreprises?.some(e => e.status === 'pending');
                    return (
                      <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9', transition:'background .15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='#fafafa'} onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:36, height:36, borderRadius:'50%', backgroundColor:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.85rem', fontWeight:700, color:'#1e40af', flexShrink:0 }}>
                              {p.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:600, color:'#0f172a', fontSize:'.875rem' }}>{p.name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ fontSize:'.8rem', color:'#334155' }}>{p.email}</div>
                          {p.phone && <div style={{ fontSize:'.75rem', color:'#64748b', marginTop:2 }}>{p.phone}</div>}
                        </td>
                        <td style={{ padding:'12px 16px' }}><PlanBadge abonnements={p.abonnements} /></td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ fontSize:'.875rem', color:'#334155' }}>
                            {p.entreprises?.length || 0} entreprise(s)
                          </div>
                          <div style={{ fontSize:'.75rem', color:'#64748b', marginTop:2 }}>
                            {p.entreprises?.filter(e=>e.status==='validated').length || 0} validée(s)
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:'.8rem', color:'#64748b', whiteSpace:'nowrap' }}>
                          {new Date(p.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          {hasValidated ? <StatutBadge statut="validated" /> :
                           hasPending   ? <StatutBadge statut="pending" /> :
                           <StatutBadge statut="rejected" />}
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <button onClick={() => setSelected(p)} style={{ display:'flex', alignItems:'center', gap:5, padding:'.4rem .875rem', backgroundColor: theme.colors.primary, color:'#fff', border:'none', borderRadius:8, fontSize:'.8rem', fontWeight:500, cursor:'pointer' }}>
                            <FiEye size={13} /> Détails
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, padding:'1rem', borderTop:'1px solid #f1f5f9' }}>
                <button disabled={page===1} onClick={() => setPage(p=>p-1)} style={{ padding:'.375rem .875rem', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', cursor:'pointer', color:'#475569', fontSize:'.875rem' }}>←</button>
                <span style={{ fontSize:'.875rem', color:'#64748b' }}>Page {page} / {pages}</span>
                <button disabled={page===pages} onClick={() => setPage(p=>p+1)} style={{ padding:'.375rem .875rem', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', cursor:'pointer', color:'#475569', fontSize:'.875rem' }}>→</button>
              </div>
            )}
          </div>
        )}
      </div>

      {selected && <ModalPrestataire prestataire={selected} onClose={() => setSelected(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}