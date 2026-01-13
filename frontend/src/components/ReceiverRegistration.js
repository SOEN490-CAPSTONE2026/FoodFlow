import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import ReceiverIllustration from "../assets/illustrations/receiver-ilustration.jpg";

import '../style/Registration.css';

// Phone number formatting utility
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('+')) {
    return phone;
  }
  return `+${cleaned}`;
};

const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

const ReceiverRegistration = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2
    organizationName: '',
    organizationType: '',
    charityRegistrationNumber: '',
    supportingDocument: null,
    // Step 3
    streetAddress: '',
    unit: '',
    city: '',
    postalCode: '',
    province: '',
    country: '',
    // Step 4
    contactPerson: '',
    phone: '',
    capacity: '',
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let errorMsg = '';

    switch (name) {
      case 'email':
        if (!value) {
          errorMsg = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMsg = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) {
          errorMsg = 'Password is required';
        } else if (value.length < 8) {
          errorMsg = 'Password must be at least 8 characters';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          errorMsg = 'Please confirm your password';
        } else if (value !== formData.password) {
          errorMsg = 'Passwords do not match';
        }
        break;
      case 'phone':
        if (value && !validatePhoneNumber(value)) {
          errorMsg = 'Please enter a valid phone number';
        }
        break;
      case 'capacity':
        if (value && (isNaN(value) || parseInt(value) < 1)) {
          errorMsg = 'Capacity must be a positive number';
        }
        break;
      case 'postalCode':
        if (value && !/^[A-Za-z0-9\s-]+$/.test(value)) {
          errorMsg = 'Please enter a valid postal code';
        }
        break;
      default:
        break;
    }

    setFieldErrors({
      ...fieldErrors,
      [name]: errorMsg
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setFieldErrors({
        ...fieldErrors,
        supportingDocument: 'Only PDF, JPG, and PNG files are allowed'
      });
      return;
    }

    if (file.size > maxSize) {
      setFieldErrors({
        ...fieldErrors,
        supportingDocument: 'File size must not exceed 10MB'
      });
      return;
    }

    setFormData({
      ...formData,
      supportingDocument: file
    });
    setFieldErrors({
      ...fieldErrors,
      supportingDocument: ''
    });
  };

  const removeFile = () => {
    setFormData({
      ...formData,
      supportingDocument: null
    });
  };

  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 1:
        if (!formData.email) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Please enter a valid email address';
        }
        
        if (!formData.password) errors.password = 'Password is required';
        else if (formData.password.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        }
        
        if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
        else if (formData.confirmPassword !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 2:
        if (!formData.organizationName) errors.organizationName = 'Organization name is required';
        if (!formData.organizationType) errors.organizationType = 'Organization type is required';
        
        // Either registration number OR supporting document required
        if (!formData.charityRegistrationNumber && !formData.supportingDocument) {
          errors.verification = 'Please provide either a registration number or upload a supporting document';
        }
        break;

      case 3:
        if (!formData.streetAddress) errors.streetAddress = 'Street address is required';
        if (!formData.city) errors.city = 'City is required';
        if (!formData.postalCode) errors.postalCode = 'Postal code is required';
        if (!formData.province) errors.province = 'Province/State is required';
        if (!formData.country) errors.country = 'Country is required';
        break;

      case 4:
        if (!formData.contactPerson) errors.contactPerson = 'Contact person name is required';
        if (!formData.phone) errors.phone = 'Phone number is required';
        else if (!validatePhoneNumber(formData.phone)) {
          errors.phone = 'Please enter a valid phone number';
        }
        if (!formData.capacity) errors.capacity = 'Daily capacity is required';
        else if (isNaN(formData.capacity) || parseInt(formData.capacity) < 1) {
          errors.capacity = 'Capacity must be a positive number';
        }
        break;

      case 5:
        if (!confirmAccuracy) {
          errors.confirmAccuracy = 'Please confirm the information is accurate';
        }
        break;

      default:
        break;
    }

    return errors;
  };

  const isStepValid = (step) => {
    const errors = validateStep(step);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors before proceeding');
      return;
    }

    // Check email exists before leaving step 1 (Account Credentials)
    if (currentStep === 1) {
      setLoading(true);
      try {
        const response = await authAPI.checkEmailExists(formData.email);
        if (response.data.exists) {
          setFieldErrors({ email: 'An account with this email already exists' });
          setError('Email already registered. Please use a different email or login.');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking email:', err);
        setError('Unable to validate email. Please try again.');
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    // Check phone exists before leaving step 4 (Contact Info)
    if (currentStep === 4) {
      setLoading(true);
      try {
        const formattedPhone = formatPhoneNumber(formData.phone);
        const response = await authAPI.checkPhoneExists(formattedPhone);
        if (response.data.exists) {
          setFieldErrors({ phone: 'An account with this phone number already exists' });
          setError('Phone number already registered. Please use a different number.');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking phone:', err);
        const errorMessage = err.response?.data?.message || 'Phone number already exists in the system';
        setError(errorMessage);
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    setError('');
    setFieldErrors({});
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError('');
    setFieldErrors({});
    setCurrentStep(currentStep - 1);
  };

  const handleStepClick = (step) => {
    // Allow navigation to previous steps or current step
    if (step <= currentStep) {
      setError('');
      setFieldErrors({});
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Address as single field for backend compatibility
      const fullAddress = [
        formData.streetAddress,
        formData.unit ? `Unit ${formData.unit}` : '',
        formData.city,
        formData.province,
        formData.postalCode,
        formData.country
      ].filter(Boolean).join(', ');

      // Prepare payload based on whether there's a file
      let payload;
      
      if (formData.supportingDocument) {
        // Use FormData if there's a file to upload
        payload = new FormData();
        payload.append('email', formData.email);
        payload.append('password', formData.password);
        payload.append('confirmPassword', formData.confirmPassword);
        payload.append('organizationName', formData.organizationName);
        payload.append('organizationType', formData.organizationType);
        
        if (formData.charityRegistrationNumber) {
          payload.append('charityRegistrationNumber', formData.charityRegistrationNumber);
        }
        
        payload.append('supportingDocument', formData.supportingDocument);
        payload.append('address', fullAddress);
        payload.append('contactPerson', formData.contactPerson);
        payload.append('phone', formatPhoneNumber(formData.phone));
        payload.append('capacity', parseInt(formData.capacity));
      } else {
        // Use JSON payload if no file
        payload = {
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          organizationName: formData.organizationName,
          organizationType: formData.organizationType,
          charityRegistrationNumber: formData.charityRegistrationNumber || '',
          address: fullAddress,
          contactPerson: formData.contactPerson,
          phone: formatPhoneNumber(formData.phone),
          capacity: parseInt(formData.capacity)
        };
      }

      const response = await authAPI.registerReceiver(payload);

      // Extract token, role, userId, organizationName, verificationStatus, and accountStatus from response
      const token = response?.data?.token;
      const userRole = response?.data?.role;
      const userId = response?.data?.userId;
      const organizationName = response?.data?.organizationName;
      const verificationStatus = response?.data?.verificationStatus || 'pending_verification';
      const accountStatus = response?.data?.accountStatus || 'PENDING_VERIFICATION';

      if (token && userRole && userId) {
        login(token, userRole, userId, organizationName, verificationStatus, accountStatus);
      }

      setSubmitted(true);

      // Auto-redirect after 5 seconds
      setTimeout(() => {
        navigate('/receiver');
      }, 5000);

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setCurrentStep(1); // Go back to first step on error
    } finally {
      setLoading(false);
    }
  };

  // Success screen after submission
  if (submitted) {
    return (
      <div className="registration-page receiver-registration">
        <div className="background-image">
          <img src={ReceiverIllustration} alt="Receiver Illustration" height={500} width={900} />
        </div>
        <div className="form-container">
          <div className="success-screen">
            <div className="success-icon">✓</div>
            <h1>Registration Submitted Successfully!</h1>
            <div className="success-details">
              <p className="status-badge">Status: Verification Pending</p>
              <p className="success-message">
                Thank you for registering with FoodFlow. Your application has been submitted and is currently under review by our admin team.
              </p>
              <div className="info-box">
                <h3>What happens next?</h3>
                <ul>
                  <li>Our team will review your application and verify your organization details</li>
                  <li>This process typically takes 1–3 business days</li>
                  <li>You'll receive an email notification once your account is verified</li>
                  <li>After verification, you'll have full access to all receiver features</li>
                </ul>
              </div>
              <p className="redirect-message">Redirecting to your dashboard in a moment...</p>
              <button 
                className="submit-button"
                onClick={() => navigate('/receiver')}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step indicator component
  const StepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3, 4, 5].map((step) => (
        <div 
          key={step} 
          className="step-item"
          onClick={() => handleStepClick(step)}
          style={{ cursor: step <= currentStep ? 'pointer' : 'default' }}
        >
          <div className={`step-number ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
            {currentStep > step ? '✓' : step}
          </div>
        </div>
      ))}
    </div>
  );

  // Get step title
  const getStepTitle = (step) => {
    switch (step) {
      case 1:
        return 'Account Credentials';
      case 2:
        return 'Organization Information';
      case 3:
        return 'Location Details';
      case 4:
        return 'Contact & Operations';
      case 5:
        return 'Review & Submit';
      default:
        return '';
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content fade-in">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your email address"
                className={fieldErrors.email ? 'error' : ''}
              />
              {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
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
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  className={fieldErrors.password ? 'error' : ''}
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
              {fieldErrors.password && <span className="error-text">{fieldErrors.password}</span>}
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
                  onBlur={handleBlur}
                  placeholder="Re-enter your password"
                  className={fieldErrors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(s => !s)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.confirmPassword && <span className="error-text">{fieldErrors.confirmPassword}</span>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content fade-in">
            <div className="form-group">
              <label htmlFor="organizationName">Organization Name</label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your organization name"
                className={fieldErrors.organizationName ? 'error' : ''}
              />
              {fieldErrors.organizationName && <span className="error-text">{fieldErrors.organizationName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="organizationType">Organization Type</label>
              <select
                id="organizationType"
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldErrors.organizationType ? 'error' : ''}
              >
                <option value="">Select organization type</option>
                <option value="CHARITY">Charity</option>
                <option value="SHELTER">Shelter</option>
                <option value="COMMUNITY_KITCHEN">Community Kitchen</option>
                <option value="FOOD_BANK">Food Bank</option>
                <option value="NONPROFIT">Nonprofit Organization</option>
                <option value="RELIGIOUS_ORG">Religious Organization</option>
                <option value="SCHOOL">School / Educational Institution</option>
                <option value="SENIOR_CENTER">Senior Center</option>
                <option value="YOUTH_CENTER">Youth Center</option>
                <option value="COMMUNITY_CENTER">Community Center</option>
                <option value="HOMELESS_SERVICES">Homeless Services</option>
                <option value="REFUGEE_CENTER">Refugee / Immigrant Center</option>
                <option value="OTHER">Other</option>
              </select>
              {fieldErrors.organizationType && <span className="error-text">{fieldErrors.organizationType}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="charityRegistrationNumber">Charity / Nonprofit Registration Number</label>
              <input
                type="text"
                id="charityRegistrationNumber"
                name="charityRegistrationNumber"
                value={formData.charityRegistrationNumber}
                onChange={handleChange}
                placeholder="Enter registration number (optional)"
              />
              <small>Optional — used to verify your organization</small>
            </div>

            <div className="verification-divider">
              <span>OR</span>
            </div>

            <div className="form-group">
              <label>Upload Supporting Document</label>
              <div 
                className={`file-upload-area compact ${isDragging ? 'dragging' : ''} ${fieldErrors.supportingDocument ? 'error' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!formData.supportingDocument ? (
                  <>
                    <label htmlFor="fileUpload" className="upload-button-compact">
                      📎 Choose File or Drag Here
                    </label>
                    <input
                      type="file"
                      id="fileUpload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <small>PDF, JPG, PNG (Max 10MB)</small>
                  </>
                ) : (
                  <div className="file-preview-compact">
                    <span className="file-icon">📎</span>
                    <span className="file-name">{formData.supportingDocument.name}</span>
                    <button
                      type="button"
                      className="remove-file-button-compact"
                      onClick={removeFile}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              {fieldErrors.supportingDocument && <span className="error-text">{fieldErrors.supportingDocument}</span>}
              {fieldErrors.verification && <span className="error-text">{fieldErrors.verification}</span>}
              <small className="help-text">
                Required if no registration number provided
              </small>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content fade-in">
            <div className="form-group">
              <label htmlFor="streetAddress">Street Address</label>
              <input
                type="text"
                id="streetAddress"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="123 Main Street"
                className={fieldErrors.streetAddress ? 'error' : ''}
              />
              {fieldErrors.streetAddress && <span className="error-text">{fieldErrors.streetAddress}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="unit">Unit / Suite (Optional)</label>
              <input
                type="text"
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="Unit 4B"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Montreal"
                  className={fieldErrors.city ? 'error' : ''}
                />
                {fieldErrors.city && <span className="error-text">{fieldErrors.city}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="postalCode">Postal Code</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="H3A 0G4"
                  className={fieldErrors.postalCode ? 'error' : ''}
                />
                {fieldErrors.postalCode && <span className="error-text">{fieldErrors.postalCode}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="province">Province / State</label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Quebec"
                  className={fieldErrors.province ? 'error' : ''}
                />
                {fieldErrors.province && <span className="error-text">{fieldErrors.province}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Canada"
                  className={fieldErrors.country ? 'error' : ''}
                />
                {fieldErrors.country && <span className="error-text">{fieldErrors.country}</span>}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content fade-in">
            <div className="form-group">
              <label htmlFor="contactPerson">Contact Person Name</label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="John Smith"
                className={fieldErrors.contactPerson ? 'error' : ''}
              />
              {fieldErrors.contactPerson && <span className="error-text">{fieldErrors.contactPerson}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="+1 (514) 555-0123"
                className={fieldErrors.phone ? 'error' : ''}
              />
              {fieldErrors.phone && <span className="error-text">{fieldErrors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="capacity">Daily Capacity (People Served)</label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="50"
                min="1"
                className={fieldErrors.capacity ? 'error' : ''}
              />
              <small>
                Approximate number of people you serve daily
              </small>
              {fieldErrors.capacity && <span className="error-text">{fieldErrors.capacity}</span>}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content fade-in">
            <div className="review-section compact">
              <h3>Account Information</h3>
              <div className="review-item">
                <span className="review-label">Email:</span>
                <span className="review-value">{formData.email}</span>
              </div>
            </div>

            <div className="review-section compact">
              <h3>Organization Details</h3>
              <div className="review-item">
                <span className="review-label">Organization Name:</span>
                <span className="review-value">{formData.organizationName}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Organization Type:</span>
                <span className="review-value">
                  {formData.organizationType.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">Verification Method:</span>
                <span className="review-value">
                  {formData.charityRegistrationNumber 
                    ? `Registration Number: ${formData.charityRegistrationNumber}`
                    : `Document: ${formData.supportingDocument?.name}`
                  }
                </span>
              </div>
            </div>

            <div className="review-section compact">
              <h3>Location</h3>
              <div className="review-item">
                <span className="review-label">Address:</span>
                <span className="review-value">
                  {formData.streetAddress}
                  {formData.unit && `, Unit ${formData.unit}`}
                  <br />
                  {formData.city}, {formData.province} {formData.postalCode}
                  <br />
                  {formData.country}
                </span>
              </div>
            </div>

            <div className="review-section compact">
              <h3>Operations</h3>
              <div className="review-item">
                <span className="review-label">Contact Person:</span>
                <span className="review-value">{formData.contactPerson}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Phone:</span>
                <span className="review-value">{formData.phone}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Daily Capacity:</span>
                <span className="review-value">{formData.capacity} people</span>
              </div>
            </div>

            <div className="form-group confirmation-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={confirmAccuracy}
                  onChange={(e) => {
                    setConfirmAccuracy(e.target.checked);
                    if (fieldErrors.confirmAccuracy) {
                      setFieldErrors({ ...fieldErrors, confirmAccuracy: '' });
                    }
                  }}
                />
                <span>I confirm that the information provided is accurate</span>
              </label>
              {fieldErrors.confirmAccuracy && <span className="error-text">{fieldErrors.confirmAccuracy}</span>}
            </div>

            <div className="info-box">
              <p><strong>What happens next?</strong></p>
              <p>Your registration will be submitted with a status of "Verification Pending". Our admin team will review your information within 1–3 business days.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="registration-page receiver-registration">
      <button 
        type="button" 
        className="exit-registration-button"
        onClick={() => navigate('/register')}
        aria-label="Back to registration selection"
      >
        ← Back
      </button>
      <div className="background-image">
        <img src={ReceiverIllustration} alt="Receiver Illustration" height={500} width={900} />
        <p>We connect you with local associations to reduce waste and support those in need</p>
      </div>
      <div className={`form-container ${currentStep === 5 ? 'step-5' : ''}`}>
        <div className="form-header-fixed">
          <h1>Register as Receiver</h1>
          <p className="form-subtitle">Step {currentStep} of {totalSteps}</p>
          <StepIndicator />
          <h2 className="step-title-fixed">{getStepTitle(currentStep)}</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="registration-form-scrollable">
          <div className="registration-form">
            {renderStepContent()}

            <div className="form-actions">
              {currentStep > 1 ? (
                <button
                  type="button"
                  className="back-button"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  className="back-button"
                  onClick={() => navigate('/register')}
                >
                  Cancel
                </button>
              )}
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  className="submit-button"
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep)}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="submit-button"
                  onClick={handleSubmit}
                  disabled={loading || !isStepValid(currentStep)}
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiverRegistration;
