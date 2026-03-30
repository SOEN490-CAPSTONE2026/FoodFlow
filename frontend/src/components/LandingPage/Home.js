import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import backgroundVideo from '../../assets/LandingPage_VIDEO.mp4';
import '../LandingPage/style/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [line1Completed, setLine1Completed] = useState(false);
  const [line2Completed, setLine2Completed] = useState(false);
  const [showReceiver, setShowReceiver] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLine1Completed(true);
    }, 2500);

    const timer2 = setTimeout(() => {
      setLine2Completed(true);
    }, 4500);

    const interval = setInterval(() => {
      setShowReceiver(prev => !prev);
    }, 8000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="home-container">
      <video className="background-video" autoPlay loop muted playsInline>
        <source src={backgroundVideo} type="video/mp4" />
      </video>

      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <div className="floating-element"></div>

      <div className="home-content">
        {!showReceiver ? (
          <div className="home-title">
            <h1>
              <span
                className={`typewriter-text typewriter-line-1 ${line1Completed ? 'completed' : ''}`}
              >
                {t('landing.home.title1')}
              </span>
            </h1>
            <span className="gradient-text">
              <span
                className={`typewriter-text typewriter-line-2 ${line2Completed ? 'completed' : ''}`}
              >
                {t('landing.home.title2')}
              </span>
            </span>
          </div>
        ) : (
          <div className="home-title receiver-title">
            <h1>
              <span className="typewriter-text typewriter-line-3">
                {t('landing.home.title3')}
              </span>
            </h1>
            <span className="gradient-text">
              <span className="typewriter-text typewriter-line-4">
                {t('landing.home.title4')}
              </span>
            </span>
          </div>
        )}

        <div className="home-description">
          <p>{t('landing.home.description')}</p>
          <button onClick={() => navigate('/register')}>
            {t('landing.home.joinUs')}
          </button>
        </div>

        <section
          className="home-donation-support-banner"
          aria-label={t('donation.bannerAriaLabel')}
        >
          <div className="home-donation-support-banner-content">
            <div className="home-donation-support-banner-icon" aria-hidden="true">
              <Heart strokeWidth={2} />
            </div>
            <div className="home-donation-support-banner-text">
              <h3>{t('donation.title')}</h3>
              <p>{t('donation.subtitle')}</p>
            </div>
          </div>
          <button
            className="home-donation-support-banner-button"
            onClick={() => navigate('/payment')}
          >
            {t('donation.modalAriaLabel')}
          </button>
        </section>
      </div>
    </div>
  );
};
export default Home;
