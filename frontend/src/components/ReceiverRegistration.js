import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
// import './RegistrationForm.css';

const ReceiverRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    organizationName: '',
    contactPerson: '',
    phone: '',
    address: '',
    organizationType: 'CHARITY',
    capacity: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.registerReceiver({
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null
      });
      
      setSuccess('Registration successful! Welcome to FoodFlow.');
      
      // Store token if needed
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      // Redirect after success
      setTimeout(() => {
        navigate('/dashboard'); // You'll create this later
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <div className="container">
        <h1>Register as Receiver</h1>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength="8"
              required
            />
            <small>Minimum 8 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="organizationName">Organization Name *</label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactPerson">Contact Person *</label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="organizationType">Organization Type *</label>
            <select
              id="organizationType"
              name="organizationType"
              value={formData.organizationType}
              onChange={handleChange}
              required
            >
              <option value="CHARITY">Charity</option>
              <option value="SHELTER">Shelter</option>
              <option value="COMMUNITY_KITCHEN">Community Kitchen</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="capacity">Daily Capacity (People Served)</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
            />
            <small>Approximate number of people you serve daily</small>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="back-button"
              onClick={() => navigate('/register')}
            >
              Back
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register as Receiver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiverRegistration;
