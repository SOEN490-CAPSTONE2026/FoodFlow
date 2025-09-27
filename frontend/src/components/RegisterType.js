import React from "react";
import { useNavigate } from "react-router-dom";
import RegistrationIllustration from "../assets/illustrations/registration-illustration.png";
import DonorIcon from "../assets/icons/donor-icon.png";
import ReceiverIcon from "../assets/icons/receiver-icon.png";
import "./RegisterType.css";

const RegisterType = () => {
  const navigate = useNavigate();

  return (
    <div className="register-type-page">
      <div className="intro">
        <h1>Join FoodFlow</h1>
        <p>
          Connect surplus food with those who need it most. Choose your
          registration type to get started.
        </p>
        <h2>Step 1: Choose your Registration Type</h2>
      </div>

      <div className="content">
        <div className="illustration">
          <img
            src={RegistrationIllustration} 
            alt="Woman carrying food box"
            height={892}
            width={595}
          />
        </div>

        <div className="registration-options">
          <div className="option-card donor">
            <img src={DonorIcon} alt="Donor Icon" height={129} width={129} />
            <h3>Register as a donor</h3>
            <p>
              For restaurants, grocery stores, and event organizers who have
              surplus food to donate.
            </p>
            <ul>
              <li>Post surplus food listings</li>
              <li>Connect with local charities</li>
              <li>Track your impact</li>
            </ul>
            <button
              className="register-button donor-button"
              onClick={() => navigate("/register/donor")}
            >
              Register as a donor →
            </button>
          </div>

          <div className="option-card receiver">
            <img src={ReceiverIcon} alt="Receiver Icon" height={129} width={129} />
            <h3>Register as a receiver</h3>
            <p>
              For charities, shelters, and community kitchens that serve people
              in need.
            </p>
            <ul>
              <li>Receive food donations</li>
              <li>Get matched with nearby donors</li>
              <li>Help feed your community</li>
            </ul>
            <button
              className="register-button receiver-button"
              onClick={() => navigate("/register/receiver")}
            >
              Register as a receiver →
            </button>
          </div>
        </div>
      </div>

      {/* Back button */}
      {/* <div className="back-container">
        <button className="back-button" onClick={() => navigate("/")}>
          Back to Home
        </button> */}
      {/* </div> */}
    </div>
  );
};

export default RegisterType;
