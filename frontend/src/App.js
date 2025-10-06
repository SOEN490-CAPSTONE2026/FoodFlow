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
import './App.css';

function AppContent() {
  useAnalytics(); // This will track page views automatically

  return (
    <div className="App">
      <NavigationBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterType />} />
        <Route path="/register/donor" element={<DonorRegistration />} />
        <Route path="/register/receiver" element={<ReceiverRegistration />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<TempDashboard />} />
        <Route path="/surplus/create" element={<SurplusForm />} />
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
