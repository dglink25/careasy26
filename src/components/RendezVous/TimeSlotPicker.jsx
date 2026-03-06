// src/components/RendezVous/TimeSlotPicker.jsx
import { useState, useEffect } from 'react';
import { rendezVousApi } from '../../api/rendezVousApi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FiClock, FiCalendar, FiAlertCircle } from 'react-icons/fi';

export default function TimeSlotPicker({ serviceId, selectedDate, onSlotSelect }) {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);

    useEffect(() => {
        if (selectedDate && serviceId) {
            fetchAvailableSlots();
        }
    }, [selectedDate, serviceId]);

    const fetchAvailableSlots = async () => {
        try {
            setLoading(true);
            setError('');
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            const response = await rendezVousApi.getAvailableSlots(serviceId, formattedDate);
            setSlots(response.data.slots || []);
        } catch (err) {
            setError('Impossible de charger les créneaux disponibles');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = (slot) => {
        setSelectedSlot(slot);
        onSlotSelect({
            date: selectedDate,
            start_time: slot.start,
            end_time: slot.end
        });
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Chargement des créneaux...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <FiAlertCircle size={24} color="#ef4444" />
                <p>{error}</p>
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <div style={styles.emptyContainer}>
                <FiClock size={32} color="#94a3b8" />
                <p>Aucun créneau disponible pour cette date</p>
                <p style={styles.emptySubtext}>
                    Veuillez sélectionner une autre date
                </p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>
                <FiCalendar style={styles.titleIcon} />
                Créneaux disponibles
            </h3>
            
            <div style={styles.slotsGrid}>
                {slots.map((slot, index) => (
                    <button
                        key={index}
                        onClick={() => handleSlotClick(slot)}
                        style={{
                            ...styles.slotButton,
                            ...(selectedSlot === slot ? styles.slotButtonSelected : {})
                        }}
                    >
                        <FiClock style={styles.slotIcon} />
                        {slot.display}
                    </button>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '1.5rem',
        backgroundColor: '#fff',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
        marginBottom: '1.5rem',
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '1.5rem',
    },
    titleIcon: {
        color: '#ef4444',
    },
    slotsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '0.75rem',
    },
    slotButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.875rem',
        backgroundColor: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '0.75rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#475569',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#f1f5f9',
            borderColor: '#94a3b8',
            transform: 'translateY(-2px)',
        },
    },
    slotButtonSelected: {
        backgroundColor: '#fee2e2',
        borderColor: '#ef4444',
        color: '#ef4444',
    },
    slotIcon: {
        fontSize: '0.875rem',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        padding: '3rem',
        backgroundColor: '#fff',
        borderRadius: '1rem',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid #fee2e2',
        borderTop: '3px solid #ef4444',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    errorContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.5rem',
        backgroundColor: '#fef2f2',
        borderRadius: '1rem',
        color: '#ef4444',
    },
    emptyContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        padding: '3rem',
        backgroundColor: '#fff',
        borderRadius: '1rem',
        textAlign: 'center',
        color: '#64748b',
    },
    emptySubtext: {
        fontSize: '0.875rem',
        color: '#94a3b8',
    },
};