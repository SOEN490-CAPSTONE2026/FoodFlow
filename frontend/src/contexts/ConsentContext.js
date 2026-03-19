import React, { createContext, useContext, useState } from 'react';
import ga4Service from '../services/ga4Service';

/**
 * ConsentContext — manages GA4 cookie consent state.
 *
 * Default state: opted IN (users are tracked unless they explicitly decline).
 * The banner is shown until the user makes a choice (accept or decline).
 */
const ConsentContext = createContext();

export const ConsentProvider = ({ children }) => {
  // Banner is visible when the user has never made a consent choice
  const [bannerVisible, setBannerVisible] = useState(
    ga4Service.isConsentPending()
  );

  const accept = () => {
    ga4Service.setConsent(true);
    setBannerVisible(false);
  };

  const decline = () => {
    ga4Service.setConsent(false);
    setBannerVisible(false);
  };

  return (
    <ConsentContext.Provider
      value={{
        bannerVisible,
        hasConsent: ga4Service.hasConsent,
        accept,
        decline,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
};

export const useConsent = () => useContext(ConsentContext);
