import React, { useState, useRef, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Globe, Bell, Camera, Lock } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';
import RegionSelector from '../RegionSelector';
import ChangePasswordModal from '../ChangePasswordModal';
import { AuthContext } from '../../contexts/AuthContext';
import './Admin_Styles/AdminSettings.css';

/**
 * Admin Settings page (standalone, with admin-specific logic)
 */
const AdminSettings = () => {
  const { t } = useTranslation();
  const { userId, organizationName, role } = useContext(AuthContext);

  // Admin-specific notification categories
  const notificationCategories = {
    ADMIN: {
      systemOversight: [
        {
          key: 'donationFlagged',
          labelKey: 'donationFlagged',
          descKey: 'donationFlaggedDesc',
        },
        {
          key: 'suspiciousActivity',
          labelKey: 'suspiciousActivity',
          descKey: 'suspiciousActivityDesc',
        },
        {
          key: 'verificationRequest',
          labelKey: 'verificationRequest',
          descKey: 'verificationRequestDesc',
        },
      ],
      disputeCompliance: [
        {
          key: 'newDispute',
          labelKey: 'newDispute',
          descKey: 'newDisputeDesc',
        },
        {
          key: 'escalatedIssue',
          labelKey: 'escalatedIssue',
          descKey: 'escalatedIssueDesc',
        },
        {
          key: 'safetyAlert',
          labelKey: 'safetyAlert',
          descKey: 'safetyAlertDesc',
        },
      ],
      operational: [
        {
          key: 'systemError',
          labelKey: 'systemError',
          descKey: 'systemErrorDesc',
        },
        {
          key: 'highVolumeDonation',
          labelKey: 'highVolumeDonation',
          descKey: 'highVolumeDonationDesc',
        },
      ],
    },
  };

  // Initialize notifications with all enabled by default
  const [notifications, setNotifications] = useState({});
  useEffect(() => {
    if (role === 'ADMIN' && Object.keys(notifications).length === 0) {
      const initialNotifications = {};
      Object.values(notificationCategories.ADMIN)
        .flat()
        .forEach(notification => {
          initialNotifications[notification.key] = true;
        });
      setNotifications(initialNotifications);
    }
  }, [role]);

  // Profile form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    organization: organizationName || '',
    address: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [regionSettings, setRegionSettings] = useState(null);
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailAlerts: false,
    smsAlerts: false,
    smsPhoneNumber: '',
  });
  const [preferencesMessage, setPreferencesMessage] = useState('');
  const [preferencesError, setPreferencesError] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);
  useEffect(() => {
    if (organizationName && !formData.organization) {
      setFormData(prev => ({ ...prev, organization: organizationName }));
    }
  }, [organizationName]);
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  useEffect(() => {
    if (preferencesMessage || preferencesError) {
      const timer = setTimeout(() => {
        setPreferencesMessage('');
        setPreferencesError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [preferencesMessage, preferencesError]);

  const fetchUserProfile = async () => {
    setLoadingProfile(false);
  };

  const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhoneNumber = phone =>
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(
      phone
    );
  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName || formData.fullName.trim().length === 0) {
      newErrors.fullName = t('adminSettings.validation.fullNameRequired');
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t('adminSettings.validation.fullNameMin');
    }
    if (!formData.email || formData.email.trim().length === 0) {
      newErrors.email = t('adminSettings.validation.emailRequired');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('adminSettings.validation.emailInvalid');
    }
    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = t('adminSettings.validation.phoneInvalid');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  const handlePasswordChange = e => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  const handleToggle = key => {
    setNotifications(prev => ({ ...prev, [key]: !notifications[key] }));
  };
  const handleRegionChange = regionData => {
    if (JSON.stringify(regionData) !== JSON.stringify(regionSettings)) {
      setRegionSettings(regionData);
    }
  };
  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ profileImage: t('adminSettings.validation.imageSize') });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors({ profileImage: t('adminSettings.validation.imageFile') });
        return;
      }
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
      if (errors.profileImage) {
        setErrors(prev => ({ ...prev, profileImage: '' }));
      }
    }
  };
  const triggerFileInput = () => fileInputRef.current?.click();
  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    setSuccessMessage('');
    setErrors({});
    try {
      setTimeout(() => {
        setSuccessMessage(t('adminSettings.messages.profileUpdated'));
        setLoading(false);
      }, 500);
    } catch (error) {
      setErrors({ submit: t('adminSettings.messages.updateFailed') });
      setLoading(false);
    }
  };
  const handleEmailAlertsToggle = () => {
    const newValue = !notificationPreferences.emailAlerts;
    setNotificationPreferences(prev => ({ ...prev, emailAlerts: newValue }));
    const toast = document.createElement('div');
    toast.className = 'language-toast';
    toast.textContent = t(
      newValue
        ? 'adminSettings.messages.emailAlertsEnabled'
        : 'adminSettings.messages.emailAlertsDisabled'
    );
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };
  const handleSmsAlertsToggle = () => {
    const newValue = !notificationPreferences.smsAlerts;
    setNotificationPreferences(prev => ({ ...prev, smsAlerts: newValue }));
    const toast = document.createElement('div');
    toast.className = 'language-toast';
    toast.textContent = t(
      newValue
        ? 'adminSettings.messages.smsAlertsEnabled'
        : 'adminSettings.messages.smsAlertsDisabled'
    );
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  return (
    <div className="settings-container">
      <div className="settings-content">
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        {errors.submit && <div className="error-message">{errors.submit}</div>}
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <User size={24} />
            </div>
            <div className="section-title-group">
              <h2>{t('adminSettings.sections.account')}</h2>
              <p className="section-description">
                {t('adminSettings.descriptions.account')}
              </p>
            </div>
          </div>
          <div className="section-content">
            {loadingProfile ? (
              <div className="loading-spinner">
                {t('adminSettings.loading')}
              </div>
            ) : (
              <>
                <div className="profile-image-section">
                  <div className="profile-image-container">
                    <div className="profile-image-wrapper">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={t('adminSettings.profileAlt')}
                          className="profile-image"
                        />
                      ) : (
                        <div className="profile-image-placeholder">
                          <User size={48} />
                        </div>
                      )}
                      <button
                        className="profile-image-upload-btn"
                        onClick={triggerFileInput}
                        type="button"
                      >
                        <Camera size={18} />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                    <div className="profile-image-info">
                      <h3>{t('adminSettings.profilePhoto')}</h3>
                      <p>{t('adminSettings.profilePhotoDescription')}</p>
                      {errors.profileImage && (
                        <span className="field-error">
                          {errors.profileImage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="account-form-grid">
                  <div className="form-field">
                    <label className="field-label">
                      {t('adminSettings.fields.fullName')} *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      className={`field-input ${errors.fullName ? 'error' : ''}`}
                      placeholder={t('adminSettings.placeholders.fullName')}
                      value={formData.fullName}
                      onChange={handleInputChange}
                    />
                    {errors.fullName && (
                      <span className="field-error">{errors.fullName}</span>
                    )}
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      {t('adminSettings.fields.email')} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      className={`field-input ${errors.email ? 'error' : ''}`}
                      placeholder={t('adminSettings.placeholders.email')}
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    {errors.email && (
                      <span className="field-error">{errors.email}</span>
                    )}
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      {t('adminSettings.fields.organization')}
                    </label>
                    <input
                      type="text"
                      name="organization"
                      className="field-input"
                      placeholder={t('adminSettings.placeholders.organization')}
                      value={formData.organization}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      {t('adminSettings.fields.phone')}
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      className={`field-input ${errors.phoneNumber ? 'error' : ''}`}
                      placeholder={t('adminSettings.placeholders.phone')}
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                    />
                    {errors.phoneNumber && (
                      <span className="field-error">{errors.phoneNumber}</span>
                    )}
                  </div>
                  <div className="form-field form-field-full">
                    <label className="field-label">
                      {t('adminSettings.fields.address')}
                    </label>
                    <input
                      type="text"
                      name="address"
                      className="field-input"
                      placeholder={t('adminSettings.placeholders.address')}
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="password-section">
                  <button
                    className="password-toggle-btn"
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    type="button"
                  >
                    <Lock size={18} />
                    <span>{t('adminSettings.changePassword')}</span>
                  </button>
                </div>
                <button
                  className="save-changes-btn"
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  {loading
                    ? t('adminSettings.saving')
                    : t('adminSettings.saveChanges')}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <Globe size={24} />
            </div>
            <div className="section-title-group">
              <h2>{t('adminSettings.sections.languageRegion')}</h2>
              <p className="section-description">
                {t('adminSettings.descriptions.languageRegion')}
              </p>
            </div>
          </div>
          <div className="section-content">
            <div className="language-region-container">
              <div className="subsection-header">
                <h3 className="subsection-title">
                  {t('adminSettings.subsections.languagePreference')}
                </h3>
                <p className="subsection-description">
                  {t('adminSettings.subsectionDescriptions.languagePreference')}
                </p>
              </div>
              <LanguageSwitcher />
            </div>
            <div className="region-settings-divider"></div>
            <div className="language-region-container">
              <div className="subsection-header">
                <h3 className="subsection-title">
                  {t('adminSettings.subsections.locationTimezone')}
                </h3>
                <p className="subsection-description">
                  {t('adminSettings.subsectionDescriptions.locationTimezone')}
                </p>
              </div>
              <RegionSelector
                value={regionSettings}
                onChange={handleRegionChange}
              />
            </div>
          </div>
        </div>
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <Bell size={24} />
            </div>
            <div className="section-title-group">
              <h2>{t('adminSettings.sections.notificationPreferences')}</h2>
              <p className="section-description">
                {t('adminSettings.descriptions.notificationPreferences')}
              </p>
            </div>
          </div>
          <div className="section-content">
            {preferencesMessage && (
              <div className="success-banner">{preferencesMessage}</div>
            )}
            {preferencesError && (
              <div className="error-banner">{preferencesError}</div>
            )}
            <div className="notification-preferences">
              <div className="preference-item">
                <div className="preference-info">
                  <h4>{t('adminSettings.emailAlerts')}</h4>
                  <p>
                    {t('adminSettings.emailAlertsDescription', {
                      email:
                        formData.email || t('adminSettings.yourEmailAddress'),
                    })}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.emailAlerts}
                    onChange={handleEmailAlertsToggle}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="preference-item">
                <div className="preference-info">
                  <h4>{t('adminSettings.smsAlerts')}</h4>
                  <p>
                    {t('adminSettings.smsAlertsDescription', {
                      phone: formData.phoneNumber
                        ? ` ${formData.phoneNumber}`
                        : '',
                    })}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.smsAlerts}
                    onChange={handleSmsAlertsToggle}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <Bell size={24} />
            </div>
            <div className="section-title-group">
              <h2>{t('adminSettings.sections.notificationTypes')}</h2>
              <p className="section-description">
                {t('adminSettings.descriptions.notificationTypes')}
              </p>
            </div>
          </div>
          <div className="section-content">
            {Object.entries(notificationCategories.ADMIN).map(
              ([categoryName, categoryItems]) => (
                <div key={categoryName} className="notification-category">
                  <h3 className="notification-category-title">
                    {t(`settings.notificationTypes.admin.${categoryName}`)}
                  </h3>
                  <div className="notification-list">
                    {categoryItems.map(notification => (
                      <div key={notification.key} className="notification-item">
                        <div className="notification-info">
                          <h4 className="notification-title">
                            {t(
                              `settings.notificationTypes.admin.${notification.labelKey}`
                            )}
                          </h4>
                          <p className="notification-desc">
                            {t(
                              `settings.notificationTypes.admin.${notification.descKey}`
                            )}
                          </p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={notifications[notification.key] || false}
                            onChange={() => handleToggle(notification.key)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default AdminSettings;
