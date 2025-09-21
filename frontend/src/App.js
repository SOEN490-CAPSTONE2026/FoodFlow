import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import RegisterType from './components/RegisterType';
import DonorRegistration from './components/DonorRegistration';
import ReceiverRegistration from './components/ReceiverRegistration';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterType />} />
          <Route path="/register/donor" element={<DonorRegistration />} />
          <Route path="/register/receiver" element={<ReceiverRegistration />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;