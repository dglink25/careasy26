import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';
import { publicApi } from '../api/publicApi';
import api from '../api/axios';
import ServiceSelectionModal from '../components/ServiceSelectionModal';
import {
  FiSearch, FiX, FiNavigation2, FiPhone, FiMessageSquare,
  FiCalendar, FiMapPin, FiZap, FiChevronUp, FiChevronDown,
  FiArrowLeft, FiExternalLink, FiRefreshCw, FiMap, FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import {
  FaWhatsapp, FaRoute, FaWalking, FaBiking, FaCar,
} from 'react-icons/fa';
import { MdBusiness, MdDirections } from 'react-icons/md';

// ── Leaflet icon fix ──────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PRIMARY   = '#dc2626';
const DEFAULT_POS = [6.3654, 2.4183];
const ORS_KEY   = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjU5YWUyNTQ2MjU4MTQ0ZDBiMzk0MGJkMzZlZDc5NTQwIiwiaCI6Im11cm11cjY0In0=';

// ── Icônes Leaflet custom ─────────────────────────────────────────────────────
const userIcon = L.divIcon({
  html: `<div style="position:relative;width:22px;height:22px;">
    <div style="position:absolute;inset:-8px;background:rgba(59,130,246,.15);border-radius:50%;animation:pring 2s ease-out infinite;"></div>
    <div style="width:22px;height:22px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,.4);"></div>
  </div>`,
  className:'', iconAnchor:[11,11], iconSize:[22,22],
});

function makeEntIcon(name, logo, selected) {
  const bg    = selected ? PRIMARY : '#fff';
  const color = selected ? '#fff'  : '#1e293b';
  const label = name.length > 10 ? name.substring(0,10)+'…' : name;
  return L.divIcon({
    html:`<div style="display:flex;align-items:center;gap:5px;background:${bg};color:${color};
      padding:5px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;
      border:${selected?'none':'1.5px solid rgba(220,38,38,.3)'};
      filter:drop-shadow(0 ${selected?4:2}px ${selected?12:6}px rgba(${selected?'220,38,38':'0,0,0'},.${selected?'4':'2'}));
      font-family:-apple-system,sans-serif;">
      <div style="width:20px;height:20px;border-radius:6px;overflow:hidden;
        background:${selected?'rgba(255,255,255,.2)':'rgba(220,38,38,.1)'};
        display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        ${logo
          ? `<img src="${logo}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
          : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${selected?'#fff':'#dc2626'}" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
        }
      </div>
      <span>${label}</span>
      ${selected?'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>':''}
    </div>`,
    className:'', iconAnchor:[60,18], iconSize:[120,36],
  });
}

function destIcon(name) {
  const label = name.length > 14 ? name.substring(0,14)+'…' : name;
  return L.divIcon({
    html:`<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="background:${PRIMARY};color:#fff;padding:5px 10px;border-radius:10px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 3px 10px rgba(220,38,38,.4);font-family:-apple-system,sans-serif;max-width:120px;overflow:hidden;text-overflow:ellipsis;">${label}</div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${PRIMARY};"></div>
      <div style="width:14px;height:14px;background:${PRIMARY};border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(220,38,38,.5);"></div>
    </div>`,
    className:'', iconAnchor:[60,46], iconSize:[120,46],
  });
}

// ── Helpers carte ─────────────────────────────────────────────────────────────
function MapController({ center, zoom, fitBounds }) {
  const map = useMap();
  useEffect(() => {
    if (fitBounds?.length >= 2) map.fitBounds(fitBounds, { padding:[60,60] });
    else if (center) map.setView(center, zoom||13, { animate:true });
  }, [center, zoom, fitBounds]);
  return null;
}
function MapClickHandler({ onClick }) {
  useMapEvents({ click: onClick });
  return null;
}

function haversine([lat1,lng1],[lat2,lng2]) {
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// ═════════════════════════════════════════════════════════════════════════════
export default function MapScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Data
  const [entreprises, setEntreprises] = useState([]);
  const [domaines,    setDomaines]    = useState([]);
  const [filtered,    setFiltered]    = useState([]);

  // Map
  const [userPos,     setUserPos]     = useState(null);
  const [isLocating,  setIsLocating]  = useState(false);
  const [mapCenter,   setMapCenter]   = useState(DEFAULT_POS);
  const [mapZoom,     setMapZoom]     = useState(13);
  const [fitBounds,   setFitBounds]   = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);

  // Filtres
  const [searchQuery,     setSearchQuery]     = useState('');
  const [selectedDomaine, setSelectedDomaine] = useState(null);
  const [searchFocused,   setSearchFocused]   = useState(false);

  // Modal entreprise
  const [selectedEnt,  setSelectedEnt]  = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Itinéraire (intégré dans le panneau bas)
  const [showItinerary, setShowItinerary] = useState(false);
  const [itinMode,      setItinMode]      = useState('driving-car');
  const [route,         setRoute]         = useState([]);
  const [itinLoading,   setItinLoading]   = useState(false);
  const [distanceKm,    setDistanceKm]    = useState(null);
  const [durationMin,   setDurationMin]   = useState(null);
  const [steps,         setSteps]         = useState([]);
  const [stepsExpanded, setStepsExpanded] = useState(false);

  // Liste bas
  const [bottomExpanded, setBottomExpanded] = useState(false);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([fetchEntreprises(), fetchDomaines(), getUserLocation()]);
  }, []);

  useEffect(() => { applyFilter(); }, [entreprises, selectedDomaine, searchQuery]);

  // ── Data ────────────────────────────────────────────────────────────────────
  async function fetchEntreprises() {
    try {
      const data = await publicApi.getEntreprises();
      setEntreprises(data || []);
    } catch {}
    finally { setIsLoading(false); }
  }
  async function fetchDomaines() {
    try { setDomaines(await publicApi.getDomaines() || []); } catch {}
  }

  function getUserLocation() {
    setIsLocating(true);
    if (!navigator.geolocation) { setIsLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const ll = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(ll); setMapCenter(ll);
        setIsLocating(false);
      },
      () => { setUserPos(DEFAULT_POS); setIsLocating(false); },
      { enableHighAccuracy:true, timeout:10000 }
    );
  }

  function applyFilter() {
    setFiltered(entreprises.filter(e => {
      const matchDom = !selectedDomaine || (e.domaines||[]).some(d=>d.name===selectedDomaine);
      const matchQ   = !searchQuery     || (e.name||'').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDom && matchQ;
    }));
  }

  const geoEnts = filtered.filter(e => e.latitude && e.longitude);

  // ── Sélection entreprise ────────────────────────────────────────────────────
  function selectEnt(e) {
    const lat = parseFloat(e.latitude), lng = parseFloat(e.longitude);
    setSelectedEnt(e); setModalVisible(true);
    setShowItinerary(false); setRoute([]); setSteps([]);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng - 0.003]); setMapZoom(16); setFitBounds(null);
    }
  }
  function closeModal() {
    setModalVisible(false); setSelectedEnt(null);
    setShowItinerary(false); setRoute([]); setSteps([]);
    setStepsExpanded(false);
  }

  // ── Distance ─────────────────────────────────────────────────────────────────
  function distanceTo(e) {
    if (!userPos) return null;
    const lat=parseFloat(e.latitude), lng=parseFloat(e.longitude);
    if (isNaN(lat)||isNaN(lng)) return null;
    return haversine(userPos,[lat,lng]);
  }
  function fmtDist(d) {
    if (d==null) return null;
    return d<1 ? `${Math.round(d*1000)} m` : `${d.toFixed(1)} km`;
  }

  // ── Itinéraire ───────────────────────────────────────────────────────────────
  const buildRoute = useCallback(async (mode=itinMode) => {
    if (!userPos||!selectedEnt) return;
    const lat=parseFloat(selectedEnt.latitude), lng=parseFloat(selectedEnt.longitude);
    if (isNaN(lat)||isNaN(lng)) return;
    setItinLoading(true); setRoute([]); setSteps([]);
    try {
      const resp = await fetch(
        `https://api.openrouteservice.org/v2/directions/${mode}/geojson`,
        { method:'POST', headers:{ Authorization:ORS_KEY, 'Content-Type':'application/json', Accept:'application/json' },
          body:JSON.stringify({ coordinates:[[userPos[1],userPos[0]],[lng,lat]], instructions:true, language:'fr' }) }
      );
      if (resp.ok) {
        const data  = await resp.json();
        const pts   = data.features[0].geometry.coordinates.map(c=>[c[1],c[0]]);
        const sum   = data.features[0].properties.summary;
        const segs  = data.features[0].properties.segments||[];
        const allSt = [];
        segs.forEach(seg=>(seg.steps||[]).forEach(s=>allSt.push({
          instruction:s.instruction||'', distance:((s.distance||0)/1000).toFixed(1), type:s.type||0
        })));
        setRoute(pts); setDistanceKm((sum.distance/1000).toFixed(1));
        setDurationMin(Math.round(sum.duration/60)); setSteps(allSt);
        setFitBounds([userPos,[lat,lng]]);
      } else { fallback(lat,lng); }
    } catch { fallback(lat,lng); }
    finally { setItinLoading(false); }
  },[userPos,selectedEnt,itinMode]);

  function fallback(lat,lng) {
    const pts=[userPos,[lat,lng]];
    setRoute(pts); setFitBounds(pts);
    const dist=haversine(userPos,[lat,lng]);
    setDistanceKm(dist.toFixed(1)); setDurationMin(Math.round((dist/40)*60));
    setSteps([
      {instruction:`Suivre la direction vers ${selectedEnt?.name}`,distance:dist.toFixed(1),type:0},
      {instruction:`Arriver à ${selectedEnt?.name}`,distance:'0',type:10},
    ]);
  }

  function changeMode(mode) { setItinMode(mode); buildRoute(mode); }

  function openItinerary() {
    setShowItinerary(true); buildRoute();
  }

  // Option : ouvrir dans l'écran dédié ItineraryScreen
  function openFullItinerary() {
    if (!selectedEnt) return;
    navigate('/itineraire', {
      state: {
        destination: [parseFloat(selectedEnt.latitude), parseFloat(selectedEnt.longitude)],
        destinationName: selectedEnt.name,
        userPosition: userPos,
      }
    });
  }

  function openGoogleMaps() {
    if (!selectedEnt) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedEnt.latitude},${selectedEnt.longitude}&travelmode=driving`,'_blank');
  }

  function fmtDuration(min) {
    if (!min) return '---';
    if (min>=60) return `${Math.floor(min/60)}h ${min%60}min`;
    return `${min} min`;
  }

  function stepIcon(type) {
    if (type===10) return '🏁';
    if ([1,5].includes(type)) return '↱';
    if ([2,6].includes(type)) return '↰';
    return '↑';
  }

  // ── Actions contact ──────────────────────────────────────────────────────────
  function handleCall()  { const p=selectedEnt?.call_phone;     if(p) window.open(`tel:${p}`); }
  function handleWA()    { const p=selectedEnt?.whatsapp_phone; if(p) window.open(`https://wa.me/${p.replace(/\D/g,'')}`); }
  function handleChat()  { if(!user){navigate('/login');return;} navigate('/messages',{state:{openConversationWith:selectedEnt?.id}}); }
  function handleRdv() {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowServiceModal(true);
  }

  function handleViewEnt() { navigate(`/entreprises/${selectedEnt?.id}`); }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      <style>{CSS}</style>

      {/* ── CARTE ─────────────────────────────────────────────────────────── */}
      <MapContainer center={mapCenter} zoom={mapZoom} style={s.map} zoomControl={false}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19}
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>' />
        <MapController center={mapCenter} zoom={mapZoom} fitBounds={fitBounds} />
        <MapClickHandler onClick={closeModal} />

        {userPos && <Marker position={userPos} icon={userIcon} />}

        {geoEnts.map(e => (
          <Marker key={e.id}
            position={[parseFloat(e.latitude), parseFloat(e.longitude)]}
            icon={makeEntIcon(e.name, e.logo, selectedEnt?.id===e.id)}
            eventHandlers={{ click: ev => { ev.originalEvent.stopPropagation(); selectEnt(e); } }}
          />
        ))}

        {showItinerary && selectedEnt && (
          <Marker position={[parseFloat(selectedEnt.latitude), parseFloat(selectedEnt.longitude)]}
            icon={destIcon(selectedEnt.name)} />
        )}

        {route.length>1 && <>
          <Polyline positions={route} color="rgba(0,0,0,.12)" weight={10} />
          <Polyline positions={route} color={PRIMARY} weight={5} />
        </>}
      </MapContainer>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <button style={s.glassBtn} onClick={()=>navigate(-1)} aria-label="Retour">
            <FiArrowLeft size={18} color="#fff" />
          </button>
          <div style={{ ...s.searchBar, boxShadow: searchFocused ? `0 0 0 2px ${PRIMARY}` : '0 4px 14px rgba(0,0,0,.15)' }}>
            <FiSearch size={16} color={PRIMARY} style={{flexShrink:0}} />
            <input type="text" placeholder="Rechercher une entreprise…" value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              onFocus={()=>setSearchFocused(true)} onBlur={()=>setSearchFocused(false)}
              style={s.searchInput} />
            {searchQuery && (
              <button style={s.clearBtn} onClick={()=>setSearchQuery('')} aria-label="Effacer">
                <FiX size={14} color="#94a3b8" />
              </button>
            )}
          </div>
          <div style={s.countBadge}>{geoEnts.length}</div>
        </div>
      </div>

      {/* ── CHIPS DOMAINES ────────────────────────────────────────────────── */}
      {domaines.length>0 && (
        <div style={s.chipsRow}>
          <div style={s.chipsScroll}>
            <button style={{...s.chip,...(selectedDomaine===null?s.chipActive:{})}}
              onClick={()=>setSelectedDomaine(null)}>Tous</button>
            {domaines.map(d=>(
              <button key={d.id}
                style={{...s.chip,...(selectedDomaine===d.name?s.chipActive:{})}}
                onClick={()=>setSelectedDomaine(selectedDomaine===d.name?null:d.name)}>
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── BOUTONS DROITE ────────────────────────────────────────────────── */}
      <div style={s.rightBtns}>
        <button style={{...s.mapBtn,...(isLocating?{background:PRIMARY}:{})}}
          onClick={getUserLocation} title="Ma position">
          {isLocating
            ? <FiRefreshCw size={18} color="#fff" style={{animation:'spin 1s linear infinite'}} />
            : <FiNavigation2 size={18} color={PRIMARY} />}
        </button>
        <button style={s.mapBtn}
          onClick={()=>{setFitBounds(null);setMapCenter(DEFAULT_POS);setMapZoom(13);}} title="Vue d'ensemble">
          <FiMap size={18} color="#64748b" />
        </button>
      </div>

      {/* ── LOADING ───────────────────────────────────────────────────────── */}
      {isLoading && (
        <div style={s.loadingOverlay}>
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <p style={{margin:0,fontSize:13,color:'#475569',fontWeight:500}}>Chargement de la carte…</p>
          </div>
        </div>
      )}

      {/* ── MODAL ENTREPRISE ──────────────────────────────────────────────── */}
      {modalVisible && selectedEnt && (
        <div style={s.modal} className="modal-slide-up">
          {showItinerary ? (
            /* ── PANNEAU ITINÉRAIRE ── */
            <ItinPanel
              selectedEnt={selectedEnt}
              userPos={userPos}
              itinMode={itinMode}
              itinLoading={itinLoading}
              distanceKm={distanceKm}
              durationMin={durationMin}
              steps={steps}
              stepsExpanded={stepsExpanded}
              setStepsExpanded={setStepsExpanded}
              changeMode={changeMode}
              openGoogleMaps={openGoogleMaps}
              openFullItinerary={openFullItinerary}
              fmtDuration={fmtDuration}
              stepIcon={stepIcon}
              onBack={()=>{setShowItinerary(false);setRoute([]);setSteps([]);}}
            />
          ) : (
            /* ── FICHE ENTREPRISE ── */
            <EntreprisePanel
              ent={selectedEnt}
              dist={fmtDist(distanceTo(selectedEnt))}
              onClose={closeModal}
              onCall={handleCall}
              onWA={handleWA}
              onChat={handleChat}
              onRdv={handleRdv}
              onItinerary={openItinerary}
              onViewEnt={handleViewEnt}
            />
          )}
        </div>
      )}

      {/* ── LISTE BAS (quand modal fermée) ───────────────────────────────── */}
      {!modalVisible && (
        <div style={s.bottomList}>
          <div style={s.bottomListHandle}
            onClick={()=>setBottomExpanded(p=>!p)} role="button" tabIndex={0}>
            <div style={s.handle} />
            <span style={s.bottomTitle}>
              {filtered.length} entreprise{filtered.length>1?'s':''}
            </span>
            {bottomExpanded ? <FiChevronDown size={16} color="#94a3b8" /> : <FiChevronUp size={16} color="#94a3b8" />}
          </div>
          <div style={s.cardScroll}>
            {filtered.map(e=>{
              const d=distanceTo(e);
              return (
                <button key={e.id} style={s.entCard}
                  onClick={()=>{if(e.latitude&&e.longitude)selectEnt(e);}}>
                  <div style={s.entCardImg}>
                    {e.logo
                      ? <img src={e.logo} alt={e.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                      : <MdBusiness size={24} color="#cbd5e1" />}
                  </div>
                  <div style={s.entCardBody}>
                    <p style={s.entCardName}>{e.name}</p>
                    {(e.domaines||[]).length>0&&<p style={s.entCardDom}>{e.domaines[0].name}</p>}
                    {d!=null&&(
                      <div style={s.entCardDist}>
                        <FiNavigation2 size={9} color={PRIMARY} />
                        <span style={{fontSize:10,color:PRIMARY,fontWeight:600}}>{fmtDist(d)}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL SÉLECTION SERVICE ──────────────────────────────────────── */}
      {showSvcModal && selectedEnt && (
        <div style={s.svcOverlay} onClick={()=>setShowSvcModal(false)}>
          <div style={s.svcBox} onClick={e=>e.stopPropagation()}>
            <div style={s.svcHeader}>
              <div>
                <p style={{margin:0,fontSize:11,color:'rgba(255,255,255,.75)',fontWeight:500}}>Choisir un service</p>
                <p style={{margin:0,fontSize:16,fontWeight:800,color:'#fff'}}>{selectedEnt.name}</p>
              </div>
              <button style={s.svcClose} onClick={()=>setShowSvcModal(false)}><FiX size={18} color="#fff"/></button>
            </div>
            <div style={{padding:'16px 16px 28px'}}>
              <p style={{margin:'0 0 12px',fontSize:12,color:'#64748b',fontWeight:500}}>
                Sélectionnez le service pour lequel vous souhaitez prendre rendez-vous :
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {(selectedEnt.services||[]).map(svc=>(
                  <button key={svc.id} style={s.svcCard}
                    onClick={()=>{setShowSvcModal(false);navigate(`/rendez-vous/demande/${svc.id}`);}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=PRIMARY;e.currentTarget.style.background='rgba(220,38,38,.04)';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.background='#fff';}}>
                    <div style={s.svcCardIcon}><FiZap size={16} color={PRIMARY}/></div>
                    <div style={{flex:1,textAlign:'left'}}>
                      <p style={{margin:0,fontSize:13,fontWeight:700,color:'#1e293b'}}>{svc.name}</p>
                      {svc.price&&<p style={{margin:'2px 0 0',fontSize:11,color:'#64748b'}}>{svc.price} FCFA</p>}
                    </div>
                    <FiChevronDown size={16} color="#94a3b8" style={{transform:'rotate(-90deg)'}} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <ServiceSelectionModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        entreprise={selectedEnt}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Sous-composants
// ═════════════════════════════════════════════════════════════════════════════

function EntreprisePanel({ ent, dist, onClose, onCall, onWA, onChat, onRdv, onItinerary, onViewEnt }) {
  const hasPhone = !!ent?.call_phone;
  const hasWA    = !!ent?.whatsapp_phone;
  const hasPosn  = !!(ent?.latitude && ent?.longitude);

  return (
    <div>
      <div style={s.handle} />
      {/* Bannière */}
      <div style={s.banner}>
        {(ent.image_boutique||ent.logo)
          ? <img src={ent.image_boutique||ent.logo} alt={ent.name} style={s.bannerImg} />
          : <div style={s.bannerPlaceholder}><MdBusiness size={40} color="rgba(220,38,38,.2)"/></div>}
        <div style={s.bannerGradient} />
        <button style={s.closeBtn} onClick={onClose}><FiX size={16} color="#fff"/></button>
        <div style={s.bannerInfo}>
          <div style={s.entLogo}>
            {ent.logo
              ? <img src={ent.logo} alt={ent.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : <MdBusiness size={22} color="#dc2626"/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={s.entName}>{ent.name}</p>
            {ent.status==='validated'&&(
              <div style={s.verifiedRow}>
                <FiCheckCircle size={11} color="#4CAF50"/>
                <span style={{fontSize:10,color:'#4CAF50',fontWeight:600}}>Vérifié</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={s.modalBody}>
        {(ent.domaines||[]).length>0&&(
          <div style={s.domainesRow}>
            {(ent.domaines||[]).slice(0,3).map(d=>(
              <span key={d.id} style={s.domainePill}>{d.name}</span>
            ))}
          </div>
        )}
        {(ent.google_formatted_address||ent.siege)&&(
          <div style={s.addrRow}>
            <FiMapPin size={13} color="#dc2626"/>
            <span style={s.addrText}>{ent.google_formatted_address||ent.siege}</span>
            {dist&&<span style={s.distBadge}>{dist}</span>}
          </div>
        )}

        {/* 5 actions */}
        <div style={s.actionsRow}>
          <ActionIcon icon={<FiPhone size={22}/>}       label="Appeler"    color="#4CAF50"  disabled={!hasPhone} onClick={onCall}/>
          <ActionIcon icon={<FaWhatsapp size={22}/>}    label="WhatsApp"   color="#25D366"  disabled={!hasWA}    onClick={onWA}/>
          <ActionIcon icon={<FiMessageSquare size={22}/>} label="Message"  color="#8b5cf6"                       onClick={onChat}/>
          <ActionIcon icon={<FiCalendar size={22}/>}    label="Rendez-vous" color="#3b82f6"                      onClick={onRdv}/>
          <ActionIcon icon={<FaRoute size={22}/>}       label="Itinéraire" color="#dc2626"  disabled={!hasPosn} onClick={onItinerary}/>
        </div>

        <button style={s.servicesBtn} onClick={onViewEnt}>
          <MdBusiness size={18} color="#fff"/>
          {(ent.services||[]).length>0
            ? `Consulter les services (${(ent.services||[]).length})`
            : 'Voir les services'}
        </button>
      </div>
    </div>
  );
}

function ItinPanel({ selectedEnt, userPos, itinMode, itinLoading, distanceKm, durationMin,
  steps, stepsExpanded, setStepsExpanded, changeMode, openGoogleMaps, openFullItinerary,
  fmtDuration, stepIcon, onBack }) {
  return (
    <div style={{padding:'0 16px 20px'}}>
      <div style={s.handle} />
      {/* Header itinéraire */}
      <div style={s.itinHeader}>
        <button style={s.itinBack} onClick={onBack}>
          <FiArrowLeft size={16} color="#dc2626"/>
          <span style={{fontSize:13,color:'#dc2626',fontWeight:600}}>Retour</span>
        </button>
        <div style={{flex:1,minWidth:0}}>
          <p style={{margin:0,fontSize:11,color:'#94a3b8'}}>Itinéraire vers</p>
          <p style={{margin:0,fontSize:14,fontWeight:700,color:'#1e293b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {selectedEnt.name}
          </p>
        </div>
        <button style={{...s.glassBtn2}} onClick={openGoogleMaps} title="Google Maps">
          <FiExternalLink size={16} color="#475569"/>
        </button>
        <button style={{...s.glassBtn2,marginLeft:6}} onClick={openFullItinerary} title="Écran complet">
          <FiMap size={16} color="#475569"/>
        </button>
      </div>

      {/* Modes transport */}
      <div style={s.modePicker}>
        {[
          {mode:'driving-car',    Icon:FaCar,     label:'Voiture'},
          {mode:'foot-walking',   Icon:FaWalking, label:'Marche'},
          {mode:'cycling-regular',Icon:FaBiking,  label:'Vélo'},
        ].map(({mode,Icon,label})=>(
          <button key={mode} style={{...s.modeBtn,...(itinMode===mode?s.modeBtnActive:{})}}
            onClick={()=>changeMode(mode)}>
            <Icon size={18} color={itinMode===mode?'#fff':'#64748b'}/>
            <span style={{fontSize:10,fontWeight:600}}>{label}</span>
          </button>
        ))}
      </div>

      {/* Chips info */}
      {itinLoading
        ? <div style={{display:'flex',justifyContent:'center',padding:'16px 0'}}><div style={s.spinner}/></div>
        : <div style={s.itinChips}>
            <div style={s.itinChip}>
              <FiMapPin size={16} color="#3b82f6"/>
              <span style={s.itinChipValue}>{distanceKm?`${distanceKm} km`:'---'}</span>
              <span style={s.itinChipLabel}>Distance</span>
            </div>
            <div style={s.itinChip}>
              <FiClock size={16} color="#dc2626"/>
              <span style={s.itinChipValue}>{fmtDuration(durationMin)}</span>
              <span style={s.itinChipLabel}>Durée estimée</span>
            </div>
            <div style={s.itinChip}>
              {itinMode==='driving-car'?<FaCar size={16} color="#10b981"/>:itinMode==='foot-walking'?<FaWalking size={16} color="#10b981"/>:<FaBiking size={16} color="#10b981"/>}
              <span style={s.itinChipValue}>{itinMode==='driving-car'?'Voiture':itinMode==='foot-walking'?'Marche':'Vélo'}</span>
              <span style={s.itinChipLabel}>Mode</span>
            </div>
          </div>}

      {/* Étapes */}
      {steps.length>0&&(
        <div style={s.stepsContainer}>
          <button style={s.stepsToggle} onClick={()=>setStepsExpanded(p=>!p)}>
            <span style={{fontSize:12,fontWeight:600,color:'#475569'}}>{steps.length} étapes</span>
            {stepsExpanded?<FiChevronDown size={14} color="#94a3b8"/>:<FiChevronUp size={14} color="#94a3b8"/>}
          </button>
          {stepsExpanded&&(
            <div style={s.stepsList}>
              {steps.map((st,i)=>(
                <div key={i} style={s.stepRow}>
                  <div style={s.stepIcon}>{stepIcon(st.type)}</div>
                  <span style={s.stepText}>{st.instruction}</span>
                  {st.distance!=='0'&&<span style={s.stepDist}>{st.distance} km</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button style={s.startNavBtn} onClick={openGoogleMaps}>
        <MdDirections size={20} color="#fff"/>
        Démarrer la navigation
      </button>
    </div>
  );
}

function ActionIcon({ icon, label, color, disabled, onClick }) {
  return (
    <button style={{...s.actionIcon,opacity:disabled?.35:1,cursor:disabled?'not-allowed':'pointer'}}
      onClick={disabled?undefined:onClick} disabled={disabled}>
      <div style={{...s.actionCircle,background:disabled?'#f1f5f9':`${color}15`,border:`1.5px solid ${disabled?'#e2e8f0':color+'30'}`}}>
        <span style={{color:disabled?'#94a3b8':color}}>{icon}</span>
      </div>
      <span style={s.actionLabel}>{label}</span>
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  root:   { position:'relative', width:'100%', height:'calc(100vh - 80px)', overflow:'hidden', background:'#f8fafc' },
  map:    { width:'100%', height:'100%', zIndex:0 },
  header: { position:'absolute', top:0, left:0, right:0, background:'linear-gradient(180deg,rgba(0,0,0,.68) 0%,transparent 100%)', zIndex:400, paddingBottom:20 },
  headerInner: { display:'flex', alignItems:'center', gap:10, padding:'14px 14px 0' },
  glassBtn:{ width:40, height:40, borderRadius:'50%', background:'rgba(0,0,0,.45)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,.2)' },
  glassBtn2:{ width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,.07)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 },
  searchBar:{ flex:1, height:44, background:'#fff', borderRadius:22, display:'flex', alignItems:'center', padding:'0 12px', gap:8, transition:'box-shadow .2s' },
  searchInput:{ flex:1, border:'none', outline:'none', fontSize:13, color:'#1e293b', background:'transparent' },
  clearBtn:{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', padding:0 },
  countBadge:{ background:'#dc2626', color:'#fff', borderRadius:20, padding:'4px 10px', fontSize:13, fontWeight:800, boxShadow:'0 3px 8px rgba(220,38,38,.4)', flexShrink:0 },
  chipsRow:{ position:'absolute', top:70, left:0, right:0, zIndex:400, height:40, overflow:'hidden' },
  chipsScroll:{ display:'flex', gap:6, padding:'0 14px', overflowX:'auto', height:'100%', alignItems:'center', scrollbarWidth:'none' },
  chip:{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:600, color:'#64748b', cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 2px 6px rgba(0,0,0,.08)', transition:'all .2s', flexShrink:0 },
  chipActive:{ background:'#dc2626', color:'#fff', border:'1px solid #dc2626', boxShadow:'0 3px 10px rgba(220,38,38,.35)' },
  rightBtns:{ position:'absolute', right:14, bottom:230, display:'flex', flexDirection:'column', gap:10, zIndex:400 },
  mapBtn:{ width:44, height:44, borderRadius:'50%', background:'#fff', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 3px 10px rgba(0,0,0,.15)', transition:'background .2s' },
  loadingOverlay:{ position:'absolute', inset:0, background:'rgba(0,0,0,.3)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:600 },
  loadingBox:{ background:'#fff', borderRadius:16, padding:'20px 28px', display:'flex', flexDirection:'column', alignItems:'center', gap:12 },
  spinner:{ width:28, height:28, border:'3px solid #fef2f2', borderTop:'3px solid #dc2626', borderRadius:'50%', animation:'spin 1s linear infinite' },
  modal:{ position:'absolute', bottom:0, left:0, right:0, background:'#fff', borderRadius:'28px 28px 0 0', boxShadow:'0 -12px 40px rgba(0,0,0,.2)', zIndex:500, maxHeight:'78vh', overflowY:'auto' },
  handle:{ width:36, height:4, background:'#e2e8f0', borderRadius:2, margin:'12px auto 0' },
  banner:{ position:'relative', height:130, overflow:'hidden' },
  bannerImg:{ width:'100%', height:'100%', objectFit:'cover' },
  bannerPlaceholder:{ width:'100%', height:'100%', background:'linear-gradient(135deg,#f1f5f9 0%,#e2e8f0 100%)', display:'flex', alignItems:'center', justifyContent:'center' },
  bannerGradient:{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 20%,rgba(0,0,0,.65) 100%)' },
  closeBtn:{ position:'absolute', top:12, right:12, width:32, height:32, borderRadius:'50%', background:'rgba(0,0,0,.5)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:2, backdropFilter:'blur(4px)' },
  bannerInfo:{ position:'absolute', bottom:14, left:14, right:50, display:'flex', alignItems:'flex-end', gap:10, zIndex:2 },
  entLogo:{ width:50, height:50, borderRadius:14, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0, boxShadow:'0 4px 12px rgba(0,0,0,.25)', border:'2px solid rgba(255,255,255,.8)' },
  entName:{ margin:0, color:'#fff', fontSize:17, fontWeight:800, textShadow:'0 1px 6px rgba(0,0,0,.5)', lineHeight:1.2 },
  verifiedRow:{ display:'flex', alignItems:'center', gap:3, marginTop:3 },
  modalBody:{ padding:'14px 16px 24px' },
  domainesRow:{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 },
  domainePill:{ fontSize:10, fontWeight:700, color:'#dc2626', background:'rgba(220,38,38,.08)', borderRadius:20, padding:'4px 12px', border:'1px solid rgba(220,38,38,.15)' },
  addrRow:{ display:'flex', alignItems:'flex-start', gap:6, marginBottom:16, padding:'10px 12px', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' },
  addrText:{ flex:1, fontSize:12, color:'#475569', lineHeight:1.5 },
  distBadge:{ background:'#dc2626', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:12, flexShrink:0 },
  actionsRow:{ display:'flex', justifyContent:'space-around', marginBottom:16, padding:'4px 0' },
  actionIcon:{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, background:'none', border:'none', padding:'4px 2px', minWidth:52 },
  actionCircle:{ width:52, height:52, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,.08)' },
  actionLabel:{ fontSize:10, color:'#64748b', fontWeight:600, textAlign:'center' },
  servicesBtn:{ width:'100%', background:'linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)', color:'#fff', border:'none', borderRadius:14, padding:14, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 14px rgba(220,38,38,.35)' },
  itinHeader:{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingTop:10 },
  itinBack:{ display:'flex', alignItems:'center', gap:4, background:'rgba(220,38,38,.08)', border:'none', borderRadius:10, padding:'6px 10px', cursor:'pointer' },
  modePicker:{ display:'flex', background:'#f8fafc', borderRadius:14, padding:4, gap:4, marginBottom:14 },
  modeBtn:{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'transparent', border:'none', borderRadius:12, padding:'8px 4px', cursor:'pointer', transition:'all .2s', fontSize:10, fontWeight:600 },
  modeBtnActive:{ background:'#dc2626' },
  itinChips:{ display:'flex', gap:10, marginBottom:12 },
  itinChip:{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'#f8fafc', borderRadius:12, padding:'10px 8px', border:'1px solid #e2e8f0' },
  itinChipValue:{ fontSize:12, fontWeight:800, color:'#1e293b' },
  itinChipLabel:{ fontSize:9, color:'#94a3b8' },
  stepsContainer:{ background:'#f8fafc', borderRadius:12, overflow:'hidden', marginBottom:12, border:'1px solid #e2e8f0' },
  stepsToggle:{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', background:'none', border:'none', padding:'10px 14px', cursor:'pointer' },
  stepsList:{ borderTop:'1px solid #e2e8f0', maxHeight:180, overflowY:'auto' },
  stepRow:{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', borderBottom:'1px solid #f1f5f9' },
  stepIcon:{ width:28, height:28, borderRadius:'50%', background:'rgba(220,38,38,.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626', flexShrink:0 },
  stepText:{ flex:1, fontSize:12, color:'#475569', lineHeight:1.4 },
  stepDist:{ fontSize:11, color:'#94a3b8', flexShrink:0 },
  startNavBtn:{ width:'100%', background:'linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)', color:'#fff', border:'none', borderRadius:14, padding:14, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 14px rgba(220,38,38,.35)' },
  bottomList:{ position:'absolute', bottom:0, left:0, right:0, background:'transparent', zIndex:400, paddingBottom:12 },
  bottomListHandle:{ display:'flex', alignItems:'center', gap:8, padding:'6px 16px 10px', cursor:'pointer' },
  bottomTitle:{ fontSize:12, fontWeight:700, color:'#1e293b', background:'rgba(255,255,255,.9)', padding:'4px 10px', borderRadius:20, backdropFilter:'blur(8px)', boxShadow:'0 2px 8px rgba(0,0,0,.1)' },
  cardScroll:{ display:'flex', gap:10, overflowX:'auto', padding:'4px 14px 4px', scrollbarWidth:'none' },
  entCard:{ width:160, background:'#fff', borderRadius:18, border:'1.5px solid #f1f5f9', overflow:'hidden', boxShadow:'0 6px 20px rgba(0,0,0,.1)', cursor:'pointer', flexShrink:0, display:'flex', flexDirection:'column', padding:0, transition:'transform .15s,box-shadow .15s' },
  entCardImg:{ height:85, background:'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  entCardBody:{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:3 },
  entCardName:{ margin:0, fontSize:12, fontWeight:700, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  entCardDom:{ margin:0, fontSize:10, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500 },
  entCardDist:{ display:'flex', alignItems:'center', gap:3, marginTop:3, background:'rgba(220,38,38,.06)', borderRadius:8, padding:'3px 6px', width:'fit-content' },
  svcOverlay:{ position:'absolute', inset:0, background:'rgba(0,0,0,.55)', zIndex:600, display:'flex', alignItems:'flex-end', backdropFilter:'blur(4px)' },
  svcBox:{ width:'100%', background:'#fff', borderRadius:'28px 28px 0 0', overflow:'hidden', boxShadow:'0 -12px 40px rgba(0,0,0,.25)', animation:'slide-up .3s cubic-bezier(.34,1,.64,1) forwards' },
  svcHeader:{ background:'linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)', padding:'20px 20px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  svcClose:{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,.2)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 },
  svcCard:{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:14, cursor:'pointer', transition:'border-color .2s,background .2s' },
  svcCardIcon:{ width:40, height:40, borderRadius:12, background:'rgba(220,38,38,.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid rgba(220,38,38,.15)' },
};

const CSS = `
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes pring { 0%{transform:scale(.5);opacity:1;} 80%,100%{transform:scale(1.8);opacity:0;} }
  @keyframes slide-up { from{transform:translateY(100%);opacity:0;} to{transform:translateY(0);opacity:1;} }
  .modal-slide-up { animation:slide-up .35s cubic-bezier(.34,1,.64,1) forwards; }
  .leaflet-container { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  .leaflet-control-attribution { display:none; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:4px; }
`;