import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import ReceiverIllustration from "../assets/illustrations/receiver-ilustration.jpg";
import '../style/Registration.css';
import { startTask, completeTask, trackError } from '../utils/usabilityTracking';

const ReceiverRegistration = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
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

  // Track when user starts the receiver registration task
  useEffect(() => {
    startTask('task_receiver_register');
  }, []);

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

      // Track successful registration
      completeTask('task_receiver_register', true);

      // Extract token, role, and userId from response
      const token = response?.data?.token;
      const userRole = response?.data?.role;
      const userId = response?.data?.userId;

      if (token && userRole && userId) {
        login(token, userRole, userId); // Store in context and localStorage
      }

      // Redirect after success
      setTimeout(() => {
        navigate('/receiver'); // Redirect to receiver dashboard
      }, 2000);

    } catch (err) {
      // Track failed registration
      trackError('registration_failed', 'ReceiverRegistration');
      completeTask('task_receiver_register', false);
      
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <div className="background-image">
        <img src={ReceiverIllustration} alt="Donor Illustration" height={500} width={900} />
        <p>Join our network to receive quality food donations for your community.
          We connect you with local businesses to reduce waste and support those in need.
          Together, we can create sustainable solutions for food distribution.</p>
      </div>
      <div className="form-container">
        <h1>Register as Receiver</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder='Enter your email address'
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder='Enter your password'
              minLength="8"
              required
            />
            <small>Minimum 8 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="organizationName">Organization Name</label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              placeholder='Enter your organization name'
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactPerson">Contact Person</label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder='Enter your contact person name'
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder='Enter your phone number'
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder='Enter your address'
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="organizationType">Organization Type</label>
            <select
              id="organizationType"
              name="organizationType"
              value={formData.organizationType}
              onChange={handleChange}
              placeholder='Select your organization type'
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
              placeholder='Enter your daily capacity'
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
