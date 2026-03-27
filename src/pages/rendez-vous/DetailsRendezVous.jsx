// src/pages/rendez-vous/DetailsRendezVous.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { rendezVousApi } from '../../api/rendezVousApi';
import { useAuth } from '../../contexts/AuthContext';
import { format, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import ReviewModal from '../../components/RendezVous/ReviewModal';
import ReportModal from '../../components/RendezVous/ReportModal';
import {
    FiArrowLeft, FiCalendar, FiClock, FiUser, FiPhone, FiMail,
    FiFileText, FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw,
    FiStar, FiFlag,
} from 'react-icons/fi';
import {
    MdBusiness, MdOutlinePending, MdOutlineCheckCircle,
    MdOutlineCancel, MdOutlinePerson,
} from 'react-icons/md';

const statusConfig = {
    pending:     { label: 'En attente',  color: '#f59e0b', bgColor: '#fffbeb', icon: MdOutlinePending,    borderColor: '#fcd34d', textColor: '#92400e' },
    confirmed:   { label: 'Confirmé',    color: '#10b981', bgColor: '#f0fdf4', icon: MdOutlineCheckCircle, borderColor: '#a7f3d0', textColor: '#065f46' },
    cancelled:   { label: 'Annulé',      color: '#ef4444', bgColor: '#fef2f2', icon: MdOutlineCancel,      borderColor: '#fecaca', textColor: '#991b1b' },
    completed:   { label: 'Terminé',     color: '#6b7280', bgColor: '#f3f4f6', icon: FiCheckCircle,        borderColor: '#d1d5db', textColor: '#374151' },
    rescheduled: { label: 'Reporté',     color: '#8b5cf6', bgColor: '#f5f3ff', icon: FiRefreshCw,          borderColor: '#ddd6fe', textColor: '#5b21b6' },
};

export default function DetailsRendezVous() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [rendezVous, setRendezVous] = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason,    setCancelReason]    = useState('');

    // ── NOUVEAU ──
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => { fetchRendezVous(); }, [id]);

    const fetchRendezVous = async () => {
        try {
            setLoading(true);
            const response = await rendezVousApi.getRendezVousById(id);
            setRendezVous(response.data);
        } catch {
            setError('Impossible de charger les détails du rendez-vous');
        } finally { setLoading(false); }
    };

    const handleConfirm = async () => {
        try { setActionLoading(true); await rendezVousApi.confirmRendezVous(id); await fetchRendezVous(); }
        catch  { setError('Erreur lors de la confirmation'); }
        finally{ setActionLoading(false); }
    };

    const handleCancel = async () => {
        try { setActionLoading(true); await rendezVousApi.cancelRendezVous(id, cancelReason); await fetchRendezVous(); setShowCancelModal(false); setCancelReason(''); }
        catch  { setError('Erreur lors de l\'annulation'); }
        finally{ setActionLoading(false); }
    };

    const handleComplete = async () => {
        try { setActionLoading(true); await rendezVousApi.completeRendezVous(id); await fetchRendezVous(); }
        catch  { setError('Erreur lors de la finalisation'); }
        finally{ setActionLoading(false); }
    };

    const getStatusBadge = (status) => {
        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;
        return (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: config.bgColor, color: config.textColor, borderRadius: '2rem', fontSize: '0.875rem', fontWeight: '600', border: `1px solid ${config.borderColor}` }}>
                <Icon size={16} />{config.label}
            </div>
        );
    };

    const getFormattedDate = (date) => {
        const d = new Date(date);
        if (isToday(d))    return "Aujourd'hui";
        if (isTomorrow(d)) return "Demain";
        return format(d, 'EEEE d MMMM yyyy', { locale: fr });
    };

    if (loading) return (
        <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Chargement des détails...</p>
        </div>
    );

    if (error || !rendezVous) return (
        <div style={styles.errorContainer}>
            <FiAlertCircle size={48} color="#ef4444" />
            <h2>{error || 'Rendez-vous non trouvé'}</h2>
            <Link to="/mes-rendez-vous" style={styles.backLink}><FiArrowLeft /> Retour</Link>
        </div>
    );

    const isPrestataire = user?.id === rendezVous.prestataire_id;
    const isClient      = user?.id === rendezVous.client_id;
    const canConfirm    = isPrestataire && rendezVous.status === 'pending';
    const canCancel     = (isPrestataire || isClient) && ['pending', 'confirmed'].includes(rendezVous.status);
    const canComplete   = isPrestataire && rendezVous.status === 'confirmed';
    const canReview     = isClient && rendezVous.status === 'completed' && !rendezVous.review;
    const hasReview     = !!rendezVous.review;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <Link to="/mes-rendez-vous" style={styles.backButton}>
                    <FiArrowLeft size={20} /><span>Retour à la liste</span>
                </Link>
            </div>

            <div style={styles.content}>
                <div style={styles.mainCard}>
                    {/* ── En-tête carte ── */}
                    <div style={styles.cardHeader}>
                        <div>
                            <h1 style={styles.title}>{rendezVous.service?.name}</h1>
                            <div style={styles.entrepriseName}><MdBusiness size={18} />{rendezVous.entreprise?.name}</div>
                        </div>
                        {getStatusBadge(rendezVous.status)}
                    </div>

                    {/* ── Infos clés ── */}
                    <div style={styles.keyInfoGrid}>
                        <div style={styles.keyInfoItem}>
                            <FiCalendar style={styles.keyInfoIcon} />
                            <div><div style={styles.keyInfoLabel}>Date</div><div style={styles.keyInfoValue}>{getFormattedDate(rendezVous.date)}</div></div>
                        </div>
                        <div style={styles.keyInfoItem}>
                            <FiClock style={styles.keyInfoIcon} />
                            <div><div style={styles.keyInfoLabel}>Horaire</div><div style={styles.keyInfoValue}>{rendezVous.start_time} - {rendezVous.end_time}</div></div>
                        </div>
                        <div style={styles.keyInfoItem}>
                            <MdOutlinePerson style={styles.keyInfoIcon} />
                            <div>
                                <div style={styles.keyInfoLabel}>{isPrestataire ? 'Client' : 'Prestataire'}</div>
                                <div style={styles.keyInfoValue}>{isPrestataire ? rendezVous.client?.name : rendezVous.prestataire?.name}</div>
                            </div>
                        </div>
                    </div>

                    {/* ── Contact ── */}
                    <div style={styles.contactSection}>
                        <h3 style={styles.sectionTitle}>Coordonnées de contact</h3>
                        <div style={styles.contactGrid}>
                            <div style={styles.contactItem}>
                                <FiPhone style={styles.contactIcon} />
                                <div>
                                    <div style={styles.contactLabel}>Téléphone</div>
                                    <div style={styles.contactValue}>{isPrestataire ? (rendezVous.client?.phone || 'Non renseigné') : (rendezVous.prestataire?.phone || 'Non renseigné')}</div>
                                </div>
                            </div>
                            <div style={styles.contactItem}>
                                <FiMail style={styles.contactIcon} />
                                <div>
                                    <div style={styles.contactLabel}>Email</div>
                                    <div style={styles.contactValue}>{isPrestataire ? rendezVous.client?.email : rendezVous.prestataire?.email}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Notes client ── */}
                    {rendezVous.client_notes && (
                        <div style={styles.notesSection}>
                            <h3 style={styles.sectionTitle}><FiFileText style={styles.sectionIcon} />Notes du client</h3>
                            <div style={styles.notesContent}>{rendezVous.client_notes}</div>
                        </div>
                    )}

                    {/* ── Détails ── */}
                    <div style={styles.detailsSection}>
                        <h3 style={styles.sectionTitle}>Détails supplémentaires</h3>
                        <div style={styles.detailsGrid}>
                            <div style={styles.detailItem}>
                                <span style={styles.detailLabel}>Date de demande</span>
                                <span style={styles.detailValue}>{format(new Date(rendezVous.created_at), 'dd/MM/yyyy')}</span>
                            </div>
                            {rendezVous.confirmed_at && (
                                <div style={styles.detailItem}>
                                    <span style={styles.detailLabel}>Confirmé le</span>
                                    <span style={styles.detailValue}>{format(new Date(rendezVous.confirmed_at), 'dd/MM/yyyy à HH:mm')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Actions prestataire / client ── */}
                    <div style={styles.actionsSection}>
                        {canConfirm && (
                            <button onClick={handleConfirm} disabled={actionLoading} style={styles.confirmButton}>
                                {actionLoading ? <div style={styles.buttonSpinner}></div> : <><FiCheckCircle size={18} />Confirmer le rendez-vous</>}
                            </button>
                        )}
                        {canComplete && (
                            <button onClick={handleComplete} disabled={actionLoading} style={styles.completeButton}>
                                {actionLoading ? <div style={styles.buttonSpinner}></div> : <><FiCheckCircle size={18} />Marquer comme terminé</>}
                            </button>
                        )}
                        {canCancel && (
                            <button onClick={() => setShowCancelModal(true)} disabled={actionLoading} style={styles.cancelButton}>
                                <FiXCircle size={18} />Annuler le rendez-vous
                            </button>
                        )}
                    </div>

                    {/* ── SECTION AVIS (nouveau) ── */}
                    {isClient && rendezVous.status === 'completed' && (
                        <div style={reviewStyles.section}>
                            <h3 style={reviewStyles.sectionTitle}>
                                <FiStar style={{ color: '#f59e0b' }} />
                                Votre avis
                            </h3>

                            {hasReview ? (
                                /* Avis déjà soumis */
                                <div style={reviewStyles.existingReview}>
                                    <div style={reviewStyles.stars}>
                                        {[1,2,3,4,5].map((s) => (
                                            <span key={s} style={{ fontSize: '1.3rem', color: s <= rendezVous.review.rating ? '#f59e0b' : '#e2e8f0' }}>
                                                ★
                                            </span>
                                        ))}
                                        <span style={reviewStyles.ratingText}>{rendezVous.review.rating}/5</span>
                                    </div>
                                    {rendezVous.review.comment && (
                                        <p style={reviewStyles.comment}>"{rendezVous.review.comment}"</p>
                                    )}
                                    <div style={{ marginTop: '0.5rem' }}>
                                        {rendezVous.review.reported ? (
                                            <span style={reviewStyles.reportedBadge}>⚑ Signalement envoyé</span>
                                        ) : (
                                            <button onClick={() => setShowReportModal(true)} style={reviewStyles.reportBtn}>
                                                <FiFlag size={13} /> Signaler ce service
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Pas encore d'avis */
                                <div style={reviewStyles.noReview}>
                                    <p style={reviewStyles.noReviewText}>
                                        Ce rendez-vous est terminé. Partagez votre expérience avec ce prestataire !
                                    </p>
                                    <button onClick={() => setShowReviewModal(true)} style={reviewStyles.reviewBtn}>
                                        <FiStar size={15} /> Laisser un avis
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal annulation ── */}
            {showCancelModal && (
                <div style={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 style={styles.modalTitle}>Annuler le rendez-vous</h3>
                        <p style={styles.modalText}>Êtes-vous sûr de vouloir annuler ce rendez-vous ?</p>
                        <div style={styles.modalFormGroup}>
                            <label style={styles.modalLabel}>Raison de l'annulation (optionnelle)</label>
                            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} style={styles.modalTextarea} rows="3" placeholder="Expliquez la raison de l'annulation..." />
                        </div>
                        <div style={styles.modalActions}>
                            <button onClick={() => setShowCancelModal(false)} style={styles.modalCancelButton}>Retour</button>
                            <button onClick={handleCancel} disabled={actionLoading} style={styles.modalConfirmButton}>
                                {actionLoading ? <div style={styles.buttonSpinner}></div> : 'Confirmer l\'annulation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modaux avis / signalement ── */}
            {showReviewModal && (
                <ReviewModal
                    rendezVous={rendezVous}
                    onClose={() => setShowReviewModal(false)}
                    onSuccess={() => { setShowReviewModal(false); fetchRendezVous(); }}
                />
            )}
            {showReportModal && (
                <ReportModal
                    rendezVous={rendezVous}
                    onClose={() => setShowReportModal(false)}
                    onSuccess={() => { setShowReportModal(false); fetchRendezVous(); }}
                />
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

/* ── Styles section avis ── */
const reviewStyles = {
    section: {
        margin: '0 0 0 0',
        padding: '1.5rem',
        backgroundColor: '#fffbeb',
        borderTop: '1px solid #f1f5f9',
        borderRadius: '0 0 1.5rem 1.5rem',
    },
    sectionTitle: {
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem',
    },
    existingReview: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    stars: { display: 'flex', alignItems: 'center', gap: '0.125rem' },
    ratingText: { marginLeft: '0.5rem', fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' },
    comment: { color: '#475569', fontSize: '0.925rem', fontStyle: 'italic', lineHeight: 1.6, margin: '0.25rem 0 0' },
    reportedBadge: {
        display: 'inline-block', padding: '0.3rem 0.875rem',
        backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '999px',
        fontSize: '0.8rem', fontWeight: 600,
    },
    reportBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
        background: 'none', border: '1.5px solid #fcd34d', color: '#b45309',
        padding: '0.45rem 1rem', borderRadius: '999px', fontSize: '0.82rem',
        fontWeight: 600, cursor: 'pointer',
    },
    noReview: { display: 'flex', flexDirection: 'column', gap: '0.875rem', alignItems: 'flex-start' },
    noReviewText: { color: '#64748b', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 },
    reviewBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        backgroundColor: '#f59e0b', color: '#fff', border: 'none',
        padding: '0.75rem 1.5rem', borderRadius: '10px', fontSize: '0.925rem',
        fontWeight: 600, cursor: 'pointer',
    },
};

/* ── Styles principaux (identiques à l'original) ── */
const styles = {
    container:    { minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem 0' },
    header:       { maxWidth: '1000px', margin: '0 auto', padding: '0 1rem', marginBottom: '2rem' },
    backButton:   { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', transition: 'all 0.2s' },
    content:      { maxWidth: '1000px', margin: '0 auto', padding: '0 1rem' },
    mainCard:     { backgroundColor: '#fff', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' },
    cardHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '2rem', borderBottom: '1px solid #f1f5f9' },
    title:        { fontSize: '1.875rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' },
    entrepriseName: { display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.875rem' },
    keyInfoGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', padding: '2rem', borderBottom: '1px solid #f1f5f9' },
    keyInfoItem:  { display: 'flex', alignItems: 'center', gap: '1rem' },
    keyInfoIcon:  { fontSize: '1.5rem', color: '#ef4444' },
    keyInfoLabel: { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.125rem' },
    keyInfoValue: { fontSize: '1rem', fontWeight: '600', color: '#1e293b' },
    contactSection: { padding: '2rem', borderBottom: '1px solid #f1f5f9' },
    sectionTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' },
    sectionIcon:  { color: '#ef4444' },
    contactGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' },
    contactItem:  { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    contactIcon:  { fontSize: '1.25rem', color: '#94a3b8' },
    contactLabel: { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.125rem' },
    contactValue: { fontSize: '0.95rem', color: '#1e293b' },
    notesSection: { padding: '2rem', borderBottom: '1px solid #f1f5f9' },
    notesContent: { padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', fontSize: '0.95rem', color: '#475569', lineHeight: '1.6', border: '1px solid #e2e8f0' },
    detailsSection: { padding: '2rem', borderBottom: '1px solid #f1f5f9' },
    detailsGrid:  { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    detailItem:   { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' },
    detailLabel:  { fontSize: '0.875rem', color: '#64748b' },
    detailValue:  { fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' },
    actionsSection: { padding: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9' },
    confirmButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem 2rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', flex: '1', minWidth: '200px' },
    completeButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem 2rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', flex: '1', minWidth: '200px' },
    cancelButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem 2rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', flex: '1', minWidth: '200px' },
    buttonSpinner: { width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modalContent: { backgroundColor: '#fff', borderRadius: '1.5rem', padding: '2rem', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto' },
    modalTitle:   { fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem' },
    modalText:    { fontSize: '1rem', color: '#475569', marginBottom: '1.5rem' },
    modalFormGroup: { marginBottom: '1.5rem' },
    modalLabel:   { display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' },
    modalTextarea: { width: '100%', padding: '0.875rem', border: '2px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none' },
    modalActions: { display: 'flex', gap: '1rem' },
    modalCancelButton: { flex: 1, padding: '0.875rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' },
    modalConfirmButton: { flex: 1, padding: '0.875rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
    spinner:       { width: '50px', height: '50px', border: '4px solid #fee2e2', borderTop: '4px solid #ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    errorContainer: { textAlign: 'center', padding: '4rem 2rem' },
    backLink:      { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: '#ef4444', textDecoration: 'none' },
};