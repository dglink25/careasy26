// src/pages/rendez-vous/GestionRendezVous.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rendezVousApi } from '../../api/rendezVousApi';
import { format, isToday, isTomorrow } from 'date-fns';
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
    FiFilter,
    FiSearch
} from 'react-icons/fi';
import {
    MdBusiness,
    MdOutlineWork,
    MdOutlinePending,
    MdOutlineCheckCircle,
    MdOutlineCancel,
    MdOutlineEvent
} from 'react-icons/md';

export default function GestionRendezVous() {
    const [rendezVous, setRendezVous] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        today: 0,
        tomorrow: 0
    });

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
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
            
            setStats({
                total: data.length,
                pending: data.filter(r => r.status === 'pending').length,
                confirmed: data.filter(r => r.status === 'confirmed').length,
                today: data.filter(r => r.date === today).length,
                tomorrow: data.filter(r => r.date === tomorrow).length
            });
        } catch (err) {
            setError('Erreur lors du chargement');
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

    const filteredRendezVous = rendezVous.filter(rdv => {
        if (filter !== 'all' && rdv.status !== filter) return false;
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                rdv.service?.name.toLowerCase().includes(searchLower) ||
                rdv.client?.name.toLowerCase().includes(searchLower) ||
                rdv.entreprise?.name.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const getStatusBadge = (status) => {
        const config = {
            pending: { bg: '#fffbeb', color: '#f59e0b', text: 'En attente' },
            confirmed: { bg: '#f0fdf4', color: '#10b981', text: 'Confirmé' },
            cancelled: { bg: '#fef2f2', color: '#ef4444', text: 'Annulé' },
            completed: { bg: '#f3f4f6', color: '#6b7280', text: 'Terminé' }
        };
        const conf = config[status] || config.pending;
        
        return (
            <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                backgroundColor: conf.bg,
                color: conf.color,
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                border: `1px solid ${conf.color}20`,
            }}>
                {conf.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Chargement...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>
                    <MdOutlineEvent style={styles.titleIcon} />
                    Gestion des rendez-vous
                </h1>
                <button onClick={fetchRendezVous} style={styles.refreshButton}>
                    <FiRefreshCw />
                    Rafraîchir
                </button>
            </div>

            {/* Stats rapides */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{stats.today}</div>
                    <div style={styles.statLabel}>Aujourd'hui</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{stats.tomorrow}</div>
                    <div style={styles.statLabel}>Demain</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{stats.pending}</div>
                    <div style={styles.statLabel}>En attente</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{stats.confirmed}</div>
                    <div style={styles.statLabel}>Confirmés</div>
                </div>
            </div>

            {/* Filtres et recherche */}
            <div style={styles.filterBar}>
                <div style={styles.searchBox}>
                    <FiSearch style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                <div style={styles.filterGroup}>
                    <FiFilter style={styles.filterIcon} />
                    <button
                        onClick={() => setFilter('all')}
                        style={{
                            ...styles.filterButton,
                            ...(filter === 'all' && styles.filterButtonActive)
                        }}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        style={{
                            ...styles.filterButton,
                            ...(filter === 'pending' && styles.filterButtonActive)
                        }}
                    >
                        En attente
                    </button>
                    <button
                        onClick={() => setFilter('confirmed')}
                        style={{
                            ...styles.filterButton,
                            ...(filter === 'confirmed' && styles.filterButtonActive)
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
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Horaire</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRendezVous.map((rdv) => (
                            <tr key={rdv.id}>
                                <td>
                                    <div style={styles.serviceCell}>
                                        <div style={styles.serviceName}>{rdv.service?.name}</div>
                                        <div style={styles.entrepriseName}>{rdv.entreprise?.name}</div>
                                    </div>
                                </td>
                                <td>{rdv.client?.name}</td>
                                <td>{format(new Date(rdv.date), 'dd/MM/yyyy')}</td>
                                <td>{rdv.start_time} - {rdv.end_time}</td>
                                <td>{getStatusBadge(rdv.status)}</td>
                                <td>
                                    <div style={styles.actionButtons}>
                                        <Link
                                            to={`/rendez-vous/${rdv.id}`}
                                            style={styles.viewButton}
                                            title="Voir détails"
                                        >
                                            <FiEye />
                                        </Link>
                                        {rdv.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleConfirm(rdv.id)}
                                                    style={styles.confirmButton}
                                                    title="Confirmer"
                                                >
                                                    <FiCheckCircle />
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(rdv.id)}
                                                    style={styles.cancelButton}
                                                    title="Annuler"
                                                >
                                                    <FiXCircle />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredRendezVous.length === 0 && (
                    <div style={styles.emptyState}>
                        <p>Aucun rendez-vous trouvé</p>
                    </div>
                )}
            </div>
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
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '2rem',
        fontWeight: '700',
        color: '#1e293b',
    },
    titleIcon: {
        color: '#ef4444',
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
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#f8fafc',
        },
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
    },
    statCard: {
        backgroundColor: '#fff',
        padding: '1.25rem',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
        textAlign: 'center',
    },
    statNumber: {
        fontSize: '2rem',
        fontWeight: '700',
        color: '#ef4444',
        lineHeight: '1.2',
        marginBottom: '0.25rem',
    },
    statLabel: {
        fontSize: '0.875rem',
        color: '#64748b',
    },
    filterBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        gap: '1rem',
        flexWrap: 'wrap',
    },
    searchBox: {
        position: 'relative',
        flex: 1,
        minWidth: '250px',
    },
    searchIcon: {
        position: 'absolute',
        left: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#94a3b8',
    },
    searchInput: {
        width: '100%',
        padding: '0.75rem 1rem 0.75rem 2.5rem',
        border: '2px solid #e2e8f0',
        borderRadius: '0.75rem',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'all 0.2s',
        ':focus': {
            borderColor: '#ef4444',
        },
    },
    filterGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: '#fff',
        padding: '0.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
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
    tableContainer: {
        backgroundColor: '#fff',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    serviceCell: {
        display: 'flex',
        flexDirection: 'column',
    },
    serviceName: {
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.25rem',
    },
    entrepriseName: {
        fontSize: '0.75rem',
        color: '#64748b',
    },
    actionButtons: {
        display: 'flex',
        gap: '0.5rem',
    },
    viewButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        backgroundColor: '#3b82f6',
        color: '#fff',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#2563eb',
            transform: 'scale(1.1)',
        },
    },
    confirmButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        backgroundColor: '#10b981',
        color: '#fff',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#059669',
            transform: 'scale(1.1)',
        },
    },
    cancelButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        backgroundColor: '#ef4444',
        color: '#fff',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#dc2626',
            transform: 'scale(1.1)',
        },
    },
    emptyState: {
        padding: '3rem',
        textAlign: 'center',
        color: '#64748b',
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