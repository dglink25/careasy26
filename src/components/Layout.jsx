// src/components/Layout.jsx
import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';

// ✅ NavigationBridge ICI — à l'intérieur d'une <Route>, donc useNavigate() fonctionne
function NavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    // Injecter navigate dans window — accessible partout (axios interceptor, toasts, etc.)
    window.__careasyNavigate = navigate;
    console.log('[Nav] ✅ window.__careasyNavigate prêt');

    const handler = (e) => {
      if (e.detail?.url) navigate(e.detail.url);
    };
    window.addEventListener('careasy:navigate', handler);
    return () => {
      window.removeEventListener('careasy:navigate', handler);
    };
  }, [navigate]);

  return null;
}

export default function Layout() {
  useRealtimeNotifications();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const isLocalhost = ['localhost', '127.0.0.1', '::1']
      .includes(window.location.hostname);
    if (isLocalhost) return;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => console.log('[SW] ✅ Enregistré:', reg.scope))
      .catch(err => console.warn('[SW] Erreur:', err.message));
  }, []);

  return (
    <>
      {/* ✅ NavigationBridge monté DANS une Route — useNavigate() fonctionne */}
      <NavigationBridge />
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
}