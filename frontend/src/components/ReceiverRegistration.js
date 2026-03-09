import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import SEOHead from './SEOHead';
import ReceiverIllustration from '../assets/illustrations/receiver-ilustration.jpg';
import { validatePassword } from '../utils/passwordValidation';
import {
  inferTimezoneFromAddress,
  getBrowserTimezone,
} from '../services/timezoneService';

import '../style/Registration.css';

// Phone number formatting utility
const formatPhoneNumber = phone => {
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

const validatePhoneNumber = phone => {
  const phoneRegex =
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

const ReceiverRegistration = () => {
  const { t } = useTranslation();
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
    timezone: '', // Automatically inferred from address
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
  const [dataStorageConsent, setDataStorageConsent] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: '',
      });
    }
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let errorMsg = '';

    switch (name) {
      case 'email':
        if (!value) {
          errorMsg = t('receiverRegistration.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMsg = t('receiverRegistration.emailInvalid');
        }
        break;
      case 'password':
        if (!value) {
          errorMsg = t('receiverRegistration.passwordRequired');
        } else {
          const passwordErrors = validatePassword(value);
          if (passwordErrors.length > 0) {
            errorMsg = passwordErrors.join('; ');
          }
        }
        break;
      case 'confirmPassword':
        if (!value) {
          errorMsg = t('receiverRegistration.confirmPasswordRequired');
        } else if (value !== formData.password) {
          errorMsg = t('receiverRegistration.passwordMismatch');
        }
        break;
      case 'phone':
        if (value && !validatePhoneNumber(value)) {
          errorMsg = t('receiverRegistration.phoneInvalid');
        }
        break;
      case 'capacity':
        if (value && (isNaN(value) || parseInt(value) < 1)) {
          errorMsg = t('receiverRegistration.capacityInvalid');
        }
        break;
      case 'postalCode':
        if (value && !/^[A-Za-z0-9\s-]+$/.test(value)) {
          errorMsg = t('receiverRegistration.postalCodeInvalid');
        }
        break;
      default:
        break;
    }

    setFieldErrors({
      ...fieldErrors,
      [name]: errorMsg,
    });
  };

  const handleFileUpload = e => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDragOver = e => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const processFile = file => {
    if (!file) {
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setFieldErrors({
        ...fieldErrors,
        supportingDocument: t('receiverRegistration.fileTypeError'),
      });
      return;
    }

    if (file.size > maxSize) {
      setFieldErrors({
        ...fieldErrors,
        supportingDocument: t('receiverRegistration.fileSizeError'),
      });
      return;
    }

    setFormData({
      ...formData,
      supportingDocument: file,
    });
    setFieldErrors({
      ...fieldErrors,
      supportingDocument: '',
    });
  };

  const removeFile = () => {
    setFormData({
      ...formData,
      supportingDocument: null,
    });
  };

  const validateStep = step => {
    const errors = {};

    switch (step) {
      case 1:
        if (!formData.email) {
          errors.email = t('receiverRegistration.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = t('receiverRegistration.emailInvalid');
        }

        if (!formData.password) {
          errors.password = t('receiverRegistration.passwordRequired');
        } else {
          const passwordErrors = validatePassword(formData.password);
          if (passwordErrors.length > 0) {
            errors.password = passwordErrors.join('; ');
          }
        }

        if (!formData.confirmPassword) {
          errors.confirmPassword = t(
            'receiverRegistration.confirmPasswordRequired'
          );
        } else if (formData.confirmPassword !== formData.password) {
          errors.confirmPassword = t('receiverRegistration.passwordMismatch');
        }
        break;

      case 2:
        if (!formData.organizationName) {
          errors.organizationName = t(
            'receiverRegistration.organizationNameRequired'
          );
        }
        if (!formData.organizationType) {
          errors.organizationType = t(
            'receiverRegistration.organizationTypeRequired'
          );
        }

        // Either registration number OR supporting document required
        if (
          !formData.charityRegistrationNumber &&
          !formData.supportingDocument
        ) {
          errors.verification = t('receiverRegistration.verificationRequired');
        }
        break;

      case 3:
        if (!formData.streetAddress) {
          errors.streetAddress = t(
            'receiverRegistration.streetAddressRequired'
          );
        }
        if (!formData.city) {
          errors.city = t('receiverRegistration.cityRequired');
        }
        if (!formData.postalCode) {
          errors.postalCode = t('receiverRegistration.postalCodeRequired');
        }
        if (!formData.province) {
          errors.province = t('receiverRegistration.provinceRequired');
        }
        if (!formData.country) {
          errors.country = t('receiverRegistration.countryRequired');
        }
        break;

      case 4:
        if (!formData.contactPerson) {
          errors.contactPerson = t(
            'receiverRegistration.contactPersonRequired'
          );
        }
        if (!formData.phone) {
          errors.phone = t('receiverRegistration.phoneRequired');
        } else if (!validatePhoneNumber(formData.phone)) {
          errors.phone = t('receiverRegistration.phoneInvalid');
        }
        if (!formData.capacity) {
          errors.capacity = t('receiverRegistration.capacityRequired');
        } else if (
          isNaN(formData.capacity) ||
          parseInt(formData.capacity) < 1
        ) {
          errors.capacity = t('receiverRegistration.capacityInvalid');
        }
        break;

      case 5:
        if (!confirmAccuracy) {
          errors.confirmAccuracy = t(
            'receiverRegistration.confirmAccuracyRequired'
          );
        }
        break;

      default:
        break;
    }

    return errors;
  };

  const isStepValid = step => {
    const errors = validateStep(step);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(t('receiverRegistration.errorBeforeProceeding'));
      return;
    }

    // Check email exists before leaving step 1 (Account Credentials)
    if (currentStep === 1) {
      setLoading(true);
      try {
        const response = await authAPI.checkEmailExists(formData.email);
        if (response.data.exists) {
          setFieldErrors({ email: t('receiverRegistration.emailExists') });
          setError(t('receiverRegistration.emailExistsError'));
          setLoading(false);
          return;
        }
      } catch (err) {
        setError(t('receiverRegistration.emailValidationError'));
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    // Automatically infer timezone from address after Step 3 (Location Details)
    if (currentStep === 3) {
      setLoading(true);
      try {
        console.log('Inferring timezone from address...');

        // Build full address string
        const fullAddress = [
          formData.streetAddress,
          formData.unit ? `Unit ${formData.unit}` : '',
          formData.city,
          formData.province,
          formData.postalCode,
          formData.country,
        ]
          .filter(Boolean)
          .join(', ');

        // Infer timezone from address
        const inferredTimezone = await inferTimezoneFromAddress(fullAddress);

        // Update formData with inferred timezone
        setFormData(prev => ({ ...prev, timezone: inferredTimezone }));

        console.log('Timezone automatically set to:', inferredTimezone);
      } catch (err) {
        console.error('Error inferring timezone:', err);
        // Fallback to browser timezone on error
        const browserTz = getBrowserTimezone();
        setFormData(prev => ({ ...prev, timezone: browserTz }));
        console.log('Timezone fallback to browser timezone:', browserTz);
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
          setFieldErrors({ phone: t('receiverRegistration.phoneExists') });
          setError(t('receiverRegistration.phoneExistsError'));
          setLoading(false);
          return;
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          t('receiverRegistration.phoneValidationError');
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

  const handleStepClick = step => {
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
        formData.country,
      ]
        .filter(Boolean)
        .join(', ');

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
          payload.append(
            'charityRegistrationNumber',
            formData.charityRegistrationNumber
          );
        }

        payload.append('supportingDocument', formData.supportingDocument);
        payload.append('address', fullAddress);
        payload.append('contactPerson', formData.contactPerson);
        payload.append('phone', formatPhoneNumber(formData.phone));
        payload.append('capacity', parseInt(formData.capacity));
        payload.append('dataStorageConsent', dataStorageConsent);
        payload.append('timezone', formData.timezone || 'UTC');
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
          capacity: parseInt(formData.capacity),
          dataStorageConsent: dataStorageConsent,
          timezone: formData.timezone || 'UTC',
        };
      }

      const response = await authAPI.registerReceiver(payload);

      // Extract token, role, userId, organizationName, verificationStatus, and accountStatus from response
      const token = response?.data?.token;
      const userRole = response?.data?.role;
      const userId = response?.data?.userId;
      const organizationName = response?.data?.organizationName;
      const verificationStatus =
        response?.data?.verificationStatus || 'pending_verification';
      const accountStatus =
        response?.data?.accountStatus || 'PENDING_VERIFICATION';

      if (token && userRole && userId) {
        login(
          token,
          userRole,
          userId,
          organizationName,
          verificationStatus,
          accountStatus
        );
      }

      setSubmitted(true);

      // Auto-redirect after 5 seconds
      setTimeout(() => {
        navigate('/receiver');
      }, 5000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.message === 'Network Error'
          ? 'Network error. Please check your connection and try again.'
          : t('receiverRegistration.registrationFailed'));
      setError(errorMessage);

      // If it's a network/upload error, stay on the current step so user can retry
      if (err.message === 'Network Error' || err.response?.status >= 500) {
        // Stay on current step for retry
      } else {
        setCurrentStep(1); // Go back to first step on validation error
      }
    } finally {
      setLoading(false);
    }
  };

  // Success screen after submission
  if (submitted) {
    return (
      <div className="registration-page receiver-registration">
        <div className="background-image">
          <img
            src={ReceiverIllustration}
            alt={t('receiverRegistration.title')}
            height={500}
            width={900}
          />
        </div>
        <div className="form-container">
          <div className="success-screen">
            <div className="success-icon">✓</div>
            <h1>{t('receiverRegistration.successTitle')}</h1>
            <div className="success-details">
              <p className="status-badge">
                {t('receiverRegistration.successStatus')}
              </p>
              <p className="success-message">
                {t('receiverRegistration.successMessage')}
              </p>
              <div className="info-box">
                <h3>{t('receiverRegistration.successNextStepsTitle')}</h3>
                <ul>
                  <li>{t('receiverRegistration.successStep1')}</li>
                  <li>{t('receiverRegistration.successStep2')}</li>
                  <li>{t('receiverRegistration.successStep3')}</li>
                  <li>{t('receiverRegistration.successStep4')}</li>
                </ul>
              </div>
              <p className="redirect-message">
                {t('receiverRegistration.successRedirectMessage')}
              </p>
              <button
                className="submit-button"
                onClick={() => navigate('/receiver')}
              >
                {t('receiverRegistration.successDashboardButton')}
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
      {[1, 2, 3, 4, 5].map(step => (
        <div
          key={step}
          className="step-item"
          onClick={() => handleStepClick(step)}
          style={{ cursor: step <= currentStep ? 'pointer' : 'default' }}
        >
          <div
            className={`step-number ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
          >
            {currentStep > step ? '✓' : step}
          </div>
        </div>
      ))}
    </div>
  );

  // Get step title
  const getStepTitle = step => {
    switch (step) {
      case 1:
        return t('receiverRegistration.step1Title');
      case 2:
        return t('receiverRegistration.step2Title');
      case 3:
        return t('receiverRegistration.step3Title');
      case 4:
        return t('receiverRegistration.step4Title');
      case 5:
        return t('receiverRegistration.step5Title');
      default:
        return '';
    }
  };

  const getOrganizationTypeLabel = value => {
    const keyMap = {
      CHARITY: 'charity',
      SHELTER: 'shelter',
      COMMUNITY_KITCHEN: 'communityKitchen',
      FOOD_BANK: 'foodBank',
      NONPROFIT: 'nonprofit',
      RELIGIOUS_ORG: 'religiousOrg',
      SCHOOL: 'school',
      SENIOR_CENTER: 'seniorCenter',
      YOUTH_CENTER: 'youthCenter',
      COMMUNITY_CENTER: 'communityCenter',
      HOMELESS_SERVICES: 'homelessServices',
      REFUGEE_CENTER: 'refugeeCenter',
      OTHER: 'other',
    };

    return keyMap[value]
      ? t(`receiverRegistration.organizationTypes.${keyMap[value]}`)
      : value?.replace(/_/g, ' ') || '';
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content fade-in">
            <div className="form-group">
              <label htmlFor="email">
                {t('receiverRegistration.emailLabel')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t('receiverRegistration.emailPlaceholder')}
                className={fieldErrors.email ? 'error' : ''}
              />
              {fieldErrors.email && (
                <span className="error-text">{fieldErrors.email}</span>
              )}
            </div>

            <div className="form-group password-wrapper">
              <label htmlFor="password">
                {t('receiverRegistration.passwordLabel')}
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('receiverRegistration.passwordPlaceholder')}
                  className={fieldErrors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={
                    showPassword
                      ? t('common.hidePassword')
                      : t('common.showPassword')
                  }
                >
                  {showPassword
                    ? t('receiverRegistration.hidePassword')
                    : t('receiverRegistration.showPassword')}
                </button>
              </div>
              <small>{t('receiverRegistration.passwordMinLengthHint')}</small>
              {fieldErrors.password && (
                <span className="error-text">{fieldErrors.password}</span>
              )}
            </div>

            <div className="form-group password-wrapper">
              <label htmlFor="confirmPassword">
                {t('receiverRegistration.confirmPasswordLabel')}
              </label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t(
                    'receiverRegistration.confirmPasswordPlaceholder'
                  )}
                  className={fieldErrors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(s => !s)}
                  aria-label={
                    showConfirmPassword
                      ? t('common.hidePassword')
                      : t('common.showPassword')
                  }
                >
                  {showConfirmPassword
                    ? t('receiverRegistration.hidePassword')
                    : t('receiverRegistration.showPassword')}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="error-text">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content fade-in">
            <div className="form-group">
              <label htmlFor="organizationName">
                {t('receiverRegistration.organizationNameLabel')}
              </label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t(
                  'receiverRegistration.organizationNamePlaceholder'
                )}
                className={fieldErrors.organizationName ? 'error' : ''}
              />
              {fieldErrors.organizationName && (
                <span className="error-text">
                  {fieldErrors.organizationName}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="organizationType">
                {t('receiverRegistration.organizationTypeLabel')}
              </label>
              <select
                id="organizationType"
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldErrors.organizationType ? 'error' : ''}
              >
                <option value="">
                  {t('receiverRegistration.organizationTypeSelect')}
                </option>
                <option value="CHARITY">
                  {t('receiverRegistration.organizationTypes.charity')}
                </option>
                <option value="SHELTER">
                  {t('receiverRegistration.organizationTypes.shelter')}
                </option>
                <option value="COMMUNITY_KITCHEN">
                  {t('receiverRegistration.organizationTypes.communityKitchen')}
                </option>
                <option value="FOOD_BANK">
                  {t('receiverRegistration.organizationTypes.foodBank')}
                </option>
                <option value="NONPROFIT">
                  {t('receiverRegistration.organizationTypes.nonprofit')}
                </option>
                <option value="RELIGIOUS_ORG">
                  {t('receiverRegistration.organizationTypes.religiousOrg')}
                </option>
                <option value="SCHOOL">
                  {t('receiverRegistration.organizationTypes.school')}
                </option>
                <option value="SENIOR_CENTER">
                  {t('receiverRegistration.organizationTypes.seniorCenter')}
                </option>
                <option value="YOUTH_CENTER">
                  {t('receiverRegistration.organizationTypes.youthCenter')}
                </option>
                <option value="COMMUNITY_CENTER">
                  {t('receiverRegistration.organizationTypes.communityCenter')}
                </option>
                <option value="HOMELESS_SERVICES">
                  {t('receiverRegistration.organizationTypes.homelessServices')}
                </option>
                <option value="REFUGEE_CENTER">
                  {t('receiverRegistration.organizationTypes.refugeeCenter')}
                </option>
                <option value="OTHER">
                  {t('receiverRegistration.organizationTypes.other')}
                </option>
              </select>
              {fieldErrors.organizationType && (
                <span className="error-text">
                  {fieldErrors.organizationType}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="charityRegistrationNumber">
                {t('receiverRegistration.charityRegistrationLabel')}
              </label>
              <input
                type="text"
                id="charityRegistrationNumber"
                name="charityRegistrationNumber"
                value={formData.charityRegistrationNumber}
                onChange={handleChange}
                placeholder={t(
                  'receiverRegistration.charityRegistrationPlaceholder'
                )}
              />
              <small>{t('receiverRegistration.charityRegistrationHint')}</small>
            </div>

            <div className="verification-divider">
              <span>{t('receiverRegistration.orDivider')}</span>
            </div>

            <div className="form-group">
              <label>{t('receiverRegistration.supportingDocumentLabel')}</label>
              <div
                className={`file-upload-area compact ${isDragging ? 'dragging' : ''} ${fieldErrors.supportingDocument ? 'error' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!formData.supportingDocument ? (
                  <>
                    <label
                      htmlFor="fileUpload"
                      className="upload-button-compact"
                    >
                      {t('receiverRegistration.chooseFileButton')}
                    </label>
                    <input
                      type="file"
                      id="fileUpload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <small>{t('receiverRegistration.fileTypeHint')}</small>
                  </>
                ) : (
                  <div className="file-preview-compact">
                    <span className="file-icon">📎</span>
                    <span className="file-name">
                      {formData.supportingDocument.name}
                    </span>
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
              {fieldErrors.supportingDocument && (
                <span className="error-text">
                  {fieldErrors.supportingDocument}
                </span>
              )}
              {fieldErrors.verification && (
                <span className="error-text">{fieldErrors.verification}</span>
              )}
              <small className="help-text">
                {t('receiverRegistration.documentRequiredHint')}
              </small>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content fade-in">
            <div className="form-group">
              <label htmlFor="streetAddress">
                {t('receiverRegistration.streetAddressLabel')}
              </label>
              <input
                type="text"
                id="streetAddress"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t('receiverRegistration.streetAddressPlaceholder')}
                className={fieldErrors.streetAddress ? 'error' : ''}
              />
              {fieldErrors.streetAddress && (
                <span className="error-text">{fieldErrors.streetAddress}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="unit">
                {t('receiverRegistration.unitLabel')}
              </label>
              <input
                type="text"
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder={t('receiverRegistration.unitPlaceholder')}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">
                  {t('receiverRegistration.cityLabel')}
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('receiverRegistration.cityPlaceholder')}
                  className={fieldErrors.city ? 'error' : ''}
                />
                {fieldErrors.city && (
                  <span className="error-text">{fieldErrors.city}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="postalCode">
                  {t('receiverRegistration.postalCodeLabel')}
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('receiverRegistration.postalCodePlaceholder')}
                  className={fieldErrors.postalCode ? 'error' : ''}
                />
                {fieldErrors.postalCode && (
                  <span className="error-text">{fieldErrors.postalCode}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="province">
                  {t('receiverRegistration.provinceLabel')}
                </label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('receiverRegistration.provincePlaceholder')}
                  className={fieldErrors.province ? 'error' : ''}
                />
                {fieldErrors.province && (
                  <span className="error-text">{fieldErrors.province}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="country">
                  {t('receiverRegistration.countryLabel')}
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('receiverRegistration.countryPlaceholder')}
                  className={fieldErrors.country ? 'error' : ''}
                />
                {fieldErrors.country && (
                  <span className="error-text">{fieldErrors.country}</span>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content fade-in">
            <div className="form-group">
              <label htmlFor="contactPerson">
                {t('receiverRegistration.contactPersonLabel')}
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t('receiverRegistration.contactPersonPlaceholder')}
                className={fieldErrors.contactPerson ? 'error' : ''}
              />
              {fieldErrors.contactPerson && (
                <span className="error-text">{fieldErrors.contactPerson}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                {t('receiverRegistration.phoneLabel')}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t('receiverRegistration.phonePlaceholder')}
                className={fieldErrors.phone ? 'error' : ''}
              />
              {fieldErrors.phone && (
                <span className="error-text">{fieldErrors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="capacity">
                {t('receiverRegistration.capacityLabel')}
              </label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t('receiverRegistration.capacityPlaceholder')}
                min="1"
                className={fieldErrors.capacity ? 'error' : ''}
              />
              <small>{t('receiverRegistration.capacityHint')}</small>
              {fieldErrors.capacity && (
                <span className="error-text">{fieldErrors.capacity}</span>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content fade-in">
            <div className="review-section compact">
              <h3>{t('receiverRegistration.reviewAccountTitle')}</h3>
              <div className="review-item">
                <span className="review-label">
                  {t('receiverRegistration.reviewEmail')}
                </span>
                <span className="review-value">{formData.email}</span>
              </div>
            </div>

            <div className="review-section compact">
              <h3>{t('receiverRegistration.reviewOrgTitle')}</h3>
              <div className="review-item">
                <span className="review-label">
                  {t('receiverRegistration.reviewOrgName')}
                </span>
                <span className="review-value">
                  {formData.organizationName}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">
                  {t('receiverRegistration.reviewOrgType')}
                </span>
                <span className="review-value">
                  {getOrganizationTypeLabel(formData.organizationType)}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">
                  {t('receiverRegistration.reviewVerificationMethod')}
                </span>
                <span className="review-value">
                  {formData.charityRegistrationNumber
                    ? t('receiverRegistration.reviewRegistrationNumber', {
                        number: formData.charityRegistrationNumber,
                      })
                    : t('receiverRegistration.reviewDocument', {
                        filename: formData.supportingDocument?.name,
                      })}
                </span>
              </div>
            </div>

            <div className="review-section compact">
              <h3>{t('receiverRegistration.reviewLocationTitle')}</h3>
              <div className="review-item">
                <span className="review-label">
                  {t('receiverRegistration.reviewAddress')}
                </span>
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
              <h3>{t('receiverRegistration.reviewOperationsTitle')}</h3>
              <div className="review-item">
                <span className="review-label">
                  {t('receiverRegistration.reviewContactPerson')}
                </span>
                <span className="review-value">{formData.contactPerson}</span>
              </div>
              <div className="review-item">
                <span className="review-label">
                  {t('receiverRegistration.reviewPhone')}
                </span>
                <span className="review-value">{formData.phone}</span>
              </div>
              <div className="review-item">
                <span className="review-label">
                  {t('receiverRegistration.reviewCapacity')}
                </span>
                <span className="review-value">
                  {t('receiverRegistration.reviewCapacityPeople', {
                    capacity: formData.capacity,
                  })}
                </span>
              </div>
            </div>

            <div className="form-group confirmation-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={confirmAccuracy}
                  onChange={e => {
                    setConfirmAccuracy(e.target.checked);
                    if (fieldErrors.confirmAccuracy) {
                      setFieldErrors({ ...fieldErrors, confirmAccuracy: '' });
                    }
                  }}
                />
                <span>{t('receiverRegistration.confirmAccuracyLabel')}</span>
              </label>
              {fieldErrors.confirmAccuracy && (
                <span className="error-text">
                  {fieldErrors.confirmAccuracy}
                </span>
              )}
            </div>

            <div className="form-group confirmation-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={dataStorageConsent}
                  onChange={e => setDataStorageConsent(e.target.checked)}
                />
                <span>
                  {t('registration.dataConsentPrefix')}{' '}
                  <Link
                    to="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#609B7E', textDecoration: 'underline' }}
                  >
                    {t('registration.privacyPolicy')}
                  </Link>
                </span>
              </label>
            </div>

            <div className="info-box">
              <p>
                <strong>{t('receiverRegistration.nextStepsInfoTitle')}</strong>
              </p>
              <p>{t('receiverRegistration.nextStepsInfo')}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="registration-page receiver-registration">
      <SEOHead noindex />
      <button
        type="button"
        className="exit-registration-button"
        onClick={() => navigate('/register')}
        aria-label={t('receiverRegistration.backToRegistration')}
      >
        {`← ${t('receiverRegistration.backButtonText')}`}
      </button>
      <div className="background-image">
        <img
          src={ReceiverIllustration}
          alt={t('receiverRegistration.title')}
          height={500}
          width={900}
        />
        <p>{t('receiverRegistration.subtitle')}</p>
      </div>
      <div className={`form-container ${currentStep === 5 ? 'step-5' : ''}`}>
        <div className="form-header-fixed">
          <h1>{t('receiverRegistration.title')}</h1>
          <p className="form-subtitle">
            {t('receiverRegistration.stepOf', {
              current: currentStep,
              total: totalSteps,
            })}
          </p>
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
                  {t('receiverRegistration.backButtonText')}
                </button>
              ) : (
                <button
                  type="button"
                  className="back-button"
                  onClick={() => navigate('/register')}
                >
                  {t('receiverRegistration.cancelButtonText')}
                </button>
              )}
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  className="submit-button"
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep)}
                >
                  {t('receiverRegistration.nextButtonText')}
                </button>
              ) : (
                <button
                  type="button"
                  className="submit-button"
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    !confirmAccuracy ||
                    !dataStorageConsent ||
                    !isStepValid(currentStep)
                  }
                >
                  {loading
                    ? t('receiverRegistration.submittingButtonText')
                    : t('receiverRegistration.registerButtonText')}
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
