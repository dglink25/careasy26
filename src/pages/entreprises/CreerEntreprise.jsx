// careasy-frontend/src/pages/entreprises/CreerEntreprise.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { entrepriseApi } from '../../api/entrepriseApi';
import theme from '../../config/theme';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FaClipboardList,
  FaFileAlt,
  FaUserTie,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaSpinner,
  FaMapPin,
  FaImage,
  FaUpload,
  FaBuilding,
  FaIdCard,
  FaCertificate,
  FaIndustry,
  FaUser,
  FaBriefcase,
  FaCog,
  FaPhone,
  FaMapMarkedAlt,
  FaRedo,
  FaShieldAlt,
  FaSearch,
  FaStreetView,
  FaCity,
  FaMap,
  FaInfoCircle,
  FaMapSigns,
  FaRoad,
  FaHome,
  FaGlobe,
  FaHistory,
  FaCrosshairs,
  FaMapMarker
} from 'react-icons/fa';
import {
  MdBusiness,
  MdWarning,
  MdError,
  MdMyLocation,
  MdGpsFixed,
  MdGpsOff,
  MdLocationDisabled,
  MdOutlineZoomOutMap,
  MdOutlineTerrain
} from 'react-icons/md';
import { HiOfficeBuilding } from 'react-icons/hi';

// Solution pour l'icône par défaut de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STEPS = [
  { id: 1, title: 'Informations générales', icon: <FaClipboardList /> },
  { id: 2, title: 'Documents légaux', icon: <FaFileAlt /> },
  { id: 3, title: 'Dirigeant', icon: <FaUserTie /> },
  { id: 4, title: 'Localisation & Médias', icon: <FaMapMarkerAlt /> },
  { id: 5, title: 'Résumé', icon: <FaCheckCircle /> }
];

