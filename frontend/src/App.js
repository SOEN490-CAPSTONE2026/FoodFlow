import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import RegisterType from './components/RegisterType';
import DonorRegistration from './components/DonorRegistration';
import ReceiverRegistration from './components/ReceiverRegistration';
import LoginPage from './components/LoginPage';
import TempDashboard from './components/TempDashboard';
import NavigationBar from './components/NavigationBar';
import { AuthProvider } from './contexts/AuthContext';
import { useAnalytics } from './hooks/useAnalytics';
import SurplusForm from './components/SurplusFormModal';
import Surplus from './components/surplus';
import PrivacyPolicy from './components/PrivacyPolicy'; 
import './App.css';

import { useLocation } from "react-router-dom";

function AppContent() {
  useAnalytics(); // This will track page views automatically
  const location = useLocation();

  // Hide navbar on login and registration pages
  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname.startsWith("/register");

  return (
    <div className="App">
      {!hideNavbar && <NavigationBar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterType />} />
        <Route path="/register/donor" element={<DonorRegistration />} />
        <Route path="/register/receiver" element={<ReceiverRegistration />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<TempDashboard />} />
        <Route path="/surplus/create" element={<Surplus />} />
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
