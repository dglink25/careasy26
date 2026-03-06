import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { rendezVousApi } from '../../api/rendezVousApi';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
    FiCalendar, 
    FiRefreshCw, 
    FiChevronLeft, 
    FiChevronRight,
    FiList,
    FiGrid,
    FiClock
} from 'react-icons/fi';

export default function CalendrierRendezVous() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const calendarRef = useRef(null);
    
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('timeGridWeek');
    const [error, setError] = useState('');

    const isPrestataire = user?.isProvider || user?.role === 'prestataire' || user?.is_prestataire === true;

    // Fonction pour charger les événements
    const fetchEvents = async (start, end) => {
        try {
            setLoading(true);
            setError('');
            
            const response = await rendezVousApi.getCalendarEvents(
                start.toISOString(),
                end.toISOString()
            );
            
            console.log('Événements reçus:', response.data); // Pour déboguer
            setEvents(response.data);
            
        } catch (err) {
            console.error('Erreur chargement calendrier:', err);
            setError('Impossible de charger le calendrier. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    // Charger les événements au montage
    useEffect(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        fetchEvents(start, end);
    }, []);

    const handleDatesSet = (range) => {
        fetchEvents(range.start, range.end);
    };

    const handleEventClick = (info) => {
        navigate(`/rendez-vous/${info.event.id}`);
    };

    const handleViewChange = (newView) => {
        setView(newView);
        if (calendarRef.current) {
            calendarRef.current.getApi().changeView(newView);
        }
    };

    const handlePrev = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().prev();
        }
    };

    const handleNext = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().next();
        }
    };

    const handleToday = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().today();
        }
    };

    return (
        <div style={styles.container}>
            {/* En-tête */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>
                        <FiCalendar style={styles.titleIcon} />
                        Calendrier des rendez-vous
                    </h1>
                    <p style={styles.subtitle}>
                        {isPrestataire 
                            ? "Gérez vos rendez-vous en toute simplicité"
                            : "Visualisez vos rendez-vous à venir"
                        }
                    </p>
                </div>
                
                <div style={styles.headerActions}>
                    {/* Navigation rapide */}
                    <div style={styles.navButtons}>
                        <button onClick={handlePrev} style={styles.navButton}>
                            <FiChevronLeft />
                        </button>
                        <button onClick={handleToday} style={styles.todayButton}>
                            Aujourd'hui
                        </button>
                        <button onClick={handleNext} style={styles.navButton}>
                            <FiChevronRight />
                        </button>
                    </div>

                    {/* Changement de vue */}
                    <div style={styles.viewButtons}>
                        <button
                            onClick={() => handleViewChange('timeGridDay')}
                            style={{
                                ...styles.viewButton,
                                ...(view === 'timeGridDay' ? styles.viewButtonActive : {})
                            }}
                        >
                            <FiClock />
                            Jour
                        </button>
                        <button
                            onClick={() => handleViewChange('timeGridWeek')}
                            style={{
                                ...styles.viewButton,
                                ...(view === 'timeGridWeek' ? styles.viewButtonActive : {})
                            }}
                        >
                            <FiGrid />
                            Semaine
                        </button>
                        <button
                            onClick={() => handleViewChange('dayGridMonth')}
                            style={{
                                ...styles.viewButton,
                                ...(view === 'dayGridMonth' ? styles.viewButtonActive : {})
                            }}
                        >
                            <FiCalendar />
                            Mois
                        </button>
                    </div>

                    {/* Bouton rafraîchir */}
                    <button
                        onClick={() => {
                            if (calendarRef.current) {
                                const api = calendarRef.current.getApi();
                                fetchEvents(api.view.currentStart, api.view.currentEnd);
                            }
                        }}
                        style={styles.refreshButton}
                        disabled={loading}
                    >
                        <FiRefreshCw style={loading ? styles.refreshing : {}} />
                    </button>
                </div>
            </div>

            {/* Barre d'onglets */}
            <div style={styles.tabsContainer}>
                <Link 
                    to="/mes-rendez-vous" 
                    style={{
                        ...styles.tab,
                        ...(location.pathname === '/mes-rendez-vous' ? styles.tabActive : {})
                    }}
                >
                    <FiList style={styles.tabIcon} />
                    Liste
                </Link>
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
                        <FiGrid style={styles.tabIcon} />
                        Gestion
                    </Link>
                )}
            </div>

            {/* Message d'erreur */}
            {error && (
                <div style={styles.error}>
                    <p>{error}</p>
                    <button onClick={() => {
                        if (calendarRef.current) {
                            const api = calendarRef.current.getApi();
                            fetchEvents(api.view.currentStart, api.view.currentEnd);
                        }
                    }}>
                        Réessayer
                    </button>
                </div>
            )}

            {/* Calendrier */}
            <div style={styles.calendarWrapper}>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={false}
                    initialView={view}
                    locale={frLocale}
                    events={events}
                    eventClick={handleEventClick}
                    height="auto"
                    slotDuration="00:30:00"
                    allDaySlot={false}
                    nowIndicator={true}
                    weekends={true}
                    firstDay={1}
                    slotMinTime="08:00:00"
                    slotMaxTime="20:00:00"
                    datesSet={handleDatesSet}
                    loading={(isLoading) => setLoading(isLoading)}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }}
                />
            </div>

            {/* Légende des couleurs */}
            <div style={styles.legend}>
                <div style={styles.legendItem}>
                    <div style={{...styles.legendDot, backgroundColor: '#f59e0b'}}></div>
                    <span>En attente</span>
                </div>
                <div style={styles.legendItem}>
                    <div style={{...styles.legendDot, backgroundColor: '#10b981'}}></div>
                    <span>Confirmé</span>
                </div>
                <div style={styles.legendItem}>
                    <div style={{...styles.legendDot, backgroundColor: '#6b7280'}}></div>
                    <span>Terminé</span>
                </div>
                <div style={styles.legendItem}>
                    <div style={{...styles.legendDot, backgroundColor: '#ef4444'}}></div>
                    <span>Annulé</span>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .fc {
                    font-family: inherit;
                }
                
                .fc th {
                    padding: 12px 0;
                    background-color: #f8fafc;
                    font-weight: 600;
                    color: #1e293b;
                }
                
                .fc .fc-timegrid-slot {
                    height: 40px;
                }
                
                .fc .fc-timegrid-now-indicator-line {
                    border-color: #ef4444;
                }
                
                .fc-day-today {
                    background-color: #fef2f2 !important;
                }
                
                .fc-event {
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .fc-event:hover {
                    transform: scale(1.02);
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 1rem',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
    },
    
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
    
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
    },
    
    navButtons: {
        display: 'flex',
        gap: '0.25rem',
        backgroundColor: '#fff',
        padding: '0.25rem',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
    },
    
    navButton: {
        padding: '0.625rem 1rem',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#475569',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#f1f5f9',
            color: '#ef4444',
        },
    },
    
    todayButton: {
        padding: '0.625rem 1.25rem',
        backgroundColor: '#ef4444',
        color: '#fff',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#dc2626',
        },
    },
    
    viewButtons: {
        display: 'flex',
        gap: '0.25rem',
        backgroundColor: '#fff',
        padding: '0.25rem',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
    },
    
    viewButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.625rem 1.25rem',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#64748b',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#f1f5f9',
            color: '#1e293b',
        },
    },
    
    viewButtonActive: {
        backgroundColor: '#ef4444',
        color: '#fff',
        ':hover': {
            backgroundColor: '#dc2626',
            color: '#fff',
        },
    },
    
    refreshButton: {
        padding: '0.875rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        color: '#475569',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#f1f5f9',
            borderColor: '#94a3b8',
        },
    },
    
    refreshing: {
        animation: 'spin 1s linear infinite',
    },
    
    tabsContainer: {
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '0.5rem',
    },
    
    tab: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem 0.5rem 0 0',
        color: '#64748b',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '0.95rem',
        transition: 'all 0.2s',
        borderBottom: '3px solid transparent',
        ':hover': {
            color: '#ef4444',
            backgroundColor: '#fef2f2',
        },
    },
    
    tabActive: {
        color: '#ef4444',
        borderBottom: '3px solid #ef4444',
        backgroundColor: '#fef2f2',
    },
    
    tabIcon: {
        fontSize: '1.1rem',
    },
    
    calendarWrapper: {
        backgroundColor: '#fff',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
    },
    
    error: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '0.75rem',
        color: '#ef4444',
        marginBottom: '1rem',
    },
    
    legend: {
        display: 'flex',
        gap: '2rem',
        padding: '1rem',
        backgroundColor: '#fff',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        flexWrap: 'wrap',
    },
    
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        color: '#475569',
    },
    
    legendDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
    },
};