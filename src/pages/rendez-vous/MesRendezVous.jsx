// src/pages/rendez-vous/MesRendezVous.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rendezVousApi } from '../../api/rendezVousApi';
import { useAuth } from '../../contexts/AuthContext';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    FiCalendar,
    FiClock,
    FiUser,
    FiCheckCircle,
    FiXCircle,
    FiAlertCircle,
    FiEye,
    FiRefreshCw,
    FiFilter
} from 'react-icons/fi';
import {
    MdBusiness,
    MdOutlineWork,
    MdOutlineSchedule,
    MdOutlineCheckCircle,
    MdOutlineCancel,
    MdOutlinePending,
    MdOutlineEvent
} from 'react-icons/md';

const statusConfig = {
    pending: {
        label: 'En attente',
        color: '#f59e0b',
        bgColor: '#fffbeb',
        icon: MdOutlinePending,
        borderColor: '#fcd34d'
    },
    confirmed: {
        label: 'Confirmé',
        color: '#10b981',
        bgColor: '#f0fdf4',
        icon: MdOutlineCheckCircle,
        borderColor: '#a7f3d0'
    },
    cancelled: {
        label: 'Annulé',
        color: '#ef4444',
        bgColor: '#fef2f2',
        icon: MdOutlineCancel,
        borderColor: '#fecaca'
    },
    completed: {
        label: 'Terminé',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        icon: FiCheckCircle,
        borderColor: '#d1d5db'
    }
};

