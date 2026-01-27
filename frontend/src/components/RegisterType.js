import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RegistrationIllustration from "../assets/illustrations/registration-illustration2.png";
import DonorIcon from "../assets/icons/donor-icon.png";
import ReceiverIcon from "../assets/icons/receiver-icon.png";
import Logo from "../assets/Logo.png";
import "../style/RegisterType.css";

const RegisterType = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="register-type-page">
      <div className="logo-container" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
        <img src={Logo} alt="FoodFlow Logo" className="logo" />
      </div>
      
      <div className="intro">
        <h1>{t('registerType.title')}</h1>
        <p className="subtitle">
          {t('registerType.subtitle')}
        </p>
      </div>

      <div className="content">
        <div className="option-card donor">
          <img src={DonorIcon} alt="Donor Icon" height={129} width={129} />
          <h3>{t('registerType.donor.heading')}</h3>
          <p>
            {t('registerType.donor.description')}
          </p>
          <ul>
            <li>{t('registerType.donor.benefit1')}</li>
            <li>{t('registerType.donor.benefit2')}</li>
            <li>{t('registerType.donor.benefit3')}</li>
          </ul>
          <button
            className="register-button donor-button"
            onClick={() => navigate("/register/donor")}
          >
            {t('registerType.donor.button')}
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
          <img src={ReceiverIcon} alt="Receiver Icon" height={129} width={129} />
          <h3>{t('registerType.receiver.heading')}</h3>
          <p>
            {t('registerType.receiver.description')}
          </p>
          <ul>
            <li>{t('registerType.receiver.benefit1')}</li>
            <li>{t('registerType.receiver.benefit2')}</li>
            <li>{t('registerType.receiver.benefit3')}</li>
          </ul>
          <button
            className="register-button receiver-button"
            onClick={() => navigate("/register/receiver")}
          >
            {t('registerType.receiver.button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterType;

