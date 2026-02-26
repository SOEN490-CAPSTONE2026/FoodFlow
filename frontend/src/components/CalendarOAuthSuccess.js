import React, { useEffect, useState } from 'react';
import '../style/CalendarOAuthSuccess.css';

const CalendarOAuthSuccess = () => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="calendar-oauth-container">
      <div className="calendar-oauth-card">
        <div className="oauth-icon success-icon">✓</div>
        <h2>Calendar Connected Successfully!</h2>
        <p>Your Google Calendar has been connected to FoodFlow.</p>
        <p className="calendar-oauth-message">
          You can now sync your donation pickups and appointments automatically.
        </p>
        <p className="closing-message">
          Closing this window in {countdown} second{countdown !== 1 ? 's' : ''}
          ...
        </p>
      </div>
    </div>
  );
};

export default CalendarOAuthSuccess;
