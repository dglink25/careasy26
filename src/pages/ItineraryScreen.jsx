// src/pages/ItineraryScreen.jsx
// ═══════════════════════════════════════════════════════════════════════════
//  CarEasy — Écran itinéraire dédié (version Web)
//  Utilisé depuis EntrepriseServicesScreen ou MapScreen
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FiArrowLeft, FiExternalLink, FiNavigation2, FiMapPin,
  FiClock, FiChevronUp, FiChevronDown, FiRefreshCw,
} from 'react-icons/fi';
import { FaCar, FaWalking, FaBiking } from 'react-icons/fa';
import { MdDirections } from 'react-icons/md';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PRIMARY_RED = '#dc2626';
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjU5YWUyNTQ2MjU4MTQ0ZDBiMzk0MGJkMzZlZDc5NTQwIiwiaCI6Im11cm11cjY0In0=';

const userIcon = L.divIcon({
  html: `<div style="position:relative;width:22px;height:22px;">
    <div style="position:absolute;inset:-8px;background:rgba(59,130,246,0.15);border-radius:50%;animation:pulse-ring 2s ease-out infinite;"></div>
    <div style="width:22px;height:22px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.4);"></div>
  </div>`,
  className: '', iconAnchor: [11, 11], iconSize: [22, 22],
});

const destIcon = (name) => L.divIcon({
  html: `<div style="display:flex;flex-direction:column;align-items:center;">
    <div style="background:${PRIMARY_RED};color:#fff;padding:5px 10px;border-radius:10px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 3px 10px rgba(220,38,38,0.4);font-family:-apple-system,sans-serif;max-width:130px;overflow:hidden;text-overflow:ellipsis;">${name.length > 16 ? name.substring(0, 16) + '…' : name}</div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${PRIMARY_RED};"></div>
    <div style="width:14px;height:14px;background:${PRIMARY_RED};border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(220,38,38,0.5);"></div>
  </div>`,
  className: '', iconAnchor: [65, 46], iconSize: [130, 46],
});

function MapFitter({ fitBounds }) {
  const map = useMap();
  useEffect(() => {
    if (fitBounds?.length >= 2) map.fitBounds(fitBounds, { padding: [70, 70] });
  }, [fitBounds]);
  return null;
}

