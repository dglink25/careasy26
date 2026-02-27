// careasy-frontend/src/components/ItineraryModal.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiX,
  FiNavigation,
  FiMapPin,
  FiClock,
  FiTarget,
  FiAlertCircle,
  FiRefreshCw,
  FiMaximize2,
  FiMinimize2,
  FiArrowLeft,
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiInfo
} from 'react-icons/fi';
import {
  MdOutlineDirectionsCar,
  MdOutlineMyLocation,
  MdOutlineLocationOn,
  MdOutlineDirectionsWalk,
  MdOutlineDirectionsBike,
  MdOutlineDirectionsBus,
  MdOutlineTraffic,
  MdOutlineRoute,
  MdOutlineError,
  MdOutlineWarning
} from 'react-icons/md';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Correction des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Service de routage avec fallback
const ROUTING_SERVICES = [
  {
    name: 'OSRM',
    url: 'https://router.project-osrm.org/route/v1',
    enabled: true,
    timeout: 5000
  },
  {
    name: 'GraphHopper',
    url: 'https://graphhopper.com/api/1/route',
    enabled: true,
    apiKey: 'your-graphhopper-key', // À remplacer par votre clé API
    timeout: 5000
  },
  {
    name: 'OpenRouteService',
    url: 'https://api.openrouteservice.org/v2/directions',
    enabled: true,
    apiKey: 'your-openrouteservice-key', // À remplacer par votre clé API
    timeout: 5000
  }
];

