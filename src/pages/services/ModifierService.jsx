import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';
import { FiArrowLeft, FiSave, FiX, FiUpload, FiTrash2, FiClock, FiImage, FiDollarSign, FiFileText, FiWatch } from 'react-icons/fi';

export default function ModifierService() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    descriptions: '',
    start_time: '',
    end_time: '',
    is_open_24h: false,
  });
  
  const [existingMedias, setExistingMedias] = useState([]);
  const [newMedias, setNewMedias] = useState([]);
  const [service, setService] = useState(null);

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const data = await serviceApi.getServiceById(id);
      setService(data);
      
      setFormData({
        name: data.name || '',
        price: data.price || '',
        descriptions: data.descriptions || '',
        start_time: data.start_time || '',
        end_time: data.end_time || '',
        is_open_24h: data.is_open_24h || false,
      });
      
      setExistingMedias(data.medias || []);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement du service');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setNewMedias(prev => [...prev, ...files]);
  };

  const removeNewMedia = (index) => {
    setNewMedias(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      if (formData.price) formDataToSend.append('price', formData.price);
      if (formData.descriptions) formDataToSend.append('descriptions', formData.descriptions);
      if (formData.start_time) formDataToSend.append('start_time', formData.start_time);
      if (formData.end_time) formDataToSend.append('end_time', formData.end_time);
      formDataToSend.append('is_open_24h', formData.is_open_24h ? '1' : '0');
      
      newMedias.forEach((file) => {
        formDataToSend.append('medias[]', file);
      });
      
      await serviceApi.updateService(id, formDataToSend);
      
      setSuccess('Service modifié avec succès !');
      
      setTimeout(() => {
        navigate('/mes-services'); 
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Chargement du service...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>
              <FiX size={48} />
            </div>
            <h3 style={styles.errorTitle}>Service non trouvé</h3>
            <p style={styles.errorMessage}>Le service que vous essayez de modifier n'existe pas ou a été supprimé.</p>
            {/* ✅ CORRECTION : Route corrigée ici aussi */}
            <Link to="/mes-services" style={styles.errorButton}>
              <FiArrowLeft /> Retour à mes services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header avec navigation */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            {/* ✅ CORRECTION : Route corrigée ici aussi */}
            <Link to="/mes-services" style={styles.backButton}>
              <FiArrowLeft size={20} />
              <span>Retour</span>
            </Link>
            <div style={styles.headerTitles}>
              <h1 style={styles.title}>Modifier le service</h1>
              <p style={styles.subtitle}>
                <span style={styles.badge}>{service.entreprise?.name}</span>
                <span style={styles.badgeSecondary}>{service.domaine?.name}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {/* Alerts */}
        {error && (
          <div style={styles.alertError}>
            <div style={styles.alertIcon}>
              <FiX size={20} />
            </div>
            <div style={styles.alertContent}>
              <p style={styles.alertTitle}>Erreur</p>
              <p style={styles.alertMessage}>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div style={styles.alertSuccess}>
            <div style={styles.alertIcon}>
              <FiSave size={20} />
            </div>
            <div style={styles.alertContent}>
              <p style={styles.alertTitle}>Succès</p>
              <p style={styles.alertMessage}>{success}</p>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <div style={styles.card}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              {/* Nom du service */}
              <div style={styles.formSection}>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.sectionTitle}>Informations principales</h3>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FiFileText style={styles.labelIcon} />
                    Nom du service *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="Ex: Installation électrique"
                  />
                  <p style={styles.helperText}>Nom qui apparaîtra sur votre profil</p>
                </div>
              </div>

              {/* Prix */}
              <div style={styles.formSection}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FiDollarSign style={styles.labelIcon} />
                    Prix (FCFA)
                  </label>
                  <div style={styles.inputGroup}>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      style={styles.input}
                      min="0"
                      placeholder="0"
                    />
                    <span style={styles.inputAddon}>FCFA</span>
                  </div>
                  <p style={styles.helperText}>Laissez vide pour un devis sur mesure</p>
                </div>
              </div>

              {/* Description */}
              <div style={styles.formSection}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FiFileText style={styles.labelIcon} />
                    Description détaillée
                  </label>
                  <textarea
                    name="descriptions"
                    value={formData.descriptions}
                    onChange={handleChange}
                    style={styles.textarea}
                    rows="5"
                    placeholder="Décrivez votre service en détail..."
                  />
                  <p style={styles.helperText}>Incluez les spécifications, matériaux utilisés, etc.</p>
                </div>
              </div>

              {/* Disponibilité */}
              <div style={styles.formSection}>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.sectionTitle}>Disponibilité</h3>
                </div>
                
                <div style={styles.checkboxContainer}>
                  <label style={styles.checkboxLabel}>
                    <div style={styles.checkboxWrapper}>
                      <input
                        type="checkbox"
                        name="is_open_24h"
                        checked={formData.is_open_24h}
                        onChange={handleChange}
                        style={styles.checkbox}
                      />
                      <span style={styles.checkboxCustom}></span>
                    </div>
                    <div style={styles.checkboxContent}>
                      <span style={styles.checkboxText}>Disponible 24h/24</span>
                      <span style={styles.checkboxDescription}>Service disponible à toute heure</span>
                    </div>
                  </label>
                </div>

                {!formData.is_open_24h && (
                  <div style={styles.timeGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FiClock style={styles.labelIcon} />
                        Heure d'ouverture
                      </label>
                      <input
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FiClock style={styles.labelIcon} />
                        Heure de fermeture
                      </label>
                      <input
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Images existantes */}
              {existingMedias.length > 0 && (
                <div style={styles.formSection}>
                  <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>Images actuelles</h3>
                  </div>
                  <div style={styles.mediaGrid}>
                    {existingMedias.map((media, index) => (
                      <div key={index} style={styles.mediaCard}>
                        <img
                          src={service.medias[index]}
                          alt={`Media ${index + 1}`}
                          style={styles.mediaImage}
                        />
                        <div style={styles.mediaOverlay}>
                          <span style={styles.mediaIndex}>Image {index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ajout de nouvelles images */}
              <div style={styles.formSection}>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.sectionTitle}>Ajouter des images</h3>
                </div>
                
                <div style={styles.formGroup}>
                  <div style={styles.uploadArea} onClick={() => document.getElementById('file-upload').click()}>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleMediaChange}
                      style={styles.hiddenFileInput}
                    />
                    <div style={styles.uploadContent}>
                      <FiUpload size={32} style={styles.uploadIcon} />
                      <div>
                        <p style={styles.uploadText}>Cliquez pour télécharger</p>
                        <p style={styles.uploadSubtext}>ou glissez-déposez vos fichiers</p>
                      </div>
                    </div>
                    <p style={styles.uploadInfo}>PNG, JPG, WEBP jusqu'à 5MB</p>
                  </div>

                  {newMedias.length > 0 && (
                    <div style={styles.mediaGrid}>
                      {newMedias.map((file, index) => (
                        <div key={index} style={styles.mediaCard}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Nouveau ${index + 1}`}
                            style={styles.mediaImage}
                          />
                          <div style={styles.mediaOverlay}>
                            <button
                              type="button"
                              onClick={() => removeNewMedia(index)}
                              style={styles.removeButton}
                            >
                              <FiTrash2 size={16} />
                            </button>
                            <span style={styles.mediaName}>{file.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => navigate('/mes-services')} // ✅ CORRECTION : Route corrigée
                style={styles.cancelButton}
                disabled={submitting}
              >
                <FiX /> Annuler
              </button>
              <button
                type="submit"
                style={styles.submitButton}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div style={styles.buttonSpinner}></div>
                    Modification...
                  </>
                ) : (
                  <>
                    <FiSave /> Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const styles = {
  container: { 
    minHeight: '100vh', 
    backgroundColor: '#f9fafb' 
  },
  
  // Header
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '1.5rem 0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem'
  },
  
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    transition: 'all 0.2s',
    backgroundColor: '#f9fafb',
    ':hover': {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    }
  },
  
  headerTitles: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0
  },
  
  subtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#6b7280',
    fontSize: '0.875rem',
    margin: 0
  },
  
  badge: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.25rem 0.75rem',
    borderRadius: '1rem',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  
  badgeSecondary: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    padding: '0.25rem 0.75rem',
    borderRadius: '1rem',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  
  // Content
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1.5rem'
  },
  
  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  
  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem',
    gap: '1.5rem'
  },
  
  spinner: {
    width: '48px',
    height: '48px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #ef4444',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  loadingText: {
    color: '#6b7280',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  
  // Error
  errorContainer: {
    textAlign: 'center',
    padding: '4rem 2rem'
  },
  
  errorIcon: {
    color: '#dc2626',
    marginBottom: '1.5rem'
  },
  
  errorTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.5rem'
  },
  
  errorMessage: {
    color: '#6b7280',
    marginBottom: '2rem'
  },
  
  errorButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#dc2626'
    }
  },
  
  // Alerts
  alertError: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '1rem 1.25rem',
    borderRadius: '0.75rem',
    marginBottom: '1.5rem'
  },
  
  alertSuccess: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
    padding: '1rem 1.25rem',
    borderRadius: '0.75rem',
    marginBottom: '1.5rem'
  },
  
  alertIcon: {
    flexShrink: 0
  },
  
  alertContent: {
    flex: 1
  },
  
  alertTitle: {
    fontWeight: '600',
    fontSize: '0.875rem',
    margin: '0 0 0.25rem 0'
  },
  
  alertMessage: {
    fontSize: '0.875rem',
    margin: 0,
    opacity: 0.9
  },
  
  // Form
  formGrid: {
    padding: '2rem'
  },
  
  formSection: {
    marginBottom: '2.5rem'
  },
  
  sectionHeader: {
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e5e7eb'
  },
  
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  
  formGroup: {
    marginBottom: '1.5rem'
  },
  
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem'
  },
  
  labelIcon: {
    color: '#9ca3af'
  },
  
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    backgroundColor: '#ffffff',
    ':focus': {
      outline: 'none',
      borderColor: '#ef4444',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
    }
  },
  
  inputGroup: {
    display: 'flex',
    alignItems: 'center'
  },
  
  inputAddon: {
    padding: '0.75rem 1rem',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderLeft: 'none',
    borderTopRightRadius: '0.5rem',
    borderBottomRightRadius: '0.5rem',
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  
  textarea: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '120px',
    transition: 'all 0.2s',
    backgroundColor: '#ffffff',
    ':focus': {
      outline: 'none',
      borderColor: '#ef4444',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
    }
  },
  
  helperText: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.375rem'
  },
  
  // Checkbox
  checkboxContainer: {
    marginBottom: '1.5rem'
  },
  
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    cursor: 'pointer'
  },
  
  checkboxWrapper: {
    position: 'relative',
    marginTop: '0.25rem'
  },
  
  checkbox: {
    position: 'absolute',
    opacity: 0,
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    ':checked + span': {
      backgroundColor: '#ef4444',
      borderColor: '#ef4444'
    },
    ':checked + span:after': {
      display: 'block'
    }
  },
  
  checkboxCustom: {
    display: 'block',
    width: '18px',
    height: '18px',
    border: '2px solid #d1d5db',
    borderRadius: '0.375rem',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s',
    ':after': {
      content: '""',
      position: 'absolute',
      display: 'none',
      left: '5px',
      top: '2px',
      width: '5px',
      height: '10px',
      border: 'solid white',
      borderWidth: '0 2px 2px 0',
      transform: 'rotate(45deg)'
    }
  },
  
  checkboxContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  
  checkboxText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#111827'
  },
  
  checkboxDescription: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  
  // Time Grid
  timeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  
  // Media
  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  },
  
  mediaCard: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }
  },
  
  mediaImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  
  mediaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    padding: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  
  mediaIndex: {
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  
  mediaName: {
    color: '#ffffff',
    fontSize: '0.75rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  
  removeButton: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.375rem',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#dc2626'
    }
  },
  
  // Upload
  uploadArea: {
    border: '2px dashed #d1d5db',
    borderRadius: '0.75rem',
    padding: '2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#f9fafb',
    ':hover': {
      borderColor: '#ef4444',
      backgroundColor: '#fef2f2'
    }
  },
  
  hiddenFileInput: {
    display: 'none'
  },
  
  uploadContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem'
  },
  
  uploadIcon: {
    color: '#9ca3af'
  },
  
  uploadText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    margin: 0
  },
  
  uploadSubtext: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: '0.25rem 0 0 0'
  },
  
  uploadInfo: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    margin: 0
  },
  
  // Form Actions
  formActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  },
  
  cancelButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f3f4f6',
      borderColor: '#9ca3af'
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#dc2626'
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};