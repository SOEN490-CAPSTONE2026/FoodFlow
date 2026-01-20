import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegistrationIllustration from '../assets/illustrations/registration-illustration2.png';
import DonorIcon from '../assets/icons/donor-icon.png';
import ReceiverIcon from '../assets/icons/receiver-icon.png';
import Logo from '../assets/Logo.png';
import '../style/RegisterType.css';

const RegisterType = () => {
  const navigate = useNavigate();

  return (
    <div className="register-type-page">
      <div
        className="logo-container"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
      >
        <img src={Logo} alt="FoodFlow Logo" className="logo" />
      </div>

      <div className="intro">
        <h1>Join FoodFlow</h1>
        <p className="subtitle">Choose your role to start making an impact.</p>
      </div>

      <div className="content">
        <div className="option-card donor">
          <img src={DonorIcon} alt="Donor Icon" height={129} width={129} />
          <h3>I'm Donating</h3>
          <p>
            For restaurants, grocery stores, and event organizers with surplus
            food to share.
          </p>
          <ul>
            <li>Post what's available</li>
            <li>Connect with nearby charities</li>
            <li>Watch your impact grow</li>
          </ul>
          <button
            className="register-button donor-button"
            onClick={() => navigate('/register/donor')}
          >
            Register as a Donor
          </button>
        </div>

        <div className="illustration">
          <img
            src={RegistrationIllustration}
            alt="Woman carrying food box"
            height={892}
            width={595}
          />
        </div>

        <div className="option-card receiver">
          <img
            src={ReceiverIcon}
            alt="Receiver Icon"
            height={129}
            width={129}
          />
          <h3>I'm Receiving</h3>
          <p>
            For charities, shelters, and community kitchens that serve people in
            need.
          </p>
          <ul>
            <li>Accept fresh donations nearby</li>
            <li>Connect directly with food donors</li>
            <li>Feed your community efficiently</li>
          </ul>
          <button
            className="register-button receiver-button"
            onClick={() => navigate('/register/receiver')}
          >
            Register as a Receiver
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterType;
