// careasy-frontend/src/components/ItineraryModal.jsx
import { useState, useEffect, useRef } from 'react';
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
  FiSearch
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
  MdOutlineError
} from 'react-icons/md';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import axios from 'axios';

// Correction des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Création d'icônes personnalisées
const createCustomIcon = (color, iconUrl) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white"/>
      </svg>
    </div>`,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });
};

export default function ItineraryModal({ isOpen, onClose, destination }) {
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
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routingControlRef = useRef(null);
  const markersRef = useRef([]);

  // Géocoder l'adresse de destination
  useEffect(() => {
    if (isOpen && destination?.siege && !destinationCoords) {
      geocodeAddress(destination.siege);
    }
  }, [isOpen, destination]);

  // Initialisation de la carte quand les deux positions sont disponibles
  useEffect(() => {
    if (isOpen && userLocation && destinationCoords && !mapInstanceRef.current) {
      initMap();
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [isOpen, userLocation, destinationCoords]);

  // Recalculer l'itinéraire quand le mode de transport change
  useEffect(() => {
    if (userLocation && destinationCoords && mapInstanceRef.current) {
      calculateRoute();
    }
  }, [travelMode, userLocation, destinationCoords]);

  const geocodeAddress = async (address) => {
    if (!address) {
      setGeocodingError('Adresse non disponible');
      return;
    }

    setGeocodingLoading(true);
    setGeocodingError('');

    try {
      // Utilisation de Nominatim (OpenStreetMap) pour le géocodage
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address + ', Bénin', // Ajouter le pays pour plus de précision
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'Careasy/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        setDestinationCoords({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        });
      } else {
        // Si non trouvé, utiliser des coordonnées par défaut pour Cotonou
        console.warn('Adresse non trouvée, utilisation des coordonnées par défaut');
        setDestinationCoords({
          lat: 6.3667,
          lng: 2.4167
        });
        setGeocodingError('Adresse approximative (Cotonou centre)');
      }
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      setGeocodingError('Impossible de localiser cette adresse');
      // Fallback sur Cotonou
      setDestinationCoords({
        lat: 6.3667,
        lng: 2.4167
      });
    } finally {
      setGeocodingLoading(false);
    }
  };

  const initMap = () => {
    if (!mapRef.current || !userLocation || !destinationCoords) return;

    try {
      // Créer la carte centrée entre les deux points
      const center = {
        lat: (userLocation.lat + destinationCoords.lat) / 2,
        lng: (userLocation.lng + destinationCoords.lng) / 2
      };

      const map = L.map(mapRef.current).setView([center.lat, center.lng], 12);

      // Ajouter les tuiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Ajouter des marqueurs personnalisés
      const startMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: createCustomIcon('#228be6', 'start')
      }).addTo(map).bindPopup('Votre position');
      
      const endMarker = L.marker([destinationCoords.lat, destinationCoords.lng], {
        icon: createCustomIcon('#fa5252', 'end')
      }).addTo(map).bindPopup(destination.name);

      markersRef.current = [startMarker, endMarker];

      // Calculer l'itinéraire
      calculateRoute();
    } catch (error) {
      console.error('Erreur d\'initialisation de la carte:', error);
      setMapError('Erreur lors du chargement de la carte');
    }
  };

  const calculateRoute = async () => {
    if (!mapInstanceRef.current || !userLocation || !destinationCoords) return;

    setLoading(true);
    setMapError('');

    try {
      // Supprimer l'ancien contrôle d'itinéraire
      if (routingControlRef.current) {
        mapInstanceRef.current.removeControl(routingControlRef.current);
      }

      // Configurer le mode de transport pour OSRM
      const profile = travelMode === 'walking' ? 'foot' : 
                     travelMode === 'cycling' ? 'bike' : 'car';

      // Créer le contrôle d'itinéraire avec OSRM
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng),
          L.latLng(destinationCoords.lat, destinationCoords.lng)
        ],
        router: L.Routing.osrmv1({
          serviceUrl: `https://router.project-osrm.org/route/v1/${profile}`,
          profile: profile
        }),
        lineOptions: {
          styles: [{
            color: travelMode === 'walking' ? '#10b981' :
                   travelMode === 'cycling' ? '#f59e0b' : '#3b82f6',
            weight: 6,
            opacity: 0.8
          }],
          extendToWaypoints: true,
          missingRouteTolerance: 10
        },
        showAlternatives: false,
        autoRoute: true,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        show: false // Cacher les instructions par défaut
      }).addTo(mapInstanceRef.current);

      routingControlRef.current = routingControl;

      // Écouter l'événement de routage réussi
      routingControl.on('routesfound', (e) => {
        const route = e.routes[0];
        const distance = (route.summary.totalDistance / 1000).toFixed(1);
        const duration = Math.round(route.summary.totalTime / 60);

        setRouteInfo({
          distance,
          duration,
          coordinates: route.coordinates,
          instructions: route.instructions,
          summary: route.summary
        });
        setLoading(false);
      });

      routingControl.on('routingerror', (e) => {
        console.error('Erreur de routage:', e.error);
        setMapError('Impossible de calculer l\'itinéraire');
        setLoading(false);
      });

    } catch (error) {
      console.error('Erreur lors du calcul de l\'itinéraire:', error);
      setMapError('Erreur lors du calcul de l\'itinéraire');
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    setLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        let message = 'Position non disponible';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Veuillez autoriser la géolocalisation';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Position temporairement indisponible';
            break;
          case error.TIMEOUT:
            message = 'Délai de recherche dépassé';
            break;
        }
        setLocationError(message);
        setLoading(false);
      }
    );
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
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

  const handleCenterMap = () => {
    if (mapInstanceRef.current && userLocation && destinationCoords) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [destinationCoords.lat, destinationCoords.lng]
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
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
                  {userLocation ? 'Votre position' : 'Non définie'}
                </p>
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
                {geocodingError && (
                  <span style={styles.addressWarning}>{geocodingError}</span>
                )}
              </div>
            </div>
          </div>

          {/* Modes de transport */}
          <div style={styles.modesContainer}>
            {[
              { id: 'driving', label: 'Voiture' },
              { id: 'walking', label: 'À pied' },
              { id: 'cycling', label: 'Vélo' }
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
                {getModeIcon(mode.id)}
                <span style={styles.modeLabel}>{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Messages d'erreur */}
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

          {mapError && (
            <div style={styles.errorCard}>
              <MdOutlineError style={styles.errorIcon} />
              <p style={styles.errorText}>{mapError}</p>
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
                <p style={styles.mapLoadingText}>Calcul de l'itinéraire...</p>
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
                    <span style={styles.summaryValue}>{routeInfo.distance} km</span>
                  </div>
                </div>
                <div style={styles.summaryDivider}></div>
                <div style={styles.summaryItem}>
                  <FiClock style={{...styles.summaryIcon, color: getModeColor(travelMode)}} />
                  <div style={styles.summaryContent}>
                    <span style={styles.summaryLabel}>Durée</span>
                    <span style={styles.summaryValue}>{formatDuration(routeInfo.duration)}</span>
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
                              {instruction.text || instruction.instruction}
                            </p>
                            <div style={styles.instructionMeta}>
                              <span style={styles.instructionDistance}>
                                {(instruction.distance / 1000).toFixed(1)} km
                              </span>
                              <span style={styles.instructionTime}>
                                ({Math.round(instruction.time / 60)} min)
                              </span>
                            </div>
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
                  Centrer la carte
                </button>
                <button 
                  onClick={() => {
                    if (userLocation && destinationCoords) {
                      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destinationCoords.lat},${destinationCoords.lng}&travelmode=${travelMode}`;
                      window.open(url, '_blank');
                    }
                  }}
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
            <span style={styles.footerNoteText}>
              Itinéraire calculé avec OpenStreetMap • Données © contributeurs OpenStreetMap
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
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    width: '95%',
    maxWidth: '1000px',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
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
    alignItems: 'center',
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
  errorIcon: {
    fontSize: '1.5rem',
    color: '#fa5252',
    flexShrink: 0,
  },
  errorContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  errorText: {
    fontSize: '0.875rem',
    color: '#c92a2a',
    margin: 0,
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
  },
  retryIcon: {
    fontSize: '0.875rem',
  },
  mapContainer: {
    position: 'relative',
    height: '300px',
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
  footerNoteText: {
    fontSize: '0.75rem',
    color: '#868e96',
    textAlign: 'center',
  },
};