import React, { useState, useRef, useEffect, useContext } from 'react';
import { User, Globe, Bell, Camera, Lock } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import RegionSelector from './RegionSelector';
import { AuthContext } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import '../style/Settings.css';

/**
 * Reusable Settings page component for all dashboards (Donor, Receiver, Admin)
 */
const Settings = () => {
  const { userId, organizationName, role } = useContext(AuthContext);
  
  // Role-based notification categories
  const notificationCategories = {
    DONOR: {
      'Claim & Pickup Flow': [
        { key: 'donationClaimed', label: 'Donation Claimed', desc: 'A receiver claimed your donation' },
        { key: 'claimCanceled', label: 'Claim Canceled', desc: 'A receiver canceled their claim' },
        { key: 'pickupReminder', label: 'Pickup Reminders', desc: 'Upcoming pickup time reminders' },
        { key: 'donationPickedUp', label: 'Donation Picked Up', desc: 'Receiver marked the donation as picked up' },
        { key: 'donationExpired', label: 'Donation Expired', desc: 'Donation automatically marked expired or overdue' }
      ],
      'Messaging': [
        { key: 'newMessageFromReceiver', label: 'New Messages', desc: 'New chat message from the receiver' }
      ],
      'Feedback': [
        { key: 'receiverReview', label: 'Reviews & Ratings', desc: 'Receiver left you a rating or review' }
      ],
      'Admin & System': [
        { key: 'donationFlagged', label: 'Donation Flagged', desc: 'Admin flagged your donation' },
        { key: 'donationStatusUpdated', label: 'Status Updates', desc: 'Admin updated your donation status' },
        { key: 'complianceWarning', label: 'Compliance Warnings', desc: 'Admin sent a compliance warning' },
        { key: 'issueResolved', label: 'Issue Resolved', desc: 'Admin resolved an issue related to your donation' },
        { key: 'verificationStatusChanged', label: 'Verification Status', desc: 'Your account verification status changed' }
      ]
    },
    RECEIVER: {
      'Matching & Claim Flow': [
        { key: 'newDonationAvailable', label: 'New Donations', desc: 'New donation available matching your preferences' },
        { key: 'donationReadyForPickup', label: 'Ready for Pickup', desc: 'Donation marked "Ready for Pickup"' },
        { key: 'pickupReminder', label: 'Pickup Reminders', desc: 'Approaching pickup time reminders' },
        { key: 'donationCompleted', label: 'Donation Completed', desc: 'Donor marked donation as completed' }
      ],
      'Messaging': [
        { key: 'newMessageFromDonor', label: 'New Messages', desc: 'New chat message from the donor' }
      ],
      'Feedback': [
        { key: 'donorReview', label: 'Reviews & Ratings', desc: 'Donor left you a rating or review' }
      ],
      'Admin & System': [
        { key: 'claimFlagged', label: 'Claim Flagged', desc: 'Admin flagged your claim' },
        { key: 'donationStatusChanged', label: 'Status Changes', desc: 'Admin changed donation status' },
        { key: 'disputeResolved', label: 'Dispute Resolved', desc: 'Admin resolved your dispute/case' },
        { key: 'verificationStatusChanged', label: 'Verification Status', desc: 'Organization verification status changed' }
      ]
    },
    ADMIN: {
      'System Oversight': [
        { key: 'donationFlagged', label: 'Flagged Donations', desc: 'New flagged donation (safety/fraud/inappropriate content)' },
        { key: 'suspiciousActivity', label: 'Suspicious Activity', desc: 'New suspicious user action detected' },
        { key: 'verificationRequest', label: 'Verification Requests', desc: 'New verification request (receiver/donor)' }
      ],
      'Dispute & Compliance': [
        { key: 'newDispute', label: 'New Disputes', desc: 'New dispute/case opened' },
        { key: 'escalatedIssue', label: 'Escalated Issues', desc: 'Repeat offender, unsafe food, dangerous temperature logs' },
        { key: 'safetyAlert', label: 'Safety Alerts', desc: 'Automated safety alerts (expired donations, cold-chain issues)' }
      ],
      'Operational': [
        { key: 'systemError', label: 'System Errors', desc: 'System errors/failures (internal use)' },
        { key: 'highVolumeDonation', label: 'High Volume Alerts', desc: 'High-volume donation alert' }
      ]
    }
  };

  // Initialize notifications based on role with all enabled by default
  const [notifications, setNotifications] = useState({});

  // Load notifications when role is available
  useEffect(() => {
    if (role && Object.keys(notifications).length === 0) {
      const initialNotifications = {};
      const categories = notificationCategories[role] || notificationCategories.RECEIVER;
      
      Object.values(categories).flat().forEach(notification => {
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
    address: ''
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [regionSettings, setRegionSettings] = useState(null);
  
  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailAlerts: false,
    smsAlerts: false,
    smsPhoneNumber: ''
  });
  const [preferencesMessage, setPreferencesMessage] = useState('');
  const [preferencesError, setPreferencesError] = useState('');
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const fileInputRef = useRef(null);

  // Load user profile on component mount
  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  // Sync organization name from context
  useEffect(() => {
    if (organizationName && !formData.organization) {
      setFormData(prev => ({ ...prev, organization: organizationName }));
    }
  }, [organizationName]);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Auto-clear preferences messages after 3 seconds
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
    try {
      setLoadingProfile(true);
      const response = await userAPI.getProfile();
      const userData = response.data;
      
      // Set form data from user profile
      setFormData({
        fullName: userData.organization?.contactPerson || '',
        email: userData.email || '',
        phoneNumber: userData.organization?.phone || '',
        organization: userData.organization?.name || organizationName || '',
        address: userData.organization?.address || ''
      });
      
      // Set profile image if available
      if (userData.profilePhoto) {
        setProfileImage(userData.profilePhoto);
      }
      
      setLoadingProfile(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setLoadingProfile(false);
      setErrors({ submit: 'Failed to load profile. Please refresh the page.' });
    }
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    // Accepts various formats: (123) 456-7890, 123-456-7890, 1234567890, +1234567890
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as E.164 standard with country code (assuming North America +1)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('+')) {
      return phone;
    }
    return `+${cleaned}`;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName || formData.fullName.trim().length === 0) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email || formData.email.trim().length === 0) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Password validation (if changing password)
    if (showPasswordFields) {
      if (!passwordData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      if (!passwordData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (passwordData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleToggle = async (key) => {
    const newValue = !notifications[key];
    
    // Update state immediately for responsiveness
    setNotifications(prev => ({ ...prev, [key]: newValue }));
 
  };

  const handleRegionChange = (regionData) => {
    // Only update if the data has actually changed
    if (JSON.stringify(regionData) !== JSON.stringify(regionSettings)) {
      setRegionSettings(regionData);
      console.log('Region settings updated:', regionData);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ profileImage: 'Image size must be less than 5MB' });
        return;
      }

      // Validate file type (JPEG and PNG)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ profileImage: 'Please upload a JPEG or PNG image file' });
        return;
      }

      if (errors.profileImage) {
        setErrors(prev => ({ ...prev, profileImage: '' }));
      }

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to backend
      try {
        setLoading(true);
        const response = await userAPI.uploadProfilePhoto(file);
        const updatedUser = response.data;
        
        // Update profile image with the base64 from backend
        if (updatedUser.profilePhoto) {
          setProfileImage(updatedUser.profilePhoto);
        }
        
        setSuccessMessage('Profile photo uploaded successfully!');
        setLoading(false);
      } catch (error) {
        console.error('Error uploading profile photo:', error);
        const errorMessage = error.response?.data?.error || 'Failed to upload profile photo. Please try again.';
        setErrors({ profileImage: errorMessage });
        setLoading(false);
        // Reset preview on error
        setProfileImageFile(null);
        setProfileImage(null);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveChanges = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrors({});

    try {
      const updateData = {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phoneNumber ? formatPhoneNumber(formData.phoneNumber) : null,
        organizationName: formData.organization || null,
        address: formData.address || null,
        contactPerson: formData.fullName
      };

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === null || updateData[key] === '') {
          delete updateData[key];
        }
      });

      // Update profile
      const response = await userAPI.updateProfile(updateData);
      const updatedUser = response.data;

      // Update form 
      setFormData(prev => ({
        ...prev,
        fullName: updatedUser.organization?.contactPerson || prev.fullName,
        email: updatedUser.email || prev.email,
        phoneNumber: updatedUser.organization?.phone || prev.phoneNumber,
        organization: updatedUser.organization?.name || prev.organization,
        address: updatedUser.organization?.address || prev.address
      }));

      setSuccessMessage('Profile updated successfully!');
      
      // Reset password fields
      if (showPasswordFields) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordFields(false);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update profile. Please try again.';
      setErrors({ submit: errorMessage });
      setLoading(false);
    }
  };

  const handleEmailAlertsToggle = () => {
    const newValue = !notificationPreferences.emailAlerts;
    setNotificationPreferences(prev => ({
      ...prev,
      emailAlerts: newValue
    }));
    
    // Show toast notification like language switcher
    const toast = document.createElement('div');
    toast.className = 'language-toast';
    toast.textContent = `Email alerts ${newValue ? 'enabled' : 'disabled'}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const handleSmsAlertsToggle = () => {
    const newValue = !notificationPreferences.smsAlerts;
    setNotificationPreferences(prev => ({
      ...prev,
      smsAlerts: newValue
    }));
    
    // Show toast notification like language switcher
    const toast = document.createElement('div');
    toast.className = 'language-toast';
    toast.textContent = `SMS alerts ${newValue ? 'enabled' : 'disabled'}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  return (
    <div className="settings-container">
      <div className="settings-content">
        
        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}
        
        {/* Account Section */}
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <User size={24} />
            </div>
            <div className="section-title-group">
              <h2>Account</h2>
              <p className="section-description">Manage your profile and account details</p>
            </div>
          </div>
          <div className="section-content">
            {loadingProfile ? (
              <div className="loading-spinner">Loading profile...</div>
            ) : (
              <>
                {/* Profile Image Upload */}
                <div className="profile-image-section">
                  <div className="profile-image-container">
                    <div className="profile-image-wrapper">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="profile-image" />
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
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                    <div className="profile-image-info">
                      <h3>Profile Photo</h3>
                      <p>Upload a photo to personalize your account</p>
                      {errors.profileImage && <span className="field-error">{errors.profileImage}</span>}
                    </div>
                  </div>
                </div>

                <div className="account-form-grid">
                  <div className="form-field">
                    <label className="field-label">Full Name *</label>
                    <input 
                      type="text"
                      name="fullName"
                      className={`field-input ${errors.fullName ? 'error' : ''}`}
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                    />
                    {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                  </div>
                  <div className="form-field">
                    <label className="field-label">Email Address *</label>
                    <input 
                      type="email"
                      name="email"
                      className={`field-input ${errors.email ? 'error' : ''}`}
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </div>
                  <div className="form-field">
                    <label className="field-label">Organization</label>
                    <input 
                      type="text"
                      name="organization"
                      className="field-input"
                      placeholder="Enter your organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Phone Number</label>
                    <input 
                      type="tel"
                      name="phoneNumber"
                      className={`field-input ${errors.phoneNumber ? 'error' : ''}`}
                      placeholder="Enter your phone number"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                    />
                    {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
                  </div>
                  <div className="form-field form-field-full">
                    <label className="field-label">Address</label>
                    <input 
                      type="text"
                      name="address"
                      className="field-input"
                      placeholder="Enter your address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Password Section */}
                <div className="password-section">
                  <button 
                    className="password-toggle-btn"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    type="button"
                  >
                    <Lock size={18} />
                    <span>Change Password</span>
                  </button>
                  
                  {showPasswordFields && (
                    <div className="password-fields">
                      <div className="form-field">
                        <label className="field-label">Current Password *</label>
                        <input 
                          type="password"
                          name="currentPassword"
                          className={`field-input ${errors.currentPassword ? 'error' : ''}`}
                          placeholder="Enter current password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                        />
                        {errors.currentPassword && <span className="field-error">{errors.currentPassword}</span>}
                      </div>
                      <div className="form-field">
                        <label className="field-label">New Password *</label>
                        <input 
                          type="password"
                          name="newPassword"
                          className={`field-input ${errors.newPassword ? 'error' : ''}`}
                          placeholder="Enter new password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                        />
                        {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
                      </div>
                      <div className="form-field">
                        <label className="field-label">Confirm New Password *</label>
                        <input 
                          type="password"
                          name="confirmPassword"
                          className={`field-input ${errors.confirmPassword ? 'error' : ''}`}
                          placeholder="Confirm new password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                        />
                        {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  className="save-changes-btn" 
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Language & Region Section */}
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <Globe size={24} />
            </div>
            <div className="section-title-group">
              <h2>Language & Region</h2>
              <p className="section-description">Set your language, location, and timezone preferences</p>
            </div>
          </div>
          <div className="section-content">
            <div className="language-region-container">
              <div className="subsection-header">
                <h3 className="subsection-title">Language Preference</h3>
                <p className="subsection-description">Choose your preferred language for the interface</p>
              </div>
              <LanguageSwitcher />
            </div>
            
            <div className="region-settings-divider"></div>
            
            <div className="language-region-container">
              <div className="subsection-header">
                <h3 className="subsection-title">Location & Timezone</h3>
                <p className="subsection-description">Set your location to ensure accurate date and time information</p>
              </div>
              <RegionSelector value={regionSettings} onChange={handleRegionChange} />
            </div>
          </div>
        </div>

        {/* Notification Preferences Section */}
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <Bell size={24} />
            </div>
            <div className="section-title-group">
              <h2>Notification Preferences</h2>
              <p className="section-description">Choose how you want to receive notifications</p>
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
              {/* Email Alerts Toggle */}
              <div className="preference-item">
                <div className="preference-info">
                  <h4>Email Alerts</h4>
                  <p>Receive notifications via email at {formData.email || 'your email address'}</p>
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

              {/* SMS Alerts Toggle */}
              <div className="preference-item">
                <div className="preference-info">
                  <h4>SMS Alerts</h4>
                  <p>Receive notifications via text message{formData.phoneNumber ? ` at ${formData.phoneNumber}` : ''}</p>
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

        {/* Notifications Section */}
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <Bell size={24} />
            </div>
            <div className="section-title-group">
              <h2>Notification Types</h2>
              <p className="section-description">Customize which types of notifications you want to receive</p>
            </div>
          </div>
          <div className="section-content">
            {Object.entries(notificationCategories[role] || notificationCategories.RECEIVER).map(([categoryName, categoryItems]) => (
              <div key={categoryName} className="notification-category">
                <h3 className="notification-category-title">{categoryName}</h3>
                <div className="notification-list">
                  {categoryItems.map((notification) => (
                    <div key={notification.key} className="notification-item">
                      <div className="notification-info">
                        <h4 className="notification-title">{notification.label}</h4>
                        <p className="notification-desc">{notification.desc}</p>
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
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
