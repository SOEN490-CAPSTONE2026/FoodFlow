import React from 'react';
import { useConsent } from '../contexts/ConsentContext';
import './CookieBanner.css';

/**
 * CookieBanner — shown on first visit until the user makes a consent choice.
 *
 * Users are opted IN by default. This banner gives them the option to decline.
 * Once a choice is made the banner disappears permanently (stored in localStorage).
 */
const CookieBanner = () => {
  const { bannerVisible, accept, decline } = useConsent();

  if (!bannerVisible) return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Cookie consent">
      <div className="cookie-banner__content">
        <p className="cookie-banner__text">
          We use cookies and analytics to improve your experience on FoodFlow.
          By continuing to use this site you agree to our use of analytics. You
          can opt out at any time.{' '}
          <a href="/privacy-policy" className="cookie-banner__link">
            Privacy Policy
          </a>
        </p>
        <div className="cookie-banner__actions">
          <button
            className="cookie-banner__btn cookie-banner__btn--accept"
            onClick={accept}
          >
            Accept
          </button>
          <button
            className="cookie-banner__btn cookie-banner__btn--decline"
            onClick={decline}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
