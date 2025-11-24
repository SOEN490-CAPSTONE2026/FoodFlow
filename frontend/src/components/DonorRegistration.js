import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import DonorIllustration from "../assets/illustrations/donor-illustration.jpg";
import '../style/Registration.css';

const DonorRegistration = () => {
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
    organizationType: 'RESTAURANT',
    businessLicense: ''
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
      const payload = { ...formData };
      const response = await authAPI.registerDonor(payload);
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
        navigate('/donor'); // Redirect to donor dashboard
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
        <img src={DonorIllustration} alt="Donor Illustration" height={500} width={900} />
        <p>Your generosity provides meals, care, and hope for families in need. Every donation helps strengthen communities and build a brighter, kinder future together, we can make lasting change!</p>
      </div>
      <div className="form-container">
        <h1>Register as a Donor</h1>

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
              placeholder="Enter your email address"
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
                minLength="8"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                minLength="8"
                placeholder="Re-enter your password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(s => !s)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
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
              placeholder="Enter your organization name"
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
              placeholder="Enter your contact person's name"
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
              placeholder="Enter your phone number"
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
              rows="3"
              placeholder="Enter your address"
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
              placeholder="Select your organization type"
              required
            >
              <option value="RESTAURANT">Restaurant</option>
              <option value="GROCERY_STORE">Grocery Store</option>
              <option value="EVENT_ORGANIZER">Event Organizer</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="businessLicense">Business License Number</label>
            <input
              type="text"
              id="businessLicense"
              name="businessLicense"
              value={formData.businessLicense}
              onChange={handleChange}
              placeholder="Enter your business license number"
            />
            <small>Optional but recommended for verification</small>
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
              {loading ? 'Registering...' : 'Register as Donor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonorRegistration;
