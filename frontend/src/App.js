import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import RegisterType from './components/RegisterType';
import DonorRegistration from './components/DonorRegistration';
import ReceiverRegistration from './components/ReceiverRegistration';
import LoginPage from './components/LoginPage';
import TempDashboard from './components/TempDashboard';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterType />} />
            <Route path="/register/donor" element={<DonorRegistration />} />
            <Route path="/register/receiver" element={<ReceiverRegistration />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<TempDashboard />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;