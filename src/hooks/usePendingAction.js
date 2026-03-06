// src/hooks/usePendingAction.js
//
// Aligné sur le pattern de Home.jsx + Login.jsx :
//   → navigate('/login', { state: { from, openContactModal: true, selectedService? } })
//   → Login redirige vers `from` avec { openContactModal, selectedService } dans le state
//   → Le composant détecte openContactModal dans location.state et ouvre le modal
//
import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function usePendingAction({ redirectPath } = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * requireAuth(callback)
   *   - Si connecté  → callback() immédiat
   *   - Sinon        → redirige /login avec openContactModal: true dans le state
   *                    (Login.jsx retransmet ce state après connexion)
   */
  const requireAuth = useCallback(
    (callback) => {
      if (user) {
        if (callback) callback();
        return;
      }
      navigate('/login', {
        state: {
          from: redirectPath || location.pathname,
          openContactModal: true,   // ← même clé que Home.jsx
        },
      });
    },
    [user, navigate, location.pathname, redirectPath]
  );

  /**
   * shouldOpenModal()
   *   Retourne true si on revient de /login avec openContactModal: true.
   *   Consomme le flag pour éviter toute ré-ouverture.
   */
  const shouldOpenModal = useCallback(() => {
    // Lire depuis location.state (React Router) ou window.history.state (fallback)
    const fromState = location.state?.openContactModal
      ?? window.history.state?.usr?.openContactModal;

    if (!fromState || !user) return false;

    // Consommer : remplacer l'état pour éviter ré-exécution au refresh
    window.history.replaceState(
      {
        ...window.history.state,
        usr: { ...(window.history.state?.usr ?? {}), openContactModal: false },
      },
      ''
    );
    return true;
  }, [user, location.state]);

  return { requireAuth, shouldOpenModal };
}