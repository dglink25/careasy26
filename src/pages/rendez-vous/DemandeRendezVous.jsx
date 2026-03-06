import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';
import { rendezVousApi } from '../../api/rendezVousApi';
import TimeSlotPicker from '../../components/RendezVous/TimeSlotPicker';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import { 
    FiArrowLeft, 
    FiCalendar, 
    FiClock, 
    FiUser,
    FiFileText,
    FiSend,
    FiCheckCircle,
    FiAlertCircle,
    FiInfo
} from 'react-icons/fi';
import { MdBusiness, MdOutlineWork, MdOutlineAttachMoney } from 'react-icons/md';

export default function DemandeRendezVous() {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [notes, setNotes] = useState('');
    const [contactInfo, setContactInfo] = useState({
        name: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        fetchService();
    }, [serviceId]);

    const fetchService = async () => {
        try {
            setLoading(true);
            const data = await serviceApi.getServiceById(serviceId);
            setService(data);
        } catch (err) {
            setError('Service non trouvé');
            setTimeout(() => navigate('/services'), 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedSlot(null);
    };

    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedSlot) {
            setError('Veuillez sélectionner un créneau');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            await rendezVousApi.createRendezVous({
                service_id: serviceId,
                date: selectedSlot.date,
                start_time: selectedSlot.start_time,
                end_time: selectedSlot.end_time,
                client_notes: notes
            });

            setSuccess(true);
            
            setTimeout(() => {
                navigate('/mes-rendez-vous');
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la demande');
        } finally {
            setSubmitting(false);
        }
    };

    const filterDate = (date) => {
        if (!service || service.is_always_open) return true;
        
        const dayOfWeek = date.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
        return service.schedule?.[dayOfWeek]?.is_open || false;
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Chargement du service...</p>
            </div>
        );
    }

    if (!service) {
        return (
            <div style={styles.errorContainer}>
                <FiAlertCircle size={48} color="#ef4444" />
                <h2>Service non trouvé</h2>
                <Link to="/services" style={styles.backLink}>
                    <FiArrowLeft /> Retour aux services
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div style={styles.successContainer}>
                <div style={styles.successIcon}>
                    <FiCheckCircle size={64} color="#10b981" />
                </div>
                <h2 style={styles.successTitle}>Demande envoyée !</h2>
                <p style={styles.successMessage}>
                    Votre demande de rendez-vous a été transmise au prestataire.
                    Vous recevrez une confirmation par SMS.
                </p>
                <div style={styles.successDetails}>
                    <p><strong>Service :</strong> {service.name}</p>
                    <p><strong>Date :</strong> {selectedSlot && new Date(selectedSlot.date).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Horaire :</strong> {selectedSlot?.start_time} - {selectedSlot?.end_time}</p>
                </div>
                <p style={styles.successRedirect}>
                    Redirection vers vos rendez-vous...
                </p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <Link to={`/service/${serviceId}`} style={styles.backButton}>
                <FiArrowLeft /> Retour au service
            </Link>

            <div style={styles.header}>
                <h1 style={styles.title}>Demande de rendez-vous</h1>
                <p style={styles.subtitle}>
                    Pour le service : {service.name}
                </p>
            </div>

            <div style={styles.content}>
                {/* Informations du service */}
                <div style={styles.infoCard}>
                    <h2 style={styles.infoTitle}>Détails du service</h2>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <MdBusiness style={styles.infoIcon} />
                            <div>
                                <div style={styles.infoLabel}>Entreprise</div>
                                <div style={styles.infoValue}>{service.entreprise?.name}</div>
                            </div>
                        </div>
                        <div style={styles.infoItem}>
                            <MdOutlineWork style={styles.infoIcon} />
                            <div>
                                <div style={styles.infoLabel}>Domaine</div>
                                <div style={styles.infoValue}>{service.domaine?.name}</div>
                            </div>
                        </div>
                        {service.price && !service.is_price_on_request && (
                            <div style={styles.infoItem}>
                                <MdOutlineAttachMoney style={styles.infoIcon} />
                                <div>
                                    <div style={styles.infoLabel}>Prix</div>
                                    <div style={styles.infoValue}>
                                        {service.price.toLocaleString()} FCFA
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Formulaire de rendez-vous */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Sélection de la date */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            <FiCalendar style={styles.labelIcon} />
                            Date du rendez-vous <span style={styles.required}>*</span>
                        </label>
                        <DatePicker
                            selected={selectedDate}
                            onChange={handleDateChange}
                            minDate={new Date()}
                            filterDate={filterDate}
                            dateFormat="dd/MM/yyyy"
                            locale={fr}
                            placeholderText="Sélectionnez une date"
                            className="datepicker-input"
                        />
                        <p style={styles.helperText}>
                            {!service.is_always_open && 
                                "Seuls les jours d'ouverture sont disponibles"
                            }
                        </p>
                    </div>

                    {/* Sélection du créneau */}
                    {selectedDate && (
                        <TimeSlotPicker
                            serviceId={serviceId}
                            selectedDate={selectedDate}
                            onSlotSelect={handleSlotSelect}
                        />
                    )}

                    {/* Notes */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            <FiFileText style={styles.labelIcon} />
                            Notes pour le prestataire (optionnel)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            style={styles.textarea}
                            rows="4"
                            placeholder="Précisez les détails de votre demande (problème spécifique, préférences, etc.)..."
                            maxLength={500}
                        />
                        <p style={styles.helperText}>
                            {notes.length}/500 caractères
                        </p>
                    </div>

                    {/* Informations de contact (pré-remplies depuis le profil) */}
                    <div style={styles.contactInfoBox}>
                        <FiInfo size={20} />
                        <div>
                            <p style={styles.contactInfoTitle}>
                                Le prestataire vous contactera via :
                            </p>
                            <p style={styles.contactInfoDetails}>
                                {contactInfo.name || 'Nom'} {contactInfo.phone || 'Téléphone'} • {contactInfo.email || 'Email'}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div style={styles.error}>
                            <FiAlertCircle />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Bouton de soumission */}
                    <button
                        type="submit"
                        disabled={submitting || !selectedSlot}
                        style={{
                            ...styles.submitButton,
                            opacity: (submitting || !selectedSlot) ? 0.6 : 1,
                            cursor: (submitting || !selectedSlot) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {submitting ? (
                            <>
                                <div style={styles.buttonSpinner}></div>
                                Envoi en cours...
                            </>
                        ) : (
                            <>
                                <FiSend style={styles.submitIcon} />
                                Envoyer la demande
                            </>
                        )}
                    </button>
                </form>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .datepicker-input {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 0.75rem;
                    font-size: 0.95rem;
                    outline: none;
                    transition: all 0.3s;
                }
                
                .datepicker-input:focus {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1rem',
    },
    backButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#64748b',
        textDecoration: 'none',
        marginBottom: '2rem',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#f1f5f9',
            color: '#ef4444',
        },
    },
    header: {
        marginBottom: '2rem',
    },
    title: {
        fontSize: '2rem',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '0.5rem',
    },
    subtitle: {
        fontSize: '1.125rem',
        color: '#64748b',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
    },
    infoCard: {
        backgroundColor: '#fff',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
    },
    infoTitle: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '1.5rem',
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
    },
    infoItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    infoIcon: {
        fontSize: '1.5rem',
        color: '#ef4444',
    },
    infoLabel: {
        fontSize: '0.75rem',
        color: '#64748b',
        marginBottom: '0.25rem',
    },
    infoValue: {
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#1e293b',
    },
    form: {
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
    },
    formGroup: {
        marginBottom: '1.5rem',
    },
    label: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.5rem',
    },
    labelIcon: {
        color: '#ef4444',
    },
    required: {
        color: '#ef4444',
    },
    helperText: {
        fontSize: '0.75rem',
        color: '#64748b',
        marginTop: '0.5rem',
    },
    textarea: {
        width: '100%',
        padding: '1rem',
        border: '2px solid #e2e8f0',
        borderRadius: '0.75rem',
        fontSize: '0.95rem',
        fontFamily: 'inherit',
        resize: 'vertical',
        minHeight: '100px',
        outline: 'none',
        transition: 'all 0.3s',
        ':focus': {
            borderColor: '#ef4444',
            boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
        },
    },
    contactInfoBox: {
        display: 'flex',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        color: '#0369a1',
    },
    contactInfoTitle: {
        fontWeight: '600',
        marginBottom: '0.25rem',
    },
    contactInfoDetails: {
        fontSize: '0.875rem',
        opacity: 0.9,
    },
    error: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.75rem',
        color: '#ef4444',
        marginBottom: '1.5rem',
    },
    submitButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: '100%',
        padding: '1rem',
        backgroundColor: '#ef4444',
        color: '#fff',
        border: 'none',
        borderRadius: '0.75rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s',
        ':hover': {
            backgroundColor: '#dc2626',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
        },
    },
    submitIcon: {
        fontSize: '1rem',
    },
    buttonSpinner: {
        width: '20px',
        height: '20px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTop: '2px solid #fff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
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
        border: '4px solid #fee2e2',
        borderTop: '4px solid #ef4444',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    errorContainer: {
        textAlign: 'center',
        padding: '4rem 2rem',
    },
    backLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '1rem',
        color: '#ef4444',
        textDecoration: 'none',
    },
    successContainer: {
        maxWidth: '600px',
        margin: '4rem auto',
        textAlign: 'center',
        padding: '3rem',
        backgroundColor: '#fff',
        borderRadius: '1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    },
    successIcon: {
        marginBottom: '1.5rem',
    },
    successTitle: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '1rem',
    },
    successMessage: {
        color: '#64748b',
        marginBottom: '2rem',
        lineHeight: '1.6',
    },
    successDetails: {
        backgroundColor: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '1rem',
        marginBottom: '1.5rem',
        textAlign: 'left',
    },
    successRedirect: {
        fontSize: '0.875rem',
        color: '#94a3b8',
    },
};