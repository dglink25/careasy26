import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import paiementApi from '../../api/paiementApi';
import theme from '../../config/theme';
import {
    FiCheckCircle,
    FiXCircle,
    FiCalendar,
    FiClock,
    FiAward,
    FiInfo,
    FiRefreshCw,
    FiEye,
    FiChevronRight
} from 'react-icons/fi';
import { MdOutlineVerified } from 'react-icons/md';

export default function MesAbonnements() {
    const navigate = useNavigate();
    const location = useLocation();
    const [abonnements, setAbonnements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAbonnement, setSelectedAbonnement] = useState(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchAbonnements();
        
        // Vérifier si on vient d'un paiement réussi
        const params = new URLSearchParams(location.search);
        if (params.get('payment') === 'success') {
            showSuccess('Paiement réussi ! Votre abonnement est actif.');
        }
    }, [location]);

    const fetchAbonnements = async () => {
        try {
            setLoading(true);
            const response = await paiementApi.getAbonnements();
            setAbonnements(response.data || []);
        } catch (err) {
            console.error('Erreur chargement abonnements:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAbonnements();
    };

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    const getStatutBadge = (abonnement) => {
        if (abonnement.est_actif) {
            return (
                <span style={styles.badgeActif}>
                    <MdOutlineVerified />
                    Actif
                </span>
            );
        } else if (abonnement.statut === 'expire') {
            return (
                <span style={styles.badgeExpire}>
                    <FiXCircle />
                    Expiré
                </span>
            );
        } else {
            return (
                <span style={styles.badgeAnnule}>
                    <FiXCircle />
                    {abonnement.statut}
                </span>
            );
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Chargement de vos abonnements...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Toast de succès */}
            {showSuccessToast && (
                <div style={styles.successToast}>
                    <FiCheckCircle style={styles.toastIcon} />
                    <span>{successMessage}</span>
                </div>
            )}

            <div style={styles.content}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>
                            <FiAward style={styles.titleIcon} />
                            Mes Abonnements
                        </h1>
                        <p style={styles.subtitle}>
                            Gérez vos abonnements et suivez leur statut
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        style={styles.refreshButton}
                        disabled={refreshing}
                    >
                        <FiRefreshCw style={refreshing ? styles.refreshingIcon : styles.refreshIcon} />
                        {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
                    </button>
                </div>

                {/* Liste des abonnements */}
                {abonnements.length === 0 ? (
                    <div style={styles.emptyState}>
                        <FiInfo style={styles.emptyStateIcon} />
                        <h3 style={styles.emptyStateTitle}>Aucun abonnement</h3>
                        <p style={styles.emptyStateText}>
                            Vous n'avez pas encore souscrit d'abonnement.
                        </p>
                        <button
                            onClick={() => navigate('/plans')}
                            style={styles.emptyStateButton}
                        >
                            Voir les plans
                        </button>
                    </div>
                ) : (
                    <div style={styles.abonnementsList}>
                        {abonnements.map((abonnement) => (
                            <div
                                key={abonnement.id}
                                style={styles.abonnementCard}
                                onClick={() => setSelectedAbonnement(abonnement)}
                            >
                                <div style={styles.cardHeader}>
                                    <div>
                                        <h3 style={styles.planName}>{abonnement.plan.name}</h3>
                                        <span style={styles.planCode}>{abonnement.plan.code}</span>
                                    </div>
                                    {getStatutBadge(abonnement)}
                                </div>

                                <div style={styles.cardBody}>
                                    <div style={styles.infoGrid}>
                                        <div style={styles.infoItem}>
                                            <FiCalendar style={styles.infoIcon} />
                                            <div>
                                                <div style={styles.infoLabel}>Début</div>
                                                <div style={styles.infoValue}>{abonnement.date_debut}</div>
                                            </div>
                                        </div>
                                        <div style={styles.infoItem}>
                                            <FiCalendar style={styles.infoIcon} />
                                            <div>
                                                <div style={styles.infoLabel}>Fin</div>
                                                <div style={styles.infoValue}>{abonnement.date_fin}</div>
                                            </div>
                                        </div>
                                        {abonnement.est_actif && (
                                            <div style={styles.infoItem}>
                                                <FiClock style={styles.infoIcon} />
                                                <div>
                                                    <div style={styles.infoLabel}>Jours restants</div>
                                                    <div style={styles.infoValue}>{abonnement.jours_restants} jours</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {abonnement.montant && (
                                        <div style={styles.montant}>
                                            Montant: <strong>{abonnement.montant}</strong>
                                        </div>
                                    )}
                                </div>

                                <div style={styles.cardFooter}>
                                    <button style={styles.viewButton}>
                                        <FiEye />
                                        Voir détails
                                        <FiChevronRight style={styles.chevron} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal de détails */}
                {selectedAbonnement && (
                    <div style={styles.modalOverlay} onClick={() => setSelectedAbonnement(null)}>
                        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setSelectedAbonnement(null)}
                                style={styles.modalClose}
                            >
                                ×
                            </button>

                            <h2 style={styles.modalTitle}>Détails de l'abonnement</h2>

                            <div style={styles.modalBody}>
                                <div style={styles.modalSection}>
                                    <h3 style={styles.modalSectionTitle}>Plan</h3>
                                    <p style={styles.modalPlanName}>{selectedAbonnement.plan.name}</p>
                                    <p style={styles.modalPlanCode}>{selectedAbonnement.plan.code}</p>
                                    {selectedAbonnement.plan.description && (
                                        <p style={styles.modalPlanDesc}>{selectedAbonnement.plan.description}</p>
                                    )}
                                </div>

                                <div style={styles.modalSection}>
                                    <h3 style={styles.modalSectionTitle}>Période</h3>
                                    <div style={styles.modalInfo}>
                                        <FiCalendar />
                                        <span>Du {selectedAbonnement.date_debut} au {selectedAbonnement.date_fin}</span>
                                    </div>
                                    {selectedAbonnement.est_actif && (
                                        <div style={styles.modalInfo}>
                                            <FiClock />
                                            <span>{selectedAbonnement.jours_restants} jours restants</span>
                                        </div>
                                    )}
                                </div>

                                {selectedAbonnement.paiement && (
                                    <div style={styles.modalSection}>
                                        <h3 style={styles.modalSectionTitle}>Paiement</h3>
                                        <div style={styles.modalInfo}>
                                            <span>Référence: {selectedAbonnement.paiement.reference}</span>
                                        </div>
                                        <div style={styles.modalInfo}>
                                            <span>Montant: {selectedAbonnement.paiement.montant}</span>
                                        </div>
                                        <div style={styles.modalInfo}>
                                            <span>Date: {selectedAbonnement.paiement.date}</span>
                                        </div>
                                    </div>
                                )}

                                <div style={styles.modalSection}>
                                    <h3 style={styles.modalSectionTitle}>Statut</h3>
                                    <div style={styles.modalStatus}>
                                        {getStatutBadge(selectedAbonnement)}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedAbonnement(null)}
                                style={styles.modalButton}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
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
        position: 'relative'
    },
    content: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 1.5rem'
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem'
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: `4px solid ${theme.colors.primaryLight}`,
        borderTop: `4px solid ${theme.colors.primary}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    loadingText: {
        color: '#64748b',
        fontSize: '1.125rem'
    },
    successToast: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#10b981',
        color: '#fff',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        zIndex: 10000,
        animation: 'slideInRight 0.3s ease'
    },
    toastIcon: {
        fontSize: '1.25rem'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
    },
    title: {
        fontSize: '2rem',
        fontWeight: '700',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.5rem'
    },
    titleIcon: {
        fontSize: '2rem',
        color: theme.colors.primary
    },
    subtitle: {
        color: '#64748b',
        fontSize: '1rem'
    },
    refreshButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.25rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        color: '#475569',
        fontSize: '0.95rem',
        fontWeight: '500',
        cursor: 'pointer'
    },
    refreshIcon: {
        fontSize: '1rem'
    },
    refreshingIcon: {
        fontSize: '1rem',
        animation: 'spin 1s linear infinite'
    },
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        backgroundColor: '#fff',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0'
    },
    emptyStateIcon: {
        fontSize: '4rem',
        color: '#94a3b8',
        marginBottom: '1rem'
    },
    emptyStateTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.5rem'
    },
    emptyStateText: {
        color: '#64748b',
        fontSize: '1rem',
        marginBottom: '1.5rem'
    },
    emptyStateButton: {
        padding: '0.75rem 2rem',
        backgroundColor: theme.colors.primary,
        color: '#fff',
        border: 'none',
        borderRadius: '0.75rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer'
    },
    abonnementsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    abonnementCard: {
        backgroundColor: '#fff',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0'
    },
    planName: {
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.25rem'
    },
    planCode: {
        fontSize: '0.875rem',
        color: '#64748b'
    },
    badgeActif: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.75rem',
        backgroundColor: '#d1fae5',
        color: '#059669',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500'
    },
    badgeExpire: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.75rem',
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500'
    },
    badgeAnnule: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.75rem',
        backgroundColor: '#fef3c7',
        color: '#d97706',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500'
    },
    cardBody: {
        marginBottom: '1rem'
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem'
    },
    infoItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    infoIcon: {
        fontSize: '1.25rem',
        color: theme.colors.primary
    },
    infoLabel: {
        fontSize: '0.75rem',
        color: '#64748b'
    },
    infoValue: {
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#1e293b'
    },
    montant: {
        fontSize: '0.875rem',
        color: '#475569'
    },
    cardFooter: {
        borderTop: '1px solid #e2e8f0',
        paddingTop: '1rem'
    },
    viewButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'none',
        border: 'none',
        color: theme.colors.primary,
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        width: '100%',
        justifyContent: 'center'
    },
    chevron: {
        fontSize: '1rem'
    },
    modalOverlay: {
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
        backdropFilter: 'blur(4px)',
        padding: '1rem'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: '1rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '2rem',
        position: 'relative'
    },
    modalClose: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'none',
        border: 'none',
        fontSize: '2rem',
        color: '#64748b',
        cursor: 'pointer',
        lineHeight: 1
    },
    modalTitle: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '2rem',
        paddingRight: '2rem'
    },
    modalBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        marginBottom: '2rem'
    },
    modalSection: {
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.75rem'
    },
    modalSectionTitle: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '1rem'
    },
    modalPlanName: {
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.25rem'
    },
    modalPlanCode: {
        fontSize: '0.875rem',
        color: '#64748b',
        marginBottom: '0.5rem'
    },
    modalPlanDesc: {
        fontSize: '0.875rem',
        color: '#475569',
        lineHeight: '1.6'
    },
    modalInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.95rem',
        color: '#475569',
        marginBottom: '0.5rem'
    },
    modalStatus: {
        marginTop: '0.5rem'
    },
    modalButton: {
        width: '100%',
        padding: '1rem',
        backgroundColor: theme.colors.primary,
        color: '#fff',
        border: 'none',
        borderRadius: '0.75rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer'
    }
};