export default function ItineraryScreen() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const { destination, destinationName, userPosition } = location.state || {};

  const [userPos,      setUserPos]      = useState(userPosition || null);
  const [route,        setRoute]        = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isLocating,   setIsLocating]   = useState(false);
  const [travelMode,   setTravelMode]   = useState('driving-car');
  const [distanceKm,   setDistanceKm]   = useState(null);
  const [durationMin,  setDurationMin]  = useState(null);
  const [steps,        setSteps]        = useState([]);
  const [stepsExpanded,setStepsExpanded]= useState(false);
  const [fitBounds,    setFitBounds]    = useState(null);
  const [errorMsg,     setErrorMsg]     = useState(null);

  useEffect(() => {
    if (!destination) { navigate(-1); return; }
    if (userPos) buildRoute(userPos, travelMode);
    else getLocation();
  }, []);

  const getLocation = () => {
    setIsLocating(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const ll = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(ll);
        setIsLocating(false);
        buildRoute(ll, travelMode);
      },
      () => { setErrorMsg("Impossible d'obtenir votre position"); setIsLoading(false); setIsLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const buildRoute = useCallback(async (origin, mode) => {
    if (!origin || !destination) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const resp = await fetch(
        `https://api.openrouteservice.org/v2/directions/${mode}/geojson`,
        {
          method: 'POST',
          headers: { Authorization: ORS_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json, application/geo+json' },
          body: JSON.stringify({
            coordinates: [[origin[1], origin[0]], [destination[1], destination[0]]],
            instructions: true, language: 'fr',
          }),
        }
      );
      if (resp.ok) {
        const data    = await resp.json();
        const coords  = data.features[0].geometry.coordinates;
        const points  = coords.map((c) => [c[1], c[0]]);
        const summary = data.features[0].properties.summary;
        const segs    = data.features[0].properties.segments || [];
        const allSteps = [];
        segs.forEach((seg) => {
          (seg.steps || []).forEach((s) => allSteps.push({
            instruction: s.instruction || '',
            distance: ((s.distance || 0) / 1000).toFixed(1),
            type: s.type || 0,
          }));
        });
        setRoute(points);
        setDistanceKm((summary.distance / 1000).toFixed(1));
        setDurationMin(Math.round(summary.duration / 60));
        setSteps(allSteps);
        setFitBounds([origin, [destination[0], destination[1]]]);
      } else {
        fallbackRoute(origin);
      }
    } catch {
      fallbackRoute(origin);
    } finally {
      setIsLoading(false);
    }
  }, [destination]);

  const fallbackRoute = (origin) => {
    setRoute([origin, [destination[0], destination[1]]]);
    setFitBounds([origin, [destination[0], destination[1]]]);
    const R = 6371;
    const dLat = ((destination[0] - origin[0]) * Math.PI) / 180;
    const dLng = ((destination[1] - origin[1]) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((origin[0] * Math.PI) / 180) * Math.cos((destination[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    setDistanceKm(dist.toFixed(1));
    setDurationMin(Math.round((dist / 40) * 60));
    setSteps([
      { instruction: `Suivre la direction vers ${destinationName}`, distance: dist.toFixed(1), type: 0 },
      { instruction: `Arriver à ${destinationName}`, distance: '0', type: 10 },
    ]);
  };

  const changeMode = (mode) => {
    setTravelMode(mode);
    if (userPos) buildRoute(userPos, mode);
  };

  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination?.[0]},${destination?.[1]}&travelmode=driving`, '_blank');
  };

  const formatDuration = (min) => {
    if (!min) return '---';
    if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}min`;
    return `${min} min`;
  };

  const stepIcon = (type) => {
    if (type === 10) return '🏁';
    if (type === 11) return '📍';
    if ([1, 5].includes(type)) return '↱';
    if ([2, 6].includes(type)) return '↰';
    return '↑';
  };

  const mapCenter = userPos || (destination ? [destination[0], destination[1]] : [6.3654, 2.4183]);

  return (
    <div style={s.root}>
      <style>{CSS}</style>

      {/* Carte */}
      <MapContainer center={mapCenter} zoom={13} style={s.map} zoomControl={false}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <MapFitter fitBounds={fitBounds} />

        {route.length > 1 && (
          <>
            <Polyline positions={route} color="rgba(0,0,0,0.1)" weight={10} />
            <Polyline positions={route} color={PRIMARY_RED} weight={5} />
          </>
        )}
        {userPos && <Marker position={userPos} icon={userIcon} />}
        {destination && <Marker position={[destination[0], destination[1]]} icon={destIcon(destinationName || 'Destination')} />}
      </MapContainer>

      {/* AppBar */}
      <div style={s.appbar}>
        <div style={s.appbarInner}>
          <button style={s.glassBtn} onClick={() => navigate(-1)} aria-label="Retour">
            <FiArrowLeft size={18} color="#fff" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Itinéraire</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {destinationName || 'Destination'}
            </p>
          </div>
          <button style={s.glassBtn} onClick={openGoogleMaps} title="Ouvrir dans Google Maps">
            <FiExternalLink size={16} color="#fff" />
          </button>
        </div>
      </div>

      {/* Modes transport */}
      <div style={s.modeSelector}>
        {[
          { mode: 'driving-car',    Icon: FaCar,     label: 'Voiture' },
          { mode: 'foot-walking',   Icon: FaWalking, label: 'Marche' },
          { mode: 'cycling-regular',Icon: FaBiking,  label: 'Vélo' },
        ].map(({ mode, Icon, label }) => (
          <button
            key={mode}
            onClick={() => changeMode(mode)}
            style={{
              ...s.modeBtn,
              ...(travelMode === mode ? s.modeBtnActive : {}),
            }}
          >
            <Icon size={18} color={travelMode === mode ? '#fff' : '#64748b'} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Bouton recentrer */}
      <div style={s.rightBtns}>
        <button style={s.mapBtn} onClick={() => { if (userPos) buildRoute(userPos, travelMode); else getLocation(); }} title="Recalculer">
          {isLocating
            ? <FiRefreshCw size={18} color={PRIMARY_RED} style={{ animation: 'spin 1s linear infinite' }} />
            : <FiNavigation2 size={18} color={PRIMARY_RED} />}
        </button>
      </div>

      {/* Panneau bas */}
      <div style={s.bottomPanel}>
        <div style={s.handle} />

        {/* Résumé */}
        <div style={s.summaryRow}>
          <div style={s.summaryChip}>
            <FiMapPin size={16} color="#3b82f6" />
            <span style={s.chipVal}>{distanceKm ? `${distanceKm} km` : '---'}</span>
            <span style={s.chipLbl}>Distance</span>
          </div>
          <div style={s.summaryChip}>
            <FiClock size={16} color={PRIMARY_RED} />
            <span style={s.chipVal}>{formatDuration(durationMin)}</span>
            <span style={s.chipLbl}>Durée estimée</span>
          </div>
          <div style={s.summaryChip}>
            {travelMode === 'driving-car' ? <FaCar size={16} color="#10b981" /> : travelMode === 'foot-walking' ? <FaWalking size={16} color="#10b981" /> : <FaBiking size={16} color="#10b981" />}
            <span style={s.chipVal}>{travelMode === 'driving-car' ? 'Voiture' : travelMode === 'foot-walking' ? 'Marche' : 'Vélo'}</span>
            <span style={s.chipLbl}>Mode</span>
          </div>
        </div>

        {/* Étapes */}
        {steps.length > 0 && (
          <div style={s.stepsBox}>
            <button style={s.stepsToggle} onClick={() => setStepsExpanded((p) => !p)}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{steps.length} étapes</span>
              {stepsExpanded ? <FiChevronDown size={14} color="#94a3b8" /> : <FiChevronUp size={14} color="#94a3b8" />}
            </button>
            {stepsExpanded && (
              <div style={s.stepsList}>
                {steps.map((step, i) => (
                  <div key={i} style={s.stepRow}>
                    <div style={s.stepIcon}>{stepIcon(step.type)}</div>
                    <span style={s.stepText}>{step.instruction}</span>
                    {step.distance !== '0' && <span style={s.stepDist}>{step.distance} km</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button style={s.startBtn} onClick={openGoogleMaps}>
          <MdDirections size={20} color="#fff" />
          Démarrer la navigation
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={s.loadingOverlay}>
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <p style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 500 }}>
              {isLocating ? 'Localisation en cours…' : 'Calcul de l\'itinéraire…'}
            </p>
          </div>
        </div>
      )}

      {/* Erreur */}
      {errorMsg && (
        <div style={s.errorBox}>
          <p style={{ margin: 0, fontSize: 14, color: '#1e293b', marginBottom: 12 }}>{errorMsg}</p>
          <button style={s.retryBtn} onClick={getLocation}>Réessayer</button>
        </div>
      )}
    </div>
  );
}

const s = {
  root: { position: 'relative', width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' },
  map:  { width: '100%', height: '100%', zIndex: 0 },
  appbar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, transparent 100%)',
    zIndex: 400, paddingBottom: 20,
  },
  appbarInner: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 0' },
  glassBtn: {
    width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.45)',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  modeSelector: {
    position: 'absolute', top: 80, left: 14, zIndex: 400,
    background: '#fff', borderRadius: 14, overflow: 'hidden',
    display: 'flex',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  },
  modeBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
    transition: 'background 0.2s',
  },
  modeBtnActive: { background: PRIMARY_RED },
  rightBtns: { position: 'absolute', right: 14, bottom: 260, zIndex: 400 },
  mapBtn: {
    width: 44, height: 44, borderRadius: '50%', background: '#fff', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
  },
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: '#fff', borderRadius: '24px 24px 0 0',
    boxShadow: '0 -6px 20px rgba(0,0,0,0.12)', zIndex: 400, padding: '0 16px 20px',
  },
  handle: { width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '10px auto 14px' },
  summaryRow: { display: 'flex', gap: 10, marginBottom: 12 },
  summaryChip: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    background: '#f8fafc', borderRadius: 12, padding: '10px 8px', border: '1px solid #e2e8f0',
  },
  chipVal: { fontSize: 12, fontWeight: 800, color: '#1e293b' },
  chipLbl: { fontSize: 9, color: '#94a3b8' },
  stepsBox: { background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 12, overflow: 'hidden' },
  stepsToggle: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer',
  },
  stepsList: { borderTop: '1px solid #e2e8f0', maxHeight: 200, overflowY: 'auto' },
  stepRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid #f1f5f9' },
  stepIcon: {
    width: 28, height: 28, borderRadius: '50%', background: 'rgba(220,38,38,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0,
  },
  stepText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 1.4 },
  stepDist: { fontSize: 11, color: '#94a3b8', flexShrink: 0 },
  startBtn: {
    width: '100%', background: PRIMARY_RED, color: '#fff', border: 'none',
    borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  loadingOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600,
  },
  loadingBox: {
    background: '#fff', borderRadius: 16, padding: '20px 28px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  spinner: {
    width: 28, height: 28, border: '3px solid #fef2f2',
    borderTop: `3px solid ${PRIMARY_RED}`, borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 24, background: '#fff', zIndex: 500,
  },
  retryBtn: {
    background: PRIMARY_RED, color: '#fff', border: 'none',
    padding: '10px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
};

const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse-ring { 0% { transform:scale(.5);opacity:1; } 80%,100% { transform:scale(1.8);opacity:0; } }
  .leaflet-control-attribution { display: none; }
`;