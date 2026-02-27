import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { entrepriseApi } from '../../api/entrepriseApi';
import { 
  FiSave, 
  FiX, 
  FiUpload, 
  FiArrowLeft,
  FiMapPin,
  FiNavigation,
  FiSearch,
  FiCheck,
  FiAlertCircle 
} from 'react-icons/fi';
import { MdBusiness } from 'react-icons/md';

// Load Google Maps script dynamically
const loadGoogleMapsScript = (callback) => {
  if (window.google && window.google.maps) {
    callback();
    return;
  }

  const existingScript = document.getElementById('googleMapsScript');
  if (existingScript) {
    existingScript.addEventListener('load', callback);
    return;
  }

  const script = document.createElement('script');
  script.id = 'googleMapsScript';
  script.src = `https://maps.googleapis.com/maps/api/js?key=VOTRE_CLE_API_GOOGLE&libraries=places`;
  script.async = true;
  script.defer = true;
  script.addEventListener('load', callback);
  document.head.appendChild(script);
};

export default function EditEntreprise() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // États existants
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [domaines, setDomaines] = useState([]);
  
  // Nouveaux états pour la localisation
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  
  // Références
  const autocompleteInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  
  // États du formulaire (inchangés)
  const [formData, setFormData] = useState({
    name: '',
    domaine_ids: [],
    siege: '',
    description: '',
    whatsapp_phone: '',
    call_phone: '',
    latitude: '',
    longitude: '',
  });

  const [files, setFiles] = useState({
    logo: null,
    image_boutique: null,
  });

  const [previews, setPreviews] = useState({
    logo: null,
    image_boutique: null,
  });

  const [fileErrors, setFileErrors] = useState({
    logo: '',
    image_boutique: ''
  });

  // Charger Google Maps
  useEffect(() => {
    loadGoogleMapsScript(() => {
      setMapsLoaded(true);
    });
  }, []);

  // Initialiser l'autocomplete quand la carte est chargée
  useEffect(() => {
    if (mapsLoaded && autocompleteInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'bj' } // Restreindre au Bénin
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        
        if (place && place.geometry) {
          const location = place.geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          setFormData(prev => ({
            ...prev,
            siege: place.formatted_address || '',
            latitude: lat,
            longitude: lng
          }));
          
          setAddressSearch(place.formatted_address || '');
          setShowMap(true);
        }
      });
    }
  }, [mapsLoaded]);

  useEffect(() => {
    fetchEntrepriseData();
    fetchDomaines();
  }, [id]);

  const fetchEntrepriseData = async () => {
    try {
      setLoading(true);
      const data = await entrepriseApi.getEntreprise(id);
      
      if (data.status !== 'validated') {
        setError('Seules les entreprises validées peuvent être modifiées');
        setTimeout(() => navigate('/mes-entreprises'), 100);
        return;
      }

      setFormData({
        name: data.name || '',
        domaine_ids: data.domaines?.map(d => d.id) || [],
        siege: data.siege || '',
        description: data.description || '',
        whatsapp_phone: data.whatsapp_phone || '',
        call_phone: data.call_phone || '',
        latitude: data.latitude || '',
        longitude: data.longitude || '',
      });

      setAddressSearch(data.siege || '');
      
      if (data.latitude && data.longitude) {
        setShowMap(true);
      }

      if (data.logo) {
        setPreviews(prev => ({ ...prev, logo: data.logo }));
      }
      if (data.image_boutique) {
        setPreviews(prev => ({ ...prev, image_boutique: data.image_boutique }));
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchDomaines = async () => {
    try {
      const data = await entrepriseApi.getFormData();
      setDomaines(data.domaines || []);
    } catch (err) {
      console.error('Erreur domaines:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDomaineToggle = (domaineId) => {
    setFormData(prev => ({
      ...prev,
      domaine_ids: prev.domaine_ids.includes(domaineId)
        ? prev.domaine_ids.filter(id => id !== domaineId)
        : [...prev.domaine_ids, domaineId]
    }));
  };

  // Validation stricte des images
  const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      return 'Format non autorisé. Utilisez uniquement PNG, JPG ou JPEG.';
    }

    if (file.size > maxSize) {
      return 'Le fichier ne doit pas dépasser 2 Mo';
    }

    return '';
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validation stricte
    const error = validateImageFile(file);
    
    if (error) {
      setFileErrors(prev => ({ ...prev, [fieldName]: error }));
      e.target.value = ''; // Reset l'input
      return;
    }

    // Si pas d'erreur
    setFileErrors(prev => ({ ...prev, [fieldName]: '' }));
    setFiles(prev => ({ ...prev, [fieldName]: file }));
    
    // Créer un aperçu
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({ ...prev, [fieldName]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Obtenir la position actuelle
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        
        setShowMap(true);

        // Géocodage inverse pour obtenir l'adresse
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                setFormData(prev => ({
                  ...prev,
                  siege: results[0].formatted_address
                }));
                setAddressSearch(results[0].formatted_address);
              }
              setIsLocating(false);
            }
          );
        } else {
          setIsLocating(false);
        }
      },
      (error) => {
        let message = 'Impossible d\'obtenir votre position';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Veuillez autoriser l\'accès à votre position';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Position non disponible';
            break;
          case error.TIMEOUT:
            message = 'Délai de recherche dépassé';
            break;
        }
        setLocationError(message);
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();

      // Validation côté client
      if (!formData.name || formData.name.trim() === '') {
        setError('Le nom de l\'entreprise est requis');
        setSubmitting(false);
        return;
      }

      // Validation des fichiers avant envoi
      if (files.logo) {
        const logoError = validateImageFile(files.logo);
        if (logoError) {
          setFileErrors(prev => ({ ...prev, logo: logoError }));
          setSubmitting(false);
          return;
        }
      }

      if (files.image_boutique) {
        const boutiqueError = validateImageFile(files.image_boutique);
        if (boutiqueError) {
          setFileErrors(prev => ({ ...prev, image_boutique: boutiqueError }));
          setSubmitting(false);
          return;
        }
      }

      // Ajouter les champs textuels
      const allowedFields = [
        'name', 'siege', 'description', 'whatsapp_phone', 
        'call_phone', 'latitude', 'longitude'
      ];

      allowedFields.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== null && formData[field] !== '') {
          submitData.append(field, formData[field]);
        }
      });

      // Ajouter les domaines
      if (formData.domaine_ids && formData.domaine_ids.length > 0) {
        formData.domaine_ids.forEach(id => {
          submitData.append('domaine_ids[]', id);
        });
      }

      // Ajouter les fichiers
      if (files.logo) {
        submitData.append('logo', files.logo);
      }
      if (files.image_boutique) {
        submitData.append('image_boutique', files.image_boutique);
      }

      submitData.append('_method', 'PUT');

      const response = await entrepriseApi.updateEntreprise(id, submitData);
      
      setSuccess(response.message || 'Entreprise mise à jour avec succès !');
      
      setTimeout(() => {
        navigate('/mes-entreprises');
      }, 100);

    } 
    catch (err) {
      console.error('Erreur:', err);
      
      if (err.response?.data?.errors) {
        const errorMessages = Object.entries(err.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        setError(errorMessages);
      } 
      else {
        setError(
          err.response?.data?.message || 
          'Erreur lors de la mise à jour. Veuillez réessayer.'
        );
      }
    } 
    finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <Link to="/mes-entreprises" style={styles.backButton}>
            <FiArrowLeft style={styles.backIcon} />
            Retour à mes entreprises
          </Link>
          <h1 style={styles.title}>
            <MdBusiness style={styles.titleIcon} />
            Modifier l'entreprise
          </h1>
          <p style={styles.subtitle}>
            Modifiez les informations de votre entreprise
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div style={styles.errorAlert}>
            <FiX style={styles.alertIcon} />
            <div style={styles.errorContent}>
              {error.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        )}

        {success && (
          <div style={styles.successAlert}>
            <FiSave style={styles.alertIcon} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Informations de base */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Informations de base</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom de l'entreprise *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={styles.textarea}
                rows="4"
                placeholder="Décrivez votre entreprise..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Siège social</label>
              <input
                type="text"
                name="siege"
                value={formData.siege}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Adresse du siège"
              />
            </div>

            {/* Domaines */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Domaines d'expertise *</label>
              <div style={styles.domainesGrid}>
                {domaines.map(domaine => (
                  <label 
                    key={domaine.id} 
                    style={{
                      ...styles.checkboxLabel,
                      ...(formData.domaine_ids.includes(domaine.id) ? styles.checkboxLabelSelected : {})
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.domaine_ids.includes(domaine.id)}
                      onChange={() => handleDomaineToggle(domaine.id)}
                      style={styles.checkbox}
                    />
                    <span>{domaine.name}</span>
                    {formData.domaine_ids.includes(domaine.id) && (
                      <FiCheck style={styles.checkIcon} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Informations de contact</h2>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>WhatsApp</label>
                <input
                  type="tel"
                  name="whatsapp_phone"
                  value={formData.whatsapp_phone}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="+229..."
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Téléphone</label>
                <input
                  type="tel"
                  name="call_phone"
                  value={formData.call_phone}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="+229..."
                />
              </div>
            </div>
          </div>

          {/* Géolocalisation - AMÉLIORÉ AVEC GOOGLE MAPS */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <FiMapPin style={styles.sectionIcon} />
              Localisation (Optionnel)
            </h2>
            
            {/* Recherche Google Places */}
            <div style={styles.locationSearchContainer}>
              <div style={styles.searchWrapper}>
                <FiSearch style={styles.searchIcon} />
                <input
                  ref={autocompleteInputRef}
                  type="text"
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                  style={styles.locationInput}
                  placeholder="Rechercher une adresse..."
                  disabled={!mapsLoaded}
                />
              </div>
              
              <button
                type="button"
                onClick={getCurrentLocation}
                style={styles.locationButton}
                disabled={isLocating}
              >
                <FiNavigation style={styles.locationButtonIcon} />
                {isLocating ? 'Localisation...' : 'Ma position'}
              </button>
            </div>

            {locationError && (
              <div style={styles.locationError}>
                <FiAlertCircle style={styles.locationErrorIcon} />
                <span>{locationError}</span>
              </div>
            )}
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  style={styles.input}
                  step="any"
                  placeholder="Ex: 6.3703"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  style={styles.input}
                  step="any"
                  placeholder="Ex: 2.3912"
                />
              </div>
            </div>

            {showMap && formData.latitude && formData.longitude && (
              <div style={styles.mapPreview}>
                <img 
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${formData.latitude},${formData.longitude}&zoom=15&size=600x200&maptype=roadmap&markers=color:red%7C${formData.latitude},${formData.longitude}&key=VOTRE_CLE_API_GOOGLE`}
                  alt="Aperçu de la localisation"
                  style={styles.mapImage}
                />
              </div>
            )}

            <p style={styles.helpText}>
              💡 Utilisez la recherche ou le bouton "Ma position" pour localiser votre entreprise
            </p>
          </div>

          {/* Images - AMÉLIORÉ AVEC VALIDATION STRICTE */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <FiUpload style={styles.sectionIcon} />
              Images (Optionnel)
            </h2>
            
            {/* Logo */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Logo de l'entreprise</label>
              <div style={styles.fileInputWrapper}>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => handleFileChange(e, 'logo')}
                  style={styles.fileInput}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" style={styles.fileInputLabel}>
                  <FiUpload style={styles.fileInputIcon} />
                  Choisir un fichier
                </label>
                <span style={styles.fileInputText}>
                  {files.logo ? files.logo.name : 'PNG, JPG ou JPEG uniquement'}
                </span>
              </div>
              
              {fileErrors.logo && (
                <div style={styles.fileError}>
                  <FiAlertCircle style={styles.fileErrorIcon} />
                  <span>{fileErrors.logo}</span>
                </div>
              )}
              
              {previews.logo && (
                <div style={styles.imagePreview}>
                  <img src={previews.logo} alt="Logo" style={styles.previewImage} />
                  <p style={styles.imageInfo}>Image actuelle</p>
                </div>
              )}
              <p style={styles.helpText}>Format: PNG, JPG, JPEG - Max: 2 Mo</p>
            </div>

            {/* Image boutique */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Image de la boutique/entreprise</label>
              <div style={styles.fileInputWrapper}>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => handleFileChange(e, 'image_boutique')}
                  style={styles.fileInput}
                  id="boutique-upload"
                />
                <label htmlFor="boutique-upload" style={styles.fileInputLabel}>
                  <FiUpload style={styles.fileInputIcon} />
                  Choisir un fichier
                </label>
                <span style={styles.fileInputText}>
                  {files.image_boutique ? files.image_boutique.name : 'PNG, JPG ou JPEG uniquement'}
                </span>
              </div>
              
              {fileErrors.image_boutique && (
                <div style={styles.fileError}>
                  <FiAlertCircle style={styles.fileErrorIcon} />
                  <span>{fileErrors.image_boutique}</span>
                </div>
              )}
              
              {previews.image_boutique && (
                <div style={styles.imagePreview}>
                  <img src={previews.image_boutique} alt="Boutique" style={styles.previewImage} />
                  <p style={styles.imageInfo}>Image actuelle</p>
                </div>
              )}
              <p style={styles.helpText}>Format: PNG, JPG, JPEG - Max: 2 Mo</p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div style={styles.actions}>
            <Link to="/mes-entreprises" style={styles.cancelButton}>
              <FiX style={styles.buttonIcon} />
              Annuler
            </Link>
            <button 
              type="submit" 
              style={{
                ...styles.submitButton,
                ...(submitting ? styles.submitButtonDisabled : {})
              }}
              disabled={submitting}
            >
              <FiSave style={styles.buttonIcon} />
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// Styles conservés exactement comme dans l'original avec quelques ajouts
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '2rem 0',
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '0 1.5rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #dbeafe',
    borderTop: '4px solid #ef4444',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#475569',
    fontSize: '1.125rem',
  },
  header: {
    marginBottom: '2rem',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    fontWeight: '500',
    transition: 'color 0.2s',
    ':hover': {
      color: '#ef4444',
    }
  },
  backIcon: { fontSize: '1rem' },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '0.5rem',
    animation: 'slideIn 0.3s ease-out',
  },
  titleIcon: { fontSize: '2rem', color: '#ef4444' },
  subtitle: { color: '#64748b', fontSize: '1rem' },
  errorAlert: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '0.75rem',
    marginBottom: '1.5rem',
    border: '1px solid #fecaca',
    animation: 'slideIn 0.3s ease-out',
  },
  errorContent: {
    flex: 1,
    fontSize: '0.875rem',
    lineHeight: '1.6',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#d1fae5',
    color: '#059669',
    padding: '1rem',
    borderRadius: '0.75rem',
    marginBottom: '1.5rem',
    border: '1px solid #a7f3d0',
    animation: 'slideIn 0.3s ease-out',
  },
  alertIcon: { fontSize: '1.25rem', flexShrink: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  section: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s',
    ':hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    }
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  sectionIcon: {
    fontSize: '1.25rem',
    color: '#ef4444',
  },
  formGroup: { marginBottom: '1.5rem' },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s',
    ':focus': {
      borderColor: '#ef4444',
      boxShadow: '0 0 0 3px rgba(239,68,68,0.1)',
    },
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    resize: 'vertical',
    transition: 'all 0.2s',
    ':focus': {
      borderColor: '#ef4444',
      boxShadow: '0 0 0 3px rgba(239,68,68,0.1)',
    },
  },
  domainesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.75rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#475569',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s',
    position: 'relative',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#ef4444',
    },
  },
  checkboxLabelSelected: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    color: '#ef4444',
  },
  checkbox: { 
    width: '18px', 
    height: '18px', 
    cursor: 'pointer',
    accentColor: '#ef4444',
  },
  checkIcon: {
    marginLeft: 'auto',
    color: '#ef4444',
    animation: 'fadeIn 0.2s',
  },
  
  // Nouveaux styles pour la localisation
  locationSearchContainer: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1rem',
    '@media (max-width: 640px)': {
      flexDirection: 'column',
    },
  },
  searchWrapper: {
    flex: 1,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    zIndex: 1,
  },
  locationInput: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s',
    ':focus': {
      borderColor: '#ef4444',
      boxShadow: '0 0 0 3px rgba(239,68,68,0.1)',
    },
  },
  locationButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#dc2626',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
    },
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },
  locationButtonIcon: {
    fontSize: '1rem',
    animation: 'pulse 2s infinite',
  },
  locationError: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#fee2e2',
    borderRadius: '0.375rem',
    color: '#dc2626',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    animation: 'slideIn 0.2s',
  },
  locationErrorIcon: {
    fontSize: '1rem',
    flexShrink: 0,
  },
  mapPreview: {
    marginTop: '1rem',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    border: '2px solid #e2e8f0',
    animation: 'fadeIn 0.5s',
  },
  mapImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  
  // Nouveaux styles pour les fichiers
  fileInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    '@media (max-width: 640px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
  fileInput: {
    display: 'none',
  },
  fileInputLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#dc2626',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
    },
  },
  fileInputIcon: {
    fontSize: '1rem',
  },
  fileInputText: {
    fontSize: '0.875rem',
    color: '#64748b',
    flex: 1,
  },
  fileError: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#fee2e2',
    borderRadius: '0.375rem',
    color: '#dc2626',
    fontSize: '0.875rem',
    animation: 'slideIn 0.2s',
  },
  fileErrorIcon: {
    fontSize: '1rem',
    flexShrink: 0,
  },
  
  // Styles existants
  imagePreview: {
    marginTop: '1rem',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    border: '2px solid #e2e8f0',
    animation: 'fadeIn 0.3s',
  },
  previewImage: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
  },
  imageInfo: {
    textAlign: 'center',
    padding: '0.5rem',
    fontSize: '0.75rem',
    color: '#64748b',
    backgroundColor: '#f8fafc',
  },
  helpText: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '0.5rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    paddingTop: '1rem',
    '@media (max-width: 640px)': {
      flexDirection: 'column',
    },
  },
  cancelButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.875rem 1.5rem',
    backgroundColor: '#fff',
    color: '#64748b',
    border: '2px solid #e2e8f0',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#ef4444',
      color: '#ef4444',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.875rem 1.5rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#dc2626',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
    },
  },
  submitButtonDisabled: { 
    opacity: 0.6, 
    cursor: 'not-allowed',
    ':hover': {
      backgroundColor: '#ef4444',
      transform: 'none',
      boxShadow: 'none',
    },
  },
  buttonIcon: { fontSize: '1rem' },
};