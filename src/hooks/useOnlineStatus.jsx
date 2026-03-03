// src/hooks/useOnlineStatus.jsx
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import api from '../api/axios';

/**
 * Ping le backend toutes les 2 minutes SEULEMENT si :
 *  - l'utilisateur est connecté
 *  - privacy.show_online_status === true
 *
 * Quand show_online_status passe à false :
 *  - l'intervalle est arrêté immédiatement
 *  - plus aucun ping n'est envoyé
 */
export function useOnlineStatus() {
  const { user } = useAuth();
  const { privacy } = usePrivacy();
  const pingIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const sendPing = async () => {
    if (!user) return;
    try {
      await api.post('/user/update-online-status');
    } catch {
      // silencieux
    }
  };

  const handleUserActivity = () => {
    lastActivityRef.current = Date.now();
  };

  useEffect(() => {
    // Toujours nettoyer l'intervalle précédent d'abord
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Ne pas pinger si déconnecté OU si statut masqué
    if (!user || !privacy.show_online_status) return;

    // Premier ping immédiat
    sendPing();

    // Ping toutes les 2 minutes si actif dans les 5 dernières minutes
    pingIntervalRef.current = setInterval(() => {
      const inactifDepuis = Date.now() - lastActivityRef.current;
      if (inactifDepuis < 5 * 60 * 1000) {
        sendPing();
      }
    }, 2 * 60 * 1000);

    // Écouter l'activité utilisateur
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handleUserActivity));

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      events.forEach(e => window.removeEventListener(e, handleUserActivity));
    };

  // Se reconfigure instantanément quand show_online_status change
  }, [user, privacy.show_online_status]);
}