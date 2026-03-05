import React from 'react';

const DAYS = [
  { id: 'monday', label: 'Lundi' },
  { id: 'tuesday', label: 'Mardi' },
  { id: 'wednesday', label: 'Mercredi' },
  { id: 'thursday', label: 'Jeudi' },
  { id: 'friday', label: 'Vendredi' },
  { id: 'saturday', label: 'Samedi' },
  { id: 'sunday', label: 'Dimanche' },
];

export default function ScheduleManager({ value = {}, onChange }) {
  const handleDayToggle = (dayId, isOpen) => {
    onChange({
      ...value,
      [dayId]: {
        is_open: isOpen,
        start: isOpen ? (value[dayId]?.start || '09:00') : null,
        end: isOpen ? (value[dayId]?.end || '18:00') : null
      }
    });
  };

  const handleTimeChange = (dayId, field, time) => {
    onChange({
      ...value,
      [dayId]: {
        ...value[dayId],
        [field]: time
      }
    });
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Horaires d'ouverture</h3>
      <div style={styles.daysContainer}>
        {DAYS.map(day => (
          <div key={day.id} style={styles.dayRow}>
            <div style={styles.dayHeader}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={value[day.id]?.is_open || false}
                  onChange={(e) => handleDayToggle(day.id, e.target.checked)}
                  style={styles.checkbox}
                />
                <span style={styles.dayName}>{day.label}</span>
              </label>
            </div>
            
            {value[day.id]?.is_open && (
              <div style={styles.timeInputs}>
                <input
                  type="time"
                  value={value[day.id]?.start || '09:00'}
                  onChange={(e) => handleTimeChange(day.id, 'start', e.target.value)}
                  style={styles.timeInput}
                />
                <span style={styles.timeSeparator}>-</span>
                <input
                  type="time"
                  value={value[day.id]?.end || '18:00'}
                  onChange={(e) => handleTimeChange(day.id, 'end', e.target.value)}
                  style={styles.timeInput}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    border: '1px solid #e2e8f0',
  },
  title: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '1.5rem',
  },
  daysContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  dayRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0',
  },
  dayHeader: {
    flex: 1,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#ef4444',
  },
  dayName: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#1e293b',
  },
  timeInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  timeInput: {
    padding: '0.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100px',
    backgroundColor: '#ffffff',
  },
  timeSeparator: {
    color: '#64748b',
    fontSize: '0.875rem',
  },
};