export default function MesRendezVous() {
    const { user } = useAuth();
    const [rendezVous, setRendezVous] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [stats, setStats] = useState({
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        completed: 0
    });

    // CORRECTION: Déterminer si l'utilisateur est prestataire
    // Selon votre structure, isProvider pourrait être une propriété de l'objet user
    const isPrestataire = user?.isProvider || user?.role === 'prestataire' || user?.is_prestataire === true;

    useEffect(() => {
        fetchRendezVous();
    }, []);

    const fetchRendezVous = async () => {
        try {
            setLoading(true);
            const response = await rendezVousApi.getMesRendezVous();
            const data = response.data;
            setRendezVous(data);
            
            // Calculer les stats
            const newStats = {
                pending: data.filter(r => r.status === 'pending').length,
                confirmed: data.filter(r => r.status === 'confirmed').length,
                cancelled: data.filter(r => r.status === 'cancelled').length,
                completed: data.filter(r => r.status === 'completed').length
            };
            setStats(newStats);
        } catch (err) {
            setError('Erreur lors du chargement des rendez-vous');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (id) => {
        try {
            await rendezVousApi.confirmRendezVous(id);
            await fetchRendezVous();
        } catch (err) {
            setError('Erreur lors de la confirmation');
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Voulez-vous vraiment annuler ce rendez-vous ?')) return;
        
        try {
            await rendezVousApi.cancelRendezVous(id);
            await fetchRendezVous();
        } catch (err) {
            setError('Erreur lors de l\'annulation');
        }
    };

    const getStatusBadge = (status) => {
        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;
        
        return (
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                backgroundColor: config.bgColor,
                color: config.color,
                borderRadius: '2rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                border: `1px solid ${config.borderColor}`
            }}>
                <Icon size={12} />
                {config.label}
            </div>
        );
    };

    const getFormattedDate = (date) => {
        const dateObj = new Date(date);
        if (isToday(dateObj)) return "Aujourd'hui";
        if (isTomorrow(dateObj)) return "Demain";
        return format(dateObj, 'dd MMM yyyy', { locale: fr });
    };

    const filteredRendezVous = rendezVous.filter(r => {
        if (filter === 'all') return true;
        return r.status === filter;
    });

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Chargement de vos rendez-vous...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>
                        <FiCalendar style={styles.titleIcon} />
                        Mes Rendez-vous
                    </h1>
                    <p style={styles.subtitle}>
                        {isPrestataire  // ← CORRECTION: Utilisation de isPrestataire au lieu de user?.isPrestataire()
                            ? "Gérez les rendez-vous demandés pour vos services"
                            : "Suivez l'état de vos demandes de rendez-vous"
                        }
                    </p>
                </div>
                <button 
                    onClick={fetchRendezVous}
                    style={styles.refreshButton}
                    disabled={loading}
                >
                    <FiRefreshCw style={loading ? styles.refreshing : {}} />
                    Rafraîchir
                </button>
                    <Link 
                        to="/rendez-vous/calendrier" 
                        style={{
                            ...styles.tab,
                            ...(location.pathname === '/rendez-vous/calendrier' ? styles.tabActive : {})
                        }}
                    >
                        <FiCalendar style={styles.tabIcon} />
                        Calendrier
                    </Link>
                    {isPrestataire && (
                        <Link 
                            to="/rendez-vous/gestion" 
                            style={{
                                ...styles.tab,
                                ...(location.pathname === '/rendez-vous/gestion' ? styles.tabActive : {})
                            }}
                        >
                            <FiCalendar style={styles.tabIcon} />
                            Gestion
                        </Link>
                    )}
            </div>

            {/* Statistiques */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#fffbeb', color: '#f59e0b' }}>
                        <MdOutlinePending />
                    </div>
                    <div>
                        <div style={styles.statNumber}>{stats.pending}</div>
                        <div style={styles.statLabel}>En attente</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#f0fdf4', color: '#10b981' }}>
                        <MdOutlineCheckCircle />
                    </div>
                    <div>
                        <div style={styles.statNumber}>{stats.confirmed}</div>
                        <div style={styles.statLabel}>Confirmés</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#fef2f2', color: '#ef4444' }}>
                        <MdOutlineCancel />
                    </div>
                    <div>
                        <div style={styles.statNumber}>{stats.cancelled}</div>
                        <div style={styles.statLabel}>Annulés</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <div style={styles.statNumber}>{stats.completed}</div>
                        <div style={styles.statLabel}>Terminés</div>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div style={styles.filterBar}>
                <div style={styles.filterGroup}>
                    <FiFilter style={styles.filterIcon} />
                    <button
                        onClick={() => setFilter('all')}
                        style={{
                            ...styles.filterButton,
                            ...(filter === 'all' ? styles.filterButtonActive : {})
                        }}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        style={{
                            ...styles.filterButton,
                            ...(filter === 'pending' ? styles.filterButtonActive : {})
                        }}
                    >
                        En attente
                    </button>
                    <button
                        onClick={() => setFilter('confirmed')}
                        style={{
                            ...styles.filterButton,
                            ...(filter === 'confirmed' ? styles.filterButtonActive : {})
                        }}
                    >
                        Confirmés
                    </button>
                </div>
            </div>

            {error && (
                <div style={styles.error}>
                    <FiAlertCircle />
                    <span>{error}</span>
                </div>
            )}

            {/* Liste des rendez-vous */}
            {filteredRendezVous.length === 0 ? (
                <div style={styles.emptyState}>
                    <MdOutlineEvent size={48} color="#94a3b8" />
                    <h3>Aucun rendez-vous trouvé</h3>
                    <p>
                        {filter !== 'all' 
                            ? `Aucun rendez-vous ${statusConfig[filter]?.label.toLowerCase()}`
                            : "Vous n'avez pas encore de rendez-vous"
                        }
                    </p>
                </div>
            ) : (
                <div style={styles.rendezVousList}>
                    {filteredRendezVous.map((rdv) => (
                        <div key={rdv.id} style={styles.rendezVousCard}>
                            <div style={styles.cardHeader}>
                                <div style={styles.serviceInfo}>
                                    <h3 style={styles.serviceName}>{rdv.service?.name}</h3>
                                    <div style={styles.entrepriseInfo}>
                                        <MdBusiness size={14} />
                                        <span>{rdv.entreprise?.name}</span>
                                    </div>
                                </div>
                                {getStatusBadge(rdv.status)}
                            </div>

                            <div style={styles.cardBody}>
                                <div style={styles.infoGrid}>
                                    <div style={styles.infoItem}>
                                        <FiCalendar style={styles.infoIcon} />
                                        <div>
                                            <div style={styles.infoLabel}>Date</div>
                                            <div style={styles.infoValue}>
                                                {getFormattedDate(rdv.date)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <FiClock style={styles.infoIcon} />
                                        <div>
                                            <div style={styles.infoLabel}>Horaire</div>
                                            <div style={styles.infoValue}>
                                                {rdv.start_time} - {rdv.end_time}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <FiUser style={styles.infoIcon} />
                                        <div>
                                            <div style={styles.infoLabel}>
                                                {isPrestataire ? 'Client' : 'Prestataire'}  {/* ← CORRECTION */}
                                            </div>
                                            <div style={styles.infoValue}>
                                                {isPrestataire 
                                                    ? rdv.client?.name 
                                                    : rdv.prestataire?.name
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {rdv.client_notes && (
                                    <div style={styles.notes}>
                                        <strong>Note :</strong> {rdv.client_notes}
                                    </div>
                                )}
                            </div>

                            <div style={styles.cardFooter}>
                                <Link 
                                    to={`/rendez-vous/${rdv.id}`}
                                    style={styles.viewButton}
                                >
                                    <FiEye size={16} />
                                    Voir détails
                                </Link>
                                
                                {rdv.status === 'pending' && isPrestataire && ( 
                                    <div style={styles.actionButtons}>
                                        <button
                                            onClick={() => handleConfirm(rdv.id)}
                                            style={styles.confirmButton}
                                        >
                                            <FiCheckCircle />
                                            Confirmer
                                        </button>
                                        <button
                                            onClick={() => handleCancel(rdv.id)}
                                            style={styles.cancelButton}
                                        >
                                            <FiXCircle />
                                            Refuser
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '2rem',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '0.5rem',
    },
    titleIcon: {
        color: '#ef4444',
        fontSize: '2rem',
    },
    subtitle: {
        color: '#64748b',
        fontSize: '1rem',
    },
    refreshButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1.25rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        color: '#475569',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#f8fafc',
            borderColor: '#94a3b8',
        },
    },
    refreshing: {
        animation: 'spin 1s linear infinite',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
    },
    statCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.25rem',
        backgroundColor: '#fff',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
    },
    statIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48px',
        height: '48px',
        borderRadius: '0.75rem',
        fontSize: '1.5rem',
    },
    statNumber: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1e293b',
        lineHeight: '1.2',
    },
    statLabel: {
        fontSize: '0.875rem',
        color: '#64748b',
    },
    filterBar: {
        marginBottom: '2rem',
    },
    filterGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: '#fff',
        padding: '0.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        width: 'fit-content',
    },
    filterIcon: {
        color: '#64748b',
        margin: '0 0.5rem',
    },
    filterButton: {
        padding: '0.5rem 1rem',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#64748b',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    filterButtonActive: {
        backgroundColor: '#ef4444',
        color: '#fff',
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
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        backgroundColor: '#fff',
        borderRadius: '1rem',
        border: '2px dashed #e2e8f0',
    },
    rendezVousList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    rendezVousCard: {
        backgroundColor: '#fff',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        transition: 'all 0.2s',
        ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid #f1f5f9',
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.25rem',
    },
    entrepriseInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontSize: '0.875rem',
        color: '#64748b',
    },
    cardBody: {
        padding: '1.5rem',
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1rem',
    },
    infoItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    infoIcon: {
        color: '#ef4444',
        fontSize: '1.25rem',
    },
    infoLabel: {
        fontSize: '0.75rem',
        color: '#64748b',
        marginBottom: '0.125rem',
    },
    infoValue: {
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#1e293b',
    },
    notes: {
        padding: '0.75rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        color: '#475569',
        border: '1px solid #e2e8f0',
    },
    cardFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        borderTop: '1px solid #f1f5f9',
        backgroundColor: '#f8fafc',
    },
    viewButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        color: '#475569',
        fontSize: '0.875rem',
        fontWeight: '500',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#f1f5f9',
        },
    },
    actionButtons: {
        display: 'flex',
        gap: '0.5rem',
    },
    confirmButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#10b981',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#fff',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#059669',
        },
    },
    cancelButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#ef4444',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#fff',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#dc2626',
        },
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
};