import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TempDashboard = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Login Successful</h1>
    </div>
  );
};

export default TempDashboard;
