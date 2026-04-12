import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PrivacyProvider } from "./contexts/PrivacyContext";
import { NotificationProvider } from './contexts/NotificationContext'; // ← AJOUTÉ
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
import GoogleCallback from './pages/GoogleCallback';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
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

// Rendez-vous
import MesRendezVous from './pages/rendez-vous/MesRendezVous';
import DemandeRendezVous from './pages/rendez-vous/DemandeRendezVous';
import DetailsRendezVous from './pages/rendez-vous/DetailsRendezVous';
import CalendrierRendezVous from './pages/rendez-vous/CalendrierRendezVous';
import GestionRendezVous from './pages/rendez-vous/GestionRendezVous';

// Messagerie
import MessagesPage from './pages/messages/MessagesPage';
import Settings from './pages/Settings';

// Notifications
import Notifications from './pages/Notifications'; // ← AJOUTÉ

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEntreprises from './pages/admin/AdminEntreprises';
import AdminEntrepriseDetails from './pages/admin/AdminEntrepriseDetails';
import PlanAdmin from './pages/admin/AdminPlans';

// Public
import PublicEntreprises from './pages/public/PublicEntreprises';
import PublicEntrepriseDetails from './pages/public/PublicEntrepriseDetails';
import PublicServices from './pages/public/PublicServices';
import PublicServiceDetails from './pages/public/PublicServiceDetails';
import Partners from './pages/Partners';

// Abonnements (unifié)
import AbonnementsPage from './pages/prestataire/AbonnementsPage';

// Paiement
import PaiementSuccess from './components/Paiement/PaiementSuccess';
import PaiementCancel from './components/Paiement/PaiementCancel';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PrivacyProvider>
            <ModalProvider>
              <NotificationProvider> {/* ← AJOUTÉ - Entoure tout le contenu */}
                <div style={{ minHeight: '100vh' }}>
                  <Routes>
                    <Route element={<Layout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />



                      {/* Public */}
                      <Route path="/entreprises" element={<PublicEntreprises />} />
                      <Route path="/entreprises/:id" element={<PublicEntrepriseDetails />} />
                      <Route path="/services" element={<PublicServices />} />
                      <Route path="/service/:id" element={<PublicServiceDetails />} />
                      <Route path="/partenaires" element={<Partners />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />

                      {/* Entreprises */}
                      <Route path="/mes-entreprises" element={<ProtectedRoute><MesEntreprises /></ProtectedRoute>} />
                      <Route path="/entreprises/creer" element={<ProtectedRoute><CreerEntreprise /></ProtectedRoute>} />
                      <Route path="/entreprises/:id" element={<ProtectedRoute><DetailsEntreprise /></ProtectedRoute>} />
                      <Route path="/entreprises/:id/edit" element={<ProtectedRoute><EditEntreprise /></ProtectedRoute>} />

                      {/* Services */}
                      <Route path="/mes-services" element={<ProtectedRoute><MesServices /></ProtectedRoute>} />
                      <Route path="/services/creer" element={<ProtectedRoute><CreerService /></ProtectedRoute>} />
                      <Route path="/services/:id" element={<ProtectedRoute><DetailsService /></ProtectedRoute>} />
                      <Route path="/services/modifier/:id" element={<ProtectedRoute><ModifierService /></ProtectedRoute>} />

                      {/* Rendez-vous */}
                      <Route path="/mes-rendez-vous" element={<ProtectedRoute><MesRendezVous /></ProtectedRoute>} />
                      <Route path="/rendez-vous/demande/:serviceId" element={<ProtectedRoute><DemandeRendezVous /></ProtectedRoute>} />
                      <Route path="/rendez-vous/:id" element={<ProtectedRoute><DetailsRendezVous /></ProtectedRoute>} />
                      <Route path="/rendez-vous/calendrier" element={<ProtectedRoute><CalendrierRendezVous /></ProtectedRoute>} />
                      <Route path="/rendez-vous/gestion" element={<ProtectedRoute><GestionRendezVous /></ProtectedRoute>} />

                      {/* Messagerie */}
                      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                    
                      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

                      {/* Admin */}
                      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                      <Route path="/admin/entreprises" element={<AdminRoute><AdminEntreprises /></AdminRoute>} />
                      <Route path="/admin/entreprises/:id" element={<AdminRoute><AdminEntrepriseDetails /></AdminRoute>} />
                      <Route path="/admin/plans" element={<AdminRoute><PlanAdmin /></AdminRoute>} />

                      
                      {/* Abonnements - UNIFIÉ */}
                      <Route path="/abonnements" element={<ProtectedRoute><AbonnementsPage /></ProtectedRoute>} />
                      
                      {/* Redirection de l'ancien chemin /plans */}
                      <Route path="/plans" element={<Navigate to="/abonnements?tab=plans" replace />} />
                    </Route>

                    {/* Routes sans Layout */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/password-reset/:token" element={<ResetPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/auth/google/callback" element={<GoogleCallback />} />
                    <Route path="/paiement/success" element={<PaiementSuccess />} />
                    <Route path="/paiement/cancel" element={<PaiementCancel />} />
                  </Routes>
                  <AIChatWidget />
                </div>
              </NotificationProvider> {/* ← FERMETURE DU PROVIDER */}
            </ModalProvider>
          </PrivacyProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;