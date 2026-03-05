import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import DonorIllustration from '../assets/illustrations/donor-illustration.jpg';
import { validatePassword } from '../utils/passwordValidation';
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

const DonorRegistration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form data
  const [formData, setFormData] = useState({
    // Step 1
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2
    organizationName: '',
    organizationType: 'RESTAURANT',
    businessLicense: '',
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
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [dataStorageConsent, setDataStorageConsent] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
        supportingDocument: t('donorRegistration.fileTypeError'),
      });
      return;
    }

    if (file.size > maxSize) {
      setFieldErrors({
        ...fieldErrors,
        supportingDocument: t('donorRegistration.fileSizeError'),
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

  const handleBlur = e => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let errorMsg = '';

    switch (name) {
      case 'email':
        if (!value) {
          errorMsg = t('donorRegistration.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMsg = t('donorRegistration.emailInvalid');
        }
        break;
      case 'password':
        if (!value) {
          errorMsg = t('donorRegistration.passwordRequired');
        } else {
          const passwordErrors = validatePassword(value);
          if (passwordErrors.length > 0) {
            errorMsg = passwordErrors.join('; ');
          }
        }
        break;
      case 'confirmPassword':
        if (!value) {
          errorMsg = t('donorRegistration.confirmPasswordRequired');
        } else if (value !== formData.password) {
          errorMsg = t('donorRegistration.passwordMismatch');
        }
        break;
      case 'phone':
        if (value && !validatePhoneNumber(value)) {
          errorMsg = t('donorRegistration.phoneInvalid');
        }
        break;
      case 'postalCode':
        if (value && !/^[A-Za-z0-9\s-]+$/.test(value)) {
          errorMsg = t('donorRegistration.postalCodeInvalid');
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

  const validateStep = step => {
    const errors = {};

    switch (step) {
      case 1:
        if (!formData.email) {
          errors.email = t('donorRegistration.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = t('donorRegistration.emailInvalid');
        }

        if (!formData.password) {
          errors.password = t('donorRegistration.passwordRequired');
        } else {
          const passwordErrors = validatePassword(formData.password);
          if (passwordErrors.length > 0) {
            errors.password = passwordErrors.join('; ');
          }
        }

        if (!formData.confirmPassword) {
          errors.confirmPassword = t(
            'donorRegistration.confirmPasswordRequired'
          );
        } else if (formData.confirmPassword !== formData.password) {
          errors.confirmPassword = t('donorRegistration.passwordMismatch');
        }
        break;

      case 2:
        if (!formData.organizationName) {
          errors.organizationName = t(
            'donorRegistration.organizationNameRequired'
          );
        }
        if (!formData.organizationType) {
          errors.organizationType = t(
            'donorRegistration.organizationTypeRequired'
          );
        }

        // Either business license OR supporting document required
        if (!formData.businessLicense && !formData.supportingDocument) {
          errors.verification = t('donorRegistration.verificationRequired');
        }
        break;

      case 3:
        if (!formData.streetAddress) {
          errors.streetAddress = t('donorRegistration.streetAddressRequired');
        }
        if (!formData.city) {
          errors.city = t('donorRegistration.cityRequired');
        }
        if (!formData.postalCode) {
          errors.postalCode = t('donorRegistration.postalCodeRequired');
        }
        if (!formData.province) {
          errors.province = t('donorRegistration.provinceRequired');
        }
        if (!formData.country) {
          errors.country = t('donorRegistration.countryRequired');
        }
        break;

      case 4:
        if (!formData.contactPerson) {
          errors.contactPerson = t('donorRegistration.contactPersonRequired');
        }
        if (!formData.phone) {
          errors.phone = t('donorRegistration.phoneRequired');
        } else if (!validatePhoneNumber(formData.phone)) {
          errors.phone = t('donorRegistration.phoneInvalid');
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
      setError(t('donorRegistration.errorBeforeProceeding'));
      return;
    }

    // Check email exists before leaving step 1 (Account Credentials)
    if (currentStep === 1) {
      setLoading(true);
      try {
        const response = await authAPI.checkEmailExists(formData.email);
        if (response.data.exists) {
          setFieldErrors({ email: t('donorRegistration.emailExists') });
          setError(t('donorRegistration.emailExistsError'));
          setLoading(false);
          return;
        }
      } catch (err) {
        setError(t('donorRegistration.emailValidationError'));
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

    // Check phone exists before submitting
    try {
      const formattedPhone = formatPhoneNumber(formData.phone);
      const response = await authAPI.checkPhoneExists(formattedPhone);
      if (response.data.exists) {
        setFieldErrors({
          phone: t('donorRegistration.phoneExists'),
        });
        setError(t('donorRegistration.phoneExistsError'));
        setLoading(false);
        return;
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        t('donorRegistration.phoneValidationError');
      setError(errorMessage);
      setLoading(false);
      return;
    }

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

        if (formData.businessLicense) {
          payload.append('businessLicense', formData.businessLicense);
        }

        payload.append('supportingDocument', formData.supportingDocument);
        payload.append('address', fullAddress);
        payload.append('contactPerson', formData.contactPerson);
        payload.append('phone', formatPhoneNumber(formData.phone));
        payload.append('dataStorageConsent', dataStorageConsent);
      } else {
        // Use JSON payload if no file
        payload = {
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          organizationName: formData.organizationName,
          organizationType: formData.organizationType,
          businessLicense: formData.businessLicense || '',
          address: fullAddress,
          contactPerson: formData.contactPerson,
          phone: formatPhoneNumber(formData.phone),
          dataStorageConsent: dataStorageConsent,
        };
      }

      const response = await authAPI.registerDonor(payload);

      // Extract token, role, userId, organizationName, verificationStatus, and accountStatus from response
      const token = response?.data?.token;
      const userRole = response?.data?.role;
      const userId = response?.data?.userId;
      const organizationName = response?.data?.organizationName;
      const verificationStatus =
        response?.data?.verificationStatus || 'verified';
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
        navigate('/donor');
      }, 5000);
    } catch (err) {
      setError(
        err.response?.data?.message || t('donorRegistration.registrationFailed')
      );
      setCurrentStep(1); // Go back to first step on error
    } finally {
      setLoading(false);
    }
  };

  // Success screen after submission
  if (submitted) {
    return (
      <div className="registration-page">
        <button
          type="button"
          className="exit-registration-button"
          onClick={() => navigate('/register')}
          aria-label={t('donorRegistration.backToRegistration')}
        >
          {`← ${t('donorRegistration.backButtonText')}`}
        </button>
        <div className="background-image">
          <img
            src={DonorIllustration}
            alt={t('donorRegistration.title')}
            height={500}
            width={900}
          />
        </div>
        <div className="form-container">
          <div className="success-screen">
            <div className="success-icon">✓</div>
            <h1>{t('donorRegistration.successTitle')}</h1>
            <div className="success-details">
              <p className="status-badge">
                {t('donorRegistration.successStatus')}
              </p>
              <p className="success-message">
                {t('donorRegistration.successMessage')}
              </p>
              <div className="info-box">
                <h3>{t('donorRegistration.successNextStepsTitle')}</h3>
                <ul>
                  <li>{t('donorRegistration.successStep1')}</li>
                  <li>{t('donorRegistration.successStep2')}</li>
                  <li>{t('donorRegistration.successStep3')}</li>
                  <li>{t('donorRegistration.successStep4')}</li>
                </ul>
              </div>
              <p className="redirect-message">
                {t('donorRegistration.successRedirectMessage')}
              </p>
              <button
                className="submit-button"
                onClick={() => navigate('/donor')}
              >
                {t('donorRegistration.successDashboardButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get step title
  const getStepTitle = step => {
    switch (step) {
      case 1:
        return t('donorRegistration.step1Title');
      case 2:
        return t('donorRegistration.step2Title');
      case 3:
        return t('donorRegistration.step3Title');
      case 4:
        return t('donorRegistration.step4Title');
      default:
        return '';
    }
  };

  const getOrganizationTypeLabel = value => {
    const keyMap = {
      RESTAURANT: 'restaurant',
      GROCERY_STORE: 'groceryStore',
      BAKERY: 'bakery',
      CAFE: 'cafe',
      CATERING: 'catering',
      HOTEL: 'hotel',
      EVENT_ORGANIZER: 'eventOrganizer',
      FARM: 'farm',
      FOOD_MANUFACTURER: 'foodManufacturer',
      OTHER: 'other',
    };

    return keyMap[value]
      ? t(`donorRegistration.organizationTypes.${keyMap[value]}`)
      : value?.replace(/_/g, ' ') || '';
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3, 4].map(step => (
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

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content fade-in">
            <div className="form-group">
              <label htmlFor="email">{t('donorRegistration.emailLabel')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t('donorRegistration.emailPlaceholder')}
                className={fieldErrors.email ? 'error' : ''}
              />
              {fieldErrors.email && (
                <span className="error-text">{fieldErrors.email}</span>
              )}
            </div>

            <div className="form-group password-wrapper">
              <label htmlFor="password">
                {t('donorRegistration.passwordLabel')}
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('donorRegistration.passwordPlaceholder')}
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
                    ? t('donorRegistration.hidePassword')
                    : t('donorRegistration.showPassword')}
                </button>
              </div>
              <small>{t('donorRegistration.passwordMinLengthHint')}</small>
              {fieldErrors.password && (
                <span className="error-text">{fieldErrors.password}</span>
              )}
            </div>

            <div className="form-group password-wrapper">
              <label htmlFor="confirmPassword">
                {t('donorRegistration.confirmPasswordLabel')}
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
                    'donorRegistration.confirmPasswordPlaceholder'
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
                    ? t('donorRegistration.hidePassword')
                    : t('donorRegistration.showPassword')}
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
                {t('donorRegistration.organizationNameLabel')}
              </label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t('donorRegistration.organizationNamePlaceholder')}
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
                {t('donorRegistration.organizationTypeLabel')}
              </label>
              <select
                id="organizationType"
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldErrors.organizationType ? 'error' : ''}
              >
                <option value="RESTAURANT">
                  {t('donorRegistration.organizationTypes.restaurant')}
                </option>
                <option value="GROCERY_STORE">
                  {t('donorRegistration.organizationTypes.groceryStore')}
                </option>
                <option value="BAKERY">
                  {t('donorRegistration.organizationTypes.bakery')}
                </option>
                <option value="CAFE">
                  {t('donorRegistration.organizationTypes.cafe')}
                </option>
                <option value="CATERING">
                  {t('donorRegistration.organizationTypes.catering')}
                </option>
                <option value="HOTEL">
                  {t('donorRegistration.organizationTypes.hotel')}
                </option>
                <option value="EVENT_ORGANIZER">
                  {t('donorRegistration.organizationTypes.eventOrganizer')}
                </option>
                <option value="FARM">
                  {t('donorRegistration.organizationTypes.farm')}
                </option>
                <option value="FOOD_MANUFACTURER">
                  {t('donorRegistration.organizationTypes.foodManufacturer')}
                </option>
                <option value="OTHER">
                  {t('donorRegistration.organizationTypes.other')}
                </option>
              </select>
              {fieldErrors.organizationType && (
                <span className="error-text">
                  {fieldErrors.organizationType}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="businessLicense">
                {t('donorRegistration.businessLicenseLabel')}
              </label>
              <input
                type="text"
                id="businessLicense"
                name="businessLicense"
                value={formData.businessLicense}
                onChange={handleChange}
                placeholder={t('donorRegistration.businessLicensePlaceholder')}
              />
              <small>{t('donorRegistration.businessLicenseHint')}</small>
            </div>

            <div className="verification-divider">
              <span>{t('donorRegistration.orDivider')}</span>
            </div>

            <div className="form-group">
              <label>{t('donorRegistration.supportingDocumentLabel')}</label>
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
                      {t('donorRegistration.chooseFileButton')}
                    </label>
                    <input
                      type="file"
                      id="fileUpload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <small>{t('donorRegistration.fileTypeHint')}</small>
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
                {t('donorRegistration.documentRequiredHint')}
              </small>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content fade-in">
            <div className="form-group">
              <label htmlFor="streetAddress">
                {t('donorRegistration.streetAddressLabel')}
              </label>
              <input
                type="text"
                id="streetAddress"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t('donorRegistration.streetAddressPlaceholder')}
                className={fieldErrors.streetAddress ? 'error' : ''}
              />
              {fieldErrors.streetAddress && (
                <span className="error-text">{fieldErrors.streetAddress}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="unit">{t('donorRegistration.unitLabel')}</label>
              <input
                type="text"
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder={t('donorRegistration.unitPlaceholder')}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">{t('donorRegistration.cityLabel')}</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('donorRegistration.cityPlaceholder')}
                  className={fieldErrors.city ? 'error' : ''}
                />
                {fieldErrors.city && (
                  <span className="error-text">{fieldErrors.city}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="postalCode">
                  {t('donorRegistration.postalCodeLabel')}
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('donorRegistration.postalCodePlaceholder')}
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
                  {t('donorRegistration.provinceLabel')}
                </label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('donorRegistration.provincePlaceholder')}
                  className={fieldErrors.province ? 'error' : ''}
                />
                {fieldErrors.province && (
                  <span className="error-text">{fieldErrors.province}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="country">
                  {t('donorRegistration.countryLabel')}
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('donorRegistration.countryPlaceholder')}
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
                {t('donorRegistration.contactPersonLabel')}
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t('donorRegistration.contactPersonPlaceholder')}
                className={fieldErrors.contactPerson ? 'error' : ''}
              />
              {fieldErrors.contactPerson && (
                <span className="error-text">{fieldErrors.contactPerson}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">{t('donorRegistration.phoneLabel')}</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t('donorRegistration.phonePlaceholder')}
                className={fieldErrors.phone ? 'error' : ''}
              />
              {fieldErrors.phone && (
                <span className="error-text">{fieldErrors.phone}</span>
              )}
            </div>

            <div className="review-section compact">
              <h3>{t('donorRegistration.reviewSectionTitle')}</h3>
              <div className="review-item">
                <span className="review-label">
                  {t('donorRegistration.reviewEmail')}
                </span>
                <span className="review-value">{formData.email}</span>
              </div>
              <div className="review-item">
                <span className="review-label">
                  {t('donorRegistration.reviewOrganization')}
                </span>
                <span className="review-value">
                  {formData.organizationName}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">
                  {t('donorRegistration.reviewType')}
                </span>
                <span className="review-value">
                  {getOrganizationTypeLabel(formData.organizationType)}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">
                  {t('donorRegistration.reviewVerificationMethod')}
                </span>
                <span className="review-value">
                  {formData.businessLicense
                    ? t('donorRegistration.reviewBusinessLicense', {
                        license: formData.businessLicense,
                      })
                    : t('donorRegistration.reviewDocument', {
                        filename: formData.supportingDocument?.name,
                      })}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">
                  {t('donorRegistration.reviewAddress')}
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

            <div className="form-group confirmation-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={confirmAccuracy}
                  onChange={e => setConfirmAccuracy(e.target.checked)}
                />
                <span>{t('donorRegistration.confirmAccuracyLabel')}</span>
              </label>
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="registration-page">
      <button
        type="button"
        className="exit-registration-button"
        onClick={() => navigate('/register')}
        aria-label={t('donorRegistration.backToRegistration')}
      >
        {`← ${t('donorRegistration.backButtonText')}`}
      </button>
      <div className="background-image">
        <img
          src={DonorIllustration}
          alt={t('donorRegistration.title')}
          height={500}
          width={900}
        />
        <p>{t('donorRegistration.subtitle')}</p>
      </div>
      <div className={`form-container ${currentStep === 4 ? 'step-4' : ''}`}>
        <div className="form-header-fixed">
          <h1>{t('donorRegistration.title')}</h1>
          <p className="form-subtitle">
            {t('donorRegistration.stepOf', {
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
                  {t('donorRegistration.backButtonText')}
                </button>
              ) : (
                <button
                  type="button"
                  className="back-button"
                  onClick={() => navigate('/register')}
                >
                  {t('donorRegistration.cancelButtonText')}
                </button>
              )}
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  className="submit-button"
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep)}
                >
                  {t('donorRegistration.nextButtonText')}
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
                    ? t('donorRegistration.submittingButtonText')
                    : t('donorRegistration.registerButtonText')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorRegistration;