// Création d'icônes personnalisées
const createCustomIcon = (color, type = 'default') => {
  const getIconSvg = () => {
    switch(type) {
      case 'start':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" fill="white" stroke="${color}" stroke-width="2"/>
          <circle cx="12" cy="12" r="4" fill="${color}"/>
        </svg>`;
      case 'end':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="12" cy="9" r="3" fill="white"/>
        </svg>`;
      default:
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        </svg>`;
    }
  };

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      ${getIconSvg()}
    </div>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export default function ItineraryModal({ isOpen, onClose, destination }) {
  // États
  const [loading, setLoading] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [geocodingError, setGeocodingError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [travelMode, setTravelMode] = useState('driving');
  const [expanded, setExpanded] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [mapError, setMapError] = useState('');
  const [routingService, setRoutingService] = useState('OSRM');
  const [retryCount, setRetryCount] = useState(0);
  const [offlineMode, setOfflineMode] = useState(false);
  
  // Refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersRef = useRef([]);
  const abortControllerRef = useRef(null);

  // Géocoder l'adresse de destination
  useEffect(() => {
    if (isOpen && destination?.siege && !destinationCoords) {
      geocodeAddress(destination.siege);
    }
  }, [isOpen, destination]);

  // Initialisation de la carte
  useEffect(() => {
    if (isOpen && userLocation && destinationCoords && !mapInstanceRef.current) {
      initMap();
    }
    
    return () => {
      cleanupMap();
    };
  }, [isOpen, userLocation, destinationCoords]);

  // Recalculer l'itinéraire
  useEffect(() => {
    if (userLocation && destinationCoords && mapInstanceRef.current) {
      calculateRouteWithFallback();
    }
  }, [travelMode, userLocation, destinationCoords, retryCount]);

  const cleanupMap = () => {
    if (routeLayerRef.current) {
      mapInstanceRef.current?.removeLayer(routeLayerRef.current);
    }
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const geocodeAddress = async (address) => {
    if (!address) {
      setGeocodingError('Adresse non disponible');
      return;
    }

    setGeocodingLoading(true);
    setGeocodingError('');

    try {
      // Tentative avec Nominatim
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: `${address}, Bénin`,
          format: 'json',
          limit: 5,
          'accept-language': 'fr'
        },
        headers: {
          'User-Agent': 'Careasy/1.0'
        },
        timeout: 8000
      });

      if (response.data && response.data.length > 0) {
        // Prendre le résultat le plus pertinent
        const result = response.data[0];
        setDestinationCoords({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          displayName: result.display_name
        });
      } else {
        // Fallback sur les coordonnées de Cotonou
        console.warn('Adresse non trouvée, utilisation des coordonnées par défaut');
        setDestinationCoords({
          lat: 6.3667,
          lng: 2.4167,
          displayName: 'Cotonou, Bénin (position approximative)'
        });
        setGeocodingError('Position approximative');
      }
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      setGeocodingError('Utilisation de la position approximative');
      // Fallback sur Cotonou
      setDestinationCoords({
        lat: 6.3667,
        lng: 2.4167,
        displayName: 'Cotonou, Bénin'
      });
    } finally {
      setGeocodingLoading(false);
    }
  };

  const initMap = () => {
    if (!mapRef.current || !userLocation || !destinationCoords) return;

    try {
      // Calculer les bounds pour centrer la carte
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [destinationCoords.lat, destinationCoords.lng]
      ]);

      const map = L.map(mapRef.current, {
        center: bounds.getCenter(),
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });

      // Ajouter plusieurs tuiles pour le fallback
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Ajouter une couche de tuiles de secours
      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap France',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      
      // Ajuster la vue pour montrer tout l'itinéraire
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });

      // Ajouter les marqueurs
      addMarkers();

    } catch (error) {
      console.error('Erreur d\'initialisation de la carte:', error);
      setMapError('Erreur lors du chargement de la carte');
    }
  };

  const addMarkers = () => {
    if (!mapInstanceRef.current || !userLocation || !destinationCoords) return;

    // Nettoyer les anciens marqueurs
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Marqueur de départ
    const startMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: createCustomIcon('#228be6', 'start'),
      zIndexOffset: 1000
    }).addTo(mapInstanceRef.current)
      .bindPopup('Votre position', { permanent: false })
      .openPopup();

    // Marqueur d'arrivée
    const endMarker = L.marker([destinationCoords.lat, destinationCoords.lng], {
      icon: createCustomIcon('#fa5252', 'end'),
      zIndexOffset: 1000
    }).addTo(mapInstanceRef.current)
      .bindPopup(destination.name, { permanent: false })
      .openPopup();

    markersRef.current = [startMarker, endMarker];
  };

  const calculateRouteWithFallback = async () => {
    if (!userLocation || !destinationCoords) return;

    setLoading(true);
    setMapError('');
    setOfflineMode(false);

    // Essayer chaque service de routage jusqu'à ce qu'un fonctionne
    for (const service of ROUTING_SERVICES) {
      if (!service.enabled) continue;

      try {
        setRoutingService(service.name);
        
        let route;
        switch(service.name) {
          case 'OSRM':
            route = await calculateOSRMRoute(service);
            break;
          case 'GraphHopper':
            route = await calculateGraphHopperRoute(service);
            break;
          case 'OpenRouteService':
            route = await calculateOpenRouteServiceRoute(service);
            break;
          default:
            continue;
        }

        if (route) {
          displayRoute(route);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn(`Service ${service.name} échoué:`, error);
        continue;
      }
    }

    // Si tous les services échouent, utiliser le mode hors ligne
    setOfflineMode(true);
    calculateOfflineRoute();
    setLoading(false);
    setMapError('Mode hors ligne - itinéraire approximatif');
  };

  const calculateOSRMRoute = async (service) => {
    const profile = travelMode === 'walking' ? 'foot' : 
                   travelMode === 'cycling' ? 'bike' : 'driving';

    const url = `${service.url}/${profile}/${userLocation.lng},${userLocation.lat};${destinationCoords.lng},${destinationCoords.lat}`;
    
    const response = await axios.get(url, {
      params: {
        alternatives: false,
        steps: true,
        geometries: 'geojson',
        overview: 'full'
      },
      timeout: service.timeout
    });

    if (response.data?.routes?.[0]) {
      const route = response.data.routes[0];
      return {
        coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
        distance: route.distance,
        duration: route.duration,
        instructions: route.legs?.[0]?.steps || []
      };
    }
    throw new Error('No route found');
  };

  const calculateGraphHopperRoute = async (service) => {
    const url = service.url;
    const response = await axios.get(url, {
      params: {
        key: service.apiKey,
        point: [`${userLocation.lat},${userLocation.lng}`, `${destinationCoords.lat},${destinationCoords.lng}`],
        vehicle: travelMode,
        locale: 'fr',
        instructions: true,
        calc_points: true
      },
      timeout: service.timeout
    });

    if (response.data?.paths?.[0]) {
      const path = response.data.paths[0];
      return {
        coordinates: path.points.coordinates.map(coord => [coord[1], coord[0]]),
        distance: path.distance,
        duration: path.time / 1000, // Convertir en secondes
        instructions: path.instructions || []
      };
    }
    throw new Error('No route found');
  };

  const calculateOpenRouteServiceRoute = async (service) => {
    const profile = travelMode === 'walking' ? 'foot-walking' :
                   travelMode === 'cycling' ? 'cycling-regular' : 'driving-car';

    const url = `${service.url}/${profile}/geojson`;
    
    const response = await axios.post(url, {
      coordinates: [
        [userLocation.lng, userLocation.lat],
        [destinationCoords.lng, destinationCoords.lat]
      ],
      instructions: true
    }, {
      headers: {
        'Authorization': service.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: service.timeout
    });

    if (response.data?.features?.[0]) {
      const feature = response.data.features[0];
      const properties = feature.properties;
      const segments = properties.segments?.[0];

      return {
        coordinates: feature.geometry.coordinates.map(coord => [coord[1], coord[0]]),
        distance: segments?.distance || 0,
        duration: segments?.duration || 0,
        instructions: segments?.steps || []
      };
    }
    throw new Error('No route found');
  };

  const calculateOfflineRoute = () => {
    // Calcul d'une route en ligne droite avec étapes intermédiaires
    const start = [userLocation.lat, userLocation.lng];
    const end = [destinationCoords.lat, destinationCoords.lng];
    
    // Calculer la distance approximative (formule de Haversine)
    const R = 6371; // Rayon de la Terre en km
    const dLat = (end[0] - start[0]) * Math.PI / 180;
    const dLon = (end[1] - start[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(start[0] * Math.PI / 180) * Math.cos(end[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Créer une ligne avec des points intermédiaires
    const coordinates = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const lat = start[0] + (end[0] - start[0]) * i / steps;
      const lng = start[1] + (end[1] - start[1]) * i / steps;
      coordinates.push([lat, lng]);
    }

    // Vitesse moyenne selon le mode de transport (km/h)
    const speeds = {
      driving: 30,
      walking: 5,
      cycling: 15
    };

    const duration = (distance / speeds[travelMode]) * 3600; // en secondes

    setRouteInfo({
      distance: distance * 1000, // en mètres
      duration: duration,
      coordinates: coordinates,
      instructions: [],
      summary: {
        totalDistance: distance * 1000,
        totalTime: duration
      }
    });

    displayRoute({
      coordinates: coordinates,
      distance: distance * 1000,
      duration: duration
    });
  };

  const displayRoute = (route) => {
    if (!mapInstanceRef.current) return;

    try {
      // Supprimer l'ancien tracé
      if (routeLayerRef.current) {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
      }

      // Créer le nouveau tracé
      const routeLine = L.polyline(route.coordinates, {
        color: getModeColor(travelMode),
        weight: 6,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
        smoothFactor: 1
      }).addTo(mapInstanceRef.current);

      routeLayerRef.current = routeLine;

      // Ajouter des flèches directionnelles (optionnel)
      if (route.coordinates.length > 1) {
        const arrows = [];
        for (let i = 0; i < route.coordinates.length - 1; i += Math.floor(route.coordinates.length / 10)) {
          const point = route.coordinates[i];
          const nextPoint = route.coordinates[i + 1];
          const angle = Math.atan2(nextPoint[1] - point[1], nextPoint[0] - point[0]) * 180 / Math.PI;
          
          const arrow = L.marker([point[0], point[1]], {
            icon: L.divIcon({
              html: `<div style="transform: rotate(${angle}deg);">➤</div>`,
              className: 'route-arrow',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          }).addTo(mapInstanceRef.current);
          arrows.push(arrow);
        }
      }

      // Mettre à jour les informations de route
      setRouteInfo({
        distance: (route.distance / 1000).toFixed(1),
        duration: Math.round(route.duration / 60),
        coordinates: route.coordinates,
        instructions: route.instructions || [],
        summary: route.summary || {}
      });

      // Ajuster la vue pour montrer tout l'itinéraire
      const bounds = L.latLngBounds(route.coordinates);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });

    } catch (error) {
      console.error('Erreur affichage route:', error);
      setMapError('Erreur lors de l\'affichage de l\'itinéraire');
    }
  };

  const getUserLocation = useCallback(() => {
    setLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée');
      setLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLocationError('');
        setLoading(false);
      },
      (error) => {
        let message = 'Position non disponible';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Veuillez autoriser la géolocalisation';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Signal GPS indisponible';
            break;
          case error.TIMEOUT:
            message = 'Délai de recherche dépassé';
            break;
        }
        setLocationError(message);
        setLoading(false);
        
        // Position par défaut (Cotonou)
        setUserLocation({
          lat: 6.3667,
          lng: 2.4167,
          isDefault: true
        });
      },
      options
    );
  }, []);

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'walking':
        return <MdOutlineDirectionsWalk style={styles.modeIcon} />;
      case 'cycling':
        return <MdOutlineDirectionsBike style={styles.modeIcon} />;
      default:
        return <MdOutlineDirectionsCar style={styles.modeIcon} />;
    }
  };

  const getModeColor = (mode) => {
    switch (mode) {
      case 'walking':
        return '#10b981';
      case 'cycling':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setMapError('');
    setOfflineMode(false);
  };

  const handleCenterMap = () => {
    if (mapInstanceRef.current && userLocation && destinationCoords) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [destinationCoords.lat, destinationCoords.lng]
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  const handleOpenInMaps = () => {
    if (userLocation && destinationCoords) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destinationCoords.lat},${destinationCoords.lng}&travelmode=${travelMode}`;
      window.open(url, '_blank');
    }
  };

  if (!isOpen || !destination) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div 
        style={{
          ...styles.modal,
          ...(expanded ? styles.modalExpanded : {})
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={onClose} style={styles.backButton}>
              <FiArrowLeft style={styles.backIcon} />
            </button>
            <div style={styles.headerInfo}>
              <h2 style={styles.headerTitle}>Itinéraire</h2>
              <p style={styles.headerSubtitle}>{destination.name}</p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button 
              onClick={() => setExpanded(!expanded)}
              style={styles.headerAction}
              title={expanded ? "Réduire" : "Agrandir"}
            >
              {expanded ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
          </div>
        </div>

        {/* Corps du modal */}
        <div style={styles.body}>
          {/* Adresses */}
          <div style={styles.addressesContainer}>
            <div style={styles.addressItem}>
              <div style={styles.addressIconDepart}>
                <MdOutlineMyLocation style={styles.addressIconSvg} />
              </div>
              <div style={styles.addressContent}>
                <span style={styles.addressLabel}>Départ</span>
                <p style={styles.addressText}>
                  {userLocation ? 
                    (userLocation.isDefault ? 'Position approximative' : 'Votre position') 
                    : 'Non définie'}
                </p>
                {userLocation?.accuracy && (
                  <span style={styles.addressPrecision}>
                    Précision: ±{Math.round(userLocation.accuracy)}m
                  </span>
                )}
              </div>
            </div>
            <div style={styles.addressConnector}>
              <div style={styles.connectorLine}></div>
              <FiChevronDown style={styles.connectorIcon} />
            </div>
            <div style={styles.addressItem}>
              <div style={styles.addressIconArrival}>
                <FiMapPin style={styles.addressIconSvg} />
              </div>
              <div style={styles.addressContent}>
                <span style={styles.addressLabel}>Arrivée</span>
                <p style={styles.addressText}>
                  {destination.siege || 'Adresse non disponible'}
                </p>
                {destinationCoords?.displayName && (
                  <span style={styles.addressDetail}>
                    {destinationCoords.displayName.substring(0, 50)}...
                  </span>
                )}
                {geocodingError && (
                  <span style={styles.addressWarning}>{geocodingError}</span>
                )}
              </div>
            </div>
          </div>

          {/* Modes de transport */}
          <div style={styles.modesContainer}>
            {[
              { id: 'driving', label: 'Voiture', icon: <MdOutlineDirectionsCar /> },
              { id: 'walking', label: 'À pied', icon: <MdOutlineDirectionsWalk /> },
              { id: 'cycling', label: 'Vélo', icon: <MdOutlineDirectionsBike /> }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setTravelMode(mode.id)}
                style={{
                  ...styles.modeButton,
                  ...(travelMode === mode.id && {
                    ...styles.modeButtonActive,
                    borderColor: getModeColor(mode.id),
                    backgroundColor: `${getModeColor(mode.id)}10`
                  })
                }}
              >
                <span style={{...styles.modeIcon, color: travelMode === mode.id ? getModeColor(mode.id) : '#6c757d'}}>
                  {mode.icon}
                </span>
                <span style={styles.modeLabel}>{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Messages d'information */}
          {locationError && (
            <div style={styles.errorCard}>
              <FiAlertCircle style={styles.errorIcon} />
              <div style={styles.errorContent}>
                <p style={styles.errorText}>{locationError}</p>
                <button onClick={getUserLocation} style={styles.retryButton}>
                  <FiRefreshCw style={styles.retryIcon} />
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {geocodingLoading && (
            <div style={styles.infoCard}>
              <FiSearch style={styles.infoIcon} />
              <p style={styles.infoText}>Recherche de l'adresse...</p>
            </div>
          )}

          {offlineMode && (
            <div style={styles.warningCard}>
              <MdOutlineWarning style={styles.warningIcon} />
              <div style={styles.warningContent}>
                <p style={styles.warningText}>
                  Mode hors ligne - Itinéraire approximatif
                </p>
                <span style={styles.warningSubtext}>
                  Service de routage temporairement indisponible
                </span>
              </div>
            </div>
          )}

          {mapError && !offlineMode && (
            <div style={styles.errorCard}>
              <MdOutlineError style={styles.errorIcon} />
              <div style={styles.errorContent}>
                <p style={styles.errorText}>{mapError}</p>
                <button onClick={handleRetry} style={styles.retryButton}>
                  <FiRefreshCw style={styles.retryIcon} />
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Carte */}
          <div style={styles.mapContainer}>
            {!userLocation && !locationError && (
              <div style={styles.locationPrompt}>
                <MdOutlineMyLocation style={styles.locationPromptIcon} />
                <h3 style={styles.locationPromptTitle}>Activez votre position</h3>
                <p style={styles.locationPromptText}>
                  Pour voir l'itinéraire, nous avons besoin de votre position
                </p>
                <button 
                  onClick={getUserLocation}
                  style={styles.activateButton}
                >
                  Activer la géolocalisation
                </button>
              </div>
            )}
            
            {userLocation && geocodingLoading && (
              <div style={styles.mapLoading}>
                <div style={styles.spinner}></div>
                <p style={styles.mapLoadingText}>Recherche de la destination...</p>
              </div>
            )}
            
            {loading && userLocation && destinationCoords && (
              <div style={styles.mapLoading}>
                <div style={styles.spinner}></div>
                <p style={styles.mapLoadingText}>
                  Calcul de l'itinéraire... ({routingService})
                </p>
              </div>
            )}
            
            <div 
              ref={mapRef}
              style={{
                ...styles.map,
                visibility: userLocation && destinationCoords && !loading && !geocodingLoading ? 'visible' : 'hidden'
              }}
            />
          </div>

          {/* Résumé de l'itinéraire */}
          {routeInfo && !loading && (
            <>
              <div style={styles.summaryCard}>
                <div style={styles.summaryItem}>
                  <FiTarget style={{...styles.summaryIcon, color: getModeColor(travelMode)}} />
                  <div style={styles.summaryContent}>
                    <span style={styles.summaryLabel}>Distance</span>
                    <span style={styles.summaryValue}>
                      {formatDistance(routeInfo.distance * 1000)}
                    </span>
                  </div>
                </div>
                <div style={styles.summaryDivider}></div>
                <div style={styles.summaryItem}>
                  <FiClock style={{...styles.summaryIcon, color: getModeColor(travelMode)}} />
                  <div style={styles.summaryContent}>
                    <span style={styles.summaryLabel}>Durée</span>
                    <span style={styles.summaryValue}>
                      {formatDuration(routeInfo.duration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions détaillées */}
              {routeInfo.instructions && routeInfo.instructions.length > 0 && (
                <div style={styles.instructionsCard}>
                  <button 
                    onClick={() => setShowSteps(!showSteps)}
                    style={styles.instructionsHeader}
                  >
                    <div style={styles.instructionsHeaderLeft}>
                      <MdOutlineRoute style={styles.instructionsIcon} />
                      <span style={styles.instructionsTitle}>
                        Instructions ({routeInfo.instructions.length})
                      </span>
                    </div>
                    {showSteps ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                  
                  {showSteps && (
                    <div style={styles.instructionsList}>
                      {routeInfo.instructions.map((instruction, index) => (
                        <div key={index} style={styles.instructionItem}>
                          <div style={styles.instructionNumber}>
                            <span style={styles.instructionNumberText}>{index + 1}</span>
                          </div>
                          <div style={styles.instructionContent}>
                            <p style={styles.instructionText}>
                              {instruction.text || instruction.instruction || `Étape ${index + 1}`}
                            </p>
                            {instruction.distance && (
                              <div style={styles.instructionMeta}>
                                <span style={styles.instructionDistance}>
                                  {formatDistance(instruction.distance)}
                                </span>
                                {instruction.time && (
                                  <span style={styles.instructionTime}>
                                    ({formatDuration(Math.round(instruction.time / 60))})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={styles.actions}>
                <button 
                  onClick={handleCenterMap}
                  style={styles.centerButton}
                >
                  <FiTarget style={styles.actionIcon} />
                  Centrer
                </button>
                <button 
                  onClick={handleOpenInMaps}
                  style={styles.googleMapsButton}
                >
                  <FiNavigation style={styles.actionIcon} />
                  Google Maps
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerNote}>
            <FiInfo style={styles.footerIcon} />
            <span style={styles.footerNoteText}>
              {offlineMode 
                ? 'Mode hors ligne • Itinéraire approximatif'
                : `Itinéraire via ${routingService} • Données © contributeurs OpenStreetMap`
              }
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .leaflet-routing-container {
          display: none !important;
        }
        
        .leaflet-control-attribution {
          font-size: 8px;
          background: rgba(255,255,255,0.8);
          padding: 2px 5px;
          border-radius: 3px;
        }
        
        .custom-marker {
          background: transparent;
          border: none;
        }
        
        .route-arrow {
          color: white;
          font-size: 16px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
    backdropFilter: 'blur(5px)',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    width: '95%',
    maxWidth: '1000px',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: 'slideUp 0.3s ease-out',
    overflow: 'hidden',
  },
  modalExpanded: {
    maxWidth: '1200px',
  },
  header: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  backButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f1f3f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#495057',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e9ecef',
    }
  },
  backIcon: {
    fontSize: '1.25rem',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#212529',
    margin: 0,
  },
  headerSubtitle: {
    fontSize: '0.875rem',
    color: '#6c757d',
    margin: '0.25rem 0 0 0',
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  headerAction: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f1f3f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#495057',
    transition: 'all 0.2s',
    fontSize: '1.25rem',
    ':hover': {
      backgroundColor: '#e9ecef',
    }
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
  },
  addressesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '1.25rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  addressItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  addressIconDepart: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e7f5ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#228be6',
    flexShrink: 0,
  },
  addressIconArrival: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#fff5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fa5252',
    flexShrink: 0,
  },
  addressIconSvg: {
    fontSize: '1.25rem',
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: '0.75rem',
    color: '#868e96',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  addressText: {
    fontSize: '0.95rem',
    color: '#212529',
    fontWeight: '500',
    margin: '0.25rem 0 0 0',
  },
  addressDetail: {
    fontSize: '0.75rem',
    color: '#6c757d',
    display: 'block',
    marginTop: '0.25rem',
  },
  addressPrecision: {
    fontSize: '0.7rem',
    color: '#40c057',
    display: 'block',
    marginTop: '0.25rem',
  },
  addressWarning: {
    fontSize: '0.75rem',
    color: '#f59e0b',
    marginTop: '0.25rem',
    display: 'block',
  },
  addressConnector: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: '20px',
    padding: '0.25rem 0',
  },
  connectorLine: {
    width: '2px',
    height: '30px',
    backgroundColor: '#dee2e6',
  },
  connectorIcon: {
    fontSize: '1rem',
    color: '#adb5bd',
  },
  modesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  modeButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ffffff',
    border: '2px solid #e9ecef',
    padding: '1rem',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    }
  },
  modeButtonActive: {
    borderWidth: '2px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  modeIcon: {
    fontSize: '1.75rem',
  },
  modeLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#495057',
  },
  errorCard: {
    backgroundColor: '#fff5f5',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    border: '1px solid #ffe3e3',
  },
  warningCard: {
    backgroundColor: '#fff9e6',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    border: '1px solid #ffecb3',
  },
  errorIcon: {
    fontSize: '1.5rem',
    color: '#fa5252',
    flexShrink: 0,
  },
  warningIcon: {
    fontSize: '1.5rem',
    color: '#f59e0b',
    flexShrink: 0,
  },
  errorContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  warningContent: {
    flex: 1,
  },
  errorText: {
    fontSize: '0.875rem',
    color: '#c92a2a',
    margin: 0,
  },
  warningText: {
    fontSize: '0.875rem',
    color: '#b45a1c',
    margin: 0,
    fontWeight: '500',
  },
  warningSubtext: {
    fontSize: '0.75rem',
    color: '#b45a1c',
    opacity: 0.8,
  },
  infoCard: {
    backgroundColor: '#e7f5ff',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    border: '1px solid #d0ebff',
  },
  infoIcon: {
    fontSize: '1.5rem',
    color: '#228be6',
    flexShrink: 0,
  },
  infoText: {
    fontSize: '0.875rem',
    color: '#0c4a6e',
    margin: 0,
  },
  retryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ffffff',
    border: '1px solid #dee2e6',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#495057',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f8f9fa',
    }
  },
  retryIcon: {
    fontSize: '0.875rem',
  },
  mapContainer: {
    position: 'relative',
    height: '350px',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '1.5rem',
    backgroundColor: '#e9ecef',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  map: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  locationPrompt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    zIndex: 2,
    padding: '2rem',
    textAlign: 'center',
  },
  locationPromptIcon: {
    fontSize: '3rem',
    color: '#adb5bd',
    marginBottom: '1rem',
  },
  locationPromptTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#212529',
    margin: '0 0 0.5rem 0',
  },
  locationPromptText: {
    fontSize: '0.875rem',
    color: '#868e96',
    margin: '0 0 1.5rem 0',
    maxWidth: '250px',
  },
  activateButton: {
    backgroundColor: '#228be6',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#1c7ed6',
    }
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 3,
    backdropFilter: 'blur(5px)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e9ecef',
    borderTop: '3px solid #228be6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  mapLoadingText: {
    fontSize: '0.875rem',
    color: '#495057',
    margin: 0,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  summaryIcon: {
    fontSize: '1.5rem',
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  summaryLabel: {
    fontSize: '0.75rem',
    color: '#868e96',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  summaryValue: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#212529',
  },
  summaryDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: '#e9ecef',
  },
  instructionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    marginBottom: '1.5rem',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  instructionsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    backgroundColor: '#f8f9fa',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    color: '#212529',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f1f3f5',
    }
  },
  instructionsHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  instructionsIcon: {
    fontSize: '1.25rem',
    color: '#228be6',
  },
  instructionsTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
  },
  instructionsList: {
    padding: '1rem',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  instructionItem: {
    display: 'flex',
    gap: '1rem',
    padding: '0.75rem',
    borderBottom: '1px solid #f1f3f5',
    ':last-child': {
      borderBottom: 'none',
    }
  },
  instructionNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#f1f3f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  instructionNumberText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#495057',
  },
  instructionContent: {
    flex: 1,
  },
  instructionText: {
    fontSize: '0.875rem',
    color: '#212529',
    margin: '0 0 0.25rem 0',
  },
  instructionMeta: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#868e96',
  },
  instructionDistance: {
    fontWeight: '500',
  },
  instructionTime: {
    opacity: 0.8,
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  centerButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: '#f1f3f5',
    border: '1px solid #dee2e6',
    padding: '0.875rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#495057',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e9ecef',
    }
  },
  googleMapsButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: '#228be6',
    border: 'none',
    padding: '0.875rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#1c7ed6',
    }
  },
  actionIcon: {
    fontSize: '1rem',
  },
  footer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e9ecef',
    backgroundColor: '#ffffff',
    flexShrink: 0,
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  footerIcon: {
    fontSize: '0.875rem',
    color: '#868e96',
  },
  footerNoteText: {
    fontSize: '0.75rem',
    color: '#868e96',
    textAlign: 'center',
  },
};