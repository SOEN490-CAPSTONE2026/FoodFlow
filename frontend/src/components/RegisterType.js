import React from 'react';
import { useNavigate } from 'react-router-dom';
// import './RegisterType.css';

const RegisterType = () => {
  const navigate = useNavigate();

  return (
    <div className="register-type-page">
      <div className="container">
        <h1>Join FoodFlow</h1>
        <p>Choose your registration type</p>
        
        <div className="registration-options">
          <div className="option-card">
            <h3>Register as Donor</h3>
            <p>For restaurants, grocery stores, and event organizers who have surplus food to donate</p>
            <ul>
              <li>Post surplus food listings</li>
              <li>Connect with local charities</li>
              <li>Track your impact</li>
            </ul>
            <button 
              className="register-button donor-button"
              onClick={() => navigate('/register/donor')}
            >
              Register as Donor
            </button>
          </div>
          
          <div className="option-card">
            <h3>Register as Receiver</h3>
            <p>For charities, shelters, and community kitchens that serve people in need</p>
            <ul>
              <li>Receive food donations</li>
              <li>Get matched with nearby donors</li>
              <li>Help feed your community</li>
            </ul>
            <button 
              className="register-button receiver-button"
              onClick={() => navigate('/register/receiver')}
            >
              Register as Receiver
            </button>
          </div>
        </div>
        
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default RegisterType;
