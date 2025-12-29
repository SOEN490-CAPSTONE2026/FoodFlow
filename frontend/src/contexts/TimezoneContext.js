import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const TimezoneContext = createContext();

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};

export const TimezoneProvider = ({ children }) => {
  const [userTimezone, setUserTimezone] = useState('UTC');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserTimezone();
  }, []);

  const fetchUserTimezone = async () => {
    console.log('[TimezoneContext] Fetching user timezone...');
    try {
      const response = await api.get('/profile/region');
      console.log('[TimezoneContext] API response:', response.data);
      
      if (response.data && response.data.timezone) {
        console.log('[TimezoneContext] Setting timezone to:', response.data.timezone);
        setUserTimezone(response.data.timezone);
      } else {
        console.log('[TimezoneContext] No timezone in response, using browser timezone');
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        console.log('[TimezoneContext] Browser timezone:', browserTz);
        setUserTimezone(browserTz);
      }
    } catch (error) {
      console.error('[TimezoneContext] Error fetching user timezone:', error);
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      console.log('[TimezoneContext] Fallback to browser timezone:', browserTz);
      setUserTimezone(browserTz);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimezone = (newTimezone) => {
    setUserTimezone(newTimezone);
  };

  const value = {
    userTimezone,
    isLoading,
    updateTimezone,
    refreshTimezone: fetchUserTimezone
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
};
