import React from 'react';
import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LandingPage from './components/LandingPage/LandingPage';
import RegisterType from './components/RegisterType';
import DonorRegistration from './components/DonorRegistration';
import ReceiverRegistration from './components/ReceiverRegistration';
import LoginPage from './components/LoginPage';
import ForgotPassword from './components/ForgotPassword';
import EmailVerification from './components/EmailVerification';
import NavigationBar from './components/NavigationBar';
import ChatWidget from './components/shared/ChatWidget';
import { AuthProvider } from './contexts/AuthContext';
import { TimezoneProvider } from './contexts/TimezoneContext';
import { useAnalytics } from './hooks/useAnalytics';
import PrivateRoutes from './components/PrivateRoutes';
import NavigationHandler from './components/NavigationHandler';

/* Dashboards */
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import DonorDashboard from './components/DonorDashboard/DonorDashboard';
import ReceiverDashboard from './components/ReceiverDashboard/ReceiverDashboard';

import SurplusForm from './components/DonorDashboard/SurplusFormModal';
import PrivacyPolicy from './components/PrivacyPolicy';
import './App.css';

import { useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import './locales/i18n';

function AppContent() {
  useAnalytics();
  const location = useLocation();
  const { i18n } = useTranslation();
  const { user } = useAuth();

  // Set document direction and lang attribute based on current language
  useEffect(() => {
    const rtlLanguages = ['ar'];
    const isRTL = rtlLanguages.includes(i18n.language);
    const dir = isRTL ? 'rtl' : 'ltr';

    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', i18n.language);
    document.body.style.direction = dir;
  }, [i18n.language]);

  // Top navbar only shown on public pages (landing, login, registration)
  // Dashboard routes (/donor, /admin, /receiver) have their own internal layouts
  // and don't need the top public navigation
  const hideNavbar =
    location.pathname === '/login' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/verify-email' ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/donor') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/receiver');

  // Show chat widget only for authenticated users
  const showChatWidget = user != null;

  return (
    <div className="App">
      <NavigationHandler />
      {!hideNavbar && <NavigationBar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterType />} />
        <Route path="/register/donor" element={<DonorRegistration />} />
        <Route path="/register/receiver" element={<ReceiverRegistration />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<EmailVerification />} />

        {/* ===== Admin Dashboard (UNPROTECTED for dev preview) ===== */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoutes allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </PrivateRoutes>
          }
        />
        {/* Back-compat redirect from old path */}
        <Route
          path="/dashboard/admin/*"
          element={<Navigate to="/admin" replace />}
        />

        {/* ===== Donor Dashboard ===== */}
        <Route
          path="/donor/*"
          element={
            <PrivateRoutes allowedRoles={['DONOR']}>
              <DonorDashboard />
            </PrivateRoutes>
          }
        />

        {/* ===== Receiver Dashboard ===== */}
        <Route
          path="/receiver/*"
          element={
            <PrivateRoutes allowedRoles={['RECEIVER']}>
              <ReceiverDashboard />
            </PrivateRoutes>
          }
        />
        <Route path="/surplus/create" element={<SurplusForm />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>

      {/* Support chat widget - shown only for authenticated users */}
      {showChatWidget && <ChatWidget />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TimezoneProvider>
        <Router>
          <AppContent />
        </Router>
      </TimezoneProvider>
    </AuthProvider>
  );
}

export default App;
