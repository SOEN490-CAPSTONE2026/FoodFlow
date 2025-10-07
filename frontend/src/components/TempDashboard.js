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
      <p>Welcome to your dashboard!</p>
      
      <div style={{ marginTop: '30px' }}>
        <button 
          onClick={() => navigate('/surplus/create')}
          style={{ 
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
            marginRight: '15px'
          }}
        >
          Create Surplus Post
        </button>
        
        <button 
          onClick={() => navigate('/my-posts')}
          style={{ 
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}
        >
          See My Posts
        </button>
      </div>
    </div>
  );
};

export default TempDashboard;
