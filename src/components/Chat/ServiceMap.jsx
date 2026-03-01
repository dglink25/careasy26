// src/components/Chat/ServiceMap.jsx - Version ultra améliorée avec itinéraire

import { useState, useEffect, useRef } from 'react';

const IcMap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);

const IcList = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IcDirections = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M12 2v20M22 12h-20M4 4l16 16M4 20L20 4"/>
  </svg>
);

const IcRoute = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M2 12h20M12 2v20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14"/>
  </svg>
);

const IcCar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
    <path d="M5 9l2-4h10l2 4M5 9h14v8H5z"/>
  </svg>
);

const IcStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
    <polygon points="12 2 15 9 22 9 16 14 19 22 12 17 5 22 8 14 2 9 9 9 12 2"/>
  </svg>
);

export default function ServiceMap({ services, userLocation }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routingControlRef = useRef(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' ou 'list'
  const [selectedService, setSelectedService] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    if (!mapRef.current || !services || services.length === 0 || viewMode !== 'map') return;

    const loadLeaflet = async () => {
      // Attendre que Leaflet soit chargé
      if (!window.L) {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        
        // Charger Leaflet
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });

        // Charger Leaflet Routing Machine pour les itinéraires
        if (!window.L.Routing) {
          const routingCSS = document.createElement('link');
          routingCSS.rel = 'stylesheet';
          routingCSS.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
          document.head.appendChild(routingCSS);

          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js';
            script.onload = resolve;
            document.head.appendChild(script);
          });
        }
      }

      const L = window.L;
      
      // Filtrer les services avec coordonnées valides
      const validServices = services.filter(s => {
        const ent = s.entreprise || {};
        const lat = parseFloat(s.latitude || ent.latitude);
        const lng = parseFloat(s.longitude || ent.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      });
      
      if (validServices.length === 0) return;

      // Nettoyer l'ancienne carte
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Centrer sur le premier service ou la position utilisateur
      const first = validServices[0];
      const firstEnt = first.entreprise || {};
      const centerLat = parseFloat(first.latitude || firstEnt.latitude);
      const centerLng = parseFloat(first.longitude || firstEnt.longitude);

      // Créer la carte avec style moderne
      const map = L.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true,
        touchZoom: true,
        dragging: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
      });
      mapInstanceRef.current = map;

      // Tuiles élégantes (CartoDB Voyager)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Ajouter un contrôle d'échelle
      L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

      // Icônes personnalisées 3D
      const createIcon = (color, label, type = 'service') => {
        const size = type === 'user' ? 44 : 36;
        const bgColor = type === 'user' ? '#3B82F6' : color;
        
        return L.divIcon({
          html: `
            <div style="
              position: relative;
              width: ${size}px;
              height: ${size}px;
              filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
            ">
              <div style="
                position: absolute;
                width: ${size-4}px;
                height: ${size-4}px;
                background: ${bgColor};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                animation: markerPop 0.3s ease;
              "></div>
              <div style="
                position: absolute;
                top: ${type === 'user' ? '10px' : '8px'};
                left: ${type === 'user' ? '16px' : '14px'};
                color: white;
                font-weight: bold;
                font-size: ${type === 'user' ? '14px' : '12px'};
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                transform: rotate(0);
                z-index: 2;
              ">${label}</div>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size/2, size],
          popupAnchor: [0, -size],
          className: 'service-marker',
        });
      };

      // Ajouter le marqueur utilisateur si disponible
      if (userLocation && userLocation.lat && userLocation.lng) {
        const userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: createIcon('#3B82F6', 'Vous', 'user'),
          zIndexOffset: 1000,
        }).addTo(map);
        
        userMarker.bindPopup(`
          <div style="font-family: system-ui; padding: 4px;">
            <strong>Votre position</strong><br/>
            <span style="font-size: 0.8rem; color: #666;">Cliquez sur un service pour l'itinéraire</span>
          </div>
        `);
      }

      // Ajouter les marqueurs des services
      markersRef.current = validServices.map((s, i) => {
        const ent = s.entreprise || {};
        const lat = parseFloat(s.latitude || ent.latitude);
        const lng = parseFloat(s.longitude || ent.longitude);
        
        const marker = L.marker([lat, lng], { 
          icon: createIcon('#DC2626', (i + 1).toString()),
          riseOnHover: true,
          zIndexOffset: 100,
        }).addTo(map);

        // Popup amélioré avec photo et bouton itinéraire
        const name = s.name || ent.name || `Service ${i+1}`;
        const phone = ent.call_phone || s.call_phone || '';
        const wa = ent.whatsapp_phone || s.whatsapp_phone || '';
        const address = ent.google_formatted_address || ent.address || s.address || '';
        const dist = s.distance_label || (s.distance_km ? `${s.distance_km} km` : '? km');
        const online = ent.status_online ? 'En ligne' : 'Hors ligne';
        const hours = s.is_open_24h ? '24h/24' : (s.start_time ? `${s.start_time}-${s.end_time}` : 'Non précisé');
        const domaine = s.domaine || '';
        const rating = s.rating || ent.rating || 4.5;
        const photo = ent.photo_url || s.photo_url || '';

        const popupContent = `
          <div class="service-popup">
            ${photo ? `<img src="${photo}" class="popup-photo" alt="${name}" />` : ''}
            <div class="popup-header">
              <div class="popup-title">${name}</div>
              <div class="popup-rating">
                ${'★'.repeat(Math.floor(rating))}${rating % 1 >= 0.5 ? '½' : ''}
                <span class="rating-value">${rating}</span>
              </div>
            </div>
            ${domaine ? `<div class="popup-domaine">${domaine}</div>` : ''}
            ${address ? `<div class="popup-address">📍 ${address}</div>` : ''}
            <div class="popup-hours">🕐 ${hours}</div>
            <div class="popup-status ${online === 'En ligne' ? 'online' : 'offline'}">${online}</div>
            <div class="popup-distance">📏 ${dist}</div>
            <div class="popup-actions">
              ${phone ? `<a href="tel:${phone}" class="popup-btn call">📞 Appeler</a>` : ''}
              ${wa ? `<a href="https://wa.me/${wa.replace(/\D/g,'')}" target="_blank" class="popup-btn whatsapp">💬 WhatsApp</a>` : ''}
              <button onclick="window.showRouteToService(${i})" class="popup-btn route">
                <IcRoute /> Itinéraire
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          minWidth: 260,
          className: 'custom-popup',
          offset: [0, -20],
        });

        marker.on('click', () => {
          setSelectedService(s);
        });

        return { marker, service: s, index: i, lat, lng };
      });

      // Fonction globale pour afficher l'itinéraire
      window.showRouteToService = (index) => {
        const target = markersRef.current[index];
        if (!target || !userLocation) return;
        
        setShowRoute(true);
        calculateRoute(userLocation, { lat: target.lat, lng: target.lng }, target.service);
      };

      // Ajuster la vue pour tous les marqueurs
      const bounds = [];
      if (userLocation && userLocation.lat && userLocation.lng) {
        bounds.push([userLocation.lat, userLocation.lng]);
      }
      markersRef.current.forEach(m => bounds.push([m.lat, m.lng]));
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
      }
    };

    // Ajouter l'animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes markerPop {
        0% { transform: rotate(-45deg) scale(0); }
        50% { transform: rotate(-45deg) scale(1.2); }
        100% { transform: rotate(-45deg) scale(1); }
      }
    `;
    document.head.appendChild(style);

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
      if (routingControlRef.current) {
        mapInstanceRef.current?.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [services, userLocation, viewMode]);

  // Fonction pour calculer l'itinéraire
  const calculateRoute = (start, end, service) => {
    if (!mapInstanceRef.current || !window.L) return;

    // Supprimer l'ancien itinéraire
    if (routingControlRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
    }

    const L = window.L;

    // Créer le contrôle d'itinéraire
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(start.lat, start.lng),
        L.latLng(end.lat, end.lng)
      ],
      routeWhileDragging: true,
      showAlternatives: true,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [
          { color: '#DC2626', opacity: 0.8, weight: 6 },
          { color: 'white', opacity: 0.3, weight: 2, dashArray: '5,5' }
        ]
      },
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      formatter: new L.Routing.Formatter({
        unit: 'metric',
        language: 'fr'
      }),
      createMarker: () => null, // Désactiver les marqueurs par défaut
    }).addTo(mapInstanceRef.current);

    // Ajouter des informations sur l'itinéraire
    routingControlRef.current.on('routesfound', (e) => {
      const routes = e.routes;
      const route = routes[0];
      const distance = (route.summary.totalDistance / 1000).toFixed(1);
      const duration = Math.round(route.summary.totalTime / 60);
      
      setRouteInfo({
        distance: `${distance} km`,
        duration: `${duration} min`,
        service: service
      });
    });
  };

  // Filtrer les services valides
  const validServices = services.filter(s => {
    const ent = s.entreprise || {};
    const lat = parseFloat(s.latitude || ent.latitude);
    const lng = parseFloat(s.longitude || ent.longitude);
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  });

  if (validServices.length === 0) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {viewMode === 'map' ? <IcMap /> : <IcList />}
          <span style={styles.headerText}>
            {validServices.length} entreprise(s) à proximité
          </span>
        </div>
        <div style={styles.viewToggle}>
          <button
            onClick={() => setViewMode('map')}
            style={{
              ...styles.toggleButton,
              backgroundColor: viewMode === 'map' ? '#DC2626' : 'transparent',
              color: viewMode === 'map' ? '#fff' : '#aaa',
            }}
          >
            Carte
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              ...styles.toggleButton,
              backgroundColor: viewMode === 'list' ? '#DC2626' : 'transparent',
              color: viewMode === 'list' ? '#fff' : '#aaa',
            }}
          >
            Liste
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <>
          <div ref={mapRef} style={styles.map} />
          
          {/* Barre d'itinéraire */}
          {routeInfo && (
            <div style={styles.routeBar}>
              <div style={styles.routeInfo}>
                <IcCar />
                <span style={styles.routeText}>
                  {routeInfo.distance} • {routeInfo.duration}
                </span>
                <span style={styles.routeService}>
                  vers {routeInfo.service?.name || routeInfo.service?.entreprise?.name || 'service'}
                </span>
              </div>
              <button 
                onClick={() => {
                  if (routingControlRef.current) {
                    mapInstanceRef.current?.removeControl(routingControlRef.current);
                    routingControlRef.current = null;
                  }
                  setRouteInfo(null);
                  setShowRoute(false);
                }}
                style={styles.routeClose}
              >
                ×
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={styles.list}>
          {validServices.map((s, idx) => {
            const ent = s.entreprise || {};
            return (
              <div key={idx} style={styles.listItem}>
                <div style={styles.listItemNumber}>{idx + 1}</div>
                <div style={styles.listItemContent}>
                  <div style={styles.listItemName}>{s.name || ent.name}</div>
                  <div style={styles.listItemDistance}>
                    {s.distance_label || `${s.distance_km || '?'} km`}
                  </div>
                  <div style={styles.listItemActions}>
                    {ent.call_phone && (
                      <a href={`tel:${ent.call_phone}`} style={styles.listItemAction}>
                        📞 Appeler
                      </a>
                    )}
                    {ent.whatsapp_phone && (
                      <a href={`https://wa.me/${ent.whatsapp_phone.replace(/\D/g,'')}`} 
                         target="_blank" 
                         style={styles.listItemAction}>
                        💬 WhatsApp
                      </a>
                    )}
                    <button 
                      onClick={() => {
                        if (userLocation) {
                          calculateRoute(userLocation, {
                            lat: parseFloat(s.latitude || ent.latitude),
                            lng: parseFloat(s.longitude || ent.longitude)
                          }, s);
                          setViewMode('map');
                        } else {
                          // Fallback Google Maps
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${s.latitude || ent.latitude},${s.longitude || ent.longitude}`;
                          window.open(url, '_blank');
                        }
                      }}
                      style={styles.listItemAction}
                    >
                      <IcDirections /> Itinéraire
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .service-popup {
          font-family: system-ui, -apple-system, sans-serif;
          padding: 0;
          overflow: hidden;
        }
        .popup-photo {
          width: 100%;
          height: 120px;
          object-fit: cover;
          margin-bottom: 8px;
        }
        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 8px;
          margin-bottom: 8px;
        }
        .popup-title {
          font-weight: 600;
          color: #333;
          font-size: 15px;
        }
        .popup-rating {
          display: flex;
          align-items: center;
          gap: 2px;
          color: #fbbf24;
          font-size: 12px;
        }
        .rating-value {
          color: #666;
          margin-left: 4px;
        }
        .popup-domaine {
          font-size: 12px;
          color: #666;
          padding: 0 8px;
          margin-bottom: 6px;
        }
        .popup-address {
          font-size: 12px;
          color: #444;
          padding: 0 8px;
          margin-bottom: 6px;
          line-height: 1.4;
        }
        .popup-hours {
          font-size: 12px;
          color: #666;
          padding: 0 8px;
          margin-bottom: 6px;
        }
        .popup-distance {
          font-size: 12px;
          color: #DC2626;
          padding: 0 8px;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .popup-status {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
          display: inline-block;
          margin: 0 8px 8px;
        }
        .popup-status.online {
          background: #22c55e20;
          color: #16a34a;
        }
        .popup-status.offline {
          background: #f59e0b20;
          color: #d97706;
        }
        .popup-actions {
          display: flex;
          gap: 8px;
          padding: 8px;
          background: #f8fafc;
        }
        .popup-btn {
          flex: 1;
          padding: 8px 0;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          text-align: center;
          text-decoration: none;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .popup-btn.call {
          background: #10b98120;
          color: #059669;
        }
        .popup-btn.whatsapp {
          background: #25D36620;
          color: #075e54;
        }
        .popup-btn.route {
          background: #DC262620;
          color: #DC2626;
        }
        .popup-btn:hover {
          opacity: 0.8;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        .leaflet-routing-container {
          background: white;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          font-family: system-ui;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    marginTop: '12px',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(220,38,38,0.15)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    backgroundColor: '#fff',
  },
  header: {
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #DC2626, #991b1b)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#fff',
  },
  headerText: {
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: '8px',
    padding: '2px',
  },
  toggleButton: {
    padding: '4px 12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  map: {
    height: '320px',
    width: '100%',
  },
  routeBar: {
    padding: '10px 16px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  routeText: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#DC2626',
  },
  routeService: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  routeClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '4px 8px',
  },
  list: {
    maxHeight: '320px',
    overflowY: 'auto',
    padding: '8px',
  },
  listItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background 0.2s',
    ':hover': {
      backgroundColor: '#f8fafc',
    }
  },
  listItemNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#DC2626',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontWeight: '600',
    color: '#333',
    fontSize: '0.9rem',
    marginBottom: '4px',
  },
  listItemDistance: {
    fontSize: '0.75rem',
    color: '#DC2626',
    marginBottom: '8px',
  },
  listItemActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  listItemAction: {
    fontSize: '0.7rem',
    color: '#666',
    textDecoration: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#f5f5f5',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
    border: 'none',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#e2e8f0',
    }
  },
};