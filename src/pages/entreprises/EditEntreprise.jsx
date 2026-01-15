import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { entrepriseApi } from '../../api/entrepriseApi';
import { FiSave, FiX, FiUpload, FiMapPin, FiArrowLeft } from 'react-icons/fi';
import { MdBusiness } from 'react-icons/md';

export default function EditEntreprise() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [domaines, setDomaines] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    domaine_ids: [],
    siege: '',
    description: '',
    whatsapp_phone: '',
    call_phone: '',
    email: '',
    website: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    latitude: '',
    longitude: '',
    status_online: false,
    horaires_ouverture: '',
    jours_ouverture: '',
    tarif_moyen: '',
  });

  const [files, setFiles] = useState({
    logo: null,
    image_boutique: null,
  });

  const [previews, setPreviews] = useState({
    logo: null,
    image_boutique: null,
  });

  useEffect(() => {
    fetchEntrepriseData();
    fetchDomaines();
  }, [id]);

  const fetchEntrepriseData = async () => {
    try {
      setLoading(true);
      const data = await entrepriseApi.getEntreprise(id);
      
      // Vérifier si l'entreprise est validée
      if (data.status !== 'validated') {
        setError('Seules les entreprises validées peuvent être modifiées');
        setTimeout(() => navigate('/entreprises/mine'), 2000);
        return;
      }

      setFormData({
        name: data.name || '',
        domaine_ids: data.domaines?.map(d => d.id) || [],
        siege: data.siege || '',
        description: data.description || '',
        whatsapp_phone: data.whatsapp_phone || '',
        call_phone: data.call_phone || '',
        email: data.email || '',
        website: data.website || '',
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        linkedin: data.linkedin || '',
        latitude: data.latitude || '',
        longitude: data.longitude || '',
        status_online: data.status_online || false,
        horaires_ouverture: data.horaires_ouverture || '',
        jours_ouverture: data.jours_ouverture || '',
        tarif_moyen: data.tarif_moyen || '',
      });

      // Définir les aperçus des images existantes
      if (data.logo) {
        setPreviews(prev => ({
          ...prev,
          logo: `${import.meta.env.VITE_API_URL}/storage/${data.logo}`
        }));
      }
      if (data.image_boutique) {
        setPreviews(prev => ({
          ...prev,
          image_boutique: `${import.meta.env.VITE_API_URL}/storage/${data.image_boutique}`
        }));
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 2 Mo');
        return;
      }

      setFiles(prev => ({ ...prev, [fieldName]: file }));
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [fieldName]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();

      // Ajouter les champs texte
      Object.keys(formData).forEach(key => {
        if (key === 'domaine_ids') {
          formData.domaine_ids.forEach(id => {
            submitData.append('domaine_ids[]', id);
          });
        } else if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      // Ajouter les fichiers
      if (files.logo) {
        submitData.append('logo', files.logo);
      }
      if (files.image_boutique) {
        submitData.append('image_boutique', files.image_boutique);
      }

      // Important: Laravel nécessite _method pour PUT avec FormData
      submitData.append('_method', 'PUT');

      const response = await entrepriseApi.updateEntreprise(id, submitData);
      
      setSuccess(response.message || 'Entreprise mise à jour avec succès !');
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate('/entreprises/mine');
      }, 2000);

    } catch (err) {
      console.error('Erreur:', err);
      setError(
        err.response?.data?.message || 
        'Erreur lors de la mise à jour. Veuillez réessayer.'
      );
      
      // Afficher les erreurs de validation
      if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(', ');
        setError(errorMessages);
      }
    } finally {
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
          <Link to="/entreprises/mine" style={styles.backButton}>
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
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={styles.successAlert}>
            <FiSave style={styles.alertIcon} />
            <span>{success}</span>
          </div>
        )}

        {/* Formulaire */}
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
                  <label key={domaine.id} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.domaine_ids.includes(domaine.id)}
                      onChange={() => handleDomaineToggle(domaine.id)}
                      style={styles.checkbox}
                    />
                    <span>{domaine.name}</span>
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

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="contact@entreprise.com"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Site web</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Réseaux sociaux</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Facebook</label>
              <input
                type="url"
                name="facebook"
                value={formData.facebook}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Instagram</label>
              <input
                type="url"
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="https://instagram.com/..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>LinkedIn</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="https://linkedin.com/..."
              />
            </div>
          </div>

          {/* Horaires */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Horaires et tarifs</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Horaires d'ouverture</label>
              <input
                type="text"
                name="horaires_ouverture"
                value={formData.horaires_ouverture}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Ex: 8h - 18h"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Jours d'ouverture</label>
              <input
                type="text"
                name="jours_ouverture"
                value={formData.jours_ouverture}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Ex: Lundi - Samedi"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Tarif moyen</label>
              <input
                type="text"
                name="tarif_moyen"
                value={formData.tarif_moyen}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Ex: 50.000 - 200.000 FCFA"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="status_online"
                  checked={formData.status_online}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                <span>Entreprise en ligne (visible sur la plateforme)</span>
              </label>
            </div>
          </div>

          {/* Géolocalisation */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <FiMapPin style={styles.sectionIcon} />
              Géolocalisation
            </h2>
            
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
          </div>

          {/* Images */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <FiUpload style={styles.sectionIcon} />
              Images
            </h2>
            
            {/* Logo */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Logo de l'entreprise</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'logo')}
                style={styles.fileInput}
              />
              {previews.logo && (
                <div style={styles.imagePreview}>
                  <img src={previews.logo} alt="Logo" style={styles.previewImage} />
                </div>
              )}
              <p style={styles.helpText}>Format: JPG, PNG, GIF - Max: 2 Mo</p>
            </div>

            {/* Image boutique */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Image de la boutique/entreprise</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'image_boutique')}
                style={styles.fileInput}
              />
              {previews.image_boutique && (
                <div style={styles.imagePreview}>
                  <img src={previews.image_boutique} alt="Boutique" style={styles.previewImage} />
                </div>
              )}
              <p style={styles.helpText}>Format: JPG, PNG, GIF - Max: 2 Mo</p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div style={styles.actions}>
            <Link to="/entreprises/mine" style={styles.cancelButton}>
              <FiX style={styles.buttonIcon} />
              Annuler
            </Link>
            <button 
              type="submit" 
              style={styles.submitButton}
              disabled={submitting}
            >
              <FiSave style={styles.buttonIcon} />
              {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

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
  },
  backIcon: {
    fontSize: '1rem',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '0.5rem',
  },
  titleIcon: {
    fontSize: '2rem',
    color: '#ef4444',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '1rem',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '0.75rem',
    marginBottom: '1.5rem',
    border: '1px solid #fecaca',
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
  },
  alertIcon: {
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  section: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '1.5rem',
  },
  sectionIcon: {
    fontSize: '1.25rem',
    color: '#ef4444',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
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
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s',
    resize: 'vertical',
  },
  fileInput: {
    width: '100%',
    padding: '0.75rem',
    border: '2px dashed #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
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
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  imagePreview: {
    marginTop: '1rem',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    border: '2px solid #e2e8f0',
  },
  previewImage: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
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
  },
  cancelButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.875rem 1.5rem',
    backgroundColor: '#fff',
    color: '#64748b',
    border: '2px solid #e2e8f0',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
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
  },
  buttonIcon: {
    fontSize: '1rem',
  },
};