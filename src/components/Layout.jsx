// careasy-frontend/src/components/Layout.jsx - AVEC FOOTER
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function Layout() {
  useOnlineStatus();
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}