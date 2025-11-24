import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import ReceiverIllustration from "../assets/illustrations/receiver-ilustration.jpg";
import '../style/Registration.css';

const ReceiverRegistration = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    contactPerson: '',
    phone: '',
    address: '',
    organizationType: 'CHARITY',
    capacity: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    // Ensure passwords match before sending request
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Prepare payload (include confirmPassword) and parsed capacity
      const payload = { ...formData };
      payload.capacity = formData.capacity ? parseInt(formData.capacity) : null;

      const response = await authAPI.registerReceiver(payload);

      setSuccess('Registration successful! Welcome to FoodFlow.');

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

          <div className="form-group password-wrapper">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder='Enter your password'
                minLength="8"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Toggle password visibility (hide)' : 'Toggle password visibility (show)'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <small>Minimum 8 characters</small>
          </div>

          <div className="form-group password-wrapper">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder='Re-enter your password'
                minLength="8"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(s => !s)}
                aria-label={showConfirmPassword ? 'Toggle confirm-password visibility (hide)' : 'Toggle confirm-password visibility (show)'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
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
