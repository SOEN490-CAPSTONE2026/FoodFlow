import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import RegisterType from './components/RegisterType';
import DonorRegistration from './components/DonorRegistration';
import ReceiverRegistration from './components/ReceiverRegistration';
import LoginPage from './components/LoginPage';
import TempDashboard from './components/TempDashboard';
import NavigationBar from './components/NavigationBar';
import { AuthProvider } from './contexts/AuthContext';
import { useAnalytics } from './hooks/useAnalytics';
import PrivateRoutes from './components/PrivateRoutes';

/* Dashboards */
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import DonorDashboard from './components/DonorDashboard/DonorDashboard';
import ReceiverDashboard from './components/ReceiverDashboard/ReceiverDashboard';

import SurplusForm from './components/SurplusForm';
import MyPosts from './components/MyPosts';
import PrivacyPolicy from './components/PrivacyPolicy';
import './App.css';

import { useLocation } from "react-router-dom";

function AppContent() {
  useAnalytics(); // This will track page views automatically
  const location = useLocation();

  // Hide navbar on login and registration pages
  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/donor") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/receiver");

  return (
    <div className="App">
      {!hideNavbar && <NavigationBar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterType />} />
        <Route path="/register/donor" element={<DonorRegistration />} />
        <Route path="/register/receiver" element={<ReceiverRegistration />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<TempDashboard />} />

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
        <Route path="/dashboard/admin/*" element={<Navigate to="/admin" replace />} />

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
        <Route path="/my-posts" element={<MyPosts />} />
         <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