// Structure hiérarchique du Bénin (complète)
const BENIN_LOCATIONS = {
  departments: [
    {
      id: '1',
      name: 'Zou',
      communes: [
        {
          id: '1-1',
          name: 'Bohicon',
          arrondissements: [
            { id: '1-1-1', name: 'KPASSAGON', quartiers: ['Gbangamey', 'Zongo', 'Ahouangbo'] },
            { id: '1-1-2', name: 'Bohicon I', quartiers: ['Goho', 'Agongbomey'] },
            { id: '1-1-3', name: 'Bohicon II', quartiers: ['Sodomey', 'Hounsouko'] }
          ]
        },
        {
          id: '1-2',
          name: 'Abomey',
          arrondissements: [
            { id: '1-2-1', name: 'Agbokpa', quartiers: ['Houeme', 'Dema'] },
            { id: '1-2-2', name: 'Gbècon', quartiers: ['Zobocon', 'Aylonto'] }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Littoral',
      communes: [
        {
          id: '2-1',
          name: 'Cotonou',
          arrondissements: [
            { id: '2-1-1', name: '1er Arrondissement', quartiers: ['Ganhi', 'Jericho'] },
            { id: '2-1-2', name: '2ème Arrondissement', quartiers: ['Agla', 'Fidjrossè'] },
            { id: '2-1-3', name: '3ème Arrondissement', quartiers: ['Akpakpa', 'Dandji'] },
            { id: '2-1-4', name: '4ème Arrondissement', quartiers: ['Minontchou', 'Gbégamey'] },
            { id: '2-1-5', name: '5ème Arrondissement', quartiers: ['Zongo', 'Ahouansori'] },
            { id: '2-1-6', name: '6ème Arrondissement', quartiers: ['Vossa', 'Enagnon'] }
          ]
        }
      ]
    },
    {
      id: '3',
      name: 'Ouémé',
      communes: [
        {
          id: '3-1',
          name: 'Porto-Novo',
          arrondissements: [
            { id: '3-1-1', name: '1er Arrondissement', quartiers: ['Avotrou', 'Houinmè'] },
            { id: '3-1-2', name: '2ème Arrondissement', quartiers: ['Akron', 'Agblangandan'] },
            { id: '3-1-3', name: '3ème Arrondissement', quartiers: ['Dowa', 'Tokpa'] }
          ]
        }
      ]
    },
    {
      id: '4',
      name: 'Atlantique',
      communes: [
        {
          id: '4-1',
          name: 'Abomey-Calavi',
          arrondissements: [
            { id: '4-1-1', name: 'Calavi', quartiers: ['Zopah', 'Agah'] },
            { id: '4-1-2', name: 'Godomey', quartiers: ['Lokossa', 'Togbin'] }
          ]
        }
      ]
    }
  ]
};

export default function CreerEntreprise() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);
  const [domaines, setDomaines] = useState([]);
  
  // États pour la hiérarchie administrative
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedArrondissement, setSelectedArrondissement] = useState('');
  const [selectedQuartier, setSelectedQuartier] = useState('');
  const [availableCommunes, setAvailableCommunes] = useState([]);
  const [availableArrondissements, setAvailableArrondissements] = useState([]);
  const [availableQuartiers, setAvailableQuartiers] = useState([]);
  const [addressLine, setAddressLine] = useState('');

  // États pour le rôle personnalisé
  const [customRole, setCustomRole] = useState('');
  const [showCustomRoleInput, setShowCustomRoleInput] = useState(false);

  // États pour la localisation
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 6.4969, lng: 2.6289 }); // Centre Bénin
  const [markerPosition, setMarkerPosition] = useState(null);
  const [mapZoom, setMapZoom] = useState(8);
  const [useHighAccuracy, setUseHighAccuracy] = useState(true);
  const [locationSource, setLocationSource] = useState(null);
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);
  const [searchMethod, setSearchMethod] = useState('hierarchical');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [locationHistory, setLocationHistory] = useState([]);

  // États pour les conditions
  const [attestationAccepted, setAttestationAccepted] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);

  // États pour les animations
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stepDirection, setStepDirection] = useState('next');

  // Références
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    domaine_ids: [],
    ifu_number: '',
    ifu_file: null,
    rccm_number: '',
    rccm_file: null,
    certificate_number: '',
    certificate_file: null,
    pdg_full_name: '',
    pdg_full_profession: '',
    role_user: '',
    custom_role: '',
    siege: '',
    logo: null,
    image_boutique: null,
    whatsapp_phone: '',
    call_phone: '',
    latitude: null,
    longitude: null,
    location_accuracy: null,
    address_formatted: '',
    department: '',
    commune: '',
    arrondissement: '',
    quartier: '',
    street: ''
  });

  const [previews, setPreviews] = useState({
    logo: null,
    image_boutique: null,
    ifu_file: null,
    rccm_file: null,
    certificate_file: null,
  });

  // Initialisation de la carte
  useEffect(() => {
    if (currentStep === 4 && mapContainerRef.current && !mapRef.current) {
      initMap();
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentStep]);

  // Mise à jour de la carte quand la position change
  useEffect(() => {
    if (mapRef.current && markerPosition) {
      mapRef.current.setView([markerPosition.lat, markerPosition.lng], 18);
      if (markerRef.current) {
        markerRef.current.setLatLng([markerPosition.lat, markerPosition.lng]);
      } else {
        markerRef.current = L.marker([markerPosition.lat, markerPosition.lng], {
          draggable: true,
          autoPan: true
        }).addTo(mapRef.current);
        
        markerRef.current.on('dragend', handleMarkerDragEnd);
      }
    }
  }, [markerPosition]);

  // Mise à jour des listes déroulantes
  useEffect(() => {
    if (selectedDepartment) {
      const department = BENIN_LOCATIONS.departments.find(d => d.id === selectedDepartment);
      setAvailableCommunes(department?.communes || []);
      setSelectedCommune('');
      setSelectedArrondissement('');
      setSelectedQuartier('');
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedCommune) {
      const department = BENIN_LOCATIONS.departments.find(d => d.id === selectedDepartment);
      const commune = department?.communes.find(c => c.id === selectedCommune);
      setAvailableArrondissements(commune?.arrondissements || []);
      setSelectedArrondissement('');
      setSelectedQuartier('');
    }
  }, [selectedCommune, selectedDepartment]);

  useEffect(() => {
    if (selectedArrondissement) {
      const department = BENIN_LOCATIONS.departments.find(d => d.id === selectedDepartment);
      const commune = department?.communes.find(c => c.id === selectedCommune);
      const arrondissement = commune?.arrondissements.find(a => a.id === selectedArrondissement);
      setAvailableQuartiers(arrondissement?.quartiers || []);
      setSelectedQuartier('');
    }
  }, [selectedArrondissement, selectedDepartment, selectedCommune]);

  // Charger l'historique des localisations
  useEffect(() => {
    fetchDomaines();
    loadLocationHistory();
  }, []);

  // Recherche automatique quand la hiérarchie est complète
  useEffect(() => {
    if (selectedQuartier && selectedArrondissement && selectedCommune && selectedDepartment) {
      geocodeFromHierarchy();
    }
  }, [selectedQuartier]);

  const initMap = () => {
    if (!mapContainerRef.current) return;
    
    mapRef.current = L.map(mapContainerRef.current).setView(
      [mapCenter.lat, mapCenter.lng], 
      mapZoom
    );
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.current);
    
    if (markerPosition) {
      markerRef.current = L.marker([markerPosition.lat, markerPosition.lng], {
        draggable: true,
        autoPan: true
      }).addTo(mapRef.current);
      
      markerRef.current.on('dragend', handleMarkerDragEnd);
    }
    
    mapRef.current.on('click', handleMapClick);
  };

  const loadLocationHistory = () => {
    try {
      const history = localStorage.getItem('location_history');
      if (history) {
        setLocationHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const saveLocationToHistory = (location) => {
    try {
      const updatedHistory = [location, ...locationHistory].slice(0, 10);
      setLocationHistory(updatedHistory);
      localStorage.setItem('location_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Erreur sauvegarde historique:', error);
    }
  };

  const geocodeFromHierarchy = async () => {
    if (!selectedQuartier) return;

    const department = BENIN_LOCATIONS.departments.find(d => d.id === selectedDepartment);
    const commune = department?.communes.find(c => c.id === selectedCommune);
    const arrondissement = commune?.arrondissements.find(a => a.id === selectedArrondissement);
    
    if (!department || !commune || !arrondissement) return;

    const searchString = `${selectedQuartier}, ${arrondissement.name}, ${commune.name}, ${department.name}, Bénin`;
    
    setIsSearching(true);
    setError('');
    
    try {
      // Utilisation de Nominatim (OpenStreetMap) pour le géocodage
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchString)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newPosition = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
        
        setMarkerPosition(newPosition);
        setMapCenter(newPosition);
        setMapZoom(18);
        
        setFormData(prev => ({
          ...prev,
          latitude: newPosition.lat,
          longitude: newPosition.lng,
          location_accuracy: 10,
          address_formatted: result.display_name,
          department: department.name,
          commune: commune.name,
          arrondissement: arrondissement.name,
          quartier: selectedQuartier
        }));

        setLocationSource('hierarchical');
        
        const locationInfo = {
          address: result.display_name,
          lat: newPosition.lat,
          lng: newPosition.lng,
          timestamp: new Date().toISOString(),
          source: 'hierarchical'
        };
        saveLocationToHistory(locationInfo);
      } else {
        setError('Adresse non trouvée. Veuillez utiliser la recherche manuelle.');
      }
    } catch (error) {
      console.error('Erreur géocodage:', error);
      setError('Erreur de géocodage. Veuillez réessayer.');
    } finally {
      setIsSearching(false);
    }
  };

  const searchLocation = async (query) => {
    if (!query || query.length < 3) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Bénin')}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (value.length >= 3) {
        searchLocation(value);
      } else {
        setSearchResults([]);
      }
    }, 500);
  };

  const selectSearchResult = (result) => {
    const position = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
    
    setMarkerPosition(position);
    setMapCenter(position);
    setMapZoom(18);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    
    setFormData(prev => ({
      ...prev,
      latitude: position.lat,
      longitude: position.lng,
      location_accuracy: 10,
      address_formatted: result.display_name
    }));

    setLocationSource('search');
    
    const locationInfo = {
      address: result.display_name,
      lat: position.lat,
      lng: position.lng,
      timestamp: new Date().toISOString(),
      source: 'search'
    };
    saveLocationToHistory(locationInfo);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsLocating(true);
    setError('');

    const options = {
      enableHighAccuracy: useHighAccuracy,
      timeout: 30000,
      maximumAge: 0
    };

    const success = async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      
      const newPosition = { lat: latitude, lng: longitude };
      setMarkerPosition(newPosition);
      setMapCenter(newPosition);
      setMapZoom(18);
      setLocationAccuracy(accuracy);
      
      setFormData(prev => ({
        ...prev,
        latitude,
        longitude,
        location_accuracy: accuracy
      }));

      setLocationSource('gps');

      // Reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        
        if (data.display_name) {
          setFormData(prev => ({
            ...prev,
            address_formatted: data.display_name
          }));
          
          const locationInfo = {
            address: data.display_name,
            lat: latitude,
            lng: longitude,
            accuracy,
            timestamp: new Date().toISOString(),
            source: 'gps'
          };
          saveLocationToHistory(locationInfo);
        }
      } catch (error) {
        console.error('Erreur reverse geocoding:', error);
      }
      
      setIsLocating(false);
    };

    const error = (error) => {
      console.error('Erreur géolocalisation:', error);
      setIsLocating(false);
      
      let errorMessage = 'Erreur de géolocalisation';
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Vous avez refusé la géolocalisation. Veuillez utiliser la recherche.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Position indisponible. Veuillez réessayer.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Délai de géolocalisation dépassé.';
          break;
        default:
          errorMessage = error.message;
      }
      setError(errorMessage);
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
  };

  const handleMapClick = (e) => {
    const position = {
      lat: e.latlng.lat,
      lng: e.latlng.lng
    };
    
    setMarkerPosition(position);
    setMapCenter(position);
    
    setFormData(prev => ({
      ...prev,
      latitude: position.lat,
      longitude: position.lng,
      location_accuracy: 5
    }));

    setLocationSource('manual');

    // Reverse geocoding
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`
    )
      .then(response => response.json())
      .then(data => {
        if (data.display_name) {
          setFormData(prev => ({
            ...prev,
            address_formatted: data.display_name
          }));
        }
      })
      .catch(console.error);
  };

  const handleMarkerDragEnd = (e) => {
    const position = {
      lat: e.target.getLatLng().lat,
      lng: e.target.getLatLng().lng
    };
    
    setMarkerPosition(position);
    setMapCenter(position);
    setIsDraggingMarker(false);
    
    setFormData(prev => ({
      ...prev,
      latitude: position.lat,
      longitude: position.lng,
      location_accuracy: 3
    }));

    setLocationSource('manual_adjustment');

    // Reverse geocoding
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`
    )
      .then(response => response.json())
      .then(data => {
        if (data.display_name) {
          setFormData(prev => ({
            ...prev,
            address_formatted: data.display_name
          }));
        }
      })
      .catch(console.error);
  };

  const fetchDomaines = async () => {
    setDomainLoading(true);
    try {
      const data = await entrepriseApi.getFormData();
      setDomaines(data.domaines || []);
    } catch (err) {
      setError('Erreur lors du chargement des domaines');
    } finally {
      setDomainLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'role_user') {
      setShowCustomRoleInput(value === 'Autre');
      if (value !== 'Autre') {
        setCustomRole('');
        setFormData(prev => ({ ...prev, custom_role: '' }));
      }
    }
  };

  const handleCustomRoleChange = (e) => {
    const value = e.target.value;
    setCustomRole(value);
    setFormData(prev => ({ ...prev, custom_role: value }));
  };

  const handleDomaineToggle = (domaineId) => {
    setFormData(prev => {
      const isSelected = prev.domaine_ids.includes(domaineId);
      return {
        ...prev,
        domaine_ids: isSelected
          ? prev.domaine_ids.filter(id => id !== domaineId)
          : [...prev.domaine_ids, domaineId]
      };
    });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, [field]: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = () => {
    setError('');
    setSuccess('');
    
    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) {
          setError('Le nom de l\'entreprise est obligatoire');
          return false;
        }
        if (formData.domaine_ids.length === 0) {
          setError('Sélectionnez au moins un domaine');
          return false;
        }
        break;
      
      case 2:
        if (!formData.ifu_number.trim()) {
          setError('Le numéro IFU est obligatoire');
          return false;
        }
        if (!formData.ifu_file) {
          setError('Le fichier IFU est obligatoire');
          return false;
        }
        if (!formData.rccm_number.trim()) {
          setError('Le numéro RCCM est obligatoire');
          return false;
        }
        if (!formData.rccm_file) {
          setError('Le fichier RCCM est obligatoire');
          return false;
        }
        if (!formData.certificate_number.trim()) {
          setError('Le numéro de certificat est obligatoire');
          return false;
        }
        if (!formData.certificate_file) {
          setError('Le fichier certificat est obligatoire');
          return false;
        }
        break;
      
      case 3:
        if (!formData.pdg_full_name.trim()) {
          setError('Le nom du dirigeant est obligatoire');
          return false;
        }
        if (!formData.pdg_full_profession.trim()) {
          setError('La profession du dirigeant est obligatoire');
          return false;
        }
        if (!formData.role_user.trim()) {
          setError('Le rôle dans l\'entreprise est obligatoire');
          return false;
        }
        if (formData.role_user === 'Autre' && !formData.custom_role?.trim()) {
          setError('Veuillez préciser votre rôle');
          return false;
        }
        if (!formData.whatsapp_phone.trim()) {
          setError('Le téléphone WhatsApp est obligatoire');
          return false;
        }
        if (!formData.call_phone.trim()) {
          setError('Le téléphone pour appels est obligatoire');
          return false;
        }
        break;
      
      case 4:
        if (!formData.latitude || !formData.longitude) {
          setError('La localisation de votre entreprise est requise');
          return false;
        }
        break;
      
      case 5:
        if (!attestationAccepted || !privacyPolicyAccepted) {
          setError('Vous devez accepter les conditions pour soumettre');
          return false;
        }
        
        if (!formData.latitude || !formData.longitude) {
          setError('La localisation est requise pour soumettre');
          return false;
        }
        break;
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStepDirection('next');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => Math.min(prev + 1, 5));
        setIsTransitioning(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }
  };

  const prevStep = () => {
    setStepDirection('prev');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(prev => Math.max(prev - 1, 1));
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  const handleSubmit = async () => {
    if (!attestationAccepted || !privacyPolicyAccepted) {
      setError('Vous devez accepter les conditions pour soumettre');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('La localisation de votre entreprise est requise');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      
      // 1. Champs requis par la validation Laravel
      submitData.append('name', formData.name);
      submitData.append('ifu_number', formData.ifu_number);
      submitData.append('rccm_number', formData.rccm_number);
      submitData.append('certificate_number', formData.certificate_number);
      submitData.append('pdg_full_name', formData.pdg_full_name);
      submitData.append('pdg_full_profession', formData.pdg_full_profession);
      
      // 2. Gestion spéciale du rôle
      if (formData.role_user === 'Autre') {
        submitData.append('role_user', formData.custom_role);
      } else {
        submitData.append('role_user', formData.role_user);
      }
      
      submitData.append('whatsapp_phone', formData.whatsapp_phone);
      submitData.append('call_phone', formData.call_phone);
      
      // 3. Champs optionnels
      if (formData.siege) {
        submitData.append('siege', formData.siege);
      }
      
      // 4. Domaines (obligatoire)
      formData.domaine_ids.forEach(id => {
        submitData.append('domaine_ids[]', id);
      });

      // 5. Coordonnées (obligatoires)
      submitData.append('latitude', formData.latitude.toString());
      submitData.append('longitude', formData.longitude.toString());

      // 6. Adresse formatée pour Google (optionnel mais attendu par Laravel)
      if (formData.address_formatted) {
        submitData.append('google_formatted_address', formData.address_formatted);
      } else {
        // Fallback si pas d'adresse
        submitData.append('google_formatted_address', `${formData.latitude}, ${formData.longitude}`);
      }

      // 7. Fichiers (obligatoires)
      if (formData.ifu_file) {
        submitData.append('ifu_file', formData.ifu_file);
      }
      if (formData.rccm_file) {
        submitData.append('rccm_file', formData.rccm_file);
      }
      if (formData.certificate_file) {
        submitData.append('certificate_file', formData.certificate_file);
      }
      
      // 8. Fichiers optionnels
      if (formData.logo) {
        submitData.append('logo', formData.logo);
      }
      if (formData.image_boutique) {
        submitData.append('image_boutique', formData.image_boutique);
      }

      // Log pour déboguer
      console.log('Données envoyées:');
      for (let pair of submitData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      await entrepriseApi.createEntreprise(submitData);
      
      setSuccess('Entreprise créée avec succès ! Redirection en cours...');
      
      setTimeout(() => {
        navigate('/mes-entreprises', { 
          state: { 
            success: 'Votre entreprise a été créée avec succès et est en attente de validation.' 
          } 
        });
      }, 2000);
      
    } catch (err) {
      console.error('Erreur détaillée:', err.response?.data);
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'entreprise');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const renderHierarchicalSearch = () => (
    <div style={styles.hierarchicalSearch}>
      <div style={styles.hierarchyLevel}>
        <label style={styles.hierarchyLabel}>
          <FaCity style={styles.hierarchyIcon} />
          Département
        </label>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          style={styles.hierarchySelect}
        >
          <option value="">-- Choisir un département --</option>
          {BENIN_LOCATIONS.departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      {selectedDepartment && (
        <div style={styles.hierarchyLevel}>
          <label style={styles.hierarchyLabel}>
            <FaMap style={styles.hierarchyIcon} />
            Commune
          </label>
          <select
            value={selectedCommune}
            onChange={(e) => setSelectedCommune(e.target.value)}
            style={styles.hierarchySelect}
          >
            <option value="">-- Choisir une commune --</option>
            {availableCommunes.map(commune => (
              <option key={commune.id} value={commune.id}>{commune.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedCommune && (
        <div style={styles.hierarchyLevel}>
          <label style={styles.hierarchyLabel}>
            <FaMapSigns style={styles.hierarchyIcon} />
            Arrondissement
          </label>
          <select
            value={selectedArrondissement}
            onChange={(e) => setSelectedArrondissement(e.target.value)}
            style={styles.hierarchySelect}
          >
            <option value="">-- Choisir un arrondissement --</option>
            {availableArrondissements.map(arr => (
              <option key={arr.id} value={arr.id}>{arr.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedArrondissement && (
        <div style={styles.hierarchyLevel}>
          <label style={styles.hierarchyLabel}>
            <FaHome style={styles.hierarchyIcon} />
            Quartier
          </label>
          <select
            value={selectedQuartier}
            onChange={(e) => setSelectedQuartier(e.target.value)}
            style={styles.hierarchySelect}
          >
            <option value="">-- Choisir un quartier --</option>
            {availableQuartiers.map(quartier => (
              <option key={quartier} value={quartier}>{quartier}</option>
            ))}
          </select>
        </div>
      )}

      {selectedQuartier && (
        <div style={styles.hierarchyLevel}>
          <label style={styles.hierarchyLabel}>
            <FaRoad style={styles.hierarchyIcon} />
            Adresse précise (rue, numéro)
          </label>
          <input
            type="text"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="Ex: Rue 123, Maison XYZ"
            style={styles.hierarchyInput}
          />
        </div>
      )}
    </div>
  );

  const renderSearch = () => (
    <div style={styles.searchSection}>
      <div style={styles.searchContainer}>
        <FaSearch style={styles.searchIcon} />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Rechercher une adresse, un lieu..."
          style={styles.searchInput}
        />
        {isSearching && <FaSpinner className="spin" style={styles.searchSpinner} />}
      </div>

      {searchResults.length > 0 && (
        <div style={styles.searchResults}>
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => selectSearchResult(result)}
              style={styles.searchResultItem}
            >
              <FaMapMarker style={styles.resultIcon} />
              <div style={styles.resultText}>
                <div style={styles.resultName}>{result.display_name}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {locationHistory.length > 0 && (
        <div style={styles.locationHistory}>
          <p style={styles.historyTitle}>
            <FaHistory /> Localisations récentes
          </p>
          {locationHistory.map((loc, index) => (
            <button
              key={index}
              onClick={() => {
                setMarkerPosition({ lat: loc.lat, lng: loc.lng });
                setMapCenter({ lat: loc.lat, lng: loc.lng });
                setMapZoom(18);
                setFormData(prev => ({
                  ...prev,
                  latitude: loc.lat,
                  longitude: loc.lng,
                  address_formatted: loc.address
                }));
              }}
              style={styles.historyItem}
            >
              <FaMapMarkerAlt style={styles.historyIcon} />
              <span>{loc.address.substring(0, 50)}...</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderMap = () => (
    <div style={styles.mapWrapper}>
      <div style={styles.mapControls}>
        <button
          onClick={getCurrentLocation}
          disabled={isLocating}
          style={{
            ...styles.mapControlButton,
            ...(isLocating ? styles.mapControlButtonDisabled : {})
          }}
        >
          {isLocating ? (
            <>
              <FaSpinner className="spin" style={styles.controlIcon} />
              Localisation...
            </>
          ) : (
            <>
              <MdMyLocation style={styles.controlIcon} />
              Ma position
            </>
          )}
        </button>
        
        <button
          onClick={() => {
            if (markerPosition) {
              setMapCenter(markerPosition);
              setMapZoom(20);
            }
          }}
          style={styles.mapControlButton}
          disabled={!markerPosition}
        >
          <MdOutlineZoomOutMap style={styles.controlIcon} />
          Recentrer
        </button>

        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setView([6.4969, 2.6289], 8);
            }
          }}
          style={styles.mapControlButton}
        >
          <FaGlobe style={styles.controlIcon} />
          Vue générale
        </button>
      </div>

      <div
        ref={mapContainerRef}
        style={styles.mapContainer}
      />

      {markerPosition && (
        <div style={styles.locationInfo}>
          <div style={styles.locationInfoHeader}>
            <FaInfoCircle style={styles.locationInfoIcon} />
            <span style={styles.locationInfoTitle}>Position sélectionnée</span>
          </div>
          
          <div style={styles.locationInfoContent}>
            <p style={styles.locationCoords}>
              <strong>Latitude:</strong> {markerPosition.lat.toFixed(6)}°
            </p>
            <p style={styles.locationCoords}>
              <strong>Longitude:</strong> {markerPosition.lng.toFixed(6)}°
            </p>
            
            {formData.location_accuracy && (
              <p style={styles.locationAccuracy}>
                <strong>Précision:</strong> {Math.round(formData.location_accuracy)} mètres
                {locationSource === 'gps' && ' (GPS)'}
                {locationSource === 'manual' && ' (Position manuelle)'}
                {locationSource === 'search' && ' (Recherche)'}
                {locationSource === 'hierarchical' && ' (Hiérarchique)'}
              </p>
            )}
            
            {formData.address_formatted && (
              <div style={styles.locationAddress}>
                <FaMapMarkerAlt style={styles.addressIcon} />
                <span>{formData.address_formatted}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep = () => {
    const stepContent = (() => {
      switch (currentStep) {
        case 1:
          return (
            <div style={styles.stepContent}>
              <div style={styles.stepHeader}>
                <FaClipboardList style={styles.stepIcon} />
                <h2 style={styles.stepTitle}>Informations générales</h2>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <MdBusiness style={styles.labelIcon} />
                  Nom de l'entreprise <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ex: Garage Auto Excellence"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <FaIndustry style={styles.labelIcon} />
                  Domaines d'activité <span style={styles.required}>*</span>
                </label>
                <p style={styles.hint}>Sélectionnez au moins un domaine</p>
                {domainLoading ? (
                  <div style={styles.loadingContainer}>
                    <FaSpinner className="spin" style={styles.spinner} />
                    <span>Chargement des domaines...</span>
                  </div>
                ) : (
                  <div style={styles.domainesGrid}>
                    {domaines.map(domaine => (
                      <button
                        key={domaine.id}
                        type="button"
                        onClick={() => handleDomaineToggle(domaine.id)}
                        style={{
                          ...styles.domaineButton,
                          ...(formData.domaine_ids.includes(domaine.id) ? styles.domaineButtonActive : {})
                        }}
                      >
                        {formData.domaine_ids.includes(domaine.id) && <FaCheck style={{ marginRight: '8px' }} />}
                        {domaine.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );

        case 2:
          return (
            <div style={styles.stepContent}>
              <div style={styles.stepHeader}>
                <FaFileAlt style={styles.stepIcon} />
                <h2 style={styles.stepTitle}>Documents légaux</h2>
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FaIdCard style={styles.labelIcon} />
                    Numéro IFU <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="ifu_number"
                    value={formData.ifu_number}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Ex: 1234567890123"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FaUpload style={styles.labelIcon} />
                    Fichier IFU (PDF/Image) <span style={styles.required}>*</span>
                  </label>
                  <div style={styles.fileUpload}>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileChange(e, 'ifu_file')}
                      style={styles.fileInput}
                      id="ifu-file"
                    />
                    <label htmlFor="ifu-file" style={styles.fileLabel}>
                      <FaUpload /> Choisir un fichier
                    </label>
                    {previews.ifu_file && (
                      <div style={styles.fileSuccess}>
                        <FaCheck /> Fichier chargé
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FaCertificate style={styles.labelIcon} />
                    Numéro RCCM <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="rccm_number"
                    value={formData.rccm_number}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Ex: RB/COT/12/B/345"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FaUpload style={styles.labelIcon} />
                    Fichier RCCM (PDF/Image) <span style={styles.required}>*</span>
                  </label>
                  <div style={styles.fileUpload}>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileChange(e, 'rccm_file')}
                      style={styles.fileInput}
                      id="rccm-file"
                    />
                    <label htmlFor="rccm-file" style={styles.fileLabel}>
                      <FaUpload /> Choisir un fichier
                    </label>
                    {previews.rccm_file && (
                      <div style={styles.fileSuccess}>
                        <FaCheck /> Fichier chargé
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FaCertificate style={styles.labelIcon} />
                    Numéro de certificat <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="certificate_number"
                    value={formData.certificate_number}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Ex: CERT-2024-12345"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FaUpload style={styles.labelIcon} />
                    Fichier certificat (PDF/Image) <span style={styles.required}>*</span>
                  </label>
                  <div style={styles.fileUpload}>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileChange(e, 'certificate_file')}
                      style={styles.fileInput}
                      id="certificate-file"
                    />
                    <label htmlFor="certificate-file" style={styles.fileLabel}>
                      <FaUpload /> Choisir un fichier
                    </label>
                    {previews.certificate_file && (
                      <div style={styles.fileSuccess}>
                        <FaCheck /> Fichier chargé
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );

        case 3:
          return (
            <div style={styles.stepContent}>
              <div style={styles.stepHeader}>
                <FaUserTie style={styles.stepIcon} />
                <h2 style={styles.stepTitle}>Informations du dirigeant</h2>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <FaUser style={styles.labelIcon} />
                  Nom complet du PDG <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="pdg_full_name"
                  value={formData.pdg_full_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ex: Jean Dupont"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <FaBriefcase style={styles.labelIcon} />
                  Profession du PDG <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="pdg_full_profession"
                  value={formData.pdg_full_profession}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ex: Ingénieur mécanicien"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <FaCog style={styles.labelIcon} />
                  Votre rôle dans l'entreprise <span style={styles.required}>*</span>
                </label>
                <select
                  name="role_user"
                  value={formData.role_user}
                  onChange={handleChange}
                  style={styles.select}
                  required
                >
                  <option value="">-- Choisir un rôle --</option>
                  <option value="PDG">PDG</option>
                  <option value="Directeur Général">Directeur Général</option>
                  <option value="Gérant">Gérant</option>
                  <option value="Directeur">Directeur</option>
                  <option value="Manager">Manager</option>
                  <option value="Autre">Autre (à préciser)</option>
                </select>
                
                {showCustomRoleInput && (
                  <div style={styles.customRoleContainer}>
                    <input
                      type="text"
                      value={customRole}
                      onChange={handleCustomRoleChange}
                      placeholder="Précisez votre rôle..."
                      style={styles.customRoleInput}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FaPhone style={styles.labelIcon} />
                    Téléphone WhatsApp <span style={styles.required}>*</span>
                  </label>
                  <p style={styles.hint}>
                    Numéro pour recevoir les messages WhatsApp des clients
                  </p>
                  <input
                    type="tel"
                    name="whatsapp_phone"
                    value={formData.whatsapp_phone}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Ex: +229 97 00 00 00"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FaPhone style={styles.labelIcon} />
                    Téléphone pour appels <span style={styles.required}>*</span>
                  </label>
                  <p style={styles.hint}>
                    Numéro pour recevoir les appels directs des clients
                  </p>
                  <input
                    type="tel"
                    name="call_phone"
                    value={formData.call_phone}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Ex: +229 97 00 00 00"
                    required
                  />
                </div>
              </div>
            </div>
          );

        case 4:
          return (
            <div style={styles.stepContent}>
              <div style={styles.stepHeader}>
                <FaMapMarkerAlt style={styles.stepIcon} />
                <h2 style={styles.stepTitle}>Localisation & Médias</h2>
              </div>
              
              <div style={styles.locationTabs}>
                <button
                  onClick={() => setSearchMethod('hierarchical')}
                  style={{
                    ...styles.locationTab,
                    ...(searchMethod === 'hierarchical' ? styles.locationTabActive : {})
                  }}
                >
                  <FaCity style={styles.tabIcon} />
                  <span>Recherche hiérarchique</span>
                </button>
                
                <button
                  onClick={() => setSearchMethod('search')}
                  style={{
                    ...styles.locationTab,
                    ...(searchMethod === 'search' ? styles.locationTabActive : {})
                  }}
                >
                  <FaSearch style={styles.tabIcon} />
                  <span>Recherche libre</span>
                </button>
              </div>

              <div style={styles.locationSection}>
                {searchMethod === 'hierarchical' && renderHierarchicalSearch()}
                {searchMethod === 'search' && renderSearch()}
              </div>

              {renderMap()}

              <div style={styles.accuracyOptions}>
                <label style={styles.accuracyLabel}>
                  <input
                    type="checkbox"
                    checked={useHighAccuracy}
                    onChange={(e) => setUseHighAccuracy(e.target.checked)}
                    style={styles.accuracyCheckbox}
                  />
                  <span>Utiliser la haute précision GPS (recommandé)</span>
                </label>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <HiOfficeBuilding style={styles.labelIcon} />
                  Siège de l'entreprise
                </label>
                <p style={styles.hint}>
                  Adresse approximative (ex: Cotonou, Akpakpa)
                </p>
                <input
                  type="text"
                  name="siege"
                  value={formData.siege}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ex: Cotonou, Akpakpa"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FaImage style={styles.labelIcon} />
                    Logo de l'entreprise
                  </label>
                  <div style={styles.imageUpload}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'logo')}
                      style={styles.fileInput}
                      id="logo-file"
                    />
                    <label htmlFor="logo-file" style={styles.imageLabel}>
                      {previews.logo ? (
                        <>
                          <img src={previews.logo} alt="Logo" style={styles.imagePreview} />
                          <span style={styles.imageOverlay}>Changer l'image</span>
                        </>
                      ) : (
                        <div style={styles.imagePlaceholder}>
                          <FaImage size={48} />
                          <span>Choisir un logo</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FaBuilding style={styles.labelIcon} />
                    Image de la boutique
                  </label>
                  <div style={styles.imageUpload}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'image_boutique')}
                      style={styles.fileInput}
                      id="boutique-file"
                    />
                    <label htmlFor="boutique-file" style={styles.imageLabel}>
                      {previews.image_boutique ? (
                        <>
                          <img src={previews.image_boutique} alt="Boutique" style={styles.imagePreview} />
                          <span style={styles.imageOverlay}>Changer l'image</span>
                        </>
                      ) : (
                        <div style={styles.imagePlaceholder}>
                          <FaBuilding size={48} />
                          <span>Choisir une image</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          );

        case 5:
          const selectedDomaines = domaines.filter(d => formData.domaine_ids.includes(d.id));
          const displayRole = formData.role_user === 'Autre' ? formData.custom_role : formData.role_user;
          
          return (
            <div style={styles.stepContent}>
              <div style={styles.stepHeader}>
                <FaCheckCircle style={styles.stepIcon} />
                <h2 style={styles.stepTitle}>Résumé de votre entreprise</h2>
              </div>
              
              <div style={styles.summary}>
                <div style={styles.summarySection}>
                  <h3 style={styles.summaryTitle}>
                    <FaClipboardList style={styles.summaryIcon} />
                    Informations générales
                  </h3>
                  <p><strong>Nom :</strong> {formData.name}</p>
                  <p><strong>Domaines :</strong> {selectedDomaines.map(d => d.name).join(', ')}</p>
                </div>

                <div style={styles.summarySection}>
                  <h3 style={styles.summaryTitle}>
                    <FaFileAlt style={styles.summaryIcon} />
                    Documents
                  </h3>
                  <p><strong>IFU :</strong> {formData.ifu_number} {previews.ifu_file && <FaCheck style={{ color: theme.colors.success, marginLeft: '5px' }} />}</p>
                  <p><strong>RCCM :</strong> {formData.rccm_number} {previews.rccm_file && <FaCheck style={{ color: theme.colors.success, marginLeft: '5px' }} />}</p>
                  <p><strong>Certificat :</strong> {formData.certificate_number} {previews.certificate_file && <FaCheck style={{ color: theme.colors.success, marginLeft: '5px' }} />}</p>
                </div>

                <div style={styles.summarySection}>
                  <h3 style={styles.summaryTitle}>
                    <FaUserTie style={styles.summaryIcon} />
                    Dirigeant
                  </h3>
                  <p><strong>Nom :</strong> {formData.pdg_full_name}</p>
                  <p><strong>Profession :</strong> {formData.pdg_full_profession}</p>
                  <p><strong>Rôle :</strong> {displayRole}</p>
                  <p><strong>WhatsApp :</strong> {formData.whatsapp_phone}</p>
                  <p><strong>Téléphone appel :</strong> {formData.call_phone}</p>
                </div>

                <div style={styles.summarySection}>
                  <h3 style={styles.summaryTitle}>
                    <FaMapMarkerAlt style={styles.summaryIcon} />
                    Localisation & Médias
                  </h3>
                  <p><strong>Siège :</strong> {formData.siege || 'Non renseigné'}</p>
                  {formData.latitude && formData.longitude && (
                    <>
                      <p>
                        <strong>Position GPS :</strong> 
                        <FaMapPin style={{ color: theme.colors.success, marginLeft: '5px' }} />
                        ({formData.latitude.toFixed(6)}°, {formData.longitude.toFixed(6)}°)
                      </p>
                      {formData.location_accuracy && (
                        <p><strong>Précision :</strong> {Math.round(formData.location_accuracy)} mètres</p>
                      )}
                      {formData.address_formatted && (
                        <p><strong>Adresse :</strong> {formData.address_formatted}</p>
                      )}
                    </>
                  )}
                  <p><strong>Logo :</strong> {previews.logo ? <FaCheck style={{ color: theme.colors.success, marginLeft: '5px' }} /> : 'Non fourni'}</p>
                  <p><strong>Image boutique :</strong> {previews.image_boutique ? <FaCheck style={{ color: theme.colors.success, marginLeft: '5px' }} /> : 'Non fournie'}</p>
                </div>

                <div style={styles.termsSection}>
                  <h3 style={styles.termsTitle}>
                    <FaShieldAlt style={styles.termsIcon} />
                    Validation finale
                  </h3>
                  
                  <div style={styles.checkboxGroup}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={attestationAccepted}
                        onChange={(e) => setAttestationAccepted(e.target.checked)}
                        style={styles.checkbox}
                      />
                      <span style={styles.checkboxText}>
                        J'atteste que les informations sont correctes
                      </span>
                    </label>
                    
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={privacyPolicyAccepted}
                        onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
                        style={styles.checkbox}
                      />
                      <span style={styles.checkboxText}>
                        J'accepte les conditions d'utilisation
                      </span>
                    </label>
                  </div>
                </div>

                <div style={styles.warningBox}>
                  <MdWarning style={styles.warningIcon} />
                  <div>
                    <strong>Information importante</strong>
                    <p>Votre entreprise sera envoyée pour validation.</p>
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    })();

    return (
      <div style={{
        ...styles.stepContainer,
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning 
          ? `translateX(${stepDirection === 'next' ? '20px' : '-20px'})` 
          : 'translateX(0)',
        transition: 'all 0.3s ease'
      }}>
        {stepContent}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <Link to="/mes-entreprises" style={styles.backButton}>
          <FaArrowLeft style={styles.backIcon} />
          Retour
        </Link>
        
        <div style={styles.header}>
          <h1 style={styles.title}>Créer une entreprise</h1>
          <p style={styles.subtitle}>Remplissez les informations nécessaires pour enregistrer votre entreprise</p>
        </div>

        <div style={styles.stepper}>
          {STEPS.map((step) => (
            <div
              key={step.id}
              style={{
                ...styles.stepIndicator,
                ...(step.id === currentStep ? styles.stepActive : {}),
                ...(step.id < currentStep ? styles.stepCompleted : {})
              }}
            >
              <div style={{
                ...styles.stepCircle,
                ...(step.id === currentStep ? styles.stepCircleActive : {}),
                ...(step.id < currentStep ? styles.stepCircleCompleted : {})
              }}>
                {step.id < currentStep ? <FaCheck /> : step.icon}
              </div>
              <div style={styles.stepLabel}>{step.title}</div>
              {step.id < STEPS.length && (
                <div style={styles.stepConnector}></div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div style={styles.errorMessage}>
            <MdError style={styles.messageIcon} />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div style={styles.successMessage}>
            <FaCheckCircle style={styles.messageIcon} />
            <span>{success}</span>
          </div>
        )}

        <div style={styles.card}>
          {renderStep()}
        </div>

        <div style={styles.navigation}>
          {currentStep > 1 && (
            <button 
              onClick={prevStep} 
              disabled={isTransitioning}
              style={styles.btnSecondary}
            >
              <FaArrowLeft style={styles.btnIcon} />
              Précédent
            </button>
          )}
          
          <div style={{flex: 1}} />
          
          {currentStep < 5 ? (
            <button 
              onClick={nextStep} 
              disabled={isTransitioning}
              style={styles.btnPrimary}
            >
              Suivant
              <FaArrowRight style={styles.btnIcon} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={
                loading || 
                !formData.latitude || 
                !formData.longitude || 
                isTransitioning ||
                !attestationAccepted ||
                !privacyPolicyAccepted
              }
              style={{
                ...styles.btnPrimary, 
                ...styles.btnSuccess,
                opacity: (loading || !formData.latitude || !formData.longitude || !attestationAccepted || !privacyPolicyAccepted) ? 0.6 : 1
              }}
            >
              {loading ? (
                <>
                  <FaSpinner className="spin" style={{ ...styles.btnIcon, marginRight: '8px' }} />
                  Envoi en cours...
                </>
              ) : !formData.latitude || !formData.longitude ? (
                <>
                  <MdError style={{ ...styles.btnIcon, marginRight: '8px' }} />
                  Localisation requise
                </>
              ) : (
                <>
                  <FaCheckCircle style={{ ...styles.btnIcon, marginRight: '8px' }} />
                  Finaliser et envoyer
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: theme.colors.background,
    padding: '2rem 1rem',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #f5f7fa 0%)',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2.5rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: theme.colors.text.primary,
    background: 'linear-gradient(90deg, ' + theme.colors.primary + ', ' + theme.colors.accent + ')',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: theme.colors.text.secondary,
    maxWidth: '600px',
    margin: '0 auto',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: '600',
    marginBottom: '1.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    transition: 'all 0.3s',
    border: '1px solid rgba(59, 130, 246, 0.2)',
  },
  backIcon: {
    fontSize: '0.9rem',
  },
  stepper: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '3rem',
    position: 'relative',
  },
  stepIndicator: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  stepCircle: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: theme.colors.primaryLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '0.75rem',
    border: `3px solid ${theme.colors.primaryLight}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: theme.shadows.md,
  },
  stepCircleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    transform: 'scale(1.1)',
    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
  },
  stepCircleCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  stepLabel: {
    fontSize: '0.9rem',
    color: theme.colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
    padding: '0 0.5rem',
  },
  stepConnector: {
    position: 'absolute',
    top: '30px',
    left: '60%',
    right: '-40%',
    height: '3px',
    backgroundColor: theme.colors.primaryLight,
    zIndex: 0,
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#fee2e2',
    color: theme.colors.error,
    padding: '1.25rem',
    borderRadius: theme.borderRadius.lg,
    marginBottom: '1.5rem',
    border: `2px solid ${theme.colors.error}`,
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#d1fae5',
    color: theme.colors.success,
    padding: '1.25rem',
    borderRadius: theme.borderRadius.lg,
    marginBottom: '1.5rem',
    border: `2px solid ${theme.colors.success}`,
  },
  messageIcon: {
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  card: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: '2.5rem',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    marginBottom: '2.5rem',
    border: `1px solid rgba(59, 130, 246, 0.1)`,
    minHeight: '500px',
    position: 'relative',
    overflow: 'hidden',
  },
  stepContainer: {
    opacity: 1,
    transition: 'all 0.3s ease',
  },
  stepContent: {
    animation: 'fadeIn 0.5s ease-out',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: `2px solid ${theme.colors.primaryLight}`,
  },
  stepIcon: {
    fontSize: '2rem',
    color: theme.colors.primary,
  },
  stepTitle: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  formGroup: {
    marginBottom: '2rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    marginBottom: '1rem',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: theme.colors.text.primary,
    fontSize: '1rem',
  },
  labelIcon: {
    color: theme.colors.primary,
    fontSize: '1rem',
  },
  required: {
    color: theme.colors.error,
    marginLeft: '2px',
  },
  hint: {
    fontSize: '0.875rem',
    color: theme.colors.text.secondary,
    marginBottom: '1rem',
    lineHeight: '1.5',
  },
  input: {
    width: '100%',
    padding: '1rem 1.25rem',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.lg,
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  select: {
    width: '100%',
    padding: '1rem 1.25rem',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.lg,
    fontSize: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  customRoleContainer: {
    marginTop: '1rem',
    animation: 'slideDown 0.3s ease-out',
  },
  customRoleInput: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: `2px solid ${theme.colors.primary}`,
    borderRadius: theme.borderRadius.md,
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.3s',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  fileUpload: {
    position: 'relative',
  },
  fileInput: {
    display: 'none',
  },
  fileLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 1.5rem',
    backgroundColor: theme.colors.primary,
    color: '#fff',
    borderRadius: theme.borderRadius.lg,
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s',
    border: 'none',
    fontSize: '0.95rem',
  },
  fileSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.75rem',
    color: theme.colors.success,
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  imageUpload: {
    border: `2px dashed ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.lg,
    padding: '1rem',
    transition: 'all 0.3s',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageLabel: {
    display: 'block',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.md,
  },
  imagePreview: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: theme.borderRadius.md,
    transition: 'transform 0.3s',
  },
  imagePlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: theme.colors.text.secondary,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: theme.borderRadius.md,
    gap: '1rem',
    transition: 'all 0.3s',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    color: '#fff',
    padding: '0.75rem',
    textAlign: 'center',
    fontWeight: '600',
    transform: 'translateY(100%)',
    transition: 'transform 0.3s',
  },
  domainesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
  },
  domaineButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s',
    fontSize: '0.95rem',
    textAlign: 'left',
    minHeight: '60px',
  },
  domaineButtonActive: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    borderColor: theme.colors.primary,
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows.md,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '2rem',
    justifyContent: 'center',
    color: theme.colors.text.secondary,
  },
  spinner: {
    fontSize: '1.25rem',
  },
  locationTabs: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  locationTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: 'transparent',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: theme.colors.text.secondary,
    transition: 'all 0.3s',
  },
  locationTabActive: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    borderColor: theme.colors.primary,
  },
  tabIcon: {
    fontSize: '1rem',
  },
  locationSection: {
    marginBottom: '1.5rem',
  },
  hierarchicalSearch: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  hierarchyLevel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  hierarchyLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  hierarchyIcon: {
    color: theme.colors.primary,
  },
  hierarchySelect: {
    padding: '0.75rem',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.md,
    fontSize: '0.95rem',
    backgroundColor: '#fff',
    outline: 'none',
  },
  hierarchyInput: {
    padding: '0.75rem',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.md,
    fontSize: '0.95rem',
    outline: 'none',
  },
  searchSection: {
    marginBottom: '1rem',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: '1rem',
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: theme.colors.text.secondary,
    zIndex: 1,
  },
  searchSpinner: {
    position: 'absolute',
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: theme.colors.primary,
  },
  searchInput: {
    width: '100%',
    padding: '1rem 1rem 1rem 3rem',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.lg,
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s',
    backgroundColor: '#fff',
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.md,
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1000,
    marginTop: '0.25rem',
    boxShadow: theme.shadows.md,
  },
  searchResultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${theme.colors.primaryLight}`,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    ':last-child': {
      borderBottom: 'none',
    },
  },
  resultIcon: {
    color: theme.colors.primary,
    flexShrink: 0,
  },
  resultText: {
    flex: 1,
    fontSize: '0.95rem',
    color: theme.colors.text.primary,
  },
  resultName: {
    fontWeight: '600',
    marginBottom: '0.25rem',
  },
  locationHistory: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.primaryLight}`,
  },
  historyTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: '0.5rem',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem',
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: theme.colors.text.secondary,
    textAlign: 'left',
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
  },
  historyIcon: {
    color: theme.colors.primary,
    flexShrink: 0,
  },
  mapWrapper: {
    marginTop: '1.5rem',
    position: 'relative',
  },
  mapControls: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  mapControlButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#fff',
    border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: theme.colors.text.primary,
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: theme.colors.primary,
      color: '#fff',
      borderColor: theme.colors.primary,
    },
  },
  mapControlButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    ':hover': {
      backgroundColor: '#fff',
      color: theme.colors.text.primary,
      borderColor: theme.colors.primaryLight,
    },
  },
  controlIcon: {
    fontSize: '1rem',
  },
  mapContainer: {
    height: '400px',
    width: '100%',
    borderRadius: theme.borderRadius.lg,
    border: `2px solid ${theme.colors.primaryLight}`,
    marginBottom: '1rem',
  },
  locationInfo: {
    padding: '1rem',
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    border: `2px solid ${theme.colors.primaryLight}`,
  },
  locationInfoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${theme.colors.primaryLight}`,
  },
  locationInfoIcon: {
    color: theme.colors.primary,
    fontSize: '1rem',
  },
  locationInfoTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  locationInfoContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  locationCoords: {
    fontSize: '0.9rem',
    color: theme.colors.text.primary,
  },
  locationAccuracy: {
    fontSize: '0.9rem',
    color: theme.colors.text.secondary,
    padding: '0.5rem',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: theme.borderRadius.md,
  },
  locationAddress: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.5rem',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.9rem',
    lineHeight: '1.4',
  },
  addressIcon: {
    color: theme.colors.primary,
    flexShrink: 0,
    marginTop: '2px',
  },
  accuracyOptions: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.md,
  },
  accuracyLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  accuracyCheckbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: theme.colors.primary,
  },
  summary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  summarySection: {
    padding: '1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.primaryLight}`,
  },
  summaryTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: theme.colors.primary,
  },
  summaryIcon: {
    fontSize: '1.1rem',
  },
  termsSection: {
    padding: '1.5rem',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: theme.borderRadius.lg,
    border: `2px solid ${theme.colors.primary}`,
  },
  termsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: theme.colors.primary,
  },
  termsIcon: {
    fontSize: '1.1rem',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    cursor: 'pointer',
    fontSize: '0.95rem',
    lineHeight: '1.4',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    marginTop: '2px',
    cursor: 'pointer',
    accentColor: theme.colors.primary,
  },
  checkboxText: {
    flex: 1,
  },
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#fef3c7',
    border: `2px solid ${theme.colors.warning}`,
    borderRadius: theme.borderRadius.lg,
    color: '#92400e',
    fontSize: '0.95rem',
    lineHeight: '1.5',
  },
  warningIcon: {
    fontSize: '1.25rem',
    color: theme.colors.warning,
    flexShrink: 0,
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    alignItems: 'center',
    padding: '1rem 0',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: theme.colors.primary,
    color: '#fff',
    padding: '1rem 2rem',
    borderRadius: theme.borderRadius.lg,
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s',
    boxShadow: theme.shadows.md,
    minWidth: '160px',
    justifyContent: 'center',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'transparent',
    color: theme.colors.primary,
    padding: '1rem 2rem',
    borderRadius: theme.borderRadius.lg,
    border: `2px solid ${theme.colors.primary}`,
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s',
  },
  btnSuccess: {
    backgroundColor: theme.colors.success,
    '&:hover:not(:disabled)': {
      backgroundColor: theme.colors.success,
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)',
    },
  },
  btnIcon: {
    fontSize: '0.9rem',
    transition: 'transform 0.3s',
  },
};