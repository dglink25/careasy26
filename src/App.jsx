// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PrivacyProvider } from './contexts/PrivacyContext';   // ← NOUVEAU
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import { ModalProvider } from './contexts/ModalContext';
import FAQ from './pages/FAQ';

import AIChatWidget from './components/Chat/AIChatWidget';

// Entreprises
import MesEntreprises from './pages/entreprises/MesEntreprises';
import CreerEntreprise from './pages/entreprises/CreerEntreprise';
import DetailsEntreprise from './pages/entreprises/DetailsEntreprise';
import EditEntreprise from './pages/entreprises/EditEntreprise';

// Services
import MesServices from './pages/services/MesServices';
import CreerService from './pages/services/CreerService';
import DetailsService from './pages/services/DetailsService';
import ModifierService from './pages/services/ModifierService';

// Messagerie
import MessagesPage from './pages/messages/MessagesPage';
import Settings from './pages/Settings';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEntreprises from './pages/admin/AdminEntreprises';
import AdminEntrepriseDetails from './pages/admin/AdminEntrepriseDetails';

// Public
import PublicEntreprises from './pages/public/PublicEntreprises';
import PublicEntrepriseDetails from './pages/public/PublicEntrepriseDetails';
import PublicServices from './pages/public/PublicServices';
import PublicServiceDetails from './pages/public/PublicServiceDetails';
import Partners from './pages/Partners';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PrivacyProvider>          {/* ← NOUVEAU : juste après AuthProvider */}
            <ModalProvider>
              <div style={{ minHeight: '100vh' }}>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                    {/* Entreprises */}
                    <Route path="/mes-entreprises" element={<ProtectedRoute><MesEntreprises /></ProtectedRoute>} />
                    <Route path="/entreprises/creer" element={<ProtectedRoute><CreerEntreprise /></ProtectedRoute>} />
                    <Route path="/entreprises/:id/edit" element={<ProtectedRoute><EditEntreprise /></ProtectedRoute>} />

                    {/* Services */}
                    <Route path="/mes-services" element={<ProtectedRoute><MesServices /></ProtectedRoute>} />
                    <Route path="/services/creer" element={<ProtectedRoute><CreerService /></ProtectedRoute>} />
                    <Route path="/services/:id" element={<ProtectedRoute><DetailsService /></ProtectedRoute>} />
                    <Route path="/services/modifier/:id" element={<ProtectedRoute><ModifierService /></ProtectedRoute>} />

                    {/* Messagerie */}
                    <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                    {/* Admin */}
                    <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/admin/entreprises" element={<AdminRoute><AdminEntreprises /></AdminRoute>} />
                    <Route path="/admin/entreprises/:id" element={<AdminRoute><AdminEntrepriseDetails /></AdminRoute>} />

                    {/* Public */}
                    <Route path="/entreprises" element={<PublicEntreprises />} />
                    <Route path="/entreprises/:id" element={<PublicEntrepriseDetails />} />
                    <Route path="/services" element={<PublicServices />} />
                    <Route path="/service/:id" element={<PublicServiceDetails />} />
                    <Route path="/partenaires" element={<Partners />} />
                    <Route path="/faq" element={<FAQ />} />
                  </Route>

                  {/* Sans Navbar */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/password-reset/:token" element={<ResetPassword />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                </Routes>
                <AIChatWidget />
              </div>
            </ModalProvider>
          </PrivacyProvider>          {/* ← FERMETURE du PrivacyProvider */}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;