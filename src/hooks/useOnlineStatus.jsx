// src/hooks/useOnlineStatus.jsx
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

/**
 * Hook pour gérer le statut en ligne automatiquement
 * - Ping toutes les 2 minutes quand l'utilisateur est actif
 * - Détecte l'activité (souris, clavier, scroll)
 * - Se désactive automatiquement à la déconnexion
 */
export function useOnlineStatus() {
  const { user } = useAuth();
  const pingIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Fonction pour envoyer le ping au backend
  const updateOnlineStatus = async () => {
    if (!user) return;

    try {
      await api.post('/user/update-online-status');
      console.log('✅ Statut en ligne mis à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
    }
  };

  // Détecter l'activité utilisateur
  const handleUserActivity = () => {
    lastActivityRef.current = Date.now();
  };

  useEffect(() => {
    if (!user) {
      // Nettoyer si déconnecté
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      return;
    }

    // Premier ping immédiat
    updateOnlineStatus();

    // Ping toutes les 2 minutes
    pingIntervalRef.current = setInterval(() => {
      // Vérifier si l'utilisateur a été actif dans les 5 dernières minutes
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity < 5 * 60 * 1000) { // 5 minutes
        updateOnlineStatus();
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Écouter les événements d'activité
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    // Ping avant fermeture de page
    const handleBeforeUnload = () => {
      // Note: Les requêtes async ne marchent pas toujours ici
      // On pourrait utiliser navigator.sendBeacon si nécessaire
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  return null; // Ce hook n'a pas besoin de retourner quoi que ce soit
}