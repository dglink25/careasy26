import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';
import ScheduleManager from '../../components/ScheduleManager';
import { 
  FiArrowLeft, 
  FiSave, 
  FiX, 
  FiUpload, 
  FiTrash2, 
  FiClock, 
  FiDollarSign, 
  FiFileText, 
  FiRotateCcw,
  FiAlertCircle,
  FiCalendar
} from 'react-icons/fi';
import {
  MdBusiness,
  MdOutlineWork,
  MdOutlineDescription,
  MdOutlineAttachMoney,
  MdOutlineImage,
  MdOutlineCheckCircle,
  MdOutlineWarning,
  MdOutlineInfo,
  MdOutlineLibraryAdd,
  MdOutlineLocationOn,
  MdOutlinePerson,
  MdOutlineSchedule,
  MdOutlinePhotoLibrary,
  MdOutlineDone,
  MdOutlineClose,
  MdOutlineCategory,
  MdOutlineDashboard,
  MdOutlineTipsAndUpdates,
  MdOutlineStar,
  MdOutlineVerified,
  MdOutlineRefresh,
  MdAccessTime
} from 'react-icons/md';

// Fonction utilitaire pour convertir l'ancien format vers le nouveau
const convertToScheduleFormat = (service) => {
  // Si le service a déjà un schedule, l'utiliser
  if (service.schedule && Object.keys(service.schedule).length > 0) {
    return service.schedule;
  }
  
  // Sinon, créer un schedule basé sur les anciens champs
  const schedule = {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  if (service.is_open_24h) {
    // Si ouvert 24h, on initialise tout vide car isAlwaysOpen sera true
    return {};
  }
  
  if (service.start_time && service.end_time) {
    // Même horaires pour tous les jours (ancien système)
    days.forEach(day => {
      schedule[day] = {
        is_open: true,
        start: service.start_time,
        end: service.end_time
      };
    });
  }
  
  return schedule;
};

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
    price_promo: '',
    is_price_on_request: false,
    has_promo: false,
    promo_start_date: '',
    promo_end_date: '',
    descriptions: '',
  });
  
  const [isAlwaysOpen, setIsAlwaysOpen] = useState(false);
  const [schedule, setSchedule] = useState({});
  
  const [existingMedias, setExistingMedias] = useState([]);
  const [mediasToDelete, setMediasToDelete] = useState([]);
  const [newMedias, setNewMedias] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
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
        price_promo: data.price_promo || '',
        is_price_on_request: data.is_price_on_request || false,
        has_promo: data.has_promo || false,
        promo_start_date: data.promo_start_date ? data.promo_start_date.substring(0, 16) : '',
        promo_end_date: data.promo_end_date ? data.promo_end_date.substring(0, 16) : '',
        descriptions: data.descriptions || '',
      });
      
      // Gestion des horaires avec le nouveau système
      setIsAlwaysOpen(data.is_always_open || data.is_open_24h || false);
      
      // Convertir les anciens horaires vers le nouveau format si nécessaire
      const initialSchedule = convertToScheduleFormat(data);
      setSchedule(initialSchedule);
      
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
    
    if (type === 'checkbox') {
      // Gestion spéciale pour les checkboxes
      if (name === 'is_price_on_request') {
        setFormData(prev => ({
          ...prev,
          is_price_on_request: checked,
          // Si "sur devis" est coché, on désactive la promo et vide les prix
          has_promo: checked ? false : prev.has_promo,
          price: checked ? '' : prev.price,
          price_promo: checked ? '' : prev.price_promo
        }));
      } else if (name === 'has_promo') {
        setFormData(prev => ({
          ...prev,
          has_promo: checked,
          // Si on décoche la promo, on vide le prix promo
          price_promo: checked ? prev.price_promo : ''
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validation des fichiers
    const validFiles = [];
    const errors = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    files.forEach(file => {
      if (file.size > maxSize) {
        errors.push(`"${file.name}" dépasse 5MB`);
      } else if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        errors.push(`"${file.name}" n'est pas une image valide`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      setTimeout(() => setError(''), 5000);
    }
    
    if (validFiles.length > 0) {
      setNewMedias(prev => [...prev, ...validFiles]);
      
      // Créer les previews
      const previewPromises = validFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(previewPromises).then(previews => {
        setNewPreviews(prev => [...prev, ...previews]);
      });
    }
    
    // Réinitialiser l'input
    e.target.value = '';
  };

  const removeNewMedia = (index) => {
    setNewMedias(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const markMediaForDeletion = (mediaUrl) => {
    setMediasToDelete(prev => [...prev, mediaUrl]);
    setExistingMedias(prev => prev.filter(url => url !== mediaUrl));
  };

  const restoreMedia = (mediaUrl) => {
    setMediasToDelete(prev => prev.filter(url => url !== mediaUrl));
    setExistingMedias(prev => [...prev, mediaUrl]);
  };

  const validateForm = () => {
    if (!formData.name || formData.name.trim().length < 3) {
      setError('Le nom du service doit contenir au moins 3 caractères');
      return false;
    }
    
    // Validation des règles de prix
    if (!formData.is_price_on_request) {
      if (formData.has_promo && !formData.price_promo) {
        setError('Veuillez indiquer le prix promotionnel');
        return false;
      }
      
      if (formData.has_promo && formData.price && formData.price_promo) {
        if (parseFloat(formData.price_promo) >= parseFloat(formData.price)) {
          setError('Le prix promotionnel doit être inférieur au prix normal');
          return false;
        }
      }
    }
    
    if (!isAlwaysOpen) {
      const hasOpenDay = Object.values(schedule).some(day => day && day.is_open);
      if (!hasOpenDay) {
        setError('Veuillez définir au moins un jour d\'ouverture');
        return false;
      }
    }
    
    return true;
  };

  const calculateDiscount = () => {
    if (formData.has_promo && formData.price && formData.price_promo) {
      const discount = ((formData.price - formData.price_promo) / formData.price) * 100;
      return Math.round(discount);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const formDataToSend = new FormData();
      
      // Champs simples
      formDataToSend.append('name', formData.name.trim());
      if (formData.descriptions) formDataToSend.append('descriptions', formData.descriptions.trim());
      
      // Gestion des prix
      formDataToSend.append('is_price_on_request', formData.is_price_on_request ? '1' : '0');
      
      if (!formData.is_price_on_request) {
        if (formData.price) {
          formDataToSend.append('price', formData.price);
        }
        
        if (formData.has_promo) {
          formDataToSend.append('has_promo', '1');
          if (formData.price_promo) {
            formDataToSend.append('price_promo', formData.price_promo);
          }
          if (formData.promo_start_date) {
            formDataToSend.append('promo_start_date', formData.promo_start_date);
          }
          if (formData.promo_end_date) {
            formDataToSend.append('promo_end_date', formData.promo_end_date);
          }
        } else {
          formDataToSend.append('has_promo', '0');
        }
      } else {
        formDataToSend.append('has_promo', '0');
      }
      
      // Gestion des horaires avec le nouveau système
      formDataToSend.append('is_always_open', isAlwaysOpen ? '1' : '0');
      
      if (!isAlwaysOpen && Object.keys(schedule).length > 0) {
        // Envoyer chaque jour individuellement
        Object.entries(schedule).forEach(([day, data]) => {
          if (data && data.is_open) {
            formDataToSend.append(`schedule[${day}][is_open]`, '1');
            if (data.start) {
              formDataToSend.append(`schedule[${day}][start]`, data.start);
            }
            if (data.end) {
              formDataToSend.append(`schedule[${day}][end]`, data.end);
            }
          } else {
            formDataToSend.append(`schedule[${day}][is_open]`, '0');
          }
        });
      }
      
      // Images à supprimer
      mediasToDelete.forEach((mediaUrl, index) => {
        formDataToSend.append(`deleted_medias[${index}]`, mediaUrl);
      });
      
      // Nouvelles images
      newMedias.forEach((file) => {
        formDataToSend.append('medias[]', file);
      });
      
      // Pour Laravel (méthode POST avec _method=PUT)
      formDataToSend.append('_method', 'PUT');
      
      console.log('Données envoyées:', {
        name: formData.name,
        price: formData.price,
        price_promo: formData.price_promo,
        is_price_on_request: formData.is_price_on_request,
        has_promo: formData.has_promo,
        promo_dates: formData.has_promo ? { start: formData.promo_start_date, end: formData.promo_end_date } : null,
        is_always_open: isAlwaysOpen,
        schedule: !isAlwaysOpen ? schedule : null,
        mediasToDelete: mediasToDelete.length,
        newMedias: newMedias.length
      });
      
      await serviceApi.updateService(id, formDataToSend);
      
      setSuccess('Service modifié avec succès !');
      
      setTimeout(() => {
        navigate('/mes-services'); 
      }, 1500);
      
    } catch (err) {
      console.error('Erreur détaillée:', err.response?.data);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error ||
        'Erreur lors de la modification'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement du service...</p>
          <p style={styles.loadingSubtext}>Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>
            <MdOutlineWarning size={48} />
          </div>
          <h2 style={styles.errorTitle}>Service non trouvé</h2>
          <p style={styles.errorMessage}>
            Le service que vous essayez de modifier n'existe pas ou a été supprimé.
          </p>
          <Link to="/mes-services" style={styles.errorButton}>
            <FiArrowLeft /> Retour à mes services
          </Link>
        </div>
      </div>
    );
  }

  const discountPercentage = calculateDiscount();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <Link to="/mes-services" style={styles.backButton}>
              <FiArrowLeft size={20} />
              <span>Retour</span>
            </Link>
            <div style={styles.headerTitles}>
              <h1 style={styles.title}>Modifier le service</h1>
              <div style={styles.badgeContainer}>
                <span style={styles.badge}>
                  <MdBusiness size={12} />
                  {service.entreprise?.name}
                </span>
                <span style={styles.badgeSecondary}>
                  <MdOutlineCategory size={12} />
                  {service.domaine?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {/* Messages */}
        {error && (
          <div style={styles.alertError}>
            <FiAlertCircle size={20} />
            <div style={styles.alertContent}>
              <p style={styles.alertTitle}>Erreur</p>
              <p style={styles.alertMessage}>{error}</p>
            </div>
            <button 
              onClick={() => setError('')} 
              style={styles.alertClose}
            >
              <FiX />
            </button>
          </div>
        )}

        {success && (
          <div style={styles.alertSuccess}>
            <MdOutlineCheckCircle size={20} />
            <div style={styles.alertContent}>
              <p style={styles.alertTitle}>Succès</p>
              <p style={styles.alertMessage}>{success}</p>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <div style={styles.card}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formContent}>
              {/* Informations principales */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <MdOutlineWork style={styles.sectionIcon} />
                  <h2 style={styles.sectionTitle}>Informations principales</h2>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FiFileText style={styles.labelIcon} />
                    Nom du service <span style={styles.required}>*</span>
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
                  <p style={styles.helperText}>
                    Nom qui apparaîtra sur votre profil
                  </p>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <MdOutlineDescription style={styles.labelIcon} />
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
                  <p style={styles.helperText}>
                    Incluez les spécifications, matériaux utilisés, délais, etc.
                  </p>
                </div>
              </div>

              {/* Tarification */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <MdOutlineAttachMoney style={styles.sectionIcon} />
                  <h2 style={styles.sectionTitle}>Tarification</h2>
                </div>
                
                {/* Option Sur devis */}
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="is_price_on_request"
                      checked={formData.is_price_on_request}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    <div style={styles.checkboxContent}>
                      <span style={styles.checkboxText}>Prix sur devis</span>
                      <span style={styles.checkboxDescription}>
                        Le prix sera communiqué après discussion avec le client
                      </span>
                    </div>
                  </label>
                </div>

                {!formData.is_price_on_request && (
                  <>
                    {/* Prix normal */}
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FiDollarSign style={styles.labelIcon} />
                        Prix normal (FCFA)
                      </label>
                      <div style={styles.inputGroup}>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          style={styles.priceInput}
                          min="0"
                          placeholder="0"
                        />
                        <span style={styles.inputAddon}>FCFA</span>
                      </div>
                      <p style={styles.helperText}>
                        Prix standard du service
                      </p>
                    </div>

                    {/* Option Promotion */}
                    <div style={styles.checkboxGroup}>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="has_promo"
                          checked={formData.has_promo}
                          onChange={handleChange}
                          disabled={!formData.price}
                          style={styles.checkbox}
                        />
                        <div style={styles.checkboxContent}>
                          <span style={styles.checkboxText}>
                            <MdOutlineStar style={{ color: '#e67e22', marginRight: '0.25rem' }} />
                            Activer une promotion
                          </span>
                          <span style={styles.checkboxDescription}>
                            {formData.price 
                              ? "Proposez un prix promotionnel" 
                              : "Définissez d'abord un prix normal"}
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Prix promotionnel */}
                    {formData.has_promo && (
                      <>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>
                            <MdOutlineStar style={{...styles.labelIcon, color: '#e67e22'}} />
                            Prix promotionnel (FCFA) <span style={styles.required}>*</span>
                          </label>
                          <div style={styles.inputGroup}>
                            <input
                              type="number"
                              name="price_promo"
                              value={formData.price_promo}
                              onChange={handleChange}
                              style={{...styles.priceInput, borderColor: '#f39c12'}}
                              min="0"
                              max={formData.price}
                              placeholder={`Max: ${formData.price} FCFA`}
                            />
                            <span style={styles.inputAddon}>FCFA</span>
                          </div>
                          
                          {discountPercentage && (
                            <div style={styles.promoInfo}>
                              <span style={styles.promoSuccess}>
                                Réduction de {discountPercentage}%
                              </span>
                            </div>
                          )}
                          
                          {formData.price_promo && formData.price && 
                           parseFloat(formData.price_promo) >= parseFloat(formData.price) && (
                            <div style={styles.promoInfo}>
                              <span style={styles.promoError}>
                                Le prix promo doit être inférieur au prix normal
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Dates de validité de la promo */}
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>
                              <FiCalendar style={styles.labelIcon} />
                              Début de la promo
                            </label>
                            <input
                              type="datetime-local"
                              name="promo_start_date"
                              value={formData.promo_start_date || ''}
                              onChange={handleChange}
                              style={styles.input}
                            />
                            <p style={styles.helperTextSmall}>
                              Laissez vide pour commencer immédiatement
                            </p>
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>
                              <FiCalendar style={styles.labelIcon} />
                              Fin de la promo
                            </label>
                            <input
                              type="datetime-local"
                              name="promo_end_date"
                              value={formData.promo_end_date || ''}
                              onChange={handleChange}
                              min={formData.promo_start_date}
                              style={styles.input}
                            />
                            <p style={styles.helperTextSmall}>
                              Laissez vide pour une durée illimitée
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Disponibilité avec ScheduleManager */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FiClock style={styles.sectionIcon} />
                  <h2 style={styles.sectionTitle}>Disponibilité</h2>
                </div>
                
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isAlwaysOpen}
                      onChange={(e) => {
                        setIsAlwaysOpen(e.target.checked);
                        if (e.target.checked) {
                          setSchedule({});
                        }
                      }}
                      style={styles.checkbox}
                    />
                    <div style={styles.checkboxContent}>
                      <span style={styles.checkboxText}>Toujours disponible</span>
                      <span style={styles.checkboxDescription}>
                        Service disponible 7j/7 et 24h/24
                      </span>
                    </div>
                  </label>
                </div>

                {!isAlwaysOpen && (
                  <div style={styles.scheduleWrapper}>
                    <ScheduleManager 
                      value={schedule}
                      onChange={setSchedule}
                    />
                  </div>
                )}
              </div>

              {/* Images actuelles */}
              {existingMedias.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <MdOutlineImage style={styles.sectionIcon} />
                    <h2 style={styles.sectionTitle}>Images actuelles</h2>
                  </div>
                  
                  <div style={styles.mediaGrid}>
                    {existingMedias.map((media, index) => (
                      <div key={index} style={styles.mediaCard}>
                        <img
                          src={media}
                          alt={`Media ${index + 1}`}
                          style={styles.mediaImage}
                        />
                        <div style={styles.mediaOverlay}>
                          <span style={styles.mediaIndex}>Image {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => markMediaForDeletion(media)}
                            style={styles.removeButton}
                            title="Supprimer cette image"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images à supprimer */}
              {mediasToDelete.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <MdOutlineWarning style={{...styles.sectionIcon, color: '#dc2626'}} />
                    <h2 style={{...styles.sectionTitle, color: '#dc2626'}}>
                      Images à supprimer
                    </h2>
                  </div>
                  
                  <div style={styles.mediaGrid}>
                    {mediasToDelete.map((media, index) => (
                      <div key={index} style={{...styles.mediaCard, opacity: 0.7}}>
                        <img
                          src={media}
                          alt={`À supprimer ${index + 1}`}
                          style={styles.mediaImage}
                        />
                        <div style={{...styles.mediaOverlay, background: 'linear-gradient(transparent, rgba(220,38,38,0.9))'}}>
                          <span style={styles.mediaIndex}>À supprimer</span>
                          <button
                            type="button"
                            onClick={() => restoreMedia(media)}
                            style={{...styles.removeButton, backgroundColor: '#10b981'}}
                            title="Restaurer cette image"
                          >
                            <MdOutlineRefresh size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={styles.warningText}>
                    Ces images seront supprimées définitivement lors de l'enregistrement
                  </p>
                </div>
              )}

              {/* Nouvelles images */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FiUpload style={styles.sectionIcon} />
                  <h2 style={styles.sectionTitle}>Ajouter des images</h2>
                </div>
                
                <div style={styles.uploadArea}>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleMediaChange}
                    style={styles.fileInput}
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" style={styles.uploadLabel}>
                    <FiUpload size={32} style={styles.uploadIcon} />
                    <div style={styles.uploadText}>
                      <span style={styles.uploadTitle}>Cliquez pour ajouter des images</span>
                      <span style={styles.uploadSubtitle}>
                        PNG, JPG, WEBP • Max: 5MB par image
                      </span>
                    </div>
                  </label>
                </div>

                {newPreviews.length > 0 && (
                  <div style={styles.mediaGrid}>
                    {newPreviews.map((preview, index) => (
                      <div key={index} style={styles.mediaCard}>
                        <img
                          src={preview}
                          alt={`Nouveau ${index + 1}`}
                          style={styles.mediaImage}
                        />
                        <div style={styles.mediaOverlay}>
                          <span style={styles.mediaName}>
                            {newMedias[index]?.name.substring(0, 15)}...
                          </span>
                          <button
                            type="button"
                            onClick={() => removeNewMedia(index)}
                            style={styles.removeButton}
                            title="Supprimer cette image"
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => navigate('/mes-services')}
                style={styles.cancelButton}
                disabled={submitting}
              >
                <FiX size={16} />
                Annuler
              </button>
              <button
                type="submit"
                style={styles.submitButton}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div style={styles.buttonSpinner}></div>
                    Modification en cours...
                  </>
                ) : (
                  <>
                    <FiSave size={16} />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Conseils */}
        <div style={styles.tipsCard}>
          <div style={styles.tipsHeader}>
            <MdOutlineTipsAndUpdates style={styles.tipsIcon} />
            <h3 style={styles.tipsTitle}>Conseils pour une bonne modification</h3>
          </div>
          <div style={styles.tipsGrid}>
            <div style={styles.tipItem}>
              <div style={styles.tipIcon}>📝</div>
              <div style={styles.tipContent}>
                <p style={styles.tipTitle}>Soyez précis</p>
                <p style={styles.tipText}>
                  Mettez à jour la description avec les nouvelles informations
                </p>
              </div>
            </div>
            <div style={styles.tipItem}>
              <div style={styles.tipIcon}>💰</div>
              <div style={styles.tipContent}>
                <p style={styles.tipTitle}>Prix à jour</p>
                <p style={styles.tipText}>
                  Utilisez les promotions pour attirer plus de clients
                </p>
              </div>
            </div>
            <div style={styles.tipItem}>
              <div style={styles.tipIcon}>⏰</div>
              <div style={styles.tipContent}>
                <p style={styles.tipTitle}>Horaires</p>
                <p style={styles.tipText}>
                  Mettez à jour vos disponibilités régulièrement
                </p>
              </div>
            </div>
            <div style={styles.tipItem}>
              <div style={styles.tipIcon}>📸</div>
              <div style={styles.tipContent}>
                <p style={styles.tipTitle}>Images de qualité</p>
                <p style={styles.tipText}>
                  Remplacez les anciennes photos par des plus récentes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        .media-card:hover .media-overlay {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

// Styles (gardez les mêmes styles et ajoutez ceux-ci)
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
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
    padding: '0 2rem'
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
    gap: '0.5rem'
  },
  
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0
  },
  
  badgeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.25rem 0.75rem',
    borderRadius: '1rem',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  
  badgeSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
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
    padding: '2rem'
  },
  
  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem'
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
    color: '#374151',
    fontSize: '1rem',
    fontWeight: '500',
    margin: 0
  },
  
  loadingSubtext: {
    color: '#6b7280',
    fontSize: '0.875rem',
    margin: 0
  },
  
  // Error
  errorContainer: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    maxWidth: '600px',
    margin: '4rem auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
    marginBottom: '2rem',
    lineHeight: '1.6'
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
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#dc2626',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(239,68,68,0.2)'
    }
  },
  
  // Alerts
  alertError: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '0.75rem',
    padding: '1rem',
    marginBottom: '1.5rem',
    animation: 'slideIn 0.3s ease-out',
    position: 'relative'
  },
  
  alertSuccess: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '0.75rem',
    padding: '1rem',
    marginBottom: '1.5rem',
    animation: 'slideIn 0.3s ease-out'
  },
  
  alertContent: {
    flex: 1
  },
  
  alertTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    margin: '0 0 0.25rem 0'
  },
  
  alertMessage: {
    fontSize: '0.875rem',
    margin: 0,
    opacity: 0.9
  },
  
  alertClose: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      opacity: 0.8
    }
  },
  
  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginBottom: '2rem'
  },
  
  formContent: {
    padding: '2rem'
  },
  
  // Sections
  section: {
    marginBottom: '2.5rem',
    animation: 'fadeIn 0.5s ease-out'
  },
  
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #e5e7eb'
  },
  
  sectionIcon: {
    fontSize: '1.5rem',
    color: '#ef4444'
  },
  
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  
  // Form
  formGroup: {
    marginBottom: '1.5rem'
  },
  
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem'
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
    color: '#9ca3af',
    fontSize: '1rem'
  },
  
  required: {
    color: '#ef4444',
    marginLeft: '0.25rem'
  },
  
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    backgroundColor: '#ffffff',
    ':focus': {
      outline: 'none',
      borderColor: '#ef4444',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
    }
  },
  
  textarea: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
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
  
  helperTextSmall: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    marginTop: '0.25rem',
    fontStyle: 'italic'
  },
  
  // Price
  inputGroup: {
    display: 'flex',
    alignItems: 'center'
  },
  
  priceInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRight: 'none',
    borderTopLeftRadius: '0.5rem',
    borderBottomLeftRadius: '0.5rem',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#ef4444',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
    }
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
  
  // Promo
  promoInfo: {
    marginTop: '0.5rem',
    fontSize: '0.875rem'
  },
  
  promoSuccess: {
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontWeight: '500'
  },
  
  promoError: {
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.875rem'
  },
  
  // Checkbox
  checkboxGroup: {
    marginBottom: '1.5rem'
  },
  
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    cursor: 'pointer',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f3f4f6',
      borderColor: '#d1d5db'
    }
  },
  
  checkbox: {
    width: '18px',
    height: '18px',
    marginTop: '0.125rem',
    cursor: 'pointer',
    accentColor: '#ef4444'
  },
  
  checkboxContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  
  checkboxText: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#111827'
  },
  
  checkboxDescription: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  
  // Schedule
  scheduleWrapper: {
    marginTop: '1rem'
  },
  
  // Media
  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
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
    transition: 'all 0.2s',
    cursor: 'pointer',
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
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'transform 0.3s',
    transform: 'translateY(0)'
  },
  
  mediaIndex: {
    color: '#ffffff',
    fontSize: '0.7rem',
    fontWeight: '500'
  },
  
  mediaName: {
    color: '#ffffff',
    fontSize: '0.7rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '80px'
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
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#dc2626',
      transform: 'scale(1.1)'
    }
  },
  
  warningText: {
    fontSize: '0.875rem',
    color: '#dc2626',
    marginTop: '0.75rem',
    padding: '0.5rem',
    backgroundColor: '#fef2f2',
    borderRadius: '0.5rem',
    border: '1px solid #fecaca'
  },
  
  // Upload
  uploadArea: {
    border: '2px dashed #d1d5db',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    transition: 'all 0.2s',
    ':hover': {
      borderColor: '#ef4444',
      backgroundColor: '#fef2f2'
    }
  },
  
  fileInput: {
    display: 'none'
  },
  
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    cursor: 'pointer',
    textAlign: 'center',
    width: '100%',
    height: '100%'
  },
  
  uploadIcon: {
    color: '#9ca3af',
    marginBottom: '1rem',
    transition: 'transform 0.2s'
  },
  
  uploadText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  
  uploadTitle: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#374151'
  },
  
  uploadSubtitle: {
    fontSize: '0.875rem',
    color: '#6b7280'
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
    backgroundColor: '#ffffff',
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
      borderColor: '#9ca3af',
      transform: 'translateY(-1px)'
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none'
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
      backgroundColor: '#dc2626',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(239,68,68,0.2)'
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none'
    }
  },
  
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  // Tips
  tipsCard: {
    backgroundColor: '#dbeafe',
    border: '1px solid #93c5fd',
    borderRadius: '1rem',
    padding: '1.5rem'
  },
  
  tipsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  
  tipsIcon: {
    fontSize: '1.5rem',
    color: '#1e40af'
  },
  
  tipsTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e40af',
    margin: 0
  },
  
  tipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  
  tipItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    backgroundColor: '#ffffff',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid #bfdbfe'
  },
  
  tipIcon: {
    fontSize: '1.25rem'
  },
  
  tipContent: {
    flex: 1
  },
  
  tipTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 0.25rem 0'
  },
  
  tipText: {
    fontSize: '0.75rem',
    color: '#3730a3',
    margin: 0,
    lineHeight: '1.4'
  },
  
  // Responsive
  '@media (max-width: 768px)': {
    content: {
      padding: '1rem'
    },
    headerContent: {
      padding: '0 1rem'
    },
    headerLeft: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '1rem'
    },
    title: {
      fontSize: '1.5rem'
    },
    formContent: {
      padding: '1.5rem'
    },
    formRow: {
      gridTemplateColumns: '1fr',
      gap: '0.5rem'
    },
    formActions: {
      flexDirection: 'column',
      gap: '1rem',
      padding: '1.5rem'
    },
    cancelButton: {
      width: '100%',
      justifyContent: 'center'
    },
    submitButton: {
      width: '100%',
      justifyContent: 'center'
    },
    mediaGrid: {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    tipsGrid: {
      gridTemplateColumns: '1fr'
    }
  },
  
  '@media (max-width: 480px)': {
    mediaGrid: {
      gridTemplateColumns: '1fr'
    }
  }
};