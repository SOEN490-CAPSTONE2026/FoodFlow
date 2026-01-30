import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setNavigator, setNavigationLocation } from '../services/navigation';

const NavigationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);

  useEffect(() => {
    setNavigationLocation(location);
  }, [location]);

  return null;
};

export default NavigationHandler;
