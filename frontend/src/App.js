import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import RegisterType from './components/RegisterType';
import DonorRegistration from './components/DonorRegistration';
import ReceiverRegistration from './components/ReceiverRegistration';
import LoginPage from './components/LoginPage';
import TempDashboard from './components/TempDashboard';
//import NavigationBar from './components/NavigationBar';
import { AuthProvider } from './contexts/AuthContext';
import { useAnalytics } from './hooks/useAnalytics';
import AdminDashboard from './components/AdminDashboard';
import DonorDashboard from './components/DonorDashboard/DonorDashboard';
import PrivateRoutes from './components/PrivateRoutes';

// For the receiver dashboard 
import ReceiverLayout from './components/ReceiverDashboard/ReceiverLayout';
import ReceiverDashboardHome from './components/ReceiverDashboard/ReceiverDashboardHome';
import ReceiverBrowse from './components/ReceiverDashboard/ReceiverBrowse';
import ReceiverRequests from './components/ReceiverDashboard/ReceiverRequests';
import ReceiverSearch from './components/ReceiverDashboard/ReceiverSearch';

import './App.css';

function AppContent() {
  useAnalytics(); // This will track page views automatically

  return (
    <div className="App">
      {/* <NavigationBar /> */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterType />} />
        <Route path="/register/donor" element={<DonorRegistration />} />
        <Route path="/register/receiver" element={<ReceiverRegistration />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<TempDashboard />} />
        
        {/* Admin Dashboard */}
        <Route
          path="/dashboard/admin"
          element={
            <PrivateRoutes allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </PrivateRoutes>
          }
        />
        
        {/* Donor Dashboard */}
        <Route
          path="/dashboard/donor/*"
          element={
            <PrivateRoutes allowedRoles={['DONOR']}>
              <DonorDashboard />
            </PrivateRoutes>
          }
        />

        {/* Receiver Dashboard */}
        <Route
          path="/dashboard/receiver/*"
          element={
            <PrivateRoutes allowedRoles={['RECEIVER']}>
              <ReceiverLayout />
            </PrivateRoutes>
          }
        >
          <Route index element={<ReceiverDashboardHome />} />
          <Route path="browse" element={<ReceiverBrowse />} />
          <Route path="requests" element={<ReceiverRequests />} />
          <Route path="search" element={<ReceiverSearch />} />
        </Route>